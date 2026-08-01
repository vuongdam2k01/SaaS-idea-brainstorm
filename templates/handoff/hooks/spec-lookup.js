#!/usr/bin/env node
/**
 * spec-lookup — resolve a frozen-spec id to its file, section and text.
 *
 * Generated into this repo by the saas-idea-brainstorm plugin's build handoff.
 * Reads .claude/product-spec/spec-index.json (produced from the locked pack + blueprint)
 * so an agent never has to infer where a decision was written.
 *
 * Usage:
 *   node .claude/product-spec/spec-lookup.js AC-03-2      resolve one id, print its section
 *   node .claude/product-spec/spec-lookup.js fs-03 INV-1  resolve several
 *   node .claude/product-spec/spec-lookup.js --list       every indexed id, grouped by kind
 *   node .claude/product-spec/spec-lookup.js --list AC     every id of one kind
 *   node .claude/product-spec/spec-lookup.js --grep invite ids whose label matches
 *
 * Exit 0 = every id resolved. Exit 1 = at least one did not (an unresolved id is a
 * finding: either a typo, or a reference to something that was never specified).
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = findRoot(process.cwd());
if (!ROOT) fail(".claude/product-spec/spec-index.json not found above " + process.cwd() +
  " — this repo has no build-handoff kit, or you are outside it.");
const INDEX_PATH = path.join(ROOT, ".claude", "product-spec", "spec-index.json");
let INDEX;
try {
  INDEX = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
} catch (e) {
  fail("spec-index.json is unreadable (" + e.message + ") — regenerate the handoff kit.");
}
const IDS = (INDEX && INDEX.ids) || {};
const SPEC_ROOT = (INDEX && INDEX.spec_root) || "docs/product";
const args = process.argv.slice(2);

if (!args.length || args[0] === "--help" || args[0] === "-h") {
  out(header());
  out("usage: spec-lookup.js <id>... | --list [kind] | --grep <text>");
  process.exit(0);
}

if (args[0] === "--list") {
  const want = args[1] ? args[1].toLowerCase() : null;
  const byKind = {};
  for (const [id, rec] of Object.entries(IDS)) {
    const k = rec.kind || "other";
    if (want && k.toLowerCase() !== want && !id.toLowerCase().startsWith(want)) continue;
    (byKind[k] = byKind[k] || []).push([id, rec]);
  }
  const kinds = Object.keys(byKind).sort();
  if (!kinds.length) fail("no ids of kind \"" + args[1] + "\" are indexed.");
  out(header());
  for (const k of kinds) {
    out("\n## " + k + " (" + byKind[k].length + ")");
    for (const [id, rec] of byKind[k].sort((a, b) => a[0].localeCompare(b[0], "en", { numeric: true })))
      out("  " + id.padEnd(14) + (rec.label || "").slice(0, 90) + "   [" + rec.file + "]");
  }
  process.exit(0);
}

if (args[0] === "--grep") {
  const needle = args.slice(1).join(" ").toLowerCase();
  if (!needle) fail("--grep needs text to match.");
  const hits = Object.entries(IDS).filter(
    ([id, rec]) => id.toLowerCase().includes(needle) || (rec.label || "").toLowerCase().includes(needle)
  );
  if (!hits.length) fail("no indexed id or label matches \"" + needle + "\".");
  out(header());
  for (const [id, rec] of hits) out("  " + id.padEnd(14) + (rec.label || "") + "   [" + rec.file + "]");
  process.exit(0);
}

let missing = 0;
out(header());
for (const raw of args) {
  const id = resolveKey(raw);
  if (!id) {
    missing++;
    out("\n### " + raw + " — NOT INDEXED");
    out("  No definition site for this id in the locked pack + blueprint.");
    const near = Object.keys(IDS)
      .filter((k) => k.toLowerCase().startsWith(raw.toLowerCase().slice(0, 3)))
      .slice(0, 8);
    if (near.length) out("  Similar indexed ids: " + near.join(", "));
    out("  This is a finding, not a licence to decide: it is a typo, a reference to something");
    out("  never specified, or a spec the kit was generated before. Do not invent the answer.");
    continue;
  }
  const rec = IDS[id];
  const abs = path.join(ROOT, SPEC_ROOT, rec.file);
  out("\n### " + id + " — " + (rec.label || "(no label)"));
  out("file:   " + SPEC_ROOT + "/" + rec.file + (rec.anchor ? "   section: <!-- " + rec.anchor + " -->" : ""));
  const text = read(abs);
  if (text === null) {
    out("  (file missing on disk — the kit is damaged; regenerate it)");
    missing++;
    continue;
  }
  const body = rec.anchor ? section(text, rec.anchor) : text;
  if (body === null) {
    out("  (anchor not found in the file — the kit is stale; regenerate it)");
    missing++;
    continue;
  }
  out("---");
  out(trimTo(body, 160));
  out("---");
  const rowText = rec.anchor ? rowFor(body, id) : null;
  if (rowText) out("row: " + rowText);
}

if (INDEX.amendments_through && INDEX.amendments_through !== "none")
  out("\nAmendments through " + INDEX.amendments_through +
      " — " + SPEC_ROOT + "/blueprint/amendment-log.md overrides the locked files wherever it speaks.");
process.exit(missing ? 1 : 0);

// ------------------------------------------------------------------ helpers
function header() {
  return "spec-index " + (INDEX.product || "?") + " · generated " + (INDEX.generated || "?") +
    " · " + Object.keys(IDS).length + " ids" + (INDEX.draft ? " · DRAFT (blueprint not locked)" : "");
}
function resolveKey(raw) {
  if (IDS[raw]) return raw;
  const lower = raw.toLowerCase();
  for (const k of Object.keys(IDS)) if (k.toLowerCase() === lower) return k;
  return null;
}
function read(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}
function section(text, anchor) {
  const m = text.match(new RegExp("<!--\\s*" + anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*-->"));
  if (!m) return null;
  const rest = text.slice(m.index + m[0].length);
  const next = rest.search(/<!--\s*(bp|pack):/);
  return (next === -1 ? rest : rest.slice(0, next)).replace(/^\s*\n/, "");
}
function rowFor(body, id) {
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim();
    if (/^\|/.test(t)) {
      const first = t.replace(/^\|/, "").split("|")[0].trim().replace(/`/g, "");
      if (first.toLowerCase() === id.toLowerCase()) return t;
    }
  }
  return null;
}
function trimTo(text, maxLines) {
  const lines = text.replace(/\s+$/, "").split(/\r?\n/);
  if (lines.length <= maxLines) return lines.join("\n");
  return lines.slice(0, maxLines).join("\n") +
    "\n… (" + (lines.length - maxLines) + " more lines — open the file for the rest)";
}
function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, ".claude", "product-spec", "spec-index.json"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
  return null;
}
function out(s) { process.stdout.write(s + "\n"); }
function fail(msg) { process.stderr.write("spec-lookup: " + msg + "\n"); process.exit(1); }
