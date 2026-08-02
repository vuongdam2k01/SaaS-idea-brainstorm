#!/usr/bin/env node
/**
 * Source-registry structural validator (saas-idea-brainstorm plugin, v1.4.0).
 *
 * Answers a founder-observed pain distinct from the evidence-ledger's own
 * checks: research agents (`competitor-scanner`, `community-review-miner`)
 * re-fetching a URL they had already mined, and mining rounds with no
 * pre-registered stop. `source-registry.md` (method-rules-artifact-schema) is
 * the tracked record of every URL a research agent has touched; this script
 * checks it against `evidence-ledger.md` the same way `validate-evidence-ledger.js`
 * checks the ledger against itself — structure and cross-reference only, never
 * a semantic judgement (is a rescan justification actually GOOD is a gatekeeper
 * reading, not a script's job).
 *
 * Deliberately advisory for now (wired into gate-check Layer 1 as a non-blocking
 * check, per method-rules §14's "earn it before you enforce it" discipline) —
 * a brand-new check should not become a gate blocker the day it ships.
 *
 * Usage:
 *   node scripts/validate-source-registry.js <idea-dir> [--json]
 * Exit codes: 0 = no errors (warnings allowed), 1 = errors, 2 = unusable input.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { canonicalize } = require("./lib/url-canon.js");
const { parseLedger } = require("./validate-evidence-ledger.js");

function isHttpUrl(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v.trim());
}

function isPresent(v) {
  if (!v) return false;
  const t = String(v).trim().toLowerCase();
  return t !== "" && t !== "-" && t !== "—" && t !== "--" && t !== "n/a" && t !== "na" && t !== "none" && t !== "0";
}

/** Same tolerant table parser shape as validate-evidence-ledger.js's parseLedger,
 * generalized here to any header containing "canonical_url" — a second bespoke
 * parser would drift from the ledger's the first time either changed. */
function parseRegistry(text) {
  const lines = text.split(/\r?\n/);
  let header = null;
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) {
      if (header) break;
      continue;
    }
    const cells = line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|\s*$/, "")
      .split("|")
      .map((c) => c.trim());
    if (!cells.length) continue;
    const lower = cells.map((c) => c.toLowerCase());
    if (!header) {
      if (lower.includes("canonical_url")) {
        header = {};
        lower.forEach((name, idx) => {
          if (name && !(name in header)) header[name] = idx;
        });
      }
      continue;
    }
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    if (!cells[0] || cells[0].startsWith(">")) continue;
    rows.push({ cells, line: i + 1 });
  }
  return { header, rows };
}

function cell(row, cols, name) {
  const idx = cols[name];
  if (idx === undefined) return "";
  const v = row.cells[idx];
  return v === undefined ? "" : v.trim();
}

