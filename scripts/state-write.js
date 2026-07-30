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
  // Cycle fragment files (cycles/C<n>/state.json) own a cycle's operating set,
  // not the root shape — validate their own contract and exit early.
  const resolvedTarget = path.resolve(target);
  if (/[\\/]cycles[\\/]C\d+[\\/]state\.json$/i.test(resolvedTarget)) {
    return writeFragment(obj, resolvedTarget);
  }
  for (const k of ["schema_version", "pipeline_version", "idea", "gates", "thresholds"]) {
    if (!(k in obj)) {
      console.error(`REJECTED: missing required top-level key "${k}"`);
      process.exit(1);
    }
  }
  // Shape validation (review finding: writer must reject retired/invalid shapes).
  // Writer accepts ONLY the current schema: legacy 1.1.0 fixtures may sit on disk
  // untouched, but every WRITE must be the migrated 1.2.0 shape ("never write the
  // old shape") — accepting 1.1.0 here was a proven freeze-bypass (downgrade attack).
  if (obj.schema_version !== "1.2.0") {
    console.error(`REJECTED: unsupported schema_version "${obj.schema_version}" (writer requires 1.2.0 — migrate first; legacy states are migrated on first touch, never written back as-is)`);
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
  if (!obj.gates || typeof obj.gates !== "object" || Array.isArray(obj.gates)) {
    console.error('REJECTED: "gates" must be a non-null object');
    process.exit(1);
  }
  for (const [g, v] of Object.entries(obj.gates)) {
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
  // "retired" is legal only for kill criteria (LOCK disposition result); runtime
  // statuses stay armed|triggered|cleared. Disposition rules are identical in
  // root and fragment criteria (validateKillCriteria).
  const HC_STATUSES = ["armed", "triggered", "cleared"];
  validateKillCriteria(obj.kill_criteria, "kill_criteria");
  // v1.2 maintenance/cycle shape validation
  if (obj.schema_version === "1.2.0") {
    if (!Array.isArray(obj.cycles) || !obj.cycles.length) {
      console.error('REJECTED: v1.2 state requires a non-empty "cycles" index');
      process.exit(1);
    }
    const CYCLE_STATUSES = ["framing", "validation", "locked", "stopped"];
    for (const c of obj.cycles) {
      if (!c || !/^C\d+$/.test(c.id || "") || !CYCLE_STATUSES.includes(c.status)) {
        console.error(`REJECTED: cycle entry invalid (need id C<n> + status ${CYCLE_STATUSES.join("|")}): ${JSON.stringify(c)}`);
        process.exit(1);
      }
    }
    if (typeof obj.active_cycle !== "string" || !obj.cycles.some((c) => c.id === obj.active_cycle)) {
      console.error(`REJECTED: "active_cycle" must name an entry in cycles[]`);
      process.exit(1);
    }
    for (const c of obj.cycles) {
      if (!(c.state === null || (typeof c.state === "string" && new RegExp(`^cycles/${c.id}/state\\.json$`).test(c.state)))) {
        console.error(`REJECTED: cycle "${c.id}" state pointer must be null (inline) or "cycles/${c.id}/state.json"`);
        process.exit(1);
      }
    }
    const m = obj.maintenance;
    if (
      !m || typeof m !== "object" ||
      !("drift_declared_at" in m) || !("last_reconcile" in m) || !("current_baseline" in m) ||
      !Array.isArray(m.blocking_claims) || !Array.isArray(m.reality_sources)
    ) {
      console.error('REJECTED: v1.2 state requires "maintenance" {drift_declared_at, active_reconcile, last_reconcile, current_baseline, blocking_claims[], reality_sources[]}');
      process.exit(1);
    }
    if (m.last_reconcile && (typeof m.last_reconcile.id !== "string" || typeof m.last_reconcile.completed_at !== "string")) {
      console.error('REJECTED: maintenance.last_reconcile requires {id, completed_at, ...} when set');
      process.exit(1);
    }
    if (!Array.isArray(obj.health_criteria) || !Array.isArray(obj.validation_runs)) {
      console.error('REJECTED: v1.2 state requires array "health_criteria" and "validation_runs"');
      process.exit(1);
    }
    for (const h of obj.health_criteria) {
      if (h && "state" in h) {
        console.error(`REJECTED: health_criteria entry uses retired field "state" — use "desired_state" only (id ${h.id || "?"})`);
        process.exit(1);
      }
      if (!h || typeof h.id !== "string" || typeof h.desired_state !== "string" || !HC_STATUSES.includes(h.status)) {
        console.error(`REJECTED: health_criteria entry invalid (id, desired_state, status ${HC_STATUSES.join("|")}): ${JSON.stringify(h)}`);
        process.exit(1);
      }
    }
    for (const v of obj.validation_runs) {
      if (!v || typeof v.run_id !== "string" || typeof v.cycle_id !== "string") {
        console.error(`REJECTED: validation_runs entry requires {run_id, cycle_id, gate_kind, verdict, report}: ${JSON.stringify(v)}`);
        process.exit(1);
      }
    }
    // privacy.retention_duties: the non-sensitive index that makes a retention
    // deadline something the system can surface. Two rules worth enforcing here:
    // a duty with no delete_by is a promise nobody can check, and identifying
    // data must never reach state (it belongs in private/ only).
    if (obj.privacy !== undefined) {
      const pv = obj.privacy;
      if (!pv || typeof pv !== "object" || !Array.isArray(pv.retention_duties)) {
        console.error('REJECTED: "privacy" must be an object with array "retention_duties"');
        process.exit(1);
      }
      const DUTY_STATUS = ["active", "due", "disposed", "extended"];
      const FORBIDDEN = ["name", "email", "phone", "contact", "consent_text", "notes", "address", "handle"];
      for (const d of pv.retention_duties) {
        if (!d || typeof d.participant_id !== "string" || typeof d.delete_by !== "string" || !DUTY_STATUS.includes(d.status)) {
          console.error(
            `REJECTED: retention_duties entry requires {participant_id, delete_by, status ${DUTY_STATUS.join("|")}}: ${JSON.stringify(d)}`
          );
          process.exit(1);
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d.delete_by)) {
          console.error(`REJECTED: retention_duties delete_by must be YYYY-MM-DD (got "${d.delete_by}")`);
          process.exit(1);
        }
        if (!/^P\d+$/.test(d.participant_id)) {
          console.error(
            `REJECTED: retention_duties participant_id must be a pseudonymous P-id (got "${d.participant_id}") — identities live only in private/contacts.md`
          );
          process.exit(1);
        }
        for (const k of Object.keys(d)) {
          if (FORBIDDEN.includes(k.toLowerCase())) {
            console.error(
              `REJECTED: retention_duties entry carries "${k}" — state.json is the non-sensitive index; consent text and identifying data stay in private/participant-data-manifest.md`
            );
            process.exit(1);
          }
        }
      }
    }
    // FREEZE RULE: once a cycle is locked/stopped, everything it owns is immutable.
    // For the inline cycle that includes the owned top-level subtree; for EVERY
    // locked/stopped cycle its index entry itself (id/status/parent/state) is
    // frozen too — mutating the entry first was a proven two-step unfreeze bypass.
    try {
      if (fs.existsSync(target)) {
        const prev = JSON.parse(fs.readFileSync(target, "utf8"));
        const prevCycles = Array.isArray(prev.cycles) ? prev.cycles : [];
        for (const pc of prevCycles) {
          if (!pc || !["locked", "stopped"].includes(pc.status)) continue;
          const nc = obj.cycles.find((c) => c.id === pc.id);
          if (!nc || JSON.stringify(nc) !== JSON.stringify(pc)) {
            console.error(
              `REJECTED: cycle ${pc.id} is ${pc.status} — its cycles[] entry is frozen (no status/parent/state/id changes, no removal).`
            );
            process.exit(1);
          }
        }
        const prevInline = prevCycles.find((c) => c && c.state === null);
        const frozen = prevInline && ["locked", "stopped"].includes(prevInline.status);
        if (frozen) {
          const FROZEN_KEYS = ["gates", "thresholds", "kill_criteria", "active", "mode", "waiting_on", "artifacts"];
          const changed = FROZEN_KEYS.filter((k) => JSON.stringify(prev[k]) !== JSON.stringify(obj[k]));
          if (changed.length) {
            console.error(
              `REJECTED: cycle ${prevInline.id} is ${prevInline.status} — its owned subtree is frozen; this write changes [${changed.join(", ")}]. Post-LOCK verification uses validation runs / a new cycle, never edits to a locked cycle's state (maintenance-rules.md).`
            );
            process.exit(1);
          }
        }
      }
    } catch (e) {
      // unreadable previous state: do not enforce freeze against a corrupt file
    }
  }
  // path/idea correspondence
  const dirIdea = path.basename(path.dirname(path.resolve(target)));
  if (obj.idea !== dirIdea) {
    console.error(`REJECTED: idea "${obj.idea}" does not match directory "${dirIdea}"`);
    process.exit(1);
  }
  atomicWrite(obj, target);
});

