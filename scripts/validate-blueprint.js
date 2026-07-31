#!/usr/bin/env node
/**
 * Blueprint validator (saas-idea-brainstorm plugin, stage 6 / gate BP).
 *
 * Nine mutually-referential documents with zero deterministic checks was the
 * v1.4.1 review's #2 blocker: the archetypal mid-build logic conflict — an FS
 * saying "max 500 chars" over a schema saying varchar(255) — was undetectable
 * by anything but a careful reading. This validator joins the documents on
 * their declared keys (fs-NN, AC-NN-n, SC-n, E-nnn, entity.field, event names,
 * DOD-n/MSP-n, DF-n) and fails on structural contradictions BEFORE code.
 *
 * Anchors (<!-- bp:… --> / <!-- pack:… -->) exist so section detection is
 * language-independent: artifact bodies follow state.language (method-rules
 * §Language) and a validator keyed on English headings would be dead on arrival
 * for a Vietnamese founder.
 *
 * Legacy boundary (review Q5): no blueprint predates 1.4.1, so blueprint-side
 * checks are ALWAYS errors. Pack-side joins (DOD/MSP ids, pack anchors) degrade
 * to `legacy-pack` warnings when the pack predates the ids — Layer 2 then covers
 * the join by reading, BY NAME, so a legacy pack gets more scrutiny, not less.
 *
 * Type comparison is token-normalized string equality plus integer extraction —
 * deliberately no synonym table (int/integer), no unit inference: a semantic
 * dialect here would silently bless `text` vs `varchar(255)` one day.
 * Unparseable cells are counted and reported, never silently skipped.
 *
 * Usage:
 *   node scripts/validate-blueprint.js <idea-dir> [--at-gate] [--with-amendments]
 *        [--json] [--blueprint-dir <rel>] [--pack-manifest <path>]
 * Exit codes: 0 no errors; 1 errors; 2 usage.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const args = process.argv.slice(2);
if (!args.length) {
  console.error("usage: validate-blueprint.js <idea-dir> [--at-gate] [--with-amendments] [--json]");
  process.exit(2);
}
const ideaDir = path.resolve(args[0]);
const AT_GATE = args.includes("--at-gate");
const JSON_OUT = args.includes("--json");
const argVal = (name) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};
const bpDir = path.join(ideaDir, argVal("--blueprint-dir") || "blueprint");
const packDir = path.join(ideaDir, "mvp-pack");

// v1.6.0: per-side singletons key off recorded state, never off the model's reading
let stateSides = [];
try {
  const st0 = JSON.parse(fs.readFileSync(path.join(ideaDir, "state.json"), "utf8"));
  if (Array.isArray(st0.sides)) stateSides = st0.sides.filter((x) => x && typeof x.id === "string");
} catch { /* state unreadable: side checks silently off; other tools own that failure */ }

const findings = [];
let unparseableCells = 0;
const err = (code, file, message) => findings.push({ level: "error", code, file, message });
const warn = (code, file, message) => findings.push({ level: "warning", code, file, message });

// ---------------------------------------------------------------- helpers
function read(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}
function rel(p) { return path.relative(ideaDir, p).replace(/\\/g, "/"); }
function fm(text) {
  const m = (text || "").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const out = {};
  if (m) for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (mm) out[mm[1]] = mm[2].trim();
  }
  return out;
}
function body(text) { return (text || "").replace(/^---\r?\n[\s\S]*?\r?\n---/, ""); }
function section(text, prefix, name) {
  const re = new RegExp(`<!--\\s*${prefix}:${name}\\s*-->`);
  const m = (text || "").match(re);
  if (!m) return null;
  const rest = text.slice(m.index + m[0].length);
  const next = rest.search(new RegExp(`<!--\\s*${prefix}:`));
  return next === -1 ? rest : rest.slice(0, next);
}
function parseTable(text) {
  if (!text) return [];
  const rows = [];
  let started = false;
  for (const raw of text.split(/\r?\n/)) {
    const t = raw.trim();
    if (/^\|/.test(t)) {
      started = true;
      if (/^\|(\s*:?-{3,}:?\s*\|)+\s*$/.test(t)) continue; // separator row
      rows.push(t.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()));
    } else if (started) break; // first non-table line ends the (first) table
  }
  return rows; // rows[0] = header
}
function dataRows(text) { const r = parseTable(text); return r.slice(1); }
function nonEmpty(cell) { return typeof cell === "string" && cell.trim() !== ""; }
function isNA(cell) { return /^N\/A\b/.test((cell || "").trim()); }
function naHasReason(cell) { return /^N\/A\b\s*\S{2,}/.test((cell || "").trim()); }
function realDate(v) {
  const m = typeof v === "string" && v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}