function main(argv) {
  const args = argv.slice(2);
  const jsonOut = args.includes("--json");
  const ideaDir = args.find((a) => !a.startsWith("--"));
  if (!ideaDir) {
    process.stderr.write("usage: validate-source-registry.js <idea-dir> [--json]\n");
    return 2;
  }

  const findings = [];
  const add = (level, code, where, message) => findings.push({ level, code, where, message });

  const ledgerPath = path.join(ideaDir, "evidence-ledger.md");
  const registryPath = path.join(ideaDir, "source-registry.md");

  if (!fs.existsSync(ledgerPath)) {
    add("error", "no-ledger", ledgerPath, "evidence-ledger.md does not exist — nothing to cross-check");
    return report(findings, jsonOut, null);
  }

  const ledgerParsed = parseLedger(fs.readFileSync(ledgerPath, "utf8"));
  const ledgerUrls = new Set();
  if (ledgerParsed.header) {
    for (const row of ledgerParsed.rows) {
      const raw = cell(row, ledgerParsed.header, "url_or_ref");
      if (isHttpUrl(raw)) ledgerUrls.add(canonicalize(raw));
    }
  }

  if (!fs.existsSync(registryPath)) {
    // No research fetch has happened yet iff the ledger cites no URLs either;
    // otherwise the registry is missing while URLs are already in use.
    if (ledgerUrls.size) {
      add(
        "error",
        "registry-missing",
        registryPath,
        `evidence-ledger.md cites ${ledgerUrls.size} URL(s) but source-registry.md does not exist yet — create it (skills/stage-1-competitive-templates)`
      );
    }
    return report(findings, jsonOut, { ledger_urls: ledgerUrls.size, registry_rows: 0 });
  }

  const registryText = fs.readFileSync(registryPath, "utf8");
  const parsed = parseRegistry(registryText);
  if (!parsed.header) {
    add("error", "no-registry-table", registryPath, "no source-registry table found (need a header row containing `canonical_url`)");
    return report(findings, jsonOut, null);
  }

  const seen = new Map();
  const registryUrls = new Set();
  for (const row of parsed.rows) {
    const at = `row ${row.line}`;
    const rawUrl = cell(row, parsed.header, "canonical_url");
    if (!rawUrl) {
      add("error", "missing-canonical-url", at, "row has no canonical_url");
      continue;
    }
    const canon = canonicalize(rawUrl);
    if (canon !== rawUrl.trim()) {
      add(
        "warning",
        "not-canonical",
        at,
        `"${rawUrl}" is not written in canonical form (expected "${canon}") — re-run url-canon.js before recording it`
      );
    }
    if (seen.has(canon)) {
      add("error", "duplicate-registry-row", at, `"${canon}" already registered at ${seen.get(canon)} — one row per canonical URL`);
    } else {
      seen.set(canon, at);
    }
    registryUrls.add(canon);

    const rescanCount = cell(row, parsed.header, "rescan_count");
    const justification = cell(row, parsed.header, "last_rescan_justification");
    if (isPresent(rescanCount) && Number(rescanCount) > 0 && !isPresent(justification)) {
      add(
        "error",
        "rescan-without-justification",
        at,
        `"${canon}" has rescan_count ${rescanCount} but no last_rescan_justification — a rescan is never "just checking again"`
      );
    }

    for (const required of ["content_hash", "first_seen_run"]) {
      if (!isPresent(cell(row, parsed.header, required))) {
        add("warning", `missing-${required.replace(/_/g, "-")}`, at, `"${canon}": no ${required} recorded`);
      }
    }
  }

  // Cross-check: every URL the ledger actually cites should be a registered
  // source. Missing rows are what the founder's re-fetching pain looks like from
  // the ledger side — a URL that was mined without ever being checked against
  // (or added to) the registry first.
  for (const url of ledgerUrls) {
    if (!registryUrls.has(url)) {
      add("error", "url-not-registered", ledgerPath, `evidence-ledger.md cites "${url}" but it has no source-registry.md row`);
    }
  }

  const summary = {
    ledger_urls: ledgerUrls.size,
    registry_rows: parsed.rows.length,
    registry_urls: registryUrls.size,
    unregistered: [...ledgerUrls].filter((u) => !registryUrls.has(u)).length,
  };
  return report(findings, jsonOut, summary);
}

function report(findings, jsonOut, summary) {
  const errors = findings.filter((f) => f.level === "error").length;
  const warnings = findings.length - errors;
  if (jsonOut) {
    process.stdout.write(JSON.stringify({ errors, warnings, findings, summary }, null, 2) + "\n");
  } else {
    for (const f of findings) process.stdout.write(`${f.level.toUpperCase()} ${f.code} [${f.where}] ${f.message}\n`);
    if (summary) {
      process.stdout.write(
        `\nledger URLs ${summary.ledger_urls} · registry rows ${summary.registry_rows || 0} · unregistered ${summary.unregistered || 0}\n`
      );
    }
    process.stdout.write(`${errors} error(s), ${warnings} warning(s)\n`);
  }
  return errors ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { main, parseRegistry };