function validateKillCriteria(list, label) {
  const KC_STATUSES = ["armed", "triggered", "cleared", "retired"];
  const validDate = (s) => {
    const m = typeof s === "string" && s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
  };
  if (!Array.isArray(list)) {
    console.error(`REJECTED: "${label}" must be an array (empty is fine, but the key must be a present array)`);
    process.exit(1);
  }
  for (const k of list) {
    if (k && "state" in k) {
      console.error(`REJECTED: ${label} entry uses retired field "state" — use "desired_state" only (id ${k.id || "?"})`);
      process.exit(1);
    }
    if (!k || typeof k.id !== "string" || typeof k.desired_state !== "string") {
      console.error(`REJECTED: ${label} entry missing "id" or "desired_state": ${JSON.stringify(k)}`);
      process.exit(1);
    }
    if (!KC_STATUSES.includes(k.status)) {
      console.error(`REJECTED: ${label} "${k.id}" has invalid status "${k.status}"`);
      process.exit(1);
    }
    // Disposition rules (identical everywhere): retired REQUIRES a complete
    // disposition; any disposition present requires {result, valid date}.
    if (k.status === "retired" && !k.disposition) {
      console.error(`REJECTED: ${label} "${k.id}" is retired but has no disposition {result, date} — retirement only happens via the LOCK disposition ceremony`);
      process.exit(1);
    }
    if (k.disposition) {
      if (!["retire", "carry", "replace"].includes(k.disposition.result) || !validDate(k.disposition.date)) {
        console.error(`REJECTED: ${label} "${k.id}" disposition must be {result: retire|carry|replace, date: real YYYY-MM-DD}`);
        process.exit(1);
      }
    }
  }
}

