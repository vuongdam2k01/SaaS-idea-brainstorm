#!/usr/bin/env node
/**
 * Threshold-snapshot verifier (saas-idea-brainstorm plugin, v1.2.0).
 *
 * The pipeline's headline integrity claim is "thresholds are signed before the
 * tests run, and a signed threshold cannot move without an approved revision".
 * Until now that claim was enforced in two places, neither of them sufficient:
 *   - `hooks/guard-thresholds.js` — per-write, defence-in-depth, and by design
 *     fails open; a disabled or crashed hook disables it entirely.
 *   - `gate-check` Layer 1 — prose telling the model to "compare current
 *     state.thresholds against the latest threshold-snapshot row plus approved
 *     revisions". Prose cannot be regression-tested, and dogfood run #2 never
 *     executed it even once (F failed before the signing ceremony, so
 *     `signed_date` stayed null and the comparison never ran).
 *
 * So the load-bearing half of the guarantee had never run. This file is that
 * half, as code: deterministic, hook-independent, and testable.
 *
 * What it proves: current `state.thresholds` is exactly the signed snapshot with
 * the approved revision chain applied — no silent edit, no self-authorized
 * revision that does not reconstruct, and no movement of `signed_date` itself
 * (backdating it is the one edit that makes late evidence look pre-registered,
 * and Layer 1's "signed BEFORE evidence dates" check would reward rather than
 * catch it — so the field is sealed here exactly as it is in the hook).
 *
 * What it does NOT do: judge whether a revision's *reason* is honest, or whether
 * the user really approved it. `user_approved: true` is data the writer authors;
 * no file-level check can distinguish a real approval from an asserted one. That
 * boundary is stated rather than papered over — see the `self_authored` warning.
 *
 * Usage:
 *   node scripts/verify-threshold-snapshot.js <idea-dir> [--json]
 * Exit codes: 0 = verified (warnings allowed), 1 = mismatch/tamper, 2 = unusable input.
 */
"use strict";
const fs = require("fs");
const path = require("path");

// Same list, same order, same seal as hooks/scripts/guard-thresholds.js. Two
// copies of this vocabulary would drift into an integrity dialect, so if you add
// a threshold field, add it in both and add a fixture that fails without it.
const THRESHOLD_FIELDS = [
  "signed_date",
  "v1_past_behavior_pct",
  "v1_min_sample",
  "v3_min_commitments",
  "r1_eval_pass_pct",
];
const SEALED = new Set(["signed_date"]);

const canon = (v) => JSON.stringify(v === undefined ? null : v);

function validDate(s) {
  const m = typeof s === "string" && s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/**
 * Pull the balanced JSON object out of a decision-log row. The snapshot has
 * lived in the `decision` column (6-column journals) and in `detail` (7-column),
 * and a journal keeps its original header forever by design (artifact-schema:
 * append a versioned table, never rewrite old rows). So scan the whole row rather
 * than trusting a column index — a verifier that only understood the current
 * format would silently skip every pre-migration signature.
 */
function extractSnapshotJson(row) {
  for (let i = 0; i < row.length; i++) {
    if (row[i] !== "{") continue;
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < row.length; j++) {
      const c = row[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          const blob = row.slice(i, j + 1);
          try {
            const parsed = JSON.parse(blob);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed) &&
                THRESHOLD_FIELDS.some((k) => k in parsed)) return parsed;
          } catch { /* not the blob we want; keep scanning */ }
          break;
        }
      }
    }
  }
  return null;
}

function findSnapshots(logText) {
  const out = [];
  for (const line of logText.split(/\r?\n/)) {
    if (!/^\s*\|/.test(line)) continue;
    if (!/\|\s*threshold-snapshot\s*\|/i.test(line)) continue;
    const cells = line.split("|");
    const date = (cells[1] || "").trim();
    out.push({ date, snapshot: extractSnapshotJson(line), raw: line.trim() });
  }
  return out;
}

/** Leaf address: "v1_min_sample" or "custom.<key>". */
function readField(th, field) {
  if (field.startsWith("custom.")) {
    const key = field.slice("custom.".length);
    return th && th.custom && typeof th.custom === "object" ? th.custom[key] : undefined;
  }
  return th ? th[field] : undefined;
}

