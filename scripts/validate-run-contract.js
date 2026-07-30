#!/usr/bin/env node
/**
 * Validate an R1 spike run contract (saas-idea-brainstorm plugin).
 *
 * Dogfood run #3 finding: the pipeline generated a spike harness that looked
 * rigorous — it blocked a biased sample and refused to grade its own output —
 * yet it (a) overwrote its usage variable on every retry, so a 3-attempt item
 * was billed as one generation, (b) had no minimum sample size, so two images
 * could score "100%" against a signed "≥70%", and (c) hardcoded a pass mark the
 * signed state carried as null. Each defect sat at the exact metric the unit
 * economics question depends on, and a human reviewer reading the file line by
 * line still praised it. Prose in a skill cannot catch that; this can.
 *
 * Usage:
 *   node scripts/validate-run-contract.js <idea-dir> [--json]
 *
 * Reads <idea-dir>/spike/run-contract.json and <idea-dir>/state.json.
 * Exit 0 = contract is runnable. Exit 1 = errors (the run must not start).
 */
"use strict";
const fs = require("fs");
const path = require("path");

const COST_UNITS = ["per-generation", "per-customer", "per-item"];

function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--json");
  const asJson = process.argv.includes("--json");
  if (!args[0]) {
    console.error("usage: validate-run-contract.js <idea-dir> [--json]");
    process.exit(2);
  }
  const ideaDir = args[0];
  const contractPath = path.join(ideaDir, "spike", "run-contract.json");
  const statePath = path.join(ideaDir, "state.json");

  const findings = [];
  const err = (code, message) => findings.push({ severity: "error", code, message });
  const warn = (code, message) => findings.push({ severity: "warning", code, message });

  if (!fs.existsSync(contractPath)) {
    err("missing-run-contract",
      `${contractPath} does not exist — write the run contract BEFORE the scored run; a harness without one is an uncalibrated instrument.`);
    return report(findings, null, asJson);
  }

  let c;
  try {
    c = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  } catch (e) {
    err("unparsable-run-contract", `${contractPath} is not valid JSON: ${e.message}`);
    return report(findings, null, asJson);
  }

  let state = null;
  try {
    state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    warn("no-state", `${statePath} unreadable — threshold provenance cannot be checked.`);
  }

  // --- sample -------------------------------------------------------------
  const sample = c.sample || {};
  if (!Number.isInteger(sample.min_n) || sample.min_n < 1) {
    err("missing-min-n",
      "sample.min_n must be a positive integer bound to the signed Test Card. A percentage threshold with no minimum denominator is not a threshold: 2 of 2 is \"100%\" and clears a signed \"≥70%\".");
  }
  if (sample.strata !== undefined) {
    const bad = !sample.strata || typeof sample.strata !== "object" || Array.isArray(sample.strata);
    if (bad) err("bad-strata", "sample.strata must be an object mapping stratum name -> minimum share (0..1).");
    else {
      for (const [k, v] of Object.entries(sample.strata)) {
        if (typeof v !== "number" || v < 0 || v > 1)
          err("bad-stratum-share", `sample.strata["${k}"] must be a share between 0 and 1 (got ${JSON.stringify(v)}).`);
      }
      if (sample.enforced_in_code !== true)
        err("strata-not-enforced",
          "sample.strata is declared but sample.enforced_in_code is not true — a declared composition that the harness does not enforce is a comment, not a control.");
    }
  }

  // --- cost ---------------------------------------------------------------
  const cost = c.cost || {};
  if (!COST_UNITS.includes(cost.unit)) {
    err("missing-cost-unit",
      `cost.unit must be one of ${COST_UNITS.join(" | ")} (got ${JSON.stringify(cost.unit)}). "$1.00 per site" is ambiguous between a generation and a customer; with a 3-round editing loop those differ by 4x, which is the difference between a margin and a loss.`);
  }
  if (typeof cost.price_unit !== "string" || !cost.price_unit.trim()) {
    err("missing-price-unit", "cost.price_unit must name the revenue unit the cost is compared against.");
  }
  if (cost.record_every_attempt !== true) {
    err("retries-not-billed",
      "cost.record_every_attempt must be true: every attempt's usage is recorded append-only, retries included. A loop that overwrites its usage variable per attempt bills a 3-attempt item as one and understates marginal cost by the retry factor.");
  }
  if (cost.append_only !== true) {
    err("cost-log-not-append-only",
      "cost.append_only must be true — a per-attempt record that can be rewritten is not a measurement.");
  }

  // --- threshold ----------------------------------------------------------
  const th = c.threshold || {};
  if (typeof th.source !== "string" || !th.source.trim()) {
    err("missing-threshold-source",
      "threshold.source must name the signed registry key the pass mark is read from (e.g. \"custom.a2_marginal_cost_usd_avg_max\"). A hardcoded number means the run is scored against an unsigned threshold.");
  } else if (state) {
    const thresholds = state.thresholds || {};
    const key = th.source.startsWith("custom.") ? th.source.slice(7) : th.source;
    const bag = th.source.startsWith("custom.") ? thresholds.custom || {} : thresholds;
    if (!(key in bag)) {
      err("threshold-source-absent",
        `threshold.source "${th.source}" does not exist in state.thresholds — the pass mark is not pre-registered.`);
    } else if (bag[key] === null || bag[key] === undefined) {
      err("threshold-still-null",
        `threshold.source "${th.source}" is null in the signed state. A deferred threshold blocks the event that would produce its evidence — load it before this run, not after.`);
    }
    if (!thresholds.signed_date) {
      err("thresholds-unsigned",
        "state.thresholds.signed_date is null — no scored run may start before the signing ceremony.");
    }
  }
  if ("hardcoded_value" in th) {
    err("hardcoded-threshold",
      "threshold.hardcoded_value is not permitted; read the value from threshold.source at run time.");
  }

  // --- raters (subjective metrics only) -----------------------------------
  if (c.metric_is_subjective === true) {
    const r = c.raters || {};
    if (!Array.isArray(r.identities) || r.identities.length < 1) {
      err("missing-raters",
        "metric_is_subjective is true, so raters.identities must list the real people who will label. An LLM grading another model's subjective output is grade D and can never satisfy the R1 PASS metric.");
    }
    if (r.blind !== true) {
      err("raters-not-blind",
        "raters.blind must be true: outputs are presented shuffled with their source hidden, or the labeller's expectation becomes the measurement.");
    }
    if (r.model_may_rate === true) {
      err("model-self-rating",
        "raters.model_may_rate must not be true — the model may not rate its own output.");
    }
    if (Array.isArray(r.identities) && r.identities.length > 1 && r.report_agreement !== true) {
      warn("no-agreement-reported",
        "More than one rater but raters.report_agreement is not true — per-rater labels and agreement should be recorded.");
    }
  }

  return report(findings, c, asJson);
}

function report(findings, contract, asJson) {
  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.length - errors;
  if (asJson) {
    console.log(JSON.stringify({ errors, warnings, findings, contract }, null, 2));
  } else {
    for (const f of findings) console.log(`${f.severity.toUpperCase()} [${f.code}] ${f.message}`);
    console.log(`\n${errors} error(s), ${warnings} warning(s)`);
    if (!errors) console.log("run contract OK — the scored run may start.");
  }
  process.exit(errors ? 1 : 0);
}

main();