function atomicWrite(obj, target) {
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
}

function writeFragment(obj, resolvedTarget) {
  const CYCLE_STATUSES = ["framing", "validation", "locked", "stopped"];
  const KC_STATUSES = ["armed", "triggered", "cleared", "retired"];
  const dirCycle = path.basename(path.dirname(resolvedTarget));
  for (const k of [
    "cycle_id", "parent", "status", "mode", "active", "gates", "thresholds",
    "kill_criteria", "waiting_on", "artifacts", "validation_runs", "updated",
  ]) {
    if (!(k in obj)) {
      console.error(`REJECTED: cycle fragment missing required key "${k}"`);
      process.exit(1);
    }
  }
  if (obj.cycle_id !== dirCycle) {
    console.error(`REJECTED: cycle_id "${obj.cycle_id}" does not match directory "${dirCycle}"`);
    process.exit(1);
  }
  if (!CYCLE_STATUSES.includes(obj.status)) {
    console.error(`REJECTED: fragment status "${obj.status}" invalid (${CYCLE_STATUSES.join("|")})`);
    process.exit(1);
  }
  if (!Array.isArray(obj.active) || !Array.isArray(obj.waiting_on) || !Array.isArray(obj.validation_runs)) {
    console.error('REJECTED: fragment "active", "waiting_on", "validation_runs" must be arrays');
    process.exit(1);
  }
  if (typeof obj.mode !== "string" || !obj.thresholds || typeof obj.thresholds !== "object" || Array.isArray(obj.thresholds) || !obj.artifacts || typeof obj.artifacts !== "object" || Array.isArray(obj.artifacts)) {
    console.error('REJECTED: fragment "mode" must be a string; "thresholds" and "artifacts" must be non-null objects');
    process.exit(1);
  }
  if (!obj.gates || typeof obj.gates !== "object" || Array.isArray(obj.gates)) {
    console.error('REJECTED: fragment "gates" must be a non-null object');
    process.exit(1);
  }
  const GATE_STATUSES = ["pending", "in_progress", "passed", "failed", "open"];
  for (const [g, v] of Object.entries(obj.gates)) {
    if (!v || !GATE_STATUSES.includes(v.status)) {
      console.error(`REJECTED: fragment gate "${g}" has invalid status "${v && v.status}"`);
      process.exit(1);
    }
  }
  validateKillCriteria(obj.kill_criteria, "fragment kill_criteria");
  // Root-index correspondence: the idea root state.json must list this cycle with
  // a matching fragment pointer (split-brain prevention). Root lives two dirs up.
  const rootState = path.join(path.dirname(path.dirname(path.dirname(resolvedTarget))), "state.json");
  try {
    const root = JSON.parse(fs.readFileSync(rootState, "utf8"));
    const entry = Array.isArray(root.cycles) && root.cycles.find((c) => c && c.id === obj.cycle_id);
    if (!entry || entry.state !== `cycles/${obj.cycle_id}/state.json`) {
      console.error(
        `REJECTED: root state.json does not index cycle "${obj.cycle_id}" with state pointer "cycles/${obj.cycle_id}/state.json" — register the cycle in the root index first.`
      );
      process.exit(1);
    }
    if (obj.parent !== entry.parent) {
      console.error(`REJECTED: fragment parent "${obj.parent}" disagrees with root index parent "${entry.parent}"`);
      process.exit(1);
    }
    // Status invariant: root index entry and fragment must agree — update the
    // root entry FIRST, then the fragment (a locked fragment under a "framing"
    // index entry left the entry unfrozen: proven round-8 gap).
    if (obj.status !== entry.status) {
      console.error(
        `REJECTED: fragment status "${obj.status}" disagrees with root index status "${entry.status}" — update the root cycles[] entry first, then write the fragment to match.`
      );
      process.exit(1);
    }
  } catch (e) {
    console.error(`REJECTED: cannot read idea root state.json (${rootState}) to verify the cycle index — fragments are never written unindexed.`);
    process.exit(1);
  }
  // FREEZE RULE for fragments: a locked/stopped fragment on disk is immutable —
  // including parent/cycle_id/status (no two-step unfreeze).
  try {
    if (fs.existsSync(resolvedTarget)) {
      const prev = JSON.parse(fs.readFileSync(resolvedTarget, "utf8"));
      if (["locked", "stopped"].includes(prev.status)) {
        const FROZEN_KEYS = ["cycle_id", "parent", "status", "gates", "thresholds", "kill_criteria", "active", "mode", "waiting_on", "artifacts", "validation_runs"];
        const changed = FROZEN_KEYS.filter((k) => JSON.stringify(prev[k]) !== JSON.stringify(obj[k]));
        if (changed.length) {
          console.error(
            `REJECTED: cycle ${prev.cycle_id} is ${prev.status} — the fragment is frozen; this write changes [${changed.join(", ")}].`
          );
          process.exit(1);
        }
      }
    }
  } catch (e) {
    /* unreadable previous fragment: don't enforce freeze against corrupt data */
  }
  atomicWrite(obj, resolvedTarget);
}