function verify(ideaDir) {
  const errors = [];
  const warnings = [];
  const statePath = path.join(ideaDir, "state.json");
  const logPath = path.join(ideaDir, "decision-log.md");

  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (e) {
    return { fatal: `cannot read/parse ${statePath}: ${e.message}` };
  }
  if (!state || typeof state !== "object" || typeof state.pipeline_version !== "string") {
    return { fatal: `${statePath} is not a pipeline state (no pipeline_version)` };
  }
  const th = state.thresholds;
  if (!th || typeof th !== "object" || Array.isArray(th)) {
    return { fatal: "state.thresholds missing or not an object" };
  }

  let logText = "";
  try {
    logText = fs.readFileSync(logPath, "utf8");
  } catch {
    logText = "";
  }
  const snaps = findSnapshots(logText);
  const signed = th.signed_date;

  // --- Signature/snapshot pairing. Either both exist or neither does. ---
  if (!signed) {
    if (snaps.length) {
      errors.push({
        code: "snapshot-without-signature",
        msg: `decision-log has ${snaps.length} threshold-snapshot row(s) but state.thresholds.signed_date is null — a signature was recorded in history and then removed from state`,
      });
    }
    // Unsigned and unsnapshotted is a legitimate pre-F state, not a finding.
    return { errors, warnings, signed: null, snapshots: snaps.length };
  }
  if (!snaps.length) {
    errors.push({
      code: "signature-without-snapshot",
      msg: `state.thresholds.signed_date is ${signed} but decision-log.md contains no threshold-snapshot row — the signed values are unverifiable, so nothing constrains them`,
    });
    return { errors, warnings, signed, snapshots: 0 };
  }

  const last = snaps[snaps.length - 1];
  if (!last.snapshot) {
    errors.push({
      code: "snapshot-unparsable",
      msg: `the latest threshold-snapshot row (${last.date || "no date"}) carries no parsable thresholds JSON`,
    });
    return { errors, warnings, signed, snapshots: snaps.length };
  }
  const base = last.snapshot;

  // --- The seal. signed_date must equal the snapshot's, always. ---
  if (canon(base.signed_date) !== canon(signed)) {
    errors.push({
      code: "signed-date-moved",
      msg: `signed_date is ${canon(signed)} but the snapshot says ${canon(base.signed_date)} — the signing date is sealed and no revision can move it` +
        (validDate(signed) && validDate(base.signed_date) && signed < base.signed_date
          ? ". This is a BACKDATE: it makes evidence collected after signing appear pre-registered, which is the exact failure this pipeline exists to prevent"
          : ""),
    });
  }

  // --- Revision chain validation, then replay. ---
  const revs = Array.isArray(th.revisions) ? th.revisions : [];
  if (th.revisions !== undefined && !Array.isArray(th.revisions)) {
    errors.push({ code: "revisions-not-array", msg: "state.thresholds.revisions must be an array" });
  }
  const expected = { plain: {}, custom: {} };
  for (const f of THRESHOLD_FIELDS) expected.plain[f] = base[f];
  if (base.custom && typeof base.custom === "object") Object.assign(expected.custom, base.custom);

  revs.forEach((r, i) => {
    const at = `revisions[${i}]`;
    if (!r || typeof r !== "object") {
      errors.push({ code: "revision-malformed", msg: `${at}: not an object` });
      return;
    }
    const field = r.field;
    if (typeof field !== "string" || !field) {
      errors.push({ code: "revision-no-field", msg: `${at}: missing "field"` });
      return;
    }
    const isCustom = field.startsWith("custom.");
    if (!isCustom && !THRESHOLD_FIELDS.includes(field)) {
      errors.push({ code: "revision-unknown-field", msg: `${at}: "${field}" is not a threshold field (plain fields: ${THRESHOLD_FIELDS.join(", ")}; custom leaves are addressed as custom.<key>)` });
      return;
    }
    if (SEALED.has(field)) {
      errors.push({ code: "revision-of-sealed-field", msg: `${at}: "${field}" can never be revised — a revision entry does not authorize it (see the seal above)` });
      return;
    }
    if (r.user_approved !== true)
      errors.push({ code: "revision-unapproved", msg: `${at} (${field}): user_approved must be exactly true` });
    if (typeof r.reason !== "string" || !r.reason.trim())
      errors.push({ code: "revision-no-reason", msg: `${at} (${field}): missing a non-empty reason` });
    if (!validDate(r.date))
      errors.push({ code: "revision-bad-date", msg: `${at} (${field}): invalid date ${canon(r.date)}` });
    else if (validDate(signed) && r.date < signed)
      errors.push({ code: "revision-predates-signing", msg: `${at} (${field}): dated ${r.date}, before the signature ${signed} — a threshold cannot be revised before it was pre-registered` });
    if (!("from" in r) || !("to" in r))
      errors.push({ code: "revision-no-from-to", msg: `${at} (${field}): needs both "from" and "to" (the real old and new values, not prose)` });

    // Chain: `from` must equal the value the previous state of the chain holds.
    const cur = isCustom ? expected.custom[field.slice(7)] : expected.plain[field];
    if ("from" in r && canon(r.from) !== canon(cur)) {
      errors.push({
        code: "revision-chain-broken",
        msg: `${at} (${field}): from=${canon(r.from)} but the value at that point in the chain is ${canon(cur)} — the revision history does not reconstruct`,
      });
    }
    if ("to" in r) {
      if (isCustom) expected.custom[field.slice(7)] = r.to;
      else expected.plain[field] = r.to;
    }
  });

  // --- Replay result vs actual state. ---
  for (const f of THRESHOLD_FIELDS) {
    if (SEALED.has(f)) continue; // already sealed-checked
    if (canon(expected.plain[f]) !== canon(th[f])) {
      errors.push({
        code: "threshold-unexplained",
        msg: `${f} is ${canon(th[f])} but snapshot+revisions reconstruct ${canon(expected.plain[f])} — the value moved with no approved revision covering it`,
      });
    }
  }
  const actualCustom = th.custom && typeof th.custom === "object" ? th.custom : {};
  for (const k of new Set([...Object.keys(expected.custom), ...Object.keys(actualCustom)])) {
    if (canon(expected.custom[k]) !== canon(actualCustom[k])) {
      errors.push({
        code: "threshold-unexplained",
        msg: `custom.${k} is ${canon(actualCustom[k])} but snapshot+revisions reconstruct ${canon(expected.custom[k])} — the value moved with no approved revision covering it`,
      });
    }
  }

  // --- Honest boundary, reported every time there is a revision. ---
  if (revs.length) {
    warnings.push({
      code: "self_authored",
      msg: `${revs.length} revision(s) present. \`user_approved: true\` is data the writer authors: this check proves the chain reconstructs, NOT that the founder approved it. Confirm each revision against a decision-log row or the founder directly.`,
    });
  }
  if (snaps.length > 1) {
    warnings.push({
      code: "multiple-snapshots",
      msg: `${snaps.length} threshold-snapshot rows found; verifying against the last (${last.date || "undated"}). Re-signing should start a new cycle rather than append a second signature.`,
    });
  }

  return { errors, warnings, signed, snapshots: snaps.length };
}