function stripComments(text) {
  // Comments carry anchors; inline-code spans legitimately QUOTE marker syntax
  // (a header saying `no interaction <reason>` documents the legal form) —
  // neither is artifact content, so both leave the marker scan.
  return (text || "").replace(/<!--[\s\S]*?-->/g, "").replace(/`[^`\n]*`/g, "");
}
function normType(s) { return (s || "").toLowerCase().replace(/\s+/g, ""); }
function ints(s) { return ((s || "").match(/\d+/g) || []).map(Number); }

// ---------------------------------------------------------------- 1. set
const REQUIRED = [
  "blueprint-overview.md", "data-schema.md", "ux-spec.md", "api-contract.md",
  "integration-specs.md", "nfr-spec.md", "test-plan.md", "build-plan.md",
];
if (!fs.existsSync(bpDir)) {
  err("no-blueprint-dir", rel(bpDir), "blueprint/ does not exist");
  report();
}
const files = {};
for (const f of REQUIRED) {
  const p = path.join(bpDir, f);
  const t = read(p);
  if (t === null) err("missing-artifact", `blueprint/${f}`, "required blueprint artifact missing");
  else files[f] = t;
}
const fsDir = path.join(bpDir, "feature-specs");
const fsFiles = fs.existsSync(fsDir)
  ? fs.readdirSync(fsDir).filter((f) => /^fs-\d{2}-[a-z0-9-]+\.md$/i.test(f)).sort()
  : [];
if (!fsFiles.length) err("no-feature-specs", "blueprint/feature-specs/", "at least one fs-NN-<slug>.md is required");
const defRegPath = path.join(bpDir, "deferred-register.md");
const defRegText = read(defRegPath);
if (defRegText === null) err("missing-artifact", "blueprint/deferred-register.md", "deferred-register.md (maintenance-phase, append-only) is required");
if (files["build-plan.md"] && /<!--\s*bp:deferred\s*-->/.test(files["build-plan.md"]))
  err("deferred-in-build-plan", "blueprint/build-plan.md", "the deferred register must NOT be a section of build-plan.md (it locks at BP) — it lives in deferred-register.md");

// ---------------------------------------------------------------- 2. frontmatter
for (const [f, t] of Object.entries(files)) {
  const m = fm(t);
  if (m.stage !== "6") err("bad-stage", `blueprint/${f}`, `frontmatter stage must be 6 (got "${m.stage || ""}")`);
  if (m.gate !== "BP") err("bad-gate", `blueprint/${f}`, `frontmatter gate must be BP (got "${m.gate || ""}")`);
  if (AT_GATE && !["ready", "locked"].includes(m.status || ""))
    err("not-ready", `blueprint/${f}`, `at the gate every required pipeline artifact must be ready (got "${m.status || ""}")`);
}
const fsTexts = {};
for (const f of fsFiles) {
  const t = read(path.join(fsDir, f));
  fsTexts[f] = t;
  const m = fm(t);
  if (m.stage !== "6" || m.gate !== "BP") err("bad-stage", `blueprint/feature-specs/${f}`, "frontmatter stage/gate must be 6/BP");
  if (AT_GATE && !["ready", "locked"].includes(m.status || ""))
    err("not-ready", `blueprint/feature-specs/${f}`, `at the gate every FS must be ready (got "${m.status || ""}")`);
}
if (defRegText !== null) {
  const m = fm(defRegText);
  if (m.phase !== "maintenance" || m.artifact_kind !== "deferred-register" || m.mutation_policy !== "append-only")
    err("bad-deferred-register", "blueprint/deferred-register.md", "must declare phase: maintenance, artifact_kind: deferred-register, mutation_policy: append-only");
}

// ---------------------------------------------------------------- 3. anchors
const ANCHORS = {
  "blueprint-overview.md": ["profile", "index", "event-dictionary", "decisions", "carry-forward"],
  "data-schema.md": ["entities", "retention"],
  "ux-spec.md": ["screens", "flows", "first-run", "copy"],
  "api-contract.md": ["endpoints"],
  "integration-specs.md": ["integrations"],
  "nfr-spec.md": ["performance"],
  "test-plan.md": ["coverage"],
  "build-plan.md": ["milestones", "environment"],
};
for (const [f, anchors] of Object.entries(ANCHORS)) {
  if (!files[f]) continue;
  for (const a of anchors)
    if (section(files[f], "bp", a) === null)
      err("missing-anchor", `blueprint/${f}`, `language-stable anchor <!-- bp:${a} --> missing — the validator cannot locate the section without it`);
}
const FS_ANCHORS = ["trace", "flow", "acceptance", "fields", "states", "edge-cases", "instrumentation", "open-decisions"];
for (const f of fsFiles) {
  for (const a of FS_ANCHORS)
    if (section(fsTexts[f], "bp", a) === null)
      err("missing-anchor", `blueprint/feature-specs/${f}`, `anchor <!-- bp:${a} --> missing`);
}
if (defRegText !== null && section(defRegText, "bp", "deferred") === null)
  err("missing-anchor", "blueprint/deferred-register.md", "anchor <!-- bp:deferred --> missing");

// ---------------------------------------------------------------- 4. marker family
const MARKERS = [
  [/\[GUESS[A-Z]*\]/g, "[GUESS]-family"],
  [/\[OPEN\]/g, "[OPEN]"],
  [/\[TBD\]/g, "[TBD]"],
  [/\[INFERRED\]/g, "[INFERRED]"],
  [/(?<![_\w])___(?![_\w])/g, "bare ___"],
  [/<[a-z][a-z0-9_.-]*>/g, "unsubstituted <placeholder>"],
];
const allBpFiles = [
  ...Object.entries(files).map(([f, t]) => [`blueprint/${f}`, t]),
  ...fsFiles.map((f) => [`blueprint/feature-specs/${f}`, fsTexts[f]]),
  ...(defRegText !== null ? [["blueprint/deferred-register.md", defRegText]] : []),
];
for (const [f, t] of allBpFiles) {
  const scan = stripComments(body(t));
  for (const [re, label] of MARKERS) {
    const hits = scan.match(re);
    if (hits) {
      const emit = AT_GATE ? err : warn;
      emit("marker", f, `${hits.length}× ${label} — a missing product decision wearing punctuation${AT_GATE ? "" : " (error at the gate)"}`);
    }
  }
}

// ---------------------------------------------------------------- symbol tables
const fsIds = fsFiles.map((f) => f.match(/^(fs-\d{2})/i)[1].toLowerCase());
const acIds = new Set();
const screenIds = new Set();
const errorCodes = new Set();
const eventNames = new Set();
const fieldTypes = {}; // key -> [{src, type, extra}]
const declaredFields = new Set();
const dfIds = new Set();

// data-schema entities
if (files["data-schema.md"]) {
  const ent = section(files["data-schema.md"], "bp", "entities") || "";
  // collect every table row across the entities section whose col1 is entity.field
  let started = false;
  const rows = [];
  for (const raw of ent.split(/\r?\n/)) {
    const t = raw.trim();
    if (/^\|/.test(t) && !/^\|(\s*:?-{3,}:?\s*\|)+\s*$/.test(t))
      rows.push(t.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()));
  }
  for (const r of rows) {
    if (!/^[a-z0-9_]+\.[a-z0-9_]+$/.test(r[0] || "") || r[0] === "entity.field") continue; // skip header rows
    declaredFields.add(r[0]);
    (fieldTypes[r[0]] = fieldTypes[r[0]] || []).push({ src: "data-schema.md", type: r[1] || "", extra: r[2] || "" });
    if (r.length >= 5 && !nonEmpty(r[4]))
      err("orphan-field", "blueprint/data-schema.md", `${r[0]}: empty "serves" cell — a field serving nothing is scope creep in schema form`);
  }
}
// ux screens + surfaces (v1.6.0): requirements key off the SC ROW's surface,
// defaulting to the frontmatter value — `mixed` as a union of requirements would
// manufacture junk N/A cells.
const SURFACES = ["ui", "headless-api", "cli", "sdk", "mixed"];
let defaultSurface = "ui";
const scSurface = {};
if (files["ux-spec.md"]) {
  const uxFm = fm(files["ux-spec.md"]);
  if (uxFm.surface) {
    if (!SURFACES.includes(uxFm.surface)) err("bad-surface", "blueprint/ux-spec.md", `surface "${uxFm.surface}" not in ${SURFACES.join("|")}`);
    else defaultSurface = uxFm.surface;
  }
  const scRows = dataRows(section(files["ux-spec.md"], "bp", "screens"));
  for (const r of scRows) {
    if (!/^SC-\d+$/i.test(r[0] || "")) continue;
    const id = r[0].toUpperCase();
    screenIds.add(id);
    const rowSurface = (r[4] || "").trim().toLowerCase();
    if (rowSurface && !SURFACES.includes(rowSurface)) err("bad-surface", "blueprint/ux-spec.md", `${id}: surface "${r[4]}" not in ${SURFACES.join("|")}`);
    scSurface[id] = SURFACES.includes(rowSurface) && rowSurface !== "mixed" ? rowSurface : (defaultSurface === "mixed" ? "ui" : defaultSurface);
  }
}
// api endpoints: error codes + field:type tokens
if (files["api-contract.md"]) {
  const sec = section(files["api-contract.md"], "bp", "endpoints") || "";
  for (const c of sec.match(/E\d{3,4}/g) || []) errorCodes.add(c);
  for (const r of dataRows(sec)) {
    for (const cell of [r[2], r[3]]) {
      if (!nonEmpty(cell) || cell === "—") continue;
      const tokens = [...(cell || "").matchAll(/([a-z0-9_]+\.[a-z0-9_]+)\s*:\s*([^,;|`]+)/g)]
        .filter((tk) => tk[1] !== "entity.field");
      if (!tokens.length) { unparseableCells++; warn("unparseable-cell", "blueprint/api-contract.md", `cell not in "entity.field: type" token form: "${cell.slice(0, 60)}"`); continue; }
      for (const tk of tokens) {
        const key = tk[1];
        if (!declaredFields.has(key)) err("unknown-field", "blueprint/api-contract.md", `${key} not declared in data-schema.md`);
        (fieldTypes[key] = fieldTypes[key] || []).push({ src: "api-contract.md", type: tk[2].trim(), extra: "" });
      }
    }
  }
}
// event dictionary
let ahaEvent = null;
if (files["blueprint-overview.md"]) {
  const rows = dataRows(section(files["blueprint-overview.md"], "bp", "event-dictionary"));
  for (const r of rows) {
    const name = (r[0] || "").replace(/`/g, "").trim();
    if (!/^[a-z][a-z0-9_]*$/.test(name)) { if (nonEmpty(r[0])) err("bad-event-name", "blueprint/blueprint-overview.md", `event "${r[0]}" is not snake_case`); continue; }
    eventNames.add(name);
    if (/\baha\b/i.test(r[1] || "")) ahaEvent = name;
    for (const id of (r[3] || "").match(/fs-\d{2}/gi) || [])
      if (!fsIds.includes(id.toLowerCase())) err("unknown-fs", "blueprint/blueprint-overview.md", `event ${name} fired by ${id}, which does not exist`);
  }
  if (rows.length && !ahaEvent) err("no-aha-event", "blueprint/blueprint-overview.md", "event dictionary has no row marked `aha` in its pack-trace column — the aha event is REQUIRED first");
  if (!rows.length) err("empty-event-dictionary", "blueprint/blueprint-overview.md", "event dictionary is empty");
}
// decision register (v1.7.0): DELEGATED decisions live INSIDE the blueprint —
// the pack's charter copy froze at LOCK, so a build-phase charter item is
// invisible to the build session that must obey it. A charter id is legal only
// as provenance, and only if it resolves in the pack copy.
const drIds = new Set();
if (files["blueprint-overview.md"]) {
  for (const r of dataRows(section(files["blueprint-overview.md"], "bp", "decisions"))) {
    if (!/^DR-\d+$/i.test(r[0] || "")) { if (nonEmpty(r[0])) err("bad-dr-id", "blueprint/blueprint-overview.md", `decision id "${r[0]}" is not DR-<n>`); continue; }
    drIds.add(r[0].toUpperCase());
    for (const [i, nm] of [[1, "scope delegated"], [2, "founder's exact words"], [3, "date"]])
      if (!nonEmpty(r[i])) err("dr-cell-blank", "blueprint/blueprint-overview.md", `${r[0]}: empty "${nm}" — a delegation without the founder's own words is a silent model choice wearing a record`);
    if (r[3] && !realDate(r[3])) err("dr-date", "blueprint/blueprint-overview.md", `${r[0]}: date must be a real YYYY-MM-DD (got "${r[3]}")`);
  }
}
// deferred register rows
if (defRegText !== null) {
  for (const r of dataRows(section(defRegText, "bp", "deferred"))) {
    if (!/^DF-\d+$/i.test(r[0] || "")) { if (nonEmpty(r[0])) err("bad-df-id", "blueprint/deferred-register.md", `row id "${r[0]}" is not DF-<n>`); continue; }
    dfIds.add(r[0].toUpperCase());
    if (!nonEmpty(r[2])) err("deferred-incomplete", "blueprint/deferred-register.md", `${r[0]}: empty why-deferrable`);
    if (!nonEmpty(r[3])) err("deferred-incomplete", "blueprint/deferred-register.md", `${r[0]}: empty owner`);
    if (!realDate(r[4])) err("deferred-incomplete", "blueprint/deferred-register.md", `${r[0]}: date must be a real YYYY-MM-DD (got "${r[4] || ""}")`);
  }
}

// ---------------------------------------------------------------- 4b. subsystems (v1.5.0)
// Per-kind required anchors — MIRRORED from the gate-contracts BP section table;
// the parity test keeps the two declarations identical (THRESHOLD_FIELDS precedent).
const SS_KIND_ANCHORS = {
  generic: [],
  llm: ["context", "output-contract", "evals", "budgets", "pinning", "artifact-lifecycle"],
  graphics: ["doc-model", "assets", "perf-budgets", "compat", "interaction-semantics", "pinning", "artifact-lifecycle"],
  pipeline: ["artifact-lifecycle"],
  realtime: ["sync-model"],
  ledger: ["ledger-model", "idempotency", "reconciliation", "failure-semantics"],
};
// Conditional anchors: an agentic llm core (takes_actions: yes) needs authorization
// + blast-radius decisions — the safety calls that otherwise get invented mid-build.
const LLM_ACTION_ANCHORS = ["action-authorization", "run-limits"];
const SS_BASE_ANCHORS = ["trace", "capabilities", "degradation"];
const ssDir = path.join(bpDir, "subsystem-specs");
const ssFiles = fs.existsSync(ssDir)
  ? fs.readdirSync(ssDir).filter((f) => /^ss-\d{2}-[a-z0-9-]+\.md$/i.test(f)).sort()
  : [];
const ssKinds = {};          // ss-NN -> kind
const capMeta = {};          // CAP id -> {ss, async, latencyInts, file}
const evIds = new Set();
const evThresholds = {};     // EV id -> threshold cell
let anyAsyncCap = false;
for (const f of ssFiles) {
  const t = read(path.join(ssDir, f));
  const rf = `blueprint/subsystem-specs/${f}`;
  const m = fm(t);
  const ssId = f.match(/^(ss-(\d{2}))/i);
  if (m.stage !== "6" || m.gate !== "BP") err("bad-stage", rf, "frontmatter stage/gate must be 6/BP");
  if (AT_GATE && !["ready", "locked"].includes(m.status || "")) err("not-ready", rf, `at the gate every subsystem spec must be ready (got "${m.status || ""}")`);
  if (!Object.keys(SS_KIND_ANCHORS).includes(m.kind || ""))
    err("bad-ss-kind", rf, `kind "${m.kind || ""}" is not in the closed enum ${Object.keys(SS_KIND_ANCHORS).join("|")} — an open field would let a spec dodge its kind's required anchors`);
  else ssKinds[ssId[1].toLowerCase()] = m.kind;
  let ssRequired = SS_BASE_ANCHORS.concat(SS_KIND_ANCHORS[m.kind] || []);
  if (m.kind === "llm" && (m.takes_actions || "").toLowerCase() === "yes") ssRequired = ssRequired.concat(LLM_ACTION_ANCHORS);
  for (const a of ssRequired)
    if (section(t, "bp", a) === null) err("missing-anchor", rf, `anchor <!-- bp:${a} --> missing (required for kind ${m.kind || "?"}${(m.takes_actions || "").toLowerCase() === "yes" ? " with takes_actions: yes" : ""})`);
  const trace = stripComments(section(t, "bp", "trace") || "");
  if (!/\S{4,}/.test(trace.replace(/\*\*Pack trace\*\*|[-:*]/g, "")))
    err("no-trace", rf, "subsystem spec has no pack trace (ADR / buy-don't-build / domain model) — a scope addition in subsystem form");
  for (const r of dataRows(section(t, "bp", "capabilities"))) {
    const cm = (r[0] || "").match(/^CAP-(\d{2})-(\d+)$/);
    if (!cm) { if (nonEmpty(r[0])) err("bad-cap-id", rf, `capability id "${r[0]}" is not CAP-NN-<n>`); continue; }
    if (cm[1] !== ssId[2]) err("cap-ss-mismatch", rf, `${r[0]} carries digits ${cm[1]} but lives in ${ssId[1]}`);
    const isAsync = /^yes/i.test((r[6] || "").trim());
    if (!/^(yes|no)$/i.test((r[6] || "").trim())) err("cap-cell", rf, `${r[0]}: async? must be yes|no (got "${r[6] || ""}")`);
    for (const [i, nm] of [[4, "p95 latency budget"], [5, "cost/call budget"], [7, "source"]])
      if (!nonEmpty(r[i])) err("cap-cell", rf, `${r[0]}: empty ${nm} cell — a capability without a budget/source is an invented promise`);
    if (isAsync) anyAsyncCap = true;
    capMeta[r[0]] = { ss: ssId[1].toLowerCase(), async: isAsync, latencyInts: ints(r[4]), file: rf, determinism: (r[8] || "").trim() };
  }
  if ((m.kind || "") === "llm") {
    const evRows = dataRows(section(t, "bp", "evals"));
    if (!evRows.length) err("no-ev", rf, "llm-kind subsystem has no EV rows — thresholds must be restated from mvp-pack/eval, and an unmeasured core cannot pass BP");
    for (const r of evRows) {
      if (!/^EV-\d+$/.test(r[0] || "")) { if (nonEmpty(r[0])) err("bad-ev-id", rf, `eval id "${r[0]}" is not EV-<n>`); continue; }
      evIds.add(r[0]);
      evThresholds[r[0]] = { threshold: (r[2] || "").trim(), file: rf };
    }
  }
}
// EV thresholds are RESTATED, never invented: the threshold string must appear
// somewhere under mvp-pack/eval/ (same mechanism as the threshold snapshot).
{
  const evalDir = path.join(packDir, "eval");
  let evalText = "";
  if (fs.existsSync(evalDir))
    for (const f of fs.readdirSync(evalDir)) { try { evalText += fs.readFileSync(path.join(evalDir, f), "utf8"); } catch { /* dirs */ } }
  for (const [id, e] of Object.entries(evThresholds)) {
    if (!e.threshold) { err("ev-cell", e.file, `${id}: empty threshold cell`); continue; }
    if (!evalText) warn("no-pack-eval", e.file, `${id}: mvp-pack/eval/ is empty or missing — threshold provenance unverifiable, Layer 2 must confirm against R1 by name`);
    else if (!evalText.includes(e.threshold)) err("ev-threshold-invented", e.file, `${id}: threshold "${e.threshold}" appears nowhere under mvp-pack/eval/ — restated means string-verifiable, never invented`);
  }
}
// ---------------------------------------------------------------- 4c. state machines (v1.5.0)
const stIds = new Set();
const stMeta = {}; // ST id -> {trigger, guard, entity}
if (files["data-schema.md"]) {
  const sec = section(files["data-schema.md"], "bp", "state-machines");
  for (const r of dataRows(sec)) {
    const sm = (r[0] || "").match(/^ST-([a-z0-9_]+)-(\d+)$/);
    if (!sm) { if (nonEmpty(r[0])) err("bad-st-id", "blueprint/data-schema.md", `transition id "${r[0]}" is not ST-<entity>-<n>`); continue; }
    stIds.add(r[0]);
    const trigger = (r[3] || "").trim();
    if (!trigger) err("st-no-trigger", "blueprint/data-schema.md", `${r[0]} has no trigger — dead schema or a missing spec`);
    else if (!/^fs-\d{2}$/i.test(trigger) && !/^system:\S+/.test(trigger))
      err("bad-st-trigger", "blueprint/data-schema.md", `${r[0]} trigger "${trigger}" must be fs-NN or system:<ss-NN|JOB-n|provider>`);
    else if (/^fs-\d{2}$/i.test(trigger) && !fsIds.includes(trigger.toLowerCase()))
      err("unknown-fs", "blueprint/data-schema.md", `${r[0]} trigger ${trigger} does not exist`);
    stMeta[r[0]] = { trigger: trigger.toLowerCase(), guard: (r[4] || "").trim(), entity: sm[1] };
  }
}

// ---------------------------------------------------------------- 5. per-FS checks
const EDGE_ROWS = 6;
const fsTouches = {};   // fs-NN -> [{entity, access}]
const fsUses = {};      // fs-NN -> [CAP ids]
const fsAcRows = {};    // fs-NN -> AC data rows
const fsFieldEntities = {}; // fs-NN -> Set(entity prefixes in its fields table)
const fsEdgeRows = {};      // fs-NN -> edge-case rows (concurrency cross-check)
for (const f of fsFiles) {
  const t = fsTexts[f];
  const fsId = f.match(/^(fs-(\d{2}))/i);
  const fid = fsId[1].toLowerCase();
  const rf = `blueprint/feature-specs/${f}`;
  // trace
  const trace = stripComments(section(t, "bp", "trace") || "");
  if (!/DOD-\d+|MSP-\d+|\d/.test(trace)) err("no-trace", rf, "pack trace has neither a core-loop step number nor a DOD-n/MSP-n id — an untraceable spec is a scope addition");
  // touches (declared entity access) + uses (capability references)
  fsTouches[fid] = [];
  for (const r of dataRows(section(t, "bp", "touches"))) {
    const entity = (r[0] || "").trim().toLowerCase();
    if (!/^[a-z0-9_]+$/.test(entity)) { if (nonEmpty(r[0])) err("bad-touches-entity", rf, `touches entity "${r[0]}" is not lowercase snake_case`); continue; }
    const access = (r[1] || "").trim().toLowerCase();
    if (!/^(read|write|transition:st-[a-z0-9_]+-\d+)$/.test(access))
      err("bad-touches-access", rf, `touches access "${r[1]}" must be read | write | transition:ST-…`);
    else if (access.startsWith("transition:")) {
      const stm = access.match(/^transition:st-([a-z0-9_]+)-(\d+)$/);
      const norm = stm ? `ST-${stm[1]}-${stm[2]}` : access.slice("transition:".length);
      if (!stIds.has(norm)) err("unknown-st", rf, `touches references ${norm}, not declared in data-schema state machines`);
    }
    fsTouches[fid].push({ entity, access });
  }
  const usesSec = stripComments(section(t, "bp", "uses") || "");
  fsUses[fid] = [...usesSec.matchAll(/CAP-\d{2}-\d+/g)].map((m) => m[0]);
  for (const cap of fsUses[fid])
    if (!capMeta[cap]) err("unknown-cap", rf, `uses ${cap}, declared in no subsystem spec`);
  const usesAsync = fsUses[fid].some((c) => capMeta[c] && capMeta[c].async);
  const usesLlm = fsUses[fid].some((c) => capMeta[c] && ssKinds[capMeta[c].ss] === "llm");
  // acceptance
  const acRows = dataRows(section(t, "bp", "acceptance"));
  fsAcRows[fid] = acRows;
  if (!acRows.length) err("no-acceptance", rf, "no acceptance criteria rows");
  for (const r of acRows) {
    const m = (r[0] || "").match(/^AC-(\d{2})-(\d+)$/);
    if (!m) { if (nonEmpty(r[0])) err("bad-ac-id", rf, `acceptance id "${r[0]}" is not AC-NN-<n>`); continue; }
    if (m[1] !== fsId[2]) err("ac-fs-mismatch", rf, `${r[0]} carries FS digits ${m[1]} but lives in ${fsId[1]}`);
    if (acIds.has(r[0])) err("dup-ac-id", rf, `${r[0]} declared twice`);
    acIds.add(r[0]);
  }
  // stochastic acceptance: an FS on an llm-kind capability binds to eval ids,
  // never to exact output equality
  if (usesLlm) {
    const citesEv = acRows.some((r) => r.some((c) => /EV-\d+/.test(c || "")));
    if (!citesEv) err("ac-no-ev", rf, "FS uses an llm-kind capability but no acceptance criterion cites an EV-n — stochastic acceptance is binary at the aggregate level (eval ≥ threshold), never exact-match");
    for (const r of acRows) {
      const then = r[3] || "";
      if (/"[^"]{12,}"/.test(then) && !/EV-\d+/.test(then))
        warn("possible-exact-match", rf, `${r[0] || "AC"}: Then-cell asserts a long quoted literal on an llm-backed feature — structural assertions are fine, content equality is not; confirm by reading`);
    }
  }
  // fields
  fsFieldEntities[fid] = new Set();
  for (const r of dataRows(section(t, "bp", "fields"))) {
    const key = r[0] || "";
    if (!/^[a-z0-9_]+\.[a-z0-9_]+$/.test(key)) { if (nonEmpty(key)) err("bad-field-key", rf, `field key "${key}" is not entity.field`); continue; }
    fsFieldEntities[fid].add(key.split(".")[0]);
    if (!declaredFields.has(key)) err("unknown-field", rf, `${key} not declared in data-schema.md`);
    for (const [i, name] of [[1, "type"], [2, "rules/limits"], [3, "default"], [4, "on-invalid copy"]])
      if (!nonEmpty(r[i])) err("field-cell-empty", rf, `${key}: empty ${name} cell`);
    (fieldTypes[key] = fieldTypes[key] || []).push({ src: rf, type: r[1] || "", extra: r[2] || "" });
  }
  // states
  const stRows = dataRows(section(t, "bp", "states"));
  const stTokens = stRows.map((r) => (r[0] || "").toLowerCase());
  const STATE_TOKENS = ["error", "empty", "loading", "success", "queued", "running", "cancelled", "partial"];
  for (const [i, r] of stRows.entries()) {
    if (!STATE_TOKENS.includes(stTokens[i]))
      err("bad-state-token", rf, `state "${r[0]}" is not one of the fixed tokens ${STATE_TOKENS.join("|")}`);
    const sc = (r[1] || "").toUpperCase();
    if (sc && sc !== "—" && sc !== "-" && !/^SC-\d+$/.test(sc)) err("bad-screen-ref", rf, `state row screen "${r[1]}" is not SC-<n> or —`);
    else if (/^SC-\d+$/.test(sc) && !screenIds.has(sc)) err("unknown-screen", rf, `${sc} not in ux-spec screen inventory`);
    const code = (r[3] || "").trim();
    if (code && code !== "—" && code !== "-") {
      if (!/^E\d{3,4}$/.test(code)) err("bad-error-code", rf, `state row code "${code}" is not E-nnn or —`);
      else if (!errorCodes.has(code)) err("unknown-error-code", rf, `${code} not declared in api-contract.md`);
    }
  }
  const referencedScs = stRows.map((r) => (r[1] || "").toUpperCase()).filter((x) => /^SC-\d+$/.test(x));
  const allHeadless = referencedScs.length
    ? referencedScs.every((sc) => ["headless-api", "cli", "sdk"].includes(scSurface[sc] || defaultSurface))
    : ["headless-api", "cli", "sdk"].includes(defaultSurface);
  for (const need of allHeadless ? ["error", "empty"] : ["error", "empty", "loading"])
    if (!stTokens.includes(need)) err("missing-state", rf, `no "${need}" state row — the states nobody specs until it's too late${allHeadless ? " (headless surface: loading not required, error/empty still are)" : ""}`);
  if (usesAsync)
    for (const need of ["queued", "running", "cancelled", "partial"])
      if (!stTokens.includes(need)) err("missing-async-state", rf, `FS uses an async capability but has no "${need}" state row — the four screens everyone forgets`);
  // edge cases
  const edges = dataRows(section(t, "bp", "edge-cases"));
  if (edges.length < EDGE_ROWS) err("edge-rows-missing", rf, `edge-case table has ${edges.length} rows; the template's ${EDGE_ROWS} cases must all be present (a silently deleted row is an unanswered case)`);
  for (const r of edges) {
    if (!nonEmpty(r[1])) err("edge-blank", rf, `edge case "${(r[0] || "").slice(0, 40)}": blank behaviour cell — "N/A <reason>" is legal, a blank is not`);
    else if (isNA(r[1]) && !naHasReason(r[1])) err("na-without-reason", rf, `edge case "${(r[0] || "").slice(0, 40)}": N/A without a reason`);
  }
  // concurrency: one answer, one home. If this FS writes an entity that other
  // features also write, the cell cites the conflict domain instead of restating
  // it — "last write wins" beside "lease + reject" is undetectable otherwise.
  fsEdgeRows[fid] = edges;
  // instrumentation references the dictionary
  for (const r of dataRows(section(t, "bp", "instrumentation"))) {
    const name = (r[0] || "").replace(/`/g, "").trim();
    if (!name || name === "—") continue;
    if (!eventNames.has(name)) err("unknown-event", rf, `instrumentation references event "${name}" not in the overview event dictionary (single payload source)`);
  }
  // delegation references: [DELEGATED — DR-n] must resolve in the register;
  // any CH-n cited anywhere must resolve in the pack's charter COPY (round-5 blocker)
  for (const m of stripComments(body(t)).matchAll(/\[DELEGATED[^\]]*\]/g)) {
    const dr = m[0].match(/DR-\d+/);
    if (!dr) err("delegation-no-dr", rf, `${m[0]} does not cite a DR-n row — the decision register inside the blueprint is the identifier, because the pack's charter copy froze at LOCK`);
    else if (!drIds.has(dr[0].toUpperCase())) err("delegation-unregistered", rf, `${m[0]} cites ${dr[0]}, which is not in blueprint-overview's decision register`);
  }
  // open decisions must be empty at the gate
  const od = dataRows(section(t, "bp", "open-decisions"));
  if (AT_GATE && od.length) err("open-decisions", rf, `${od.length} open decision row(s) at the gate — every product decision is resolved, delegated, or the gate fails`);
}

// ---------------------------------------------------------------- 5b. interaction layer (v1.5.0)
// Asymmetric touches cross-check: omission is the failure mode, so
// mentioned-but-undeclared is an ERROR; declared-but-unmentioned only a warning
// (a pure-read FS legitimately mentions nothing else — an error there would
// push people to under-declare).
const writers = {}; // entity -> Set(fs)
for (const f of fsFiles) {
  const fid = f.match(/^(fs-\d{2})/i)[1].toLowerCase();
  const rf = `blueprint/feature-specs/${f}`;
  const declared = new Set((fsTouches[fid] || []).map((t) => t.entity));
  const mentioned = new Set(fsFieldEntities[fid] || []);
  for (const [st, meta] of Object.entries(stMeta)) if (meta.trigger === fid) mentioned.add(meta.entity);
  for (const e of mentioned) if (!declared.has(e)) err("touches-omission", rf, `entity "${e}" is used by this FS (fields/state-machine trigger) but not declared in its touches table`);
  for (const e of declared) if (!mentioned.has(e)) warn("touches-unused", rf, `entity "${e}" declared in touches but not visibly used elsewhere in the FS — fine for pure reads; confirm by reading`);
  for (const t of fsTouches[fid] || [])
    if (t.access === "write" || t.access.startsWith("transition:")) (writers[t.entity] = writers[t.entity] || new Set()).add(fid);
}
// fs-triggered transitions must be claimed in that FS's touches
for (const [st, meta] of Object.entries(stMeta)) {
  if (!/^fs-\d{2}$/.test(meta.trigger)) continue;
  const claims = (fsTouches[meta.trigger] || []).some((t) => t.access === `transition:${st.toLowerCase()}`);
  if (!claims) err("st-unclaimed", "blueprint/data-schema.md", `${st} is triggered by ${meta.trigger}, but that FS's touches table does not declare transition:${st}`);
}
// system-triggered transitions need a user-visible consequence, or an explicit reason
{
  const visibleText = fsFiles.map((f) => stripComments(body(fsTexts[f]))).join("\n") +
    (files["ux-spec.md"] ? stripComments(body(files["ux-spec.md"])) : "");
  for (const [st, meta] of Object.entries(stMeta)) {
    if (!meta.trigger.startsWith("system:")) continue;
    const visible = visibleText.includes(st);
    const excused = /invisible\s+\S{2,}/i.test(meta.guard);
    if (!visible && !excused)
      err("st-invisible", "blueprint/data-schema.md", `${st} is system-triggered (${meta.trigger}) and appears in no FS state / ux flow — background work the user never sees, or a missing spec; state \`invisible <reason>\` in the guard if truly invisible`);
  }
}
// concurrency citation (v1.7.0): a multi-writer FS must point at the domain row
for (const f of fsFiles) {
  const fid = f.match(/^(fs-\d{2})/i)[1].toLowerCase();
  const rf = `blueprint/feature-specs/${f}`;
  const sharesEntity = (fsTouches[fid] || []).some((t) => writers[t.entity] && writers[t.entity].size >= 2);
  if (!sharesEntity) continue;
  const row = (fsEdgeRows[fid] || []).find((r) => /concurren/i.test(r[0] || ""));
  if (row && !/interaction-map/i.test(row[1] || ""))
    err("concurrency-not-cited", rf, "this FS writes an entity with other writers, so its concurrency cell must CITE the interaction-map conflict domain rather than restate the rule (two homes for one answer is how they silently diverge)");
}
// interaction-map: required iff any entity has ≥2 writers, any CAP is async, or any INV exists
const imText = read(path.join(bpDir, "interaction-map.md"));
const invIds = new Set();
const jobIds = new Set();
const multiWriter = Object.entries(writers).filter(([, s]) => s.size >= 2);
const imRequired = multiWriter.length > 0 || anyAsyncCap;
if (imRequired && imText === null)
  err("missing-artifact", "blueprint/interaction-map.md", `interaction-map.md is required (${multiWriter.length ? `entity "${multiWriter[0][0]}" has ${multiWriter[0][1].size} writers` : "an async capability exists"})`);
if (imText !== null) {
  const m = fm(imText);
  if (m.stage !== "6" || m.gate !== "BP") err("bad-stage", "blueprint/interaction-map.md", "frontmatter stage/gate must be 6/BP");
  if (AT_GATE && !["ready", "locked"].includes(m.status || "")) err("not-ready", "blueprint/interaction-map.md", `at the gate interaction-map must be ready (got "${m.status || ""}")`);
  for (const a of ["conflict-domains", "pairwise-exceptions", "invariants", "jobs"])
    if (section(imText, "bp", a) === null) err("missing-anchor", "blueprint/interaction-map.md", `anchor <!-- bp:${a} --> missing`);
  const NULL_REASONS = /^(none|independent|no interaction|n\/a|—|-)\s*$/i;
  const domainRows = dataRows(section(imText, "bp", "conflict-domains"));
  const domainByEntity = {};
  for (const r of domainRows) {
    const entity = (r[0] || "").trim().toLowerCase();
    if (!entity) continue;
    domainByEntity[entity] = r;
    if (!/^(single-user-multi-session|multi-user)$/.test((r[2] || "").trim()))
      err("bad-domain-scope", "blueprint/interaction-map.md", `conflict domain "${entity}": scope must be single-user-multi-session | multi-user (got "${r[2] || ""}") — an unstated scope makes a single-user answer read as if multi-user were covered`);
    for (const [i, nm] of [[3, "who wins"], [4, "merge rule"], [5, "lock/lease"], [6, "loser sees"], [7, "undo scope"]]) {
      if (!nonEmpty(r[i])) err("domain-cell-blank", "blueprint/interaction-map.md", `conflict domain "${entity}": blank "${nm}" cell — "last write wins" is an answer, a blank is not`);
      else if (NULL_REASONS.test(r[i])) err("domain-null-answer", "blueprint/interaction-map.md", `conflict domain "${entity}": "${nm}" is a null answer ("${r[i]}") — a domain with ≥2 writers always has a real answer; "no interaction" is legal only in the pairwise-exceptions table`);
    }
  }
  for (const [entity, set] of multiWriter) {
    const row = domainByEntity[entity];
    if (!row) { err("domain-missing", "blueprint/interaction-map.md", `entity "${entity}" has writers {${[...set].join(", ")}} but no conflict-domain row`); continue; }
    const declared = new Set([...(row[1] || "").matchAll(/fs-\d{2}/gi)].map((m2) => m2[0].toLowerCase()));
    const a = [...set].sort().join(","), b = [...declared].sort().join(",");
    if (a !== b) err("writers-set-mismatch", "blueprint/interaction-map.md", `conflict domain "${entity}": writers cell {${b}} ≠ computed writer set {${a}} — a forgotten writer is the actual failure mode`);
  }
  for (const [entity] of Object.entries(domainByEntity))
    if (!(writers[entity] && writers[entity].size >= 2)) warn("domain-extra", "blueprint/interaction-map.md", `conflict-domain row for "${entity}" but the computed writer set has <2 writers — stale row or missing touches declarations`);
  // invariants
  for (const r of dataRows(section(imText, "bp", "invariants"))) {
    if (!/^INV-\d+$/.test(r[0] || "")) { if (nonEmpty(r[0])) err("bad-inv-id", "blueprint/interaction-map.md", `invariant id "${r[0]}" is not INV-<n>`); continue; }
    invIds.add(r[0]);
    if (!nonEmpty(r[2])) err("inv-untraced", "blueprint/interaction-map.md", `${r[0]} has no trace (pack / ST / CAP) — an untraced invariant is a new product promise wearing an invariant's clothes`);
    else if (/^\s*DOD-\d+\s*$/i.test(r[2])) err("inv-duplicates-dod", "blueprint/interaction-map.md", `${r[0]} traces only to ${r[2].trim()} — an invariant already expressed as a DoD item stays a DoD item; two homes for one rule means nothing can tell which is authoritative when they drift`);
  }
  // jobs
  const jobRows = dataRows(section(imText, "bp", "jobs"));
  for (const r of jobRows) {
    if (!/^JOB-\d+$/.test(r[0] || "")) { if (nonEmpty(r[0])) err("bad-job-id", "blueprint/interaction-map.md", `job id "${r[0]}" is not JOB-<n>`); continue; }
    jobIds.add(r[0]);
    const trig = (r[1] || "").trim();
    if (!/fs-\d{2}|CAP-\d{2}-\d+/.test(trig)) err("job-trigger", "blueprint/interaction-map.md", `${r[0]}: triggered-by must name an fs-NN or CAP id`);
    for (const [i, nm] of [[2, "durable?"], [3, "cancellable?"], [4, "on second submit"], [5, "on disconnect/tab close"], [6, "result lifetime"], [7, "user notified how"]])
      if (!nonEmpty(r[i])) err("job-cell-blank", "blueprint/interaction-map.md", `${r[0]}: blank "${nm}" cell — a job outlives the screen; every column is a decision someone will otherwise invent`);
  }
  if (anyAsyncCap && !jobRows.length)
    err("no-jobs", "blueprint/interaction-map.md", "an async capability exists but the jobs table is empty — a multi-minute generation is a durable object, not a loading state");
}
// orphan capabilities: every CAP referenced by ≥1 FS uses row
{
  const used = new Set(Object.values(fsUses).flat());
  for (const cap of Object.keys(capMeta))
    if (!used.has(cap)) err("orphan-cap", capMeta[cap].file, `${cap} is referenced by no FS uses line — unused capability is a scope addition in subsystem form (the orphan-field rule's exact analogue)`);
}
// budgets containment: CAP p95 ≤ the using FS's nfr end-to-end target (components
// fit inside user-visible targets — equality is wrong by construction)
if (files["nfr-spec.md"]) {
  const perfRows = dataRows(section(files["nfr-spec.md"], "bp", "performance"));
  for (const [fid, caps] of Object.entries(fsUses)) {
    for (const cap of caps) {
      if (!capMeta[cap] || !capMeta[cap].latencyInts.length) continue;
      const row = perfRows.find((r) => (r[0] || "").toLowerCase().includes(fid));
      if (!row) continue;
      const nfrInts = ints(row[1] || "");
      if (!nfrInts.length) { warn("unparseable-cell", "blueprint/nfr-spec.md", `performance row for ${fid} has no parseable number — budget containment not compared`); continue; }
      if (Math.max(...capMeta[cap].latencyInts) > Math.max(...nfrInts))
        err("budget-exceeds-nfr", capMeta[cap].file, `${cap} p95 budget (${Math.max(...capMeta[cap].latencyInts)}) exceeds ${fid}'s nfr target (${Math.max(...nfrInts)}) — a 90-second generation under a 5-second screen promise`);
    }
  }
}

// ---------------------------------------------------------------- 6. three-way type check
for (const [key, list] of Object.entries(fieldTypes)) {
  if (list.length < 2) continue;
  const norms = list.map((e) => ({ ...e, n: normType(e.type) }));
  const distinct = [...new Set(norms.map((e) => e.n).filter(Boolean))];
  if (distinct.length <= 1) continue;
  const intSets = norms.map((e) => ints(e.type + " " + e.extra));
  const maxes = intSets.filter((a) => a.length).map((a) => Math.max(...a));
  if (maxes.length >= 2 && new Set(maxes).size > 1) {
    err("type-conflict", key, `${key}: limit disagreement across ${list.map((e) => `${e.src} ("${e.type}${e.extra ? " / " + e.extra : ""}")`).join(" vs ")} — the archetypal mid-build logic conflict`);
  } else {
    warn("type-mismatch", key, `${key}: type spellings differ (${list.map((e) => `${e.src}: "${e.type}"`).join(" vs ")}) — token comparison cannot equate them; confirm by reading`);
  }
}

// ---------------------------------------------------------------- 7. ux cross-checks
if (files["ux-spec.md"]) {
  const fr = section(files["ux-spec.md"], "bp", "first-run");
  if (fr !== null) {
    const rows = dataRows(fr);
    if (!rows.length) err("first-run-empty", "blueprint/ux-spec.md", "first-run flow (signup → aha) has no steps — screens plus empty states do not compose into a first-run sequence");
    for (const r of rows) {
      const sc = (r[1] || "").toUpperCase();
      if (/^SC-\d+$/.test(sc) && !screenIds.has(sc)) err("unknown-screen", "blueprint/ux-spec.md", `first-run references ${sc}, not in the screen inventory`);
    }
    if (ahaEvent && !new RegExp("`?" + ahaEvent + "`?").test(fr)) err("first-run-no-aha", "blueprint/ux-spec.md", `first-run section never names the aha event ${ahaEvent}`);
  }
  const DISPOSITIONS = ["publish-as-fact", "publish-with-qualification", "test-as-proposition", "do-not-publish"];
  for (const r of dataRows(section(files["ux-spec.md"], "bp", "copy"))) {
    const d = (r[3] || "").trim();
    if (!nonEmpty(r[1])) continue;
    if (!DISPOSITIONS.includes(d)) err("bad-disposition", "blueprint/ux-spec.md", `copy row "${(r[1] || "").slice(0, 40)}": publication_disposition "${d}" not in the enum`);
    else if (d === "do-not-publish" && AT_GATE) err("do-not-publish-on-screen", "blueprint/ux-spec.md", `copy row "${(r[1] || "").slice(0, 40)}" is do-not-publish — a claim we cannot support must not ship on a screen`);
  }
}

// ---------------------------------------------------------------- 7b. surfaces, compliance, sides (v1.6.0)
// api-lifecycle: required the moment any surface is not a screen — versioning,
// deprecation, breaking-change policy, key rotation are promises made the
// instant a customer integrates.
{
  const anyHeadless = ["headless-api", "cli", "sdk"].includes(defaultSurface) ||
    Object.values(scSurface).some((x) => ["headless-api", "cli", "sdk"].includes(x));
  if (anyHeadless && files["api-contract.md"]) {
    const al = section(files["api-contract.md"], "bp", "api-lifecycle");
    if (al === null) err("api-lifecycle-missing", "blueprint/api-contract.md", "a non-ui surface exists but <!-- bp:api-lifecycle --> is missing (versioning scheme, deprecation window, breaking-change policy, key issuance/rotation)");
    else if (!/\S{10,}/.test(stripComments(al))) err("api-lifecycle-empty", "blueprint/api-contract.md", "api-lifecycle section is empty");
  }
}
// accessibility floor is NEVER cuttable — headless surfaces substitute, not N/A
if (files["ux-spec.md"]) {
  const acc = stripComments(section(files["ux-spec.md"], "bp", "accessibility") || "");
  if (!/\S{10,}/.test(acc) || /^\s*(##[^\n]*\n)?\s*N\/A/i.test(acc))
    err("accessibility-na", "blueprint/ux-spec.md", "the accessibility anchor is never N/A — UI: keyboard/contrast/labels/focus; headless: stable machine-readable error codes, documented limits, deprecation policy");
}
// compliance: always present — REG rows, or an explicit N/A with a recorded basis
const regIds = new Set();
if (files["nfr-spec.md"]) {
  const comp = section(files["nfr-spec.md"], "bp", "compliance");
  if (comp === null) err("compliance-missing", "blueprint/nfr-spec.md", "<!-- bp:compliance --> is required ALWAYS — REG-n rows, or `N/A — <basis>` (a charter item or source ref; \"no regulation applies\" is itself a claim)");
  else {
    const rows = dataRows(comp).filter((r) => /^REG-\d+$/i.test(r[0] || ""));
    for (const r of rows) {
      regIds.add(r[0].toUpperCase());
      for (const [i, nm] of [[1, "applies because (source ref)"], [2, "obligation affecting MVP"], [3, "mechanism join"], [4, "verified by"]])
        if (!nonEmpty(r[i])) err("compliance-cell", "blueprint/nfr-spec.md", `${r[0]}: empty "${nm}" cell — a model-drafted obligation is [GUESS] and never satisfies the section`);
    }
    if (!rows.length) {
      const na = stripComments(comp).split(/\r?\n/).find((l) => /N\/A/i.test(l)) || "";
      if (!/N\/A\s*[—–-]\s*\S{4,}/.test(na))
        err("compliance-na-basis", "blueprint/nfr-spec.md", "compliance has no REG rows and no `N/A — <basis>` line with a recorded basis (charter item or source ref)");
    }
  }
}
// per-side singletons: ≥2 recorded sides ⇒ the first-run flow covers each side,
// and the aha's side is recorded
if (stateSides.length >= 2 && files["ux-spec.md"]) {
  const fr = stripComments(section(files["ux-spec.md"], "bp", "first-run") || "");
  for (const sd of stateSides)
    if (!fr.toLowerCase().includes(sd.id.toLowerCase()))
      err("first-run-missing-side", "blueprint/ux-spec.md", `first-run flow never mentions side "${sd.id}" — a marketplace has a per-side first run; one flow cannot serve both`);
  const dict = files["blueprint-overview.md"] ? stripComments(section(files["blueprint-overview.md"], "bp", "event-dictionary") || "") : "";
  if (!stateSides.some((sd) => dict.toLowerCase().includes(sd.id.toLowerCase())))
    warn("aha-side-unrecorded", "blueprint/blueprint-overview.md", "≥2 sides but the event dictionary never says which side the aha measures (nor names the other side's activation event) — confirm by reading");
}

// ---------------------------------------------------------------- 8. coverage
const coverageText = files["test-plan.md"] ? (section(files["test-plan.md"], "bp", "coverage") || "") : "";
const coveredAc = new Map();
for (const m of coverageText.matchAll(/AC-\d{2}-\d+/g)) coveredAc.set(m[0], (coveredAc.get(m[0]) || 0) + 1);
for (const ac of acIds) {
  const n = coveredAc.get(ac) || 0;
  if (n === 0) err("ac-uncovered", "blueprint/test-plan.md", `${ac} appears in no test case (cite by reference, never restate)`);
  else if (n > 1) warn("ac-multi-cited", "blueprint/test-plan.md", `${ac} cited ${n}× — the contract expects exactly one case by reference`);
}
for (const m of coverageText.matchAll(/AC-\d{2}-\d+/g))
  if (!acIds.has(m[0])) err("unknown-ac", "blueprint/test-plan.md", `${m[0]} cited but declared in no FS`);
// INV and EV join the coverage map like DOD/MSP: an invariant or eval threshold
// no test depends on is a promise/number with no consequence
for (const inv of invIds)
  if (!coverageText.includes(inv)) err("inv-uncovered", "blueprint/test-plan.md", `${inv} maps to no test scenario`);
for (const ev of evIds) {
  if (!coverageText.includes(ev)) err("ev-uncovered", "blueprint/test-plan.md", `${ev} appears in no test case — an eval threshold no acceptance depends on is a number with no consequence`);
  const cited = Object.values(fsAcRows).some((rows) => rows.some((r) => r.some((c) => (c || "").includes(ev))));
  if (!cited) err("ev-uncited", "blueprint/test-plan.md", `${ev} is cited by no acceptance criterion`);
}
// determinism strategy: any coverage row whose source cites an AC of an FS that
// uses an llm/async capability must say HOW it is repeatable (blank = flaky CI
// by construction; WHICH strategy is right stays a founder/Layer-2 call)
{
  const stochFs = new Set(Object.entries(fsUses)
    .filter(([, caps]) => caps.some((c) => capMeta[c] && (capMeta[c].async || ssKinds[capMeta[c].ss] === "llm")))
    .map(([fid]) => fid.replace(/^fs-/, "")));
  for (const r of dataRows(section(files["test-plan.md"] || "", "bp", "coverage"))) {
    const src = r[0] || "";
    const acm = src.match(/AC-(\d{2})-\d+/);
    const stoch = (acm && stochFs.has(acm[1])) || /EV-\d+/.test(src);
    if (!stoch || nonEmpty(r[3])) continue;
    // blank = inherit the CAP's declaration (v1.7.0: forty cases sharing one
    // strategy should declare it once); only a CAP that declares nothing fails
    const caps = acm ? (fsUses["fs-" + acm[1]] || []) : Object.values(fsUses).flat();
    const inherited = caps.some((c) => capMeta[c] && capMeta[c].determinism);
    if (!inherited)
      err("no-determinism-strategy", "blueprint/test-plan.md", `case "${src}": no determinism strategy — declare it once on the CAP (inherited by every case) or per case (recorded-fixtures / seeded / live-eval-threshold / manual)`);
  }
}

// ---------------------------------------------------------------- 9. pack-side joins (legacy-gated)
const packRead = (f) => read(path.join(packDir, f));
const mvpSpec = packRead("mvp-spec.md");
const dod = packRead("definition-of-done.md");
const techDesign = packRead("tech-design.md");
const packHasAnchors = !!(mvpSpec && /<!--\s*pack:core-loop\s*-->/.test(mvpSpec));
if (!packHasAnchors) {
  warn("legacy-pack", "mvp-pack/", "pack predates the join ids/anchors (pipeline < 1.4.1) — core-loop/DOD/MSP joins NOT mechanically checked; Layer 2 must cover them by reading, by name");
} else {
  const steps = dataRows(section(mvpSpec, "pack", "core-loop")).filter((r) => /^\d+$/.test(r[0] || ""));
  const traced = new Set();
  for (const f of fsFiles) for (const d of (stripComments(section(fsTexts[f], "bp", "trace") || "").match(/\b\d{1,2}\b/g) || [])) traced.add(Number(d));
  for (const s of steps) if (!traced.has(Number(s[0]))) err("step-unspecced", "blueprint/", `core-loop step ${s[0]} is referenced by no feature spec's trace`);
  if (dod) {
    const dodIds = [...new Set((dod.match(/DOD-\d+/g) || []))];
    for (const id of dodIds) {
      const line = dod.split(/\r?\n/).find((l) => l.includes(id)) || "";
      if (/N\/A/.test(line)) continue;
      if (!coverageText.includes(id)) err("dod-uncovered", "blueprint/test-plan.md", `${id} maps to no test scenario (and is not marked N/A in the DoD)`);
    }
  }
  if (mvpSpec) {
    const mspRows = dataRows(section(mvpSpec, "pack", "msp"));
    for (const r of mspRows) {
      const id = (r[0] || "").trim();
      if (!/^MSP-\d+$/.test(id)) continue;
      if (isNA(r[2] || "")) continue;
      const inRetention = files["data-schema.md"] && (section(files["data-schema.md"], "bp", "retention") || "").includes(id);
      if (!coverageText.includes(id) && !inRetention)
        err("msp-uncovered", "blueprint/test-plan.md", `${id} maps to no test scenario and no retention mechanism`);
    }
  }
  if (techDesign) {
    const entSection = section(techDesign, "pack", "entities") || "";
    for (const entity of new Set([...declaredFields].map((k) => k.split(".")[0])))
      if (!entSection.toLowerCase().includes(entity))
        warn("entity-not-in-tech-design", "blueprint/data-schema.md", `entity "${entity}" does not appear in tech-design's domain model section — scope creep in schema form, or a renamed entity; confirm by reading`);
  }
}

// ---------------------------------------------------------------- 10. self-containment
// v1.5.0 files parse after the section-4 marker sweep — give them the same
// marker scan here, then include them in the self-containment sweep below.
if (imText !== null) allBpFiles.push(["blueprint/interaction-map.md", imText]);
for (const f of ssFiles) allBpFiles.push([`blueprint/subsystem-specs/${f}`, read(path.join(ssDir, f))]);
for (const [f, t] of allBpFiles.slice(-(ssFiles.length + (imText !== null ? 1 : 0)))) {
  const scan = stripComments(body(t || ""));
  for (const [re, label] of MARKERS) {
    const hits = scan.match(re);
    if (hits) { const emit = AT_GATE ? err : warn; emit("marker", f, `${hits.length}× ${label}${AT_GATE ? "" : " (error at the gate)"}`); }
  }
}
for (const [f, t] of allBpFiles) {
  const scan = stripComments(body(t));
  if (/\]\((\.\.\/(?!mvp-pack\/))/.test(scan) || /\]\(\s*\/[A-Za-z]/.test(scan) || /[A-Za-z]:\\/.test(scan))
    err("not-self-contained", f, "reference escapes blueprint/ (only ../mvp-pack/ is legal) — the clean-copy cold-start would break here");
}

// ---------------------------------------------------------------- 11. pack immutability
{
  let manifest = argVal("--pack-manifest");
  if (!manifest) {
    const priv = path.join(ideaDir, "private");
    if (fs.existsSync(priv)) {
      const cands = fs.readdirSync(priv).filter((f) => /^manifest-lock-.*\.json$/i.test(f)).sort();
      if (cands.length) manifest = path.join(priv, cands[cands.length - 1]);
    }
  }
  if (manifest && fs.existsSync(manifest)) {
    try {
      execFileSync("node", [path.join(__dirname, "artifact-manifest.js"), "verify", ideaDir, manifest], { stdio: "pipe" });
    } catch (e) {
      err("pack-hash-moved", "mvp-pack/", `pack hashes no longer match the LOCK verdict manifest (${rel(manifest)}) — the pack is read-only during stage 6: ${String(e.stdout || e.message).trim().split(/\r?\n/).slice(0, 3).join("; ")}`);
    }
  } else {
    warn("no-lock-manifest", "private/", "no LOCK manifest found to verify pack immutability against — Layer 2 must confirm the pack is untouched, by name");
  }
}

// ---------------------------------------------------------------- 12. amendments
const amDir = path.join(bpDir, "amendments");
const WITH_AM = args.includes("--with-amendments") || fs.existsSync(amDir);
if (WITH_AM) {
  const amFiles = fs.existsSync(amDir) ? fs.readdirSync(amDir).filter((f) => /^ba-\d{3}-[a-z0-9-]+\.md$/i.test(f)).sort() : [];
  const logText = read(path.join(bpDir, "amendment-log.md"));
  const logIds = new Set((logText || "").match(/BA-\d{3}/g) || []);
  const fileIds = new Set(amFiles.map((f) => "BA-" + f.match(/^ba-(\d{3})/i)[1]));
  if (amFiles.length && logText === null) err("no-amendment-log", "blueprint/amendment-log.md", "amendments exist but the log is missing — the log is FIRST in the build read order");
  for (const id of fileIds) if (!logIds.has(id)) err("amendment-unlogged", "blueprint/amendment-log.md", `${id} has a record file but no log row`);
  for (const id of logIds) if (!fileIds.has(id)) err("amendment-dangling-log", "blueprint/amendment-log.md", `log row ${id} has no record file — the log indexes an amendment no file claims`);
  const symbols = new Set([
    ...acIds, ...declaredFields, ...errorCodes, ...screenIds, ...eventNames, ...dfIds, ...fsIds,
    ...Object.keys(capMeta), ...evIds, ...stIds, ...invIds, ...jobIds, ...Object.keys(ssKinds),
    ...regIds,
  ]);
  for (const f of amFiles) {
    const t = read(path.join(amDir, f));
    const rf = `blueprint/amendments/${f}`;
    const m = fm(t);
    const fnum = f.match(/^ba-(\d{3})/i)[1];
    if ((m.amendment_id || "") !== `BA-${fnum}`) err("amendment-id-mismatch", rf, `amendment_id "${m.amendment_id || ""}" vs filename digits ${fnum} — the two ids are one number`);
    for (const tm of (t || "").matchAll(/`?([a-z0-9./-]+\.md)#([A-Za-z0-9._-]+)`?/g)) {
      const [, tf, tid] = tm;
      const base = tf.replace(/^.*\//, "");
      const known = [...REQUIRED, "deferred-register.md", "interaction-map.md", ...fsFiles, ...ssFiles].some((k) => k === base);
      if (!known) { err("amendment-target-file", rf, `target file ${tf} is not a blueprint artifact`); continue; }
      if (!symbols.has(tid) && !symbols.has(tid.toUpperCase()) && !symbols.has(tid.toLowerCase()))
        err("amendment-target-id", rf, `target ${tf}#${tid} does not resolve in the blueprint's id space`);
    }
    for (const [re, label] of MARKERS) {
      const hits = stripComments(body(t || "")).match(re);
      if (hits) err("marker", rf, `${hits.length}× ${label} in a final amendment record`);
    }
  }
  // state index agreement
  try {
    const st = JSON.parse(read(path.join(ideaDir, "state.json")) || "{}");
    const last = st.blueprint && st.blueprint.amendments && st.blueprint.amendments.last_id;
    const maxId = amFiles.length ? "BA-" + amFiles[amFiles.length - 1].match(/^ba-(\d{3})/i)[1] : null;
    if (maxId && last !== maxId) err("state-amendments-stale", "state.json", `blueprint.amendments.last_id is ${last || "unset"} but the highest record is ${maxId}`);
  } catch { /* state unreadable: other tools own that failure */ }
}

report();

// ---------------------------------------------------------------- output
function report() {
  const errors = findings.filter((f) => f.level === "error");
  const warnings = findings.filter((f) => f.level === "warning");
  if (JSON_OUT) {
    console.log(JSON.stringify({ errors: errors.length, warnings: warnings.length, unparseable_cells: unparseableCells, findings }, null, 2));
  } else {
    for (const f of findings) console.log(`${f.level.toUpperCase()} [${f.code}] ${f.file}: ${f.message}`);
    console.log(`\n${errors.length} error(s), ${warnings.length} warning(s), ${unparseableCells} unparseable cell(s) never compared`);
    if (!errors.length) {
      console.log(
        "\nWhat a green run does NOT mean: this proves the documents are internally consistent and\n" +
        "complete in FORM — every id resolves, every cell is answered, types agree. It cannot tell you\n" +
        "the specified product is the right product. A quality bar validated with a human in the loop,\n" +
        "a per-user volume nobody observed, or a milestone that satisfies 'core loop first' while\n" +
        "reducing no risk all pass this check. Those live in the carry-forward table's quantitative\n" +
        "rows and in the founder's judgement — not here."
      );
    }
  }
  process.exit(errors.length ? 1 : 0);
}
