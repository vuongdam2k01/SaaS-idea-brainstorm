#!/usr/bin/env node
/**
 * Finding fingerprints + regression check (saas-idea-brainstorm plugin, v1.4.0).
 *
 * Answers a founder-observed pain: gatekeeper review rounds that never converge
 * because a finding gets restated in different words every round, or a founder
 * reopens something already dispositioned with no evidence anything actually
 * changed. A **fingerprint** is a stable identity for one finding across rounds
 * (gate, file, section, issue type, claim id) — the same finding hashes the same
 * way every time, so `audit-trail.md` can say "this is the SAME finding as B4
 * three attempts ago" instead of a human eyeballing prose for a match.
 *
 * `--check-regression` answers the companion question the checklist item in
 * `agents/gatekeeper.md` needs: reopening a fingerprint whose latest disposition
 * was fixed/accepted/deferred requires a CITED regression, not a restatement. It
 * compares the current content hash of the file the finding "lands on" against
 * the hash captured in the Layer-1 gate-input manifest from the attempt where
 * that disposition was recorded (`artifact-manifest.js`, same hashing — see its
 * header comment on why a second implementation is never created).
 *
 * Usage:
 *   node scripts/finding-fingerprint.js compute <gate> <file> <section> <issue_type> <claim_id>
 *   node scripts/finding-fingerprint.js --check-regression <idea-dir> <fingerprint> [--json]
 * Exit codes: 0 ok, 1 finding/regression check failed or inconclusive, 2 usage/unreadable input.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Stable sha256 identity for one finding. Order and exact spelling of the five
 * components matter (they are the fingerprint's whole meaning), so callers must
 * pass them in this order every time — never derive it from free-text prose,
 * which is exactly the ambiguity a fingerprint exists to remove.
 */
function fingerprint(gate, file, section, issueType, claimId) {
  const parts = [gate, file, section, issueType, claimId].map((v) => String(v == null ? "" : v).trim());
  return crypto.createHash("sha256").update(parts.join("")).digest("hex");
}

/** Strip a trailing ":line" or ":line-start-line-end" suffix from a "lands on" cell. */
function stripLineRef(landsOn) {
  return String(landsOn || "").trim().replace(/:\d+(-\d+)?$/, "");
}

/**
 * Parse audit-trail.md into attempt sections, each with its header fields and
 * finding rows. Deliberately tolerant of the pre-v1.4.0 5-column shape (no
 * `fingerprint` column) — those rows simply never match a fingerprint lookup,
 * which is correct: a fingerprint was never computed for them.
 */
function parseAuditTrail(text) {
  const lines = text.split(/\r?\n/);
  const sections = [];
  let current = null;
  let header = null; // column name -> index, for the CURRENT table
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h = line.match(/^##\s+(\S+)\s+attempt\s+(\d+)\s+—\s+(\d{4}-\d{2}-\d{2})\s+—\s+(.+)$/);
    if (h) {
      current = { gate: h[1], attempt: h[2].padStart(2, "0"), date: h[3].replace(/-/g, ""), verdict: h[4].trim(), rows: [] };
      sections.push(current);
      header = null;
      continue;
    }
    if (!current || !line.trim().startsWith("|")) continue;
    const cells = line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue; // separator row
    const lower = cells.map((c) => c.toLowerCase());
    if (!header && lower.includes("id") && lower.includes("status")) {
      header = {};
      lower.forEach((name, idx) => {
        if (name && !(name in header)) header[name] = idx;
      });
      continue;
    }
    if (header) current.rows.push(cells);
  }
  return sections;
}

/**
 * Find every row across every attempt section whose `fingerprint` cell equals
 * the target, in file order (append-only, so the LAST match is the most recent
 * disposition).
 */
function findRows(sections, fp) {
  const hits = [];
  for (const s of sections) {
    for (const cells of s.rows) {
      // Column positions are per-section (a pre-1.4.0 section has no fingerprint
      // column at all, so it can never match); re-derive from the section's own
      // header would require carrying it per-row — simpler and just as correct:
      // scan cell-by-cell for an exact 64-hex-char match, which only a
      // `fingerprint` cell can produce (severities/statuses/ids never are hex-64).
      if (cells.some((c) => c.toLowerCase() === fp.toLowerCase())) hits.push({ section: s, cells });
    }
  }
  return hits;
}

