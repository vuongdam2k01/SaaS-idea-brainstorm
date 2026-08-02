#!/usr/bin/env node
/**
 * Compute the MVP pack verdict from gate state (saas-idea-brainstorm plugin).
 *
 * The predicate lived only in prose, so the label was hand-authored into
 * `mvp-spec.md` — which is how a Hypothesis pack ends up reading as Validated. It
 * lives here now so stage 5 derives it and a fixture tests the real thing rather
 * than a copy of it. the 'method-rules-gate-contracts' skill remains the normative statement; this file
 * is its executable form and must not diverge.
 *
 * Usage:
 *   node scripts/pack-verdict.js <path-to-state.json>
 *   node scripts/pack-verdict.js <path-to-state.json> --json
 *   node scripts/pack-verdict.js <path-to-state.json> --assuming-lock-pass
 *       (stage 5 needs the label before the LOCK gate runs, because the label goes
 *        INTO the pack the gate reviews; the output is marked PROSPECTIVE)
 * Exit codes: 0 = a pack is issuable, 1 = not finished (no pack), 2 = unusable input.
 *
 * v1.5.0: a 4th verdict tier, "FOUNDER-AUTHORIZED HYPOTHESIS TRACK", fires whenever
 * `gates.V1.status === "deferred"` (set only by gate-check's `--ceremony=defer`) —
 * checked before, and independent of, the pre-existing three-tier VALIDATED /
 * HYPOTHESIS / PRE-FEASIBILITY logic, which stays byte-identical for any state that
 * never sets `deferred`. See "V1 deferred track" in method-rules-gate-contracts.
 */
"use strict";
const fs = require("fs");

const PACK_GATES = ["V1", "V2", "V3", "R1", "R2", "P", "LOCK"];
const OPENABLE = ["V2", "V3", "R2", "R1"]; // per gate-contracts "OPEN allowed?"

/**
 * @param {Record<string, {status?: string}>} gates
 * @param {string} v3Grade highest grade actually backing V3 ("A" | "B" | "C" | "none")
 */
