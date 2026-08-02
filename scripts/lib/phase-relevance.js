#!/usr/bin/env node
/**
 * Phase relevance (saas-idea-brainstorm plugin, v1.5.0).
 *
 * ONE static phase→required-capabilities map, shared by `setup-audit` and any
 * future consumer — mirrors `scripts/lib/spec-index.js`'s sharing pattern (one
 * vocabulary lives in one file, never a hand-kept copy in two skills that drift
 * the moment one of them is edited).
 *
 * Answers a founder-observed gap: setup-audit reported every capability with
 * the same weight regardless of which stage was actually active, so a founder
 * still in stage 0 (framing) saw "payments: unavailable" read as if it were
 * blocking something — it is not relevant until gate V3 opens in stage 2.
 * Integrations are never REQUIRED (method-rules §8: missing ones only change
 * the execution rung), so this map answers a narrower question: is this
 * capability even consumed by the phase the idea is actually in right now?
 * A capability whose phase has not been reached is informational only.
 *
 * Phase keys mirror `state.active[]`'s own dotted task-id shape exactly
 * ("2.V1", "3.R1", ...) so a caller can look a task id up directly. A bare
 * stage number ("2") is the fallback for a task id whose exact leaf is not in
 * the map, and also serves callers that only track stage-level position.
 *
 * Usage:
 *   const { requiredCapabilities, isRequiredNow } = require("./lib/phase-relevance.js");
 */
"use strict";

// Stage/task id -> capabilities that phase's own work actually consumes.
// Deliberately narrow: a capability absent from every list here is simply
// never phase-gated (e.g. nothing in this plugin's stage work consumes
// "analytics" before V2 traffic measurement, so it is not listed at stage 0/1).
const PHASE_CAPABILITIES = {
  "0": [], // framing: no integration is consumed yet
  "1": ["scraping", "multi_llm"], // competitive scan: research agents
  "2": ["scraping", "multi_llm", "email", "hosting", "analytics", "payments", "ads"], // stage-level fallback (all of V1/V2/V3's needs)
  "2.V1": ["scraping", "multi_llm", "email"], // problem mining + interview outreach
  "2.V2": ["hosting", "analytics", "ads", "email"], // mock deploy, landing traffic + measurement
  "2.V3": ["payments"], // money commitment
  "3": ["multi_llm", "hosting"], // stage-level fallback (R1 cross-model eval, R2 delivery)
  "3.R1": ["multi_llm"], // secondary-LLM cross-check for subjective quality
  "3.R2": ["hosting"], // concierge/value delivery
  "4": [],
  "5": [],
  "6": [],
  "BP": [],
};

/**
 * Capabilities relevant to a given phase/task id. Tries an exact match first
 * (e.g. "2.V1"), then falls back to the leading stage number (e.g. "2.V1" ->
 * "2" is never needed since "2.V1" is listed, but "2.V1b" style variants
 * would fall back this way), then to [] for an unrecognized id — an unknown
 * phase is never treated as requiring everything.
 */
function requiredCapabilities(phase) {
  const key = String(phase == null ? "" : phase).trim();
  if (PHASE_CAPABILITIES[key]) return PHASE_CAPABILITIES[key].slice();
  const stage = key.split(".")[0];
  if (PHASE_CAPABILITIES[stage]) return PHASE_CAPABILITIES[stage].slice();
  return [];
}

/**
 * Is `capability` required by any of the currently active phases? `activePhases`
 * is `state.active[]` (or a single id) — an idea can have several tasks active
 * at once (the pipeline is a DAG), so relevance is a union across all of them.
 */
function isRequiredNow(capability, activePhases) {
  const active = Array.isArray(activePhases) ? activePhases : [activePhases];
  return active.some((p) => requiredCapabilities(p).includes(capability));
}

/**
 * The earliest phase (in map declaration order) that consumes `capability` —
 * used to fill `capabilities.<cap>.required_in_phase` even before that phase
 * is reached, so a report can say "not needed yet, becomes relevant at 2.V3"
 * rather than just "not needed".
 */
function earliestPhaseFor(capability) {
  for (const [phase, caps] of Object.entries(PHASE_CAPABILITIES)) {
    if (caps.includes(capability)) return phase;
  }
  return null;
}

function main(argv) {
  const phase = argv[2];
  if (!phase) {
    process.stderr.write("usage: phase-relevance.js <phase-or-task-id>\n");
    return 2;
  }
  process.stdout.write(JSON.stringify(requiredCapabilities(phase)) + "\n");
  return 0;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { PHASE_CAPABILITIES, requiredCapabilities, isRequiredNow, earliestPhaseFor };
