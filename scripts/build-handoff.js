#!/usr/bin/env node
/**
 * build-handoff — generate a build-repo handoff kit from a locked pack + blueprint.
 *
 * The problem it solves (observed, 2026-08-01): the pipeline's output is read by a
 * DIFFERENT agent in a DIFFERENT repository — the coding session that implements the
 * product. That session arrives with no knowledge that these files exist, that they
 * are frozen, that `AC-03-2` is an id rather than prose, or that a spec defect has a
 * process. So it reads the tree, infers a structure, and fills the rest with plausible
 * invention — which is precisely the failure stage 6 was built to prevent, reintroduced
 * one directory downstream.
 *
 * The kit makes the artifacts legible to that session through mechanisms the host tools
 * actually load on their own:
 *   AGENTS.md              the cross-tool standard (Codex, Cursor, Copilot, Zed, …)
 *   CLAUDE.md              imports AGENTS.md — Claude Code reads CLAUDE.md, not AGENTS.md
 *   .claude/rules/*.md     path-scoped: id vocabulary on docs/product/**, decision
 *                          boundary on source paths, AC-as-oracle on test paths
 *   .claude/skills/        /spec (resolve an id) and /spec-gap (route a real gap)
 *   .claude/scripts/       spec-lookup.js (deterministic id → file+section+text)
 *   .claude/settings.json  SessionStart hook: states the contract, verifies hashes,
 *                          and reports drift against the source workspace
 *   docs/product/          the read-only copy, plus spec-index.json
 *
 * Design constraint, deliberately narrow: **the kit never paraphrases a spec.** It
 * copies, indexes and routes. Nothing it generates is a new product statement that
 * could drift from the artifacts, and it adds zero founder judgements to the pipeline —
 * every input is already locked.
 *
 * Usage:
 *   node scripts/build-handoff.js <idea-dir> --to <build-repo> [options]
 *   node scripts/build-handoff.js <idea-dir> --to <build-repo> --check
 *
 * Options:
 *   --check          verify an existing kit against the source; write nothing.
 *                    Exit 1 on drift (suitable for CI in the build repo).
 *   --draft          allow generation before gate BP passes. Every generated file is
 *                    stamped DRAFT and spec-index.json carries "draft": true.
 *   --force          overwrite an AGENTS.md / CLAUDE.md this generator did not write.
 *   --src <globs>    comma-separated path globs for the implementation rule
 *   --tests <globs>  comma-separated path globs for the test rule
 *   --json           machine-readable result
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const TPL = path.join(ROOT, "templates", "handoff");
const PLUGIN_VERSION = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, ".claude-plugin", "plugin.json"), "utf8")).version; }
  catch { return "0.0.0"; }
})();
const MARKER = "saas-idea-brainstorm:handoff";

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, dflt) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : dflt;
};
const positional = argv.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--to", "--src", "--tests"].includes(argv[i - 1])));
const IDEA_DIR = positional[0] ? path.resolve(positional[0]) : null;
const TARGET = opt("--to", null) ? path.resolve(opt("--to")) : null;
const CHECK = flag("--check");
const DRAFT = flag("--draft");
const FORCE = flag("--force");
const JSON_OUT = flag("--json");
const SRC_GLOBS = (opt("--src", "src/**,app/**,lib/**,apps/**,packages/**,server/**,api/**,internal/**,pkg/**,cmd/**") || "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const TEST_GLOBS = (opt("--tests", "tests/**,test/**,__tests__/**,spec/**,**/*.test.*,**/*.spec.*,**/*_test.*") || "")
  .split(",").map((s) => s.trim()).filter(Boolean);

if (!IDEA_DIR || !TARGET) {
  process.stderr.write(
    "usage: build-handoff.js <idea-dir> --to <build-repo> [--check] [--draft] [--force]\n" +
    "                        [--src <globs>] [--tests <globs>] [--json]\n"
  );
  process.exit(2);
}

const problems = [];
const notes = [];
const die = (msg) => {
  if (JSON_OUT) process.stdout.write(JSON.stringify({ ok: false, error: msg }, null, 2) + "\n");
  else process.stderr.write("build-handoff: " + msg + "\n");
  process.exit(1);
};