function main(argv) {
  const args = argv.slice(2);
  const jsonOut = args.includes("--json");
  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir) {
    process.stderr.write("usage: verify-threshold-snapshot.js <idea-dir> [--json]\n");
    return 2;
  }
  const res = verify(dir);
  if (res.fatal) {
    if (jsonOut) process.stdout.write(JSON.stringify({ ok: false, fatal: res.fatal }, null, 2) + "\n");
    else process.stderr.write(`UNUSABLE: ${res.fatal}\n`);
    return 2;
  }
  const ok = res.errors.length === 0;
  if (jsonOut) {
    process.stdout.write(JSON.stringify({ ok, signed_date: res.signed, snapshots: res.snapshots, errors: res.errors, warnings: res.warnings }, null, 2) + "\n");
  } else {
    for (const e of res.errors) process.stdout.write(`ERROR [${e.code}] ${e.msg}\n`);
    for (const w of res.warnings) process.stdout.write(`warn  [${w.code}] ${w.msg}\n`);
    process.stdout.write(ok
      ? `OK: thresholds match the signed snapshot${res.signed ? ` (signed ${res.signed})` : " (unsigned, no snapshot — legitimate pre-F state)"}\n`
      : `FAILED: ${res.errors.length} integrity error(s)\n`);
  }
  return ok ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { main, verify, extractSnapshotJson, THRESHOLD_FIELDS, SEALED };
