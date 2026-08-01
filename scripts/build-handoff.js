#!/usr/bin/env node
/**
 * build-handoff — ship a locked pack + blueprint to a SEPARATE build repository.
 *
 * Scope, deliberately narrow: this is for the case where the code lives in a different
 * repo from the idea workspace, and that repo may not have this plugin installed at all.
 * There, files are the only carrier — so the artifacts are copied read-only and hashed,
 * `AGENTS.md` / `CLAUDE.md` state the contract, path-scoped `.claude/rules/` carry the id
 * vocabulary and the decision boundary, and a SessionStart hook verifies the copy has not
 * drifted from its source.
 *
 * When the idea workspace and the code are in the SAME repo — the common solo case — none
 * of this is needed and none of it should be used. The plugin does it natively: its
 * SessionStart hook carries the build contract, a PostToolUse hook injects the id
 * vocabulary the first time a session opens a spec file, and `/saas-idea-brainstorm:spec`
 * resolves an id from the artifacts on demand. Nothing generated, nothing to regenerate
 * after an amendment, nothing to collide with another plugin, nothing to go stale.
 * Copying into the same tree would be actively harmful: the pipeline's guard hooks scope
 * to paths under `ideas/`, so the copy would be a freely editable twin of a frozen file.
 *
 * Design constraint: **the kit never paraphrases a spec.** It copies, indexes and routes.
 * Nothing it generates is a new product statement that could drift from the artifacts, and
 * it adds zero founder judgements — every input is already locked.
 *
 * Usage:
 *   node scripts/build-handoff.js <idea-dir> --to <build-repo> [options]
 *   node scripts/build-handoff.js <idea-dir> --to <build-repo> --check
 *
 * Options:
 *   --check          verify an existing kit against the source; write nothing. Exit 1 on
 *                    drift in either direction — the source moved ahead, or a frozen file
 *                    was edited in the build repo. Cheap enough for that repo's CI.
 *   --draft          allow generation before gate BP passes. Every generated file is
 *                    stamped DRAFT and spec-index.json carries "draft": true.
 *   --force          overwrite generated files this generator did not write.
 *   --src <globs>    comma-separated path globs for the implementation rule
 *   --tests <globs>  comma-separated path globs for the test rule
 *   --json           machine-readable result
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const SI = require("./lib/spec-index.js");

const ROOT = path.resolve(__dirname, "..");
const TPL = path.join(ROOT, "templates", "handoff");
const PLUGIN_VERSION = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, ".claude-plugin", "plugin.json"), "utf8")).version; }
  catch { return "0.0.0"; }
})();
const MARKER = "saas-idea-brainstorm:handoff";
const PACK = "pack"; // the pack directory's name inside the shipped copy

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
    "                        [--src <globs>] [--tests <globs>] [--json]\n" +
    "\nOnly for a build repo SEPARATE from the idea workspace. Same repo? Nothing to run —\n" +
    "the plugin's own hooks and /saas-idea-brainstorm:spec already cover it.\n"
  );
  process.exit(2);
}
if (path.resolve(TARGET) === path.resolve(path.dirname(path.dirname(IDEA_DIR))) ||
    IDEA_DIR.startsWith(path.resolve(TARGET) + path.sep)) {
  process.stderr.write(
    "build-handoff: the target is the same repository as the idea workspace.\n" +
    "A copy here would be a second, unguarded twin of a frozen spec: the pipeline's guard hooks\n" +
    "scope to paths under ideas/, so the copy would be freely editable while the original is locked.\n" +
    "Nothing needs installing for the same-repo case — the plugin's SessionStart hook carries the\n" +
    "build contract, a PostToolUse hook injects the id vocabulary on first contact with a spec file,\n" +
    "and /saas-idea-brainstorm:spec resolves any id from the artifacts on demand.\n"
  );
  process.exit(2);
}

const notes = [];
const die = (msg) => {
  if (JSON_OUT) process.stdout.write(JSON.stringify({ ok: false, error: msg }, null, 2) + "\n");
  else process.stderr.write("build-handoff: " + msg + "\n");
  process.exit(1);
};

// ---------------------------------------------------------------- 1. source guards
if (!isDir(IDEA_DIR)) die("idea directory not found: " + IDEA_DIR);
if (!isDir(path.join(IDEA_DIR, "mvp-pack"))) die("no mvp-pack/ in " + IDEA_DIR + " — the pack is layer 1 of the contract; gate LOCK must have passed.");
if (!isDir(path.join(IDEA_DIR, "blueprint"))) die("no blueprint/ in " + IDEA_DIR + " — there is nothing to hand off until stage 6 has run.");

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

// The validator gates GENERATION, not inspection: a kit must never freeze a spec set that
// cannot be implemented. But --check only answers "is this kit stale?", and a mid-edit
// blueprint is exactly when that answer matters most.
if (locked && !CHECK) {
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

// ---------------------------------------------------------------- 2. index
const idx = SI.buildIndex(IDEA_DIR, { packAs: PACK, withBuffers: true });
const files = idx.files.map((f) => ({ ...f, sha256: crypto.createHash("sha256").update(f.buf).digest("hex") }));
const ids = idx.ids;
const amendmentsThrough = (bpState && bpState.amendments && bpState.amendments.last_id) || idx.amendmentsThrough;
if (!files.length) die("no readable artifacts found under mvp-pack/ or blueprint/.");

const OUT = {
  index: ".claude/product-spec/spec-index.json",
  lookup: ".claude/product-spec/spec-lookup.js",
  freshness: ".claude/product-spec/spec-freshness.js",
  readOrder: ".claude/product-spec/READ-ORDER.md",
  rules: ".claude/rules/product-spec",
  skillSpec: "product-spec",
  skillGap: "product-spec-gap",
};

// ---------------------------------------------------------------- 3. check mode
if (CHECK) {
  const existing = readJson(path.join(TARGET, OUT.index));
  if (!existing) die("no handoff kit at " + posix(TARGET) + " (missing " + OUT.index + ").");
  const drift = [];
  const byPath = new Map(files.map((f) => [f.path, f]));
  for (const rec of existing.files || []) {
    const now = byPath.get(rec.path);
    if (!now) { drift.push(rec.path + ": no longer present in the source workspace"); continue; }
    if (rec.sha256 && now.sha256 !== rec.sha256) drift.push(rec.path + ": source has changed since the kit was generated");
    byPath.delete(rec.path);
  }
  for (const p of byPath.keys()) drift.push(p + ": new in the source workspace, absent from the kit");
  for (const f of existing.files || []) {
    const local = path.join(TARGET, "docs", "product", f.path);
    let buf; try { buf = fs.readFileSync(local); } catch { drift.push(f.path + ": missing from the local copy"); continue; }
    if (f.sha256 && crypto.createHash("sha256").update(buf).digest("hex") !== f.sha256)
      drift.push(f.path + ": locally modified — frozen files must be byte-identical");
  }
  if (JSON_OUT) process.stdout.write(JSON.stringify({ ok: !drift.length, drift }, null, 2) + "\n");
  else process.stdout.write(drift.length
    ? "handoff kit is OUT OF DATE (" + drift.length + "):\n- " + drift.join("\n- ") +
      "\n\nRegenerate: node scripts/build-handoff.js " + posix(IDEA_DIR) + " --to " + posix(TARGET) + "\n"
    : "handoff kit is up to date with " + posix(IDEA_DIR) + " (" + files.length + " files verified).\n");
  process.exit(drift.length ? 1 : 0);
}

// ---------------------------------------------------------------- 4. write guards
if (!isDir(TARGET)) die("target repository not found: " + posix(TARGET) + " (create it first — this generator never creates the repo).");
// Never silently replace a file this generator did not write. In a repo that carries other
// plugins that is not a courtesy — it is the difference between adding a rule and deleting
// someone else's.
const OWNED = [
  "AGENTS.md", "CLAUDE.md", OUT.index, OUT.lookup, OUT.freshness, OUT.readOrder,
  `${OUT.rules}/spec-vocabulary.md`, `${OUT.rules}/implementation.md`, `${OUT.rules}/spec-tests.md`,
  `.claude/skills/${OUT.skillSpec}/SKILL.md`, `.claude/skills/${OUT.skillGap}/SKILL.md`,
];
const foreign = OWNED.filter((rel) => {
  const p = path.join(TARGET, rel);
  if (!fs.existsSync(p)) return false;
  try { return !fs.readFileSync(p, "utf8").slice(0, 600).includes(MARKER); } catch { return true; }
});
if (foreign.length && !FORCE)
  die(
    "these files already exist and were not written by this generator:\n  " + foreign.join("\n  ") +
    "\nOverwriting them would silently drop instructions someone — or another plugin — wrote for this repo.\n" +
    (foreign.some((f) => /^(AGENTS|CLAUDE)\.md$/.test(f))
      ? "For AGENTS.md/CLAUDE.md: move your content into a file of your own and import it (`@my-notes.md`), then rerun.\n"
      : "") +
    "Or rerun with --force to replace them."
  );

// ---------------------------------------------------------------- 5. write
const productName = (state && state.idea) || path.basename(IDEA_DIR);
const generated = new Date().toISOString().slice(0, 10);
const draftBanner = locked
  ? ""
  : "\n> **DRAFT — the blueprint has not passed gate BP.** These specs are still changing. Do not\n" +
    "> treat them as a locked contract, and regenerate once stage 6 closes.\n";
const regenCmd = "node " + posix(path.join(ROOT, "scripts", "build-handoff.js")) + " " + posix(IDEA_DIR) + " --to " + posix(TARGET);
const amendCmd = "# in " + posix(IDEA_DIR) + "\n  /saas-idea-brainstorm:amend-blueprint\n  # then, back here:  " + regenCmd;
// Claude Code picks arbitrarily between contradicting instructions, so every generated rule
// states its own limits rather than competing with whatever else this repo installs.
const precedence =
  "---\n\n**Scope of this rule.** It speaks only about product decisions already recorded in\n" +
  "`docs/product/`: where to find them, and which questions are not yours to answer. It makes no\n" +
  "claim about architecture, stack, code style, formatting, commit conventions, branching, review or\n" +
  "release process. Where another instruction in this repository covers those, that instruction\n" +
  "governs and there is no conflict to resolve. The one thing it does insist on: a product decision\n" +
  "recorded in `docs/product/` is not overridden by any other instruction — it is amended, or it\n" +
  "stands.";

const written = [];
const productDir = path.join(TARGET, "docs", "product");
if (isDir(productDir)) rmrf(productDir); // a file removed upstream must not linger in the copy
for (const f of files) writeOut(path.join(productDir, f.path), f.buf);

const subs = {
  PLUGIN_VERSION, PRODUCT: productName, GENERATED: generated, SOURCE: posix(IDEA_DIR),
  PACK_CLASS: idx.packClass, PACK, AMENDMENTS_THROUGH: amendmentsThrough, DRAFT_BANNER: draftBanner,
  ID_COUNT: String(Object.keys(ids).length), FILE_COUNT: String(files.length),
  REGEN_CMD: regenCmd, AMEND_CMD: amendCmd, PRECEDENCE: precedence,
  ID_TABLE: idTable(), READ_ORDER_TABLE: readOrderTable(), FILE_TABLE: fileTable(),
  SPEC_ROOT: "docs/product", INDEX: OUT.index, LOOKUP: OUT.lookup, READ_ORDER: OUT.readOrder,
  SKILL_SPEC: OUT.skillSpec, SKILL_GAP: OUT.skillGap,
  SRC_PATHS: SRC_GLOBS.map((g) => "  - " + JSON.stringify(g)).join("\n"),
  TEST_PATHS: TEST_GLOBS.map((g) => "  - " + JSON.stringify(g)).join("\n"),
};
for (const [from, to] of [
  ["AGENTS.md", "AGENTS.md"],
  ["CLAUDE.md", "CLAUDE.md"],
  ["READ-ORDER.md", OUT.readOrder],
  ["rules/spec-vocabulary.md", `${OUT.rules}/spec-vocabulary.md`],
  ["rules/implementation.md", `${OUT.rules}/implementation.md`],
  ["rules/spec-tests.md", `${OUT.rules}/spec-tests.md`],
  ["skills/spec/SKILL.md", `.claude/skills/${OUT.skillSpec}/SKILL.md`],
  ["skills/spec-gap/SKILL.md", `.claude/skills/${OUT.skillGap}/SKILL.md`],
])
  writeOut(path.join(TARGET, to), render(fs.readFileSync(path.join(TPL, from), "utf8"), subs));
for (const [name, dest] of [["spec-lookup.js", OUT.lookup], ["spec-freshness.js", OUT.freshness]])
  writeOut(path.join(TARGET, dest), fs.readFileSync(path.join(TPL, "hooks", name)));

// settings.json belongs to the repo owner, not to us: merge one hook, touch nothing else.
const settingsPath = path.join(TARGET, ".claude", "settings.json");
const settings = readJson(settingsPath) || {};
settings.hooks = settings.hooks && typeof settings.hooks === "object" ? settings.hooks : {};
const ss = Array.isArray(settings.hooks.SessionStart) ? settings.hooks.SessionStart : [];
const already = JSON.stringify(ss).includes("spec-freshness.js");
if (!already) ss.push({ hooks: [{ type: "command", command: 'node "$CLAUDE_PROJECT_DIR/' + OUT.freshness + '"' }] });
settings.hooks.SessionStart = ss;
writeOut(settingsPath, JSON.stringify(settings, null, 2) + "\n");
if (already) notes.push(".claude/settings.json already registered the freshness hook — left as it was");

// Last: the index is the kit's claim about itself, so it only becomes true once everything
// it describes is on disk. A crash before this point leaves no false "up to date".
writeOut(path.join(TARGET, OUT.index), JSON.stringify({
  kind: "saas-idea-brainstorm/spec-index",
  spec_version: 2,
  mode: "copy",
  generator_version: PLUGIN_VERSION,
  product: productName,
  generated,
  draft: !locked,
  spec_root: "docs/product",
  source_workspace: posix(IDEA_DIR),
  pack_class: idx.packClass,
  pipeline_gates_passed: state && state.gates ? Object.keys(state.gates).filter((g) => state.gates[g] && state.gates[g].status === "passed") : [],
  amendments_through: amendmentsThrough,
  amendment_files: idx.amendmentFiles,
  file_count: files.length,
  read_order: idx.readOrder.map((r) => r.path),
  files: files.map((f) => ({ path: f.path, source: f.source, sha256: f.sha256, bytes: f.bytes })),
  ids,
}, null, 2) + "\n");

// ---------------------------------------------------------------- 6. report
const summary = {
  ok: true, target: posix(TARGET), source: posix(IDEA_DIR), draft: !locked,
  files_copied: files.length, ids_indexed: Object.keys(ids).length,
  id_kinds: countBy(Object.values(ids).map((v) => v.kind)),
  amendments_through: amendmentsThrough, generated_files: written.map(posixRel), notes,
};
if (JSON_OUT) { process.stdout.write(JSON.stringify(summary, null, 2) + "\n"); process.exit(0); }
process.stdout.write(
  "handoff kit written to " + posix(TARGET) + (locked ? "" : "  [DRAFT — blueprint not locked]") + "\n" +
  "  docs/product/     " + files.length + " files copied read-only, hashed in " + OUT.index + "\n" +
  "  indexed           " + Object.keys(ids).length + " ids — " +
    Object.entries(summary.id_kinds).map(([k, n]) => k + ":" + n).join(", ") + "\n" +
  "  pack class        " + idx.packClass + ", amendments through " + amendmentsThrough + "\n" +
  "  generated         " + written.map(posixRel).filter((p) => !p.startsWith("docs/product/")).join(", ") + "\n" +
  (notes.length ? "  notes             " + notes.join("; ") + "\n" : "") +
  "\nIn the build repo: AGENTS.md is read by Codex and the other AGENTS.md readers, CLAUDE.md imports\n" +
  "it for Claude Code, /" + OUT.skillSpec + " resolves an id, /" + OUT.skillGap + " routes a real gap.\n" +
  "Re-run after every amendment; `--check` says whether it is stale. To uninstall: delete\n" +
  ".claude/product-spec/, .claude/rules/product-spec/, docs/product/, AGENTS.md, CLAUDE.md.\n"
);
process.exit(0);

// ---------------------------------------------------------------- helpers
function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function rmrf(p) { try { fs.rmSync(p, { recursive: true, force: true }); } catch {} }
function writeOut(abs, data) {
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, data);
  written.push(abs);
}
function posix(p) { return String(p).replace(/\\/g, "/"); }
function posixRel(abs) { return posix(path.relative(TARGET, abs)); }
function readJson(p) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } }
function render(tpl, map) { return tpl.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in map ? map[k] : m)); }
function countBy(arr) {
  const o = {};
  for (const v of arr) o[v] = (o[v] || 0) + 1;
  return o;
}
function idTable() {
  const present = new Set(Object.values(ids).map((v) => v.kind));
  const rows = SI.ID_KINDS.filter((k) => present.has(k.kind)).map((k) => {
    const example = Object.entries(ids).find(([, v]) => v.kind === k.kind);
    const n = Object.values(ids).filter((v) => v.kind === k.kind).length;
    return "| `" + (example ? example[0] : k.kind) + "` | " + k.desc + " | " + n + " |";
  });
  if (!rows.length) return "_No ids were indexed — the spec set is unusually shaped; read `docs/product/READ-ORDER.md`._";
  return "| example | means | count |\n|---|---|---|\n" + rows.join("\n");
}
function readOrderTable() {
  const rows = idx.readOrder.map((r, i) =>
    "| " + (i + 1) + " | `" + r.path + "` | " + (r.note ? r.note + " — " : "") + SI.purposeOf(r.path) + " |");
  return "| # | file | why |\n|---|---|---|\n" + rows.join("\n");
}
function fileTable() {
  const out = [];
  for (const [prefix, title] of [[PACK + "/", "Pack — layer 1: what and why, and the scope boundary"],
                                 ["blueprint/", "Blueprint — layer 2: exactly how, at the product level"]]) {
    const group = files.filter((f) => f.path.startsWith(prefix)).map((f) => f.path).sort();
    if (!group.length) continue;
    out.push("### " + title + "\n");
    out.push("| file | purpose |\n|---|---|");
    for (const p of group) out.push("| `" + p + "` | " + SI.purposeOf(p) + " |");
    out.push("");
  }
  return out.join("\n");
}