function checkRegression(ideaDir, fp) {
  const auditPath = path.join(ideaDir, "audit-trail.md");
  if (!fs.existsSync(auditPath)) {
    return { ok: false, code: "no-audit-trail", detail: "audit-trail.md does not exist in this idea" };
  }
  const sections = parseAuditTrail(fs.readFileSync(auditPath, "utf8"));
  const hits = findRows(sections, fp);
  if (!hits.length) {
    return { ok: false, code: "fingerprint-not-found", detail: `no row in audit-trail.md carries fingerprint ${fp}` };
  }
  const last = hits[hits.length - 1];
  // "lands on" is conventionally the second-to-last cell (status is last); tolerate
  // either 5- or 6-column shape by locating status as the LAST cell and lands-on
  // as the one before it, per the documented row shapes in method-rules-artifact-schema.
  const cells = last.cells;
  const status = cells[cells.length - 1];
  const landsOnRaw = cells[cells.length - 2];
  const file = stripLineRef(landsOnRaw);
  const manifestPath = path.join(ideaDir, "private", `manifest-${last.section.gate}-${last.section.date}-${last.section.attempt}.json`);
  const result = {
    fingerprint: fp,
    gate: last.section.gate,
    attempt: last.section.attempt,
    lands_on: landsOnRaw,
    file,
    disposition_status: status,
  };
  if (!fs.existsSync(manifestPath)) {
    return {
      ok: false,
      code: "no-baseline-manifest",
      detail: `no Layer-1 manifest at ${path.relative(ideaDir, manifestPath)} — cannot mechanically compare; a reopening must cite the regression by hand and say so`,
      ...result,
    };
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (e) {
    return { ok: false, code: "unreadable-manifest", detail: e.message, ...result };
  }
  const entry = (manifest.entries || []).find((e) => e.path === file || e.path.endsWith("/" + file));
  if (!entry) {
    return { ok: false, code: "file-not-in-manifest", detail: `${file} is not in the baseline manifest`, ...result };
  }
  const abs = path.join(ideaDir, file);
  if (!fs.existsSync(abs)) {
    return { ok: false, code: "file-missing-now", detail: `${file} no longer exists`, ...result, baseline_sha256: entry.sha256 };
  }
  const currentHash = crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
  const changed = currentHash !== entry.sha256;
  return {
    ok: true,
    changed,
    ...result,
    baseline_sha256: entry.sha256,
    current_sha256: currentHash,
    note: changed
      ? "file content changed since the disposition — a reopening citing this diff is legitimate"
      : "file content is byte-identical to the disposition — reopening needs a different cited reason (new external evidence, not this file)",
  };
}

function main(argv) {
  const args = argv.slice(2);
  const jsonOut = args.includes("--json");
  const positional = args.filter((a) => !a.startsWith("--"));

  if (positional[0] === "compute") {
    const [, gate, file, section, issueType, claimId] = positional;
    if (!gate || !file || !section || !issueType || !claimId) {
      process.stderr.write("usage: finding-fingerprint.js compute <gate> <file> <section> <issue_type> <claim_id>\n");
      return 2;
    }
    const fp = fingerprint(gate, file, section, issueType, claimId);
    if (jsonOut) process.stdout.write(JSON.stringify({ fingerprint: fp }) + "\n");
    else process.stdout.write(fp + "\n");
    return 0;
  }

  if (args.includes("--check-regression")) {
    const ideaDir = positional[0];
    const fp = positional[1];
    if (!ideaDir || !fp) {
      process.stderr.write("usage: finding-fingerprint.js --check-regression <idea-dir> <fingerprint> [--json]\n");
      return 2;
    }
    const result = checkRegression(ideaDir, fp);
    if (jsonOut) {
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    } else if (result.ok) {
      process.stdout.write(
        `${result.changed ? "CHANGED" : "UNCHANGED"}: ${result.file} (baseline ${result.baseline_sha256.slice(0, 12)}, now ${result.current_sha256.slice(0, 12)})\n${result.note}\n`
      );
    } else {
      process.stdout.write(`INCONCLUSIVE ${result.code}: ${result.detail}\n`);
    }
    return result.ok ? 0 : 1;
  }

  process.stderr.write(
    "usage: finding-fingerprint.js compute <gate> <file> <section> <issue_type> <claim_id>\n" +
      "       finding-fingerprint.js --check-regression <idea-dir> <fingerprint> [--json]\n"
  );
  return 2;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { fingerprint, checkRegression, parseAuditTrail, stripLineRef };
