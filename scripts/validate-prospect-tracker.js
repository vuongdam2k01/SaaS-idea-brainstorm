#!/usr/bin/env node
/**
 * Validate a beachhead prospect tracker (saas-idea-brainstorm plugin).
 *
 * Dogfood run #3 finding: the F prospect floor is the pipeline's most valuable
 * early check — it is what made a run score its founder's chosen beachhead at
 * `our reach = 1` and refuse to invent people. But the tracker itself was prose,
 * so the same run then inflated a second segment from 3-5 real prospects to a
 * claimed 16 by copying tier-1 competitor rows across, counting a listicle entry
 * with no first-party evidence, and admitting one entity whose "tier evidence"
 * was that it had already automated the thing the segment was defined as doing
 * by hand. One counted entry turned out to be a template demo site with the
 * placeholder phone number 0900 000 000. Only the adversarial gatekeeper caught
 * it; a spot-check that confirmed 14/14 domains returned HTTP 200 did not,
 * because HTTP 200 is not evidence that a business exists.
 *
 * v1.2 added `root_source_id` independence to the EVIDENCE LEDGER, which is the
 * same failure mode one gate later — it does not touch this tracker.
 *
 * Usage:
 *   node scripts/validate-prospect-tracker.js <beachhead-icp.md> [--json] [--min 15]
 *
 * Counts only rows that are on-segment, tier 4-5, and carry a first-party
 * evidence basis. Exit 0 = floor met. Exit 1 = errors or below the floor.
 */
"use strict";
const fs = require("fs");

const REQUIRED_COLS = ["pid", "tier", "evidence_basis", "resolved_ref", "observed_at", "reach_route"];
const PLACEHOLDER = /^(—|-|n\/a|na|tbd|\?|none|unknown|\s*)$/i;

function parseTables(text) {
  const tables = [];
  const lines = text.split(/\r?\n/);
  let cur = null;
  for (const line of lines) {
    if (/^\s*\|/.test(line)) {
      const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      if (!cur) cur = { header: cells, rows: [] };
      else if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      else cur.rows.push(cells);
    } else if (cur) {
      tables.push(cur);
      cur = null;
    }
  }
  if (cur) tables.push(cur);
  return tables;
}