// ---------------------------------------------------------------- 1. source guards
if (!isDir(IDEA_DIR)) die("idea directory not found: " + IDEA_DIR);
const PACK_DIR = path.join(IDEA_DIR, "mvp-pack");
const BP_DIR = path.join(IDEA_DIR, "blueprint");
if (!isDir(PACK_DIR)) die("no mvp-pack/ in " + IDEA_DIR + " — the pack is layer 1 of the contract; gate LOCK must have passed.");
if (!isDir(BP_DIR)) die("no blueprint/ in " + IDEA_DIR + " — there is nothing to hand off until stage 6 has run.");

let state = null;
try { state = JSON.parse(fs.readFileSync(path.join(IDEA_DIR, "state.json"), "utf8")); } catch {}
const bpState = (state && state.blueprint) || null;
const locked = !!(bpState && bpState.status === "locked" && bpState.gate && bpState.gate.status === "passed");
if (!locked && !DRAFT)
  die(
    "gate BP has not passed" + (bpState ? ` (blueprint.status="${bpState.status}", gate="${bpState.gate && bpState.gate.status}")` : " (no blueprint block in state.json)") +
    ".\nA handoff kit asserts that the specs it carries are locked, and a build session will treat them that way.\n" +
    "Finish stage 6, or pass --draft to generate a kit stamped DRAFT for preview."
  );
if (!locked) notes.push("generated in DRAFT mode — blueprint is not locked");

// validator must be clean, or the kit would freeze a spec set that cannot be implemented
if (locked) {
  try {
    require("child_process").execFileSync(
      process.execPath, [path.join(ROOT, "scripts", "validate-blueprint.js"), IDEA_DIR, "--at-gate"],
      { stdio: "pipe" }
    );
  } catch (e) {
    const detail = String((e.stdout || "") + (e.stderr || "")).trim().split("\n").slice(-12).join("\n");
    die("validate-blueprint.js --at-gate does not exit 0 on this blueprint, so it is not the locked set it claims to be:\n" + detail);
  }
}

// ---------------------------------------------------------------- 2. collect files
const SKIP_NAMES = new Set(["private", ".git", "node_modules"]);
const sources = []; // { source (rel to idea dir), path (rel to docs/product) }
for (const [srcRel, dstRel] of [["mvp-pack", "pack"], ["blueprint", "blueprint"]]) {
  walk(path.join(IDEA_DIR, srcRel), (abs) => {
    const rel = path.relative(path.join(IDEA_DIR, srcRel), abs).replace(/\\/g, "/");
    if (!/\.(md|json|ya?ml|txt|csv)$/i.test(rel)) return;
    sources.push({ source: srcRel + "/" + rel, path: dstRel + "/" + rel });
  });
}
if (!sources.length) die("no readable artifacts found under mvp-pack/ or blueprint/.");

const files = sources.map((s) => {
  const buf = fs.readFileSync(path.join(IDEA_DIR, s.source));
  return { ...s, sha256: crypto.createHash("sha256").update(buf).digest("hex"), bytes: buf.length, buf };
});
const amendmentFiles = files
  .filter((f) => /^blueprint\/amendments\/ba-\d{3}-/i.test(f.path))
  .map((f) => path.basename(f.path)).sort();
const amendmentsThrough =
  (bpState && bpState.amendments && bpState.amendments.last_id) ||
  (amendmentFiles.length ? amendmentFiles[amendmentFiles.length - 1].replace(/-.*$/, "") : "none");

