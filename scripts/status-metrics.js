#!/usr/bin/env node
/**
 * Status metrics — the two purely-arithmetic pieces of the `status` skill's
 * four-metric gate reporting (saas-idea-brainstorm plugin, v1.13.0).
 *
 * Before this script, `status` reported one conflated "Gates" line that mixed
 * work done, gates formally passed, evidence strength, and build readiness
 * into a single impression — a founder-observed pain (the status output did
 * not match what the artifacts actually showed). `status` now reports FOUR
 * separate metrics; this script computes the two that are deterministic
 * arithmetic over persisted files, so the skill stays a thin reporting layer
 * instead of re-deriving counts by hand every time:
 *
 *   1. work_completion  — for each stage named in state.active[], the status
 *      (draft/ready/locked) of every pipeline-phase artifact ON DISK whose
 *      frontmatter names that stage. This counts artifacts that EXIST, not an
 *      idealized checklist of what SHOULD exist — a stage with zero artifacts
 *      written yet reports total:0, not 0%, because "0% of nothing" is not a
 *      real number.
 *   2. gate_compliance  — counts of state.gates[*].status against the closed
 *      status enum (pending/in_progress/passed/pass_with_deviation/failed/
 *      open/deferred), plus state.blueprint.gate.status (BP) reported
 *      separately since it lives outside the frozen per-cycle gates object.
 *
 * The other two metrics in status's four-metric reporting — evidence
 * confidence (ledger grade distribution + V3.evidence_grade_observed) and
 * build readiness (LOCK/BP/blueprint synthesis) — are read directly by the
 * `status` skill from `validate-evidence-ledger.js --summary` and state.json;
 * they stay prose tier on purpose (method-rules §14 discipline: a synthesis
 * judgment does not become code just because a related count is code).
 *
 * Operates over ONE state.json + its co-located artifacts: pass the idea root
 * for the inline root cycle (C1), or `cycles/<id>/` for a fragment cycle —
 * state-schema's fragment layout mirrors the root layout, so both are the
 * same shape of directory to this script.
 *
 * Usage:
 *   node scripts/status-metrics.js <dir-with-state.json> [--json]
 * Exit codes: 0 = computed successfully, 2 = unusable input.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const GATE_STATUSES = ["pending", "in_progress", "passed", "pass_with_deviation", "failed", "open", "deferred"];
const ARTIFACT_STATUSES = ["draft", "ready", "locked"];

// Same exclusions validate-artifact.js uses to recognize "not a pipeline-phase
// artifact with frontmatter to count" — journals, private/, cold-start run
// records, frontmatter-exempt worker trace files, maintenance-phase content.
function isCountableArtifact(norm, fm) {
  if (/\/private\//i.test(norm) || /README\.md$/i.test(norm)) return false;
  if (/\/(decision-log|post-mortem|audit-trail)\.md$/i.test(norm)) return false;
  if (/\/coldstart-l[12]-\d{8}-\d{2}\.md$/i.test(norm)) return false;
  if (/\/error-analysis\/batch-\d+\.md$/i.test(norm)) return false;
  if (fm.phase === "maintenance") return false;
  return true;
}

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

function walkMarkdown(root) {
  const out = [];
  (function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith(".md")) out.push(full);
    }
  })(root);
  return out;
}

/** Active stage numbers named in state.active (e.g. ["2.V1","3.R1"] -> ["2","3"]). */
function activeStages(active) {
  const list = Array.isArray(active) ? active : [];
  const stages = new Set();
  for (const a of list) {
    if (typeof a !== "string") continue;
    const stage = a.split(".")[0];
    if (stage) stages.add(stage);
  }
  return [...stages];
}

function computeWorkCompletion(dir, active) {
  const stages = activeStages(active);
  const byStage = {};
  for (const s of stages) byStage[s] = { draft: 0, ready: 0, locked: 0, other: 0, total: 0 };

  const files = walkMarkdown(dir);
  for (const f of files) {
    let text;
    try {
      text = fs.readFileSync(f, "utf8");
    } catch {
      continue;
    }
    const norm = f.replace(/\\/g, "/");
    const fm = parseFrontmatter(text);
    if (!fm || !("stage" in fm)) continue;
    if (!isCountableArtifact(norm, fm)) continue;
    const stage = String(fm.stage);
    if (!stages.includes(stage)) continue; // only the active stage(s) — status is a snapshot of NOW
    if (!byStage[stage]) byStage[stage] = { draft: 0, ready: 0, locked: 0, other: 0, total: 0 };
    const st = byStage[stage];
    if (ARTIFACT_STATUSES.includes(fm.status)) st[fm.status]++;
    else st.other++;
    st.total++;
  }

  const result = {};
  for (const [stage, counts] of Object.entries(byStage)) {
    const doneOrReady = counts.ready + counts.locked;
    result[stage] = {
      ...counts,
      pct_ready_or_locked: counts.total > 0 ? Number(((doneOrReady / counts.total) * 100).toFixed(1)) : null,
    };
  }
  return result;
}

function computeGateCompliance(state) {
  const gates = state.gates && typeof state.gates === "object" ? state.gates : {};
  const counts = Object.fromEntries(GATE_STATUSES.map((s) => [s, 0]));
  const byGate = {};
  for (const [name, g] of Object.entries(gates)) {
    const status = g && GATE_STATUSES.includes(g.status) ? g.status : "other";
    counts[status] = (counts[status] || 0) + 1;
    byGate[name] = status;
  }
  const bp = state.blueprint && state.blueprint.gate && state.blueprint.gate.status;
  return {
    by_gate: byGate,
    counts,
    total: Object.keys(gates).length,
    bp_gate_status: bp || null, // outside the frozen cycle gates object on purpose — reported separately
  };
}

function main(argv) {
  const args = argv.slice(2);
  const jsonOut = args.includes("--json");
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir) {
    process.stderr.write("usage: status-metrics.js <dir-with-state.json> [--json]\n");
    return 2;
  }
  const statePath = path.join(dir, "state.json");
  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (e) {
    process.stderr.write(`cannot read/parse ${statePath}: ${e.message}\n`);
    return 2;
  }

  const work_completion = computeWorkCompletion(dir, state.active);
  const gate_compliance = computeGateCompliance(state);

  if (jsonOut) {
    process.stdout.write(JSON.stringify({ work_completion, gate_compliance }, null, 2) + "\n");
  } else {
    process.stdout.write("Work completion (active stage(s), artifacts on disk only):\n");
    for (const [stage, c] of Object.entries(work_completion)) {
      process.stdout.write(
        `  stage ${stage}: draft ${c.draft} · ready ${c.ready} · locked ${c.locked}${c.other ? ` · other ${c.other}` : ""} · total ${c.total}` +
          (c.pct_ready_or_locked === null ? " (no artifacts yet)" : ` · ${c.pct_ready_or_locked}% ready-or-locked`) +
          "\n"
      );
    }
    process.stdout.write("\nFormal gate compliance:\n");
    for (const [status, n] of Object.entries(gate_compliance.counts)) {
      if (n) process.stdout.write(`  ${status}: ${n}\n`);
    }
    if (gate_compliance.bp_gate_status) process.stdout.write(`  BP (outside cycle gates): ${gate_compliance.bp_gate_status}\n`);
  }
  return 0;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { computeWorkCompletion, computeGateCompliance, activeStages };
