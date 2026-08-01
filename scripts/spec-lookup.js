#!/usr/bin/env node
/**
 * spec-lookup — resolve a locked-spec id to the file, section and text that DEFINES it.
 *
 * For the common case: the idea workspace and the code live in the same repository, this
 * plugin is installed, and a build session needs to know what `AC-03-2` actually says.
 * There is nothing to generate and nothing to keep in sync — the index is built from the
 * artifacts on every run (~20 files, milliseconds), so it cannot go stale against an
 * amendment that landed five minutes ago.
 *
 * Usage (from anywhere inside the workspace):
 *   node scripts/spec-lookup.js AC-03-2            resolve one id
 *   node scripts/spec-lookup.js fs-03 INV-1        resolve several
 *   node scripts/spec-lookup.js --list             every id, grouped by kind
 *   node scripts/spec-lookup.js --list AC          one kind
 *   node scripts/spec-lookup.js --grep invite      ids whose label matches
 *   node scripts/spec-lookup.js --files            the spec file set, with purposes
 *   …plus --idea <slug|dir> when the workspace holds more than one idea.
 *
 * Exit 0 = every id resolved. Exit 1 = at least one did not — which is a finding, not a
 * licence to decide: a typo, a reference to something never specified, or a spec that
 * moved. Inventing the answer is the failure the whole pipeline exists to prevent.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const SI = require("./lib/spec-index.js");

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
};
const rest = argv.filter((a, i) => a !== "--idea" && argv[i - 1] !== "--idea");

const ideaDir = resolveIdea(opt("--idea"));
const idx = SI.buildIndex(ideaDir);
// state.json is the index of record for the amendment high-water mark; the file scan is
// the fallback when state has not been written (or has been rebuilt from artifacts).
try {
  const st = JSON.parse(fs.readFileSync(path.join(ideaDir, "state.json"), "utf8"));
  const last = st && st.blueprint && st.blueprint.amendments && st.blueprint.amendments.last_id;
  if (last) idx.amendmentsThrough = last;
} catch { /* artifacts remain ground truth */ }
const IDS = idx.ids;
const slug = path.basename(ideaDir);

if (!rest.length || rest[0] === "--help" || rest[0] === "-h") {
  out(header());
  out("usage: spec-lookup.js <id>... | --list [kind] | --grep <text> | --files [--idea <slug>]");
  process.exit(0);
}

if (rest[0] === "--files") {
  out(header());
  out("\nRead order:");
  idx.readOrder.forEach((r, i) => out("  " + (i + 1) + ". " + r.path + (r.note ? "   (" + r.note + ")" : "")));
  out("\nEvery file:");
  for (const f of idx.files.map((f) => f.path).sort())
    out("  " + f.padEnd(46) + SI.purposeOf(f));
  process.exit(0);
}

if (rest[0] === "--list") {
  const want = rest[1] ? rest[1].toLowerCase() : null;
  const byKind = {};
  for (const [id, rec] of Object.entries(IDS)) {
    if (want && rec.kind.toLowerCase() !== want && !id.toLowerCase().startsWith(want)) continue;
    (byKind[rec.kind] = byKind[rec.kind] || []).push([id, rec]);
  }
  const kinds = Object.keys(byKind).sort();
  if (!kinds.length) fail("no ids of kind \"" + rest[1] + "\" are defined in " + slug + ".");
  out(header());
  for (const k of kinds) {
    out("\n## " + k + " (" + byKind[k].length + ")");
    for (const [id, rec] of byKind[k].sort((a, b) => a[0].localeCompare(b[0], "en", { numeric: true })))
      out("  " + id.padEnd(14) + (rec.label || "").slice(0, 90) + "   [" + rec.file + "]");
  }
  process.exit(0);
}

if (rest[0] === "--grep") {
  const needle = rest.slice(1).join(" ").toLowerCase();
  if (!needle) fail("--grep needs text to match.");
  const hits = Object.entries(IDS).filter(
    ([id, rec]) => id.toLowerCase().includes(needle) || (rec.label || "").toLowerCase().includes(needle)
  );
  if (!hits.length) fail("no id or label in " + slug + " matches \"" + needle + "\".");
  out(header());
  for (const [id, rec] of hits) out("  " + id.padEnd(14) + (rec.label || "") + "   [" + rec.file + "]");
  process.exit(0);
}

