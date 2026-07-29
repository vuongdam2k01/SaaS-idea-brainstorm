#!/usr/bin/env node
/**
 * Durable state writer (saas-idea-brainstorm plugin).
 * Usage: node state-write.js <path-to-state.json>   (new content piped on stdin)
 * - Validates the incoming JSON parses and keeps required top-level keys.
 * - Backs up the current file to state.json.bak before writing.
 * - Writes to a temp file, then renames atomically.
 * Exit codes: 0 ok; 1 invalid input; 2 io error.
 */
const fs = require("fs");
const path = require("path");

const target = process.argv[2];
if (!target) {
  console.error("usage: node state-write.js <path-to-state.json>  (content on stdin)");
  process.exit(1);
}

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  let obj;
  try {
    obj = JSON.parse(input);
  } catch (e) {
    console.error("REJECTED: stdin is not valid JSON: " + e.message);
    process.exit(1);
  }
  for (const k of ["schema_version", "pipeline_version", "idea", "gates", "thresholds"]) {
    if (!(k in obj)) {
      console.error(`REJECTED: missing required top-level key "${k}"`);
      process.exit(1);
    }
  }
  // v1.1 shape validation (review finding: writer must reject retired/invalid shapes)
  if (obj.schema_version !== "1.1.0") {
    console.error(`REJECTED: unsupported schema_version "${obj.schema_version}" (writer requires 1.1.0 — migrate first)`);
    process.exit(1);
  }
  if ("current_stage" in obj) {
    console.error('REJECTED: retired v1.0 field "current_stage" present — use active[]');
    process.exit(1);
  }
  if (!Array.isArray(obj.active)) {
    console.error('REJECTED: "active" must be an array of task ids');
    process.exit(1);
  }
  const GATE_STATUSES = ["pending", "in_progress", "passed", "failed", "open"];
  for (const [g, v] of Object.entries(obj.gates || {})) {
    if (!v || !GATE_STATUSES.includes(v.status)) {
      console.error(`REJECTED: gate "${g}" has invalid status "${v && v.status}"`);
      process.exit(1);
    }
  }
  // kill_criteria shape (review finding: retired trigger-polarity "state" field
  // must never reappear — the schema is stable-id + desired-state polarity)
  if (!Array.isArray(obj.kill_criteria)) {
    console.error('REJECTED: "kill_criteria" must be an array (empty is fine pre-signing, but the key must be a present array, not missing/non-array)');
    process.exit(1);
  }
  const KC_STATUSES = ["armed", "triggered", "cleared"];
  for (const k of obj.kill_criteria) {
    if (k && "state" in k) {
      console.error(`REJECTED: kill_criteria entry uses retired field "state" — use "desired_state" only (id ${k.id || "?"})`);
      process.exit(1);
    }
    if (!k || typeof k.id !== "string" || typeof k.desired_state !== "string") {
      console.error(`REJECTED: kill_criteria entry missing "id" or "desired_state": ${JSON.stringify(k)}`);
      process.exit(1);
    }
    if (!KC_STATUSES.includes(k.status)) {
      console.error(`REJECTED: kill_criteria "${k.id}" has invalid status "${k.status}"`);
      process.exit(1);
    }
  }
  // path/idea correspondence
  const dirIdea = path.basename(path.dirname(path.resolve(target)));
  if (obj.idea !== dirIdea) {
    console.error(`REJECTED: idea "${obj.idea}" does not match directory "${dirIdea}"`);
    process.exit(1);
  }
  try {
    if (fs.existsSync(target)) fs.copyFileSync(target, target + ".bak");
    const tmp = path.join(path.dirname(target), ".state.tmp." + process.pid);
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
    fs.renameSync(tmp, target);
    console.log("OK: state written atomically, backup at state.json.bak");
    process.exit(0);
  } catch (e) {
    console.error("IO ERROR: " + e.message);
    process.exit(2);
  }
});