// ---------------------------------------------------------------- 3. index ids
// `home` is where an id of this kind is DEFINED, as opposed to the many places it is
// merely cited. Without it the index points at whichever file the directory walk reached
// first — sending a build session to the overview's index row instead of the feature spec.
// E-nnn evidence ids are deliberately absent: the evidence ledger stays in the source
// workspace (it carries participant material), so those are provenance markers here, not
// lookups, and an index entry for them would be a dangling pointer.
const ID_KINDS = [
  { kind: "feature-spec", re: /^fs-\d{2}$/i, home: /^blueprint\/feature-specs\//, desc: "a feature specification — one file under `blueprint/feature-specs/`" },
  { kind: "acceptance", re: /^AC-\d{2}-\d+$/i, home: /^blueprint\/feature-specs\//, desc: "acceptance criterion *n* of feature spec `fs-NN`; binary given/when/then, and the test oracle" },
  { kind: "state", re: /^ST-[A-Za-z0-9_.-]+-\d+$/i, home: /data-schema\.md$/, desc: "a state transition of one entity; every transition is owned, and unlisted transitions are defects" },
  { kind: "invariant", re: /^INV-\d+$/i, home: /interaction-map\.md$/, desc: "an invariant that must hold across features, not within one" },
  { kind: "job", re: /^JOB-\d+$/i, home: /interaction-map\.md$/, desc: "async work semantics: queued/running/cancelled/partial, second submit, disconnect, result lifetime" },
  { kind: "conflict-domain", re: /^CD-\d+$/i, home: /interaction-map\.md$/, desc: "a multi-writer conflict domain — the full writer set of one entity" },
  { kind: "subsystem", re: /^ss-\d{2}$/i, home: /^blueprint\/subsystem-specs\//, desc: "a non-CRUD subsystem spec (model, engine, pipeline, ledger…)" },
  { kind: "capability", re: /^CAP-\d{2}-\d+$/i, home: /^blueprint\/subsystem-specs\//, desc: "a subsystem capability with a budget traced to the technical design" },
  { kind: "eval", re: /^EV-\d+$/i, home: /^blueprint\/subsystem-specs\//, desc: "an eval binding: the threshold a capability's acceptance is measured against" },
  { kind: "decision", re: /^DR-\d+$/i, home: /blueprint-overview\.md$/, desc: "a decision the founder explicitly delegated to build time — **yours to make**, within the recorded constraint" },
  { kind: "deferred", re: /^DF-\d+$/i, home: /deferred-register\.md$/, desc: "a deferred non-product item, with an owner and a date" },
  { kind: "amendment", re: /^BA-\d{3}$/i, home: /^blueprint\/amendments\//, desc: "a blueprint amendment — overrides the locked files wherever it speaks" },
  { kind: "dod", re: /^DOD-\d+$/i, home: /^pack\/definition-of-done\.md$/, desc: "a definition-of-done item for the product as a whole" },
  { kind: "msp", re: /^MSP-\d+$/i, home: /^pack\/mvp-spec\.md$/, desc: "a minimum-service-promise commitment made to users" },
  { kind: "core-loop-step", re: /^SC-\d+$/i, home: /^pack\/mvp-spec\.md$/, desc: "a step of the locked core loop" },
  { kind: "regulation", re: /^REG-\d+$/i, home: null, desc: "a compliance obligation flagged for a regulated domain" },
];
const ids = {};
function registerId(raw, rec) {
  const clean = String(raw || "").replace(/[`*_]/g, "").trim();
  if (!clean) return;
  const kind = ID_KINDS.find((k) => k.re.test(clean));
  if (!kind) return;
  const atHome = !kind.home || kind.home.test(rec.file);
  const prev = ids[clean];
  // First registration wins, except that a definition site always displaces a citation.
  if (prev && !(atHome && !prev.at_home)) return;
  ids[clean] = {
    kind: kind.kind, file: rec.file, anchor: rec.anchor || null,
    label: (rec.label || "").slice(0, 160), at_home: atHome,
  };
}
for (const f of files) {
  if (!/\.md$/i.test(f.path)) continue;
  const text = f.buf.toString("utf8");
  const base = path.basename(f.path);
  const mFs = base.match(/^(fs-\d{2})-/i);
  if (mFs) registerId(mFs[1], { file: f.path, anchor: "bp:trace", label: titleOf(text) });
  const mSs = base.match(/^(ss-\d{2})-/i);
  if (mSs) registerId(mSs[1], { file: f.path, anchor: "bp:trace", label: titleOf(text) });
  const mBa = base.match(/^(ba-\d{3})-/i);
  if (mBa) registerId(mBa[1].toUpperCase(), { file: f.path, anchor: null, label: titleOf(text) });
  for (const sec of sections(text)) {
    for (const row of tableRows(sec.text)) {
      if (row.length < 2) continue;
      registerId(row[0], { file: f.path, anchor: sec.anchor, label: row[1] || row[2] || "" });
    }
  }
}
for (const rec of Object.values(ids)) delete rec.at_home; // bookkeeping, not output

// ---------------------------------------------------------------- 4. check mode
const indexRel = path.join("docs", "product", "spec-index.json");
if (CHECK) {
  const existing = readJson(path.join(TARGET, indexRel));
  if (!existing) die("no handoff kit at " + TARGET + " (missing " + indexRel.replace(/\\/g, "/") + ").");
  const byPath = new Map(files.map((f) => [f.path, f]));
  const drift = [];
  for (const rec of existing.files || []) {
    const now = byPath.get(rec.path);
    if (!now) { drift.push(rec.path + ": no longer present in the source workspace"); continue; }
    if (now.sha256 !== rec.sha256) drift.push(rec.path + ": source has changed since the kit was generated");
    byPath.delete(rec.path);
  }
  for (const p of byPath.keys()) drift.push(p + ": new in the source workspace, absent from the kit");
  for (const f of existing.files || []) {
    const local = path.join(TARGET, "docs", "product", f.path);
    let buf; try { buf = fs.readFileSync(local); } catch { drift.push(f.path + ": missing from the local copy"); continue; }
    if (crypto.createHash("sha256").update(buf).digest("hex") !== f.sha256)
      drift.push(f.path + ": locally modified — frozen files must be byte-identical");
  }
  if (JSON_OUT) process.stdout.write(JSON.stringify({ ok: !drift.length, drift }, null, 2) + "\n");
  else {
    process.stdout.write(drift.length
      ? "handoff kit is OUT OF DATE (" + drift.length + "):\n- " + drift.join("\n- ") +
        "\n\nRegenerate: node scripts/build-handoff.js " + IDEA_DIR + " --to " + TARGET + "\n"
      : "handoff kit is up to date with " + IDEA_DIR + " (" + files.length + " files verified).\n");
  }
  process.exit(drift.length ? 1 : 0);
}

// ---------------------------------------------------------------- 5. write guards
if (!isDir(TARGET)) die("target repository not found: " + TARGET + " (create it first — this generator never creates the repo).");
for (const name of ["AGENTS.md", "CLAUDE.md"]) {
  const p = path.join(TARGET, name);
  if (fs.existsSync(p) && !FORCE) {
    const head = fs.readFileSync(p, "utf8").slice(0, 400);
    if (!head.includes(MARKER))
      die(
        TARGET + "/" + name + " already exists and was not written by this generator.\n" +
        "Overwriting it would silently drop instructions someone wrote for this repo.\n" +
        "Either move your content into a file of your own and import it (`@my-notes.md`), then rerun,\n" +
        "or rerun with --force to replace it."
      );
  }
}

// ---------------------------------------------------------------- 6. write
const productName = (state && state.idea) || path.basename(IDEA_DIR);
const generated = new Date().toISOString().slice(0, 10);
const packClass = packClassOf();
const draftBanner = locked
  ? ""
  : "\n> **DRAFT — the blueprint has not passed gate BP.** These specs are still changing. Do not\n" +
    "> treat them as a locked contract, and regenerate this kit once stage 6 closes.\n";
const regenCmd =
  "node " + posix(path.join(ROOT, "scripts", "build-handoff.js")) + " " + posix(IDEA_DIR) + " --to " + posix(TARGET);
const amendCmd =
  "# in " + posix(IDEA_DIR) + "\n  /saas-idea-brainstorm:amend-blueprint\n" +
  "  # then, back here:  " + regenCmd;

const written = [];
const productDir = path.join(TARGET, "docs", "product");
// The copy is regenerated wholesale: a file removed upstream must not linger here.
if (isDir(productDir)) rmrf(productDir);
for (const f of files) writeOut(path.join(productDir, f.path), f.buf);

const specIndex = {
  kind: "saas-idea-brainstorm/spec-index",
  spec_version: 1,
  generator_version: PLUGIN_VERSION,
  product: productName,
  generated,
  draft: !locked,
  source_workspace: posix(IDEA_DIR),
  pack_class: packClass,
  pipeline_gates_passed: state && state.gates ? Object.keys(state.gates).filter((g) => state.gates[g] && state.gates[g].status === "passed") : [],
  amendments_through: amendmentsThrough,
  amendment_files: amendmentFiles,
  file_count: files.length,
  read_order: readOrder().map((r) => r.path),
  files: files.map((f) => ({ path: f.path, source: f.source, sha256: f.sha256, bytes: f.bytes })),
  ids,
};
writeOut(path.join(productDir, "spec-index.json"), JSON.stringify(specIndex, null, 2) + "\n");

const subs = {
  PLUGIN_VERSION, PRODUCT: productName, GENERATED: generated, SOURCE: posix(IDEA_DIR),
  PACK_CLASS: packClass, AMENDMENTS_THROUGH: amendmentsThrough, DRAFT_BANNER: draftBanner,
  ID_COUNT: String(Object.keys(ids).length), FILE_COUNT: String(files.length),
  REGEN_CMD: regenCmd, AMEND_CMD: amendCmd,
  ID_TABLE: idTable(), READ_ORDER_TABLE: readOrderTable(), FILE_TABLE: fileTable(),
  SRC_PATHS: SRC_GLOBS.map((g) => "  - " + JSON.stringify(g)).join("\n"),
  TEST_PATHS: TEST_GLOBS.map((g) => "  - " + JSON.stringify(g)).join("\n"),
};
const RENDER = [
  ["AGENTS.md", "AGENTS.md"],
  ["CLAUDE.md", "CLAUDE.md"],
  ["READ-ORDER.md", "docs/product/READ-ORDER.md"],
  ["rules/spec-vocabulary.md", ".claude/rules/spec-vocabulary.md"],
  ["rules/implementation.md", ".claude/rules/implementation.md"],
  ["rules/spec-tests.md", ".claude/rules/spec-tests.md"],
  ["skills/spec/SKILL.md", ".claude/skills/spec/SKILL.md"],
  ["skills/spec-gap/SKILL.md", ".claude/skills/spec-gap/SKILL.md"],
];
for (const [from, to] of RENDER) {
  const tpl = fs.readFileSync(path.join(TPL, from), "utf8");
  writeOut(path.join(TARGET, to), render(tpl, subs));
}
for (const name of ["spec-lookup.js", "spec-freshness.js"])
  writeOut(path.join(TARGET, ".claude", "scripts", name), fs.readFileSync(path.join(TPL, "hooks", name)));

// settings.json: merge, never replace — this file is the user's, not ours
const settingsPath = path.join(TARGET, ".claude", "settings.json");
const settings = readJson(settingsPath) || {};
const hookCmd = 'node "$CLAUDE_PROJECT_DIR/.claude/scripts/spec-freshness.js"';
settings.hooks = settings.hooks && typeof settings.hooks === "object" ? settings.hooks : {};
const ss = Array.isArray(settings.hooks.SessionStart) ? settings.hooks.SessionStart : [];
const already = JSON.stringify(ss).includes("spec-freshness.js");
if (!already) ss.push({ hooks: [{ type: "command", command: hookCmd }] });
settings.hooks.SessionStart = ss;
writeOut(settingsPath, JSON.stringify(settings, null, 2) + "\n");
if (already) notes.push(".claude/settings.json already registered the freshness hook — left as it was");

// ---------------------------------------------------------------- 7. report
const summary = {
  ok: true, target: posix(TARGET), source: posix(IDEA_DIR), draft: !locked,
  files_copied: files.length, ids_indexed: Object.keys(ids).length,
  id_kinds: countBy(Object.values(ids).map((v) => v.kind)),
  amendments_through: amendmentsThrough, generated_files: written.map(posixRel), notes,
};
if (JSON_OUT) { process.stdout.write(JSON.stringify(summary, null, 2) + "\n"); process.exit(0); }
process.stdout.write(
  "handoff kit written to " + posix(TARGET) + (locked ? "" : "  [DRAFT — blueprint not locked]") + "\n" +
  "  source            " + posix(IDEA_DIR) + " (pack class " + packClass + ", amendments through " + amendmentsThrough + ")\n" +
  "  docs/product/     " + files.length + " files copied read-only, hashed in spec-index.json\n" +
  "  spec-index.json   " + Object.keys(ids).length + " ids indexed — " +
    Object.entries(summary.id_kinds).map(([k, n]) => k + ":" + n).join(", ") + "\n" +
  "  generated         " + written.map(posixRel).filter((p) => !p.startsWith("docs/product/")).join(", ") + "\n" +
  (notes.length ? "  notes             " + notes.join("; ") + "\n" : "") +
  "\nIn the build repo: AGENTS.md is read by Codex and other agents, CLAUDE.md imports it for\n" +
  "Claude Code, /spec resolves an id, /spec-gap routes a real gap back here. Re-run this command\n" +
  "after every amendment; `--check` tells you whether it is stale.\n"
);
process.exit(0);

// ---------------------------------------------------------------- helpers
function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function walk(dir, fn) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_NAMES.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, fn);
    else if (e.isFile()) fn(abs);
  }
}
function rmrf(p) { try { fs.rmSync(p, { recursive: true, force: true }); } catch {} }
function writeOut(abs, data) {
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, data);
  written.push(abs);
}
function posix(p) { return String(p).replace(/\\/g, "/"); }
function posixRel(abs) { return posix(path.relative(TARGET, abs)); }
function readJson(p) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } }
function render(tpl, map) {
  return tpl.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in map ? map[k] : m));
}
function titleOf(text) {
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "";
}
function sections(text) {
  const out = [];
  const re = /<!--\s*((?:bp|pack):[a-z0-9:_-]+)\s*-->/gi;
  let m, last = null, lastIdx = 0;
  while ((m = re.exec(text))) {
    if (last) out.push({ anchor: last, text: text.slice(lastIdx, m.index) });
    last = m[1]; lastIdx = m.index + m[0].length;
  }
  if (last) out.push({ anchor: last, text: text.slice(lastIdx) });
  if (!out.length) out.push({ anchor: null, text });
  return out;
}
function tableRows(text) {
  const rows = [];
  for (const raw of String(text).split(/\r?\n/)) {
    const t = raw.trim();
    if (!/^\|/.test(t)) continue;
    if (/^\|(\s*:?-{3,}:?\s*\|)+\s*$/.test(t)) continue;
    rows.push(t.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()));
  }
  return rows;
}
function countBy(arr) {
  const o = {};
  for (const v of arr) o[v] = (o[v] || 0) + 1;
  return o;
}
function packClassOf() {
  for (const f of files) {
    if (!/pack\/(mvp-spec|evidence-quality-report)\.md$/i.test(f.path)) continue;
    const m = f.buf.toString("utf8").match(/\b(Validated|Hypothesis|Pre-feasibility)\b/);
    if (m) return m[1];
  }
  return "unstated";
}
function idTable() {
  const present = new Set(Object.values(ids).map((v) => v.kind));
  const rows = ID_KINDS.filter((k) => present.has(k.kind)).map((k) => {
    const example = Object.entries(ids).find(([, v]) => v.kind === k.kind);
    const n = Object.values(ids).filter((v) => v.kind === k.kind).length;
    return "| `" + (example ? example[0] : k.kind) + "` | " + k.desc + " | " + n + " |";
  });
  if (!rows.length) return "_No ids were indexed — the spec set is unusually shaped; read `docs/product/READ-ORDER.md`._";
  return "| example | means | count |\n|---|---|---|\n" + rows.join("\n");
}
// A function declaration, not a const: it is called from the render pass above, and a
// `const` here would still be in its temporal dead zone at that point.
function purposeMap() { return {
  "amendment-log.md": "**Read first.** Every change made to the blueprint since it locked. Current truth = locked blueprint + this log.",
  "mvp-spec.md": "The locked scope: what is in, and the cut list of what was deliberately left out.",
  "definition-of-done.md": "What \"done\" means for the product as a whole (`DOD-n`).",
  "tech-design.md": "Schema/domain model and the condensed architecture decisions the blueprint descends from.",
  "founder-charter.md": "The founder's non-negotiables — constraints no implementation choice may violate.",
  "carry-forward.md": "What earlier stages resolved that later work must not re-litigate.",
  "evidence-quality-report.md": "How well-evidenced the pack is, per claim. Explains the pack class.",
  "audit-trail.md": "How the pack was arrived at.",
  "blueprint-overview.md": "Index of the blueprint, the event dictionary, and the `DR-n` decision register.",
  "data-schema.md": "Field-level entities, constraints, indexes, migrations, `ST-*` state machines, retention duties.",
  "ux-spec.md": "Screens, flows, per-screen states, navigation, accessibility floor, outward-claim inventory.",
  "api-contract.md": "Endpoint shapes, auth, error codes, and how each maps to a UI state.",
  "integration-specs.md": "Per third-party provider: scope, config, webhook contract, failure path, cost basis.",
  "nfr-spec.md": "Performance and capacity numbers, the authorization matrix, security and operational duties.",
  "test-plan.md": "Every DoD item, service promise, invariant and eval bound to a scenario, plus mandatory scenarios.",
  "build-plan.md": "Milestones (core loop end-to-end first) and the environment spec.",
  "interaction-map.md": "Conflict domains, `INV-n` invariants, `JOB-n` async semantics — the cross-feature rules.",
  "deferred-register.md": "Non-product items deferred, each with an owner and a date. Append-only.",
}; }
function purposeOf(p) {
  const base = path.basename(p);
  const PURPOSE = purposeMap();
  if (PURPOSE[base]) return PURPOSE[base];
  if (/^blueprint\/feature-specs\//.test(p)) return "Feature spec: flow, acceptance criteria, fields, states, edge cases, instrumentation.";
  if (/^blueprint\/subsystem-specs\//.test(p)) return "Subsystem spec: capabilities, budgets, degradation ladder, eval bindings, output contract.";
  if (/^blueprint\/amendments\//.test(p)) return "An immutable amendment record — a spec defect found during build and how it was answered.";
  if (/^pack\/eval\//.test(p)) return "Eval harness material referenced by the pack's acceptance thresholds.";
  return "Part of the locked specification.";
}
function readOrder() {
  const has = (p) => files.some((f) => f.path === p);
  const order = [];
  if (has("blueprint/amendment-log.md")) order.push({ path: "blueprint/amendment-log.md" });
  for (const p of ["pack/mvp-spec.md", "blueprint/blueprint-overview.md", "pack/definition-of-done.md"])
    if (has(p)) order.push({ path: p });
  const firstFs = files.map((f) => f.path).filter((p) => /^blueprint\/feature-specs\//.test(p)).sort()[0];
  if (firstFs) order.push({ path: "blueprint/feature-specs/", note: "the spec for the feature you are implementing" });
  for (const p of ["blueprint/interaction-map.md", "blueprint/data-schema.md", "blueprint/test-plan.md", "blueprint/build-plan.md"])
    if (has(p)) order.push({ path: p });
  return order;
}
function readOrderTable() {
  const rows = readOrder().map((r, i) =>
    "| " + (i + 1) + " | `" + r.path + "` | " + (r.note ? r.note + " — " : "") + purposeOf(r.path) + " |"
  );
  return "| # | file | why |\n|---|---|---|\n" + rows.join("\n");
}
function fileTable() {
  const groups = [["pack/", "Pack — layer 1: what and why, and the scope boundary"],
                  ["blueprint/", "Blueprint — layer 2: exactly how, at the product level"]];
  const out = [];
  for (const [prefix, title] of groups) {
    const group = files.filter((f) => f.path.startsWith(prefix)).map((f) => f.path).sort();
    if (!group.length) continue;
    out.push("### " + title + "\n");
    out.push("| file | purpose |\n|---|---|");
    for (const p of group) out.push("| `" + p + "` | " + purposeOf(p) + " |");
    out.push("");
  }
  return out.join("\n");
}