let missing = 0;
out(header());
for (const raw of rest) {
  const id = resolveKey(raw);
  if (!id) {
    missing++;
    out("\n### " + raw + " — NOT DEFINED");
    const near = Object.keys(IDS).filter((k) => k.toLowerCase().startsWith(raw.toLowerCase().slice(0, 3))).slice(0, 8);
    if (near.length) out("  Similar ids that do exist: " + near.join(", "));
    out("  Nothing in the locked pack + blueprint defines this id. That is a finding, not a");
    out("  licence to decide: a typo, a reference to something never specified, or a spec that");
    out("  moved. Do not invent the answer — use /saas-idea-brainstorm:spec-gap.");
    continue;
  }
  const rec = IDS[id];
  const f = idx.files.find((x) => x.path === rec.file);
  out("\n### " + id + " — " + (rec.label || "(no label)"));
  out("file:   " + rec.file + (rec.anchor ? "   section: <!-- " + rec.anchor + " -->" : ""));
  const body = rec.anchor ? SI.sectionOf(f.text, rec.anchor) : f.text;
  if (body === null) { out("  (anchor missing from the file — the spec set is damaged)"); missing++; continue; }
  out("---");
  out(trimTo(body, 160));
  out("---");
  const row = rec.anchor ? rowFor(body, id) : null;
  if (row) out("row: " + row);
}

if (idx.amendmentsThrough !== "none")
  out("\nAmendments through " + idx.amendmentsThrough + " — blueprint/amendment-log.md overrides " +
      "the locked files wherever it speaks. Read it before acting on anything above.");
process.exit(missing ? 1 : 0);

// ------------------------------------------------------------------ helpers
function header() {
  return "spec: " + slug + " · pack class " + idx.packClass + " · " + idx.files.length + " files · " +
    Object.keys(IDS).length + " ids" +
    (idx.amendmentsThrough !== "none" ? " · amendments through " + idx.amendmentsThrough : "");
}
function resolveKey(raw) {
  if (IDS[raw]) return raw;
  const lower = raw.toLowerCase();
  for (const k of Object.keys(IDS)) if (k.toLowerCase() === lower) return k;
  return null;
}
function rowFor(body, id) {
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim();
    if (!/^\|/.test(t)) continue;
    const first = t.replace(/^\|/, "").split("|")[0].trim().replace(/`/g, "");
    if (first.toLowerCase() === id.toLowerCase()) return t;
  }
  return null;
}
function trimTo(text, maxLines) {
  const lines = String(text).replace(/\s+$/, "").split(/\r?\n/);
  if (lines.length <= maxLines) return lines.join("\n");
  return lines.slice(0, maxLines).join("\n") +
    "\n… (" + (lines.length - maxLines) + " more lines — open the file for the rest)";
}
function resolveIdea(given) {
  if (given) {
    const asPath = path.resolve(given);
    if (isSpecDir(asPath)) return asPath;
    const ws = SI.findWorkspace(process.cwd());
    if (ws) {
      const cand = path.join(ws.ideasDir, given);
      if (isSpecDir(cand)) return cand;
    }
    fail("no idea workspace with a blueprint at \"" + given + "\".");
  }
  const ws = SI.findWorkspace(process.cwd());
  if (!ws) fail("no ideas/ workspace found above " + process.cwd() + ".");
  const withSpec = ws.ideas.filter((n) => isSpecDir(path.join(ws.ideasDir, n)));
  if (!withSpec.length)
    fail("no idea in " + path.relative(ws.root, ws.ideasDir).replace(/\\/g, "/") +
         " has both mvp-pack/ and blueprint/ yet — there is no locked spec to resolve against.");
  if (withSpec.length > 1)
    fail("this workspace holds several specs (" + withSpec.join(", ") + ") — name one with --idea <slug>.");
  return path.join(ws.ideasDir, withSpec[0]);
}
function isSpecDir(p) {
  try {
    return fs.statSync(path.join(p, "mvp-pack")).isDirectory() && fs.statSync(path.join(p, "blueprint")).isDirectory();
  } catch { return false; }
}
function out(s) { process.stdout.write(s + "\n"); }
function fail(msg) { process.stderr.write("spec-lookup: " + msg + "\n"); process.exit(1); }