function norm(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const minIdx = argv.indexOf("--min");
  const floor = minIdx >= 0 ? parseInt(argv[minIdx + 1], 10) : 15;
  const file = argv.find((a) => !a.startsWith("--") && a !== String(floor));

  const findings = [];
  const err = (code, message) => findings.push({ severity: "error", code, message });
  const warn = (code, message) => findings.push({ severity: "warning", code, message });

  if (!file || !fs.existsSync(file)) {
    err("missing-file", `prospect tracker not found: ${file}`);
    return report(findings, { counted: 0, floor }, asJson);
  }
  const text = fs.readFileSync(file, "utf8");

  // The tracker is the table whose header carries a Pid column.
  const table = parseTables(text).find((t) => t.header.some((h) => /^p\s*id$/i.test(h.replace(/[^a-z ]/gi, "").trim())));
  if (!table) {
    err("no-tracker-table",
      "no prospect tracker table found (expected a markdown table with a `Pid` column). The floor is not auditable while the tracker is prose.");
    return report(findings, { counted: 0, floor }, asJson);
  }

  const col = {};
  table.header.forEach((h, i) => {
    const n = norm(h);
    if (n === "pid") col.pid = i;
    else if (n.includes("tier")) col.tier = col.tier === undefined ? i : col.tier;
    else if (n.includes("evidencebasis")) col.evidence_basis = i;
    else if (n.includes("resolvedref") || n.includes("resolved")) col.resolved_ref = i;
    else if (n.includes("observedat") || n === "observed") col.observed_at = i;
    else if (n.includes("reachroute") || n.includes("reachchannel")) col.reach_route = i;
    else if (n.includes("segment")) col.segment = i;
    else if (n.includes("funnel")) col.funnel = i;
  });

  for (const c of REQUIRED_COLS) {
    if (col[c] === undefined)
      err("missing-column",
        `tracker is missing the \`${c}\` column — without it the count cannot be checked, only asserted.`);
  }
  if (col.funnel !== undefined) {
    warn("funnel-is-not-an-f-predicate",
      "a `funnel status` column is fine as founder tracking, but contact status is NOT a gate-F predicate — F requires a tier-evidenced list, not outreach. Do not let it gate the count.");
  }
  if (findings.some((f) => f.severity === "error")) return report(findings, { counted: 0, floor }, asJson);

  const seenPid = new Map();
  const seenEntity = new Map();
  let counted = 0;
  const quarantined = [];

  for (const [n, cells] of table.rows.entries()) {
    const at = `row ${n + 1}`;
    const pid = cells[col.pid] || "";
    if (PLACEHOLDER.test(pid)) continue; // spacer / empty row
    const tierRaw = cells[col.tier] || "";
    const basis = cells[col.evidence_basis] || "";
    const ref = cells[col.resolved_ref] || "";
    const observed = cells[col.observed_at] || "";
    const route = cells[col.reach_route] || "";

    if (seenPid.has(norm(pid)))
      err("duplicate-pid", `${at}: Pid "${pid}" already used at row ${seenPid.get(norm(pid)) + 1}.`);
    else seenPid.set(norm(pid), n);

    // Tier: only an unambiguous 4 or 5 counts. "tier 1-2 (ước tính)", "tier 4?",
    // "chưa xác định" are all quarantined, not rounded up.
    const tierNums = (tierRaw.match(/[1-5]/g) || []).map(Number);
    const uncertain = /\?|estimate|ước|uoc|chưa|chua|likely|probably|assume/i.test(tierRaw);
    const qualifies = tierNums.length === 1 && tierNums[0] >= 4 && !uncertain;

    if (!qualifies) {
      quarantined.push({ pid, why: uncertain ? "tier is an estimate/uncertain" : `tier "${tierRaw}" is not an unambiguous 4 or 5` });
      continue;
    }
    if (PLACEHOLDER.test(basis)) {
      err("no-evidence-basis", `${at} (${pid}): counted as tier ${tierNums[0]} with no evidence_basis. Tier is a claim; the basis is what makes it checkable.`);
      quarantined.push({ pid, why: "no evidence basis" });
      continue;
    }
    if (/is a competitor|competitor of|đối thủ|doi thu/i.test(basis) && !/workaround|interim|by hand|thủ công|thu cong|manual/i.test(basis)) {
      err("competitor-as-tier-evidence",
        `${at} (${pid}): "is a competitor" is not the same as "has cobbled an interim workaround". A shipped competing product is evidence the tier-4 need was already MET, not that it is unmet.`);
      quarantined.push({ pid, why: "competitor used as tier evidence" });
      continue;
    }
    if (/listicle|toplist|top-?list|roundup/i.test(basis) && !/first-?party|own site|their site|trang chủ|trang chu/i.test(basis)) {
      err("listicle-only", `${at} (${pid}): evidence basis is a listicle with no first-party confirmation.`);
      quarantined.push({ pid, why: "listicle only" });
      continue;
    }
    if (PLACEHOLDER.test(ref)) {
      err("no-resolved-ref", `${at} (${pid}): no resolved_ref — without a resolved entity two rows can be the same business under two names.`);
      quarantined.push({ pid, why: "no resolved ref" });
      continue;
    }
    const ek = norm(ref);
    if (seenEntity.has(ek)) {
      err("duplicate-entity", `${at} (${pid}): resolves to the same entity as ${seenEntity.get(ek)} — one business counted twice.`);
      quarantined.push({ pid, why: "duplicate entity" });
      continue;
    }
    seenEntity.set(ek, pid);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(observed))
      err("bad-observed-at", `${at} (${pid}): observed_at must be YYYY-MM-DD (got "${observed}") — tier evidence goes stale.`);
    if (PLACEHOLDER.test(route))
      err("no-reach-route", `${at} (${pid}): no reach_route. A prospect you cannot reach is a name, not a prospect — reach is the axis this gate exists to measure.`);
    counted++;
  }

  if (counted < floor) {
    err("below-floor",
      `${counted} qualifying prospect(s) counted, floor is ${floor}. This is a Layer 1 formal FAIL. Do not invent entries and do not lower the floor to fit the pool — the shortfall IS the reach signal.`);
  } else if (counted < 20) {
    warn("reach-risk", `${counted} qualifying (target 20) — passes, but Layer 2/3 must log a mandatory reach-risk finding.`);
  }

  return report(findings, { counted, floor, quarantined }, asJson);
}

function report(findings, summary, asJson) {
  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.length - errors;
  if (asJson) console.log(JSON.stringify({ errors, warnings, findings, summary }, null, 2));
  else {
    for (const f of findings) console.log(`${f.severity.toUpperCase()} [${f.code}] ${f.message}`);
    if (summary.quarantined && summary.quarantined.length)
      console.log(`\nquarantined (not counted): ${summary.quarantined.map((q) => `${q.pid} (${q.why})`).join("; ")}`);
    console.log(`\ncounted ${summary.counted} / floor ${summary.floor} — ${errors} error(s), ${warnings} warning(s)`);
  }
  process.exit(errors ? 1 : 0);
}

main();