function verdict(gates, v3Grade, opts = {}) {
  const g = (name) => (gates && gates[name] && gates[name].status) || "pending";
  const passed = (name) => g(name) === "passed";
  const open = (name) => g(name) === "open";
  const resolved = (name) => passed(name) || open(name);

  // v1.5.0: gates.V1.status "deferred" is the founder-authorized skip of pre-MVP
  // human validation (gate-check's `--ceremony=defer`). It is a THIRD bucket,
  // structurally distinct from both "passed" and "open" — it must never make
  // resolved("V1") true, or a deferred V1 would silently look exactly like an
  // open one to every caller of resolved(). Checked and handled separately
  // below; resolved() itself is byte-identical to the pre-1.5.0 helper.
  const v1Deferred = g("V1") === "deferred";

  const reasons = [];
  // Stage 5 needs the label BEFORE the LOCK gate runs (it goes into the pack that
  // the gate then reviews), so a prospective mode is explicit rather than implied:
  // `assumingLockPass` computes what the verdict WILL be if LOCK passes, and says
  // so. Without it the helper returned NO PACK during stage 5 and the sequence
  // could never complete.
  if (!passed("LOCK") && !opts.assumingLockPass) {
    return {
      verdict: "NO PACK",
      prospective: false,
      reasons: [`LOCK is "${g("LOCK")}" — no pack is issued until it passes (use --assuming-lock-pass for the pre-gate label)`],
      inputs: snapshot(gates, v3Grade),
    };
  }
  const prospective = !passed("LOCK");
  for (const name of PACK_GATES) {
    if (name === "LOCK" && prospective) continue; // assumed, and labelled as such
    // A deferred V1 is checked in its own branch below, never through resolved() —
    // it is neither "passed" nor "open" (V1's OPEN-allowed cell stays No), so
    // letting it fall into this loop's ordinary resolved()/open() checks would
    // either wrongly reject it here or wrongly satisfy it via `open`.
    if (name === "V1" && v1Deferred) continue;
    if (!resolved(name)) reasons.push(`${name} is "${g(name)}" (must be passed, or open where the contract allows)`);
    else if (open(name) && !OPENABLE.includes(name)) reasons.push(`${name} is open, which its contract does not allow`);
  }
  if (reasons.length) return { verdict: "NO PACK", prospective, reasons, inputs: snapshot(gates, v3Grade) };

  // v1.5.0 4th verdict tier — checked BEFORE the Pre-feasibility/Hypothesis/Validated
  // selection below. A deferred V1 can never produce VALIDATED or a plain HYPOTHESIS
  // label, regardless of how V2/V3/R1/R2 resolve: those two labels are reserved for
  // a V1 that was actually attempted. Never reachable via will-override's code path —
  // that mechanism does not touch this function's return value at all.
  if (v1Deferred) {
    return {
      verdict: "FOUNDER-AUTHORIZED HYPOTHESIS TRACK",
      prospective,
      reasons: ["V1 is deferred: founder-authorized skip of pre-MVP human validation, on named reopen conditions — see post-launch-validation-register.md"],
      inputs: snapshot(gates, v3Grade),
    };
  }

  if (open("R1"))
    return {
      verdict: "PRE-FEASIBILITY HYPOTHESIS",
      prospective,
      reasons: ["R1 is open: feasibility itself is unproven, so the pack says so on line 1"],
      inputs: snapshot(gates, v3Grade),
    };
  if (["V2", "V3", "R2"].some(open))
    return {
      verdict: "HYPOTHESIS",
      prospective,
      reasons: [`open gate(s): ${["V2", "V3", "R2"].filter(open).join(", ")}`],
      inputs: snapshot(gates, v3Grade),
    };
  const allPassed = PACK_GATES.every((name) => passed(name) || (name === "LOCK" && prospective));
  if (allPassed && v3Grade === "A")
    return {
      verdict: "VALIDATED",
      prospective,
      reasons: ["all pack gates passed and V3 rests on grade-A evidence"],
      inputs: snapshot(gates, v3Grade),
    };
  // The contract says "anything else = pipeline not finished; no pack". A passed V3
  // whose evidence is not grade A is not a weaker pack — it is an inconsistency
  // between two records (V3 cannot pass on anything but grade A), so say that
  // instead of quietly downgrading the label.
  return {
    verdict: "NO PACK",
    prospective,
    reasons: [
      `V3 is "${g("V3")}" but its recorded evidence grade is "${v3Grade}", not A — V3 cannot pass on anything but real money, so one of the two records is wrong; fix the record, do not relabel the pack`,
    ],
    inputs: snapshot(gates, v3Grade),
  };
}

function snapshot(gates, v3Grade) {
  const out = {};
  for (const name of PACK_GATES) out[name] = (gates && gates[name] && gates[name].status) || "pending";
  out.v3_evidence_grade = v3Grade;
  return out;
}

function main(argv) {
  const args = argv.slice(2);
  const jsonOut = args.includes("--json");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    process.stderr.write("usage: pack-verdict.js <state.json> [--json]\n");
    return 2;
  }
  let st;
  try {
    st = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    process.stderr.write(`cannot read state: ${e.message}\n`);
    return 2;
  }
  // V3's OBSERVED grade lives on the gate itself (state-schema: gates.V3.evidence_grade_observed,
  // set when the V3 verdict is recorded). `evidence_floor` is the requirement, not the observation —
  // reading the floor would make every pack look validated.
  const grade = (st.gates && st.gates.V3 && st.gates.V3.evidence_grade_observed) || "none";
  const r = verdict(st.gates, grade, { assumingLockPass: args.includes("--assuming-lock-pass") });
  if (jsonOut) process.stdout.write(JSON.stringify(r, null, 2) + "\n");
  else {
    process.stdout.write(`${r.verdict}${r.prospective ? " (PROSPECTIVE — assumes LOCK passes)" : ""}\n`);
    for (const reason of r.reasons) process.stdout.write(`  - ${reason}\n`);
    process.stdout.write(`  inputs: ${JSON.stringify(r.inputs)}\n`);
  }
  return r.verdict === "NO PACK" ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { verdict, PACK_GATES };
