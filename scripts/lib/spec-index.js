"use strict";
/**
 * spec-index — the one place that knows how to read a locked pack + blueprint as a
 * set of addressable ids.
 *
 * Two consumers, one vocabulary: `spec-lookup.js` (resolves an id for a build session
 * working in the same repo as the idea) and `build-handoff.js` (ships the same index
 * to a separate build repository). The plugin has a standing rule against a vocabulary
 * that exists in two hand-kept copies — the parity tests exist because of the times it
 * did — so the id forms, the definition-site rules and the artifact-purpose table live
 * here and nowhere else.
 *
 * Nothing here is cached to disk. Building the index means reading ~20 markdown files;
 * doing it on demand is cheap and removes an entire class of failure — a stale index
 * that resolves an id to a decision that has since been amended.
 */
const fs = require("fs");
const path = require("path");

// `home` is where an id of this kind is DEFINED, as opposed to the many places it is
// merely cited. Without it the index points at whichever file the directory walk reached
// first — sending a build session to the overview's index row instead of the feature spec.
// E-nnn evidence ids are deliberately absent: they address the evidence ledger, which is
// provenance for *why* a decision was made, not an input to building it.
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
  { kind: "dod", re: /^DOD-\d+$/i, home: /^(mvp-)?pack\/definition-of-done\.md$/, desc: "a definition-of-done item for the product as a whole" },
  { kind: "msp", re: /^MSP-\d+$/i, home: /^(mvp-)?pack\/mvp-spec\.md$/, desc: "a minimum-service-promise commitment made to users" },
  { kind: "core-loop-step", re: /^SC-\d+$/i, home: /^(mvp-)?pack\/mvp-spec\.md$/, desc: "a step of the locked core loop" },
  { kind: "regulation", re: /^REG-\d+$/i, home: null, desc: "a compliance obligation flagged for a regulated domain" },
];

const SKIP_NAMES = new Set(["private", ".git", "node_modules"]);

const PURPOSE = {
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
};

function purposeOf(p) {
  const base = path.basename(p);
  if (PURPOSE[base]) return PURPOSE[base];
  if (/^blueprint\/feature-specs\//.test(p)) return "Feature spec: flow, acceptance criteria, fields, states, edge cases, instrumentation.";
  if (/^blueprint\/subsystem-specs\//.test(p)) return "Subsystem spec: capabilities, budgets, degradation ladder, eval bindings, output contract.";
  if (/^blueprint\/amendments\//.test(p)) return "An immutable amendment record — a spec defect found during build and how it was answered.";
  if (/^(mvp-)?pack\/eval\//.test(p)) return "Eval harness material referenced by the pack's acceptance thresholds.";
  return "Part of the locked specification.";
}

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

/** Split a markdown body into { anchor, text } spans delimited by <!-- bp:… --> / <!-- pack:… -->. */
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

/** Extract one anchored section's body from a file's text. */
function sectionOf(text, anchor) {
  const m = String(text).match(new RegExp("<!--\\s*" + String(anchor).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*-->"));
  if (!m) return null;
  const rest = text.slice(m.index + m[0].length);
  const next = rest.search(/<!--\s*(bp|pack):/);
  return (next === -1 ? rest : rest.slice(0, next)).replace(/^\s*\n/, "");
}

function titleOf(text) {
  const m = String(text).match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

/**
 * Collect the spec files of an idea workspace.
 * `packAs` renames the pack directory in the returned paths — "mvp-pack" keeps the
 * pipeline's own layout (same-repo reading), "pack" matches the shipped copy layout.
 */
function collectFiles(ideaDir, packAs) {
  const pack = packAs || "mvp-pack";
  const out = [];
  for (const [srcRel, dstRel] of [["mvp-pack", pack], ["blueprint", "blueprint"]]) {
    walk(path.join(ideaDir, srcRel), (abs) => {
      const rel = path.relative(path.join(ideaDir, srcRel), abs).replace(/\\/g, "/");
      if (!/\.(md|json|ya?ml|txt|csv)$/i.test(rel)) return;
      out.push({ source: srcRel + "/" + rel, path: dstRel + "/" + rel });
    });
  }
  return out;
}

/**
 * Build the id index. Returns { files, ids, amendmentFiles, amendmentsThrough,
 * packClass, readOrder } — every id mapped to { kind, file, anchor, label }.
 */
function buildIndex(ideaDir, opts) {
  const packAs = (opts && opts.packAs) || "mvp-pack";
  const withBuffers = !!(opts && opts.withBuffers);
  const files = collectFiles(ideaDir, packAs).map((f) => {
    const buf = fs.readFileSync(path.join(ideaDir, f.source));
    return withBuffers ? { ...f, buf, bytes: buf.length } : { ...f, text: buf.toString("utf8"), bytes: buf.length };
  });

  const ids = {};
  const register = (raw, rec) => {
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
  };
  for (const f of files) {
    if (!/\.md$/i.test(f.path)) continue;
    const text = f.text !== undefined ? f.text : f.buf.toString("utf8");
    const base = path.basename(f.path);
    const mFs = base.match(/^(fs-\d{2})-/i);
    if (mFs) register(mFs[1], { file: f.path, anchor: "bp:trace", label: titleOf(text) });
    const mSs = base.match(/^(ss-\d{2})-/i);
    if (mSs) register(mSs[1], { file: f.path, anchor: "bp:trace", label: titleOf(text) });
    const mBa = base.match(/^(ba-\d{3})-/i);
    if (mBa) register(mBa[1].toUpperCase(), { file: f.path, anchor: null, label: titleOf(text) });
    for (const sec of sections(text))
      for (const row of tableRows(sec.text)) {
        if (row.length < 2) continue;
        register(row[0], { file: f.path, anchor: sec.anchor, label: row[1] || row[2] || "" });
      }
  }
  for (const rec of Object.values(ids)) delete rec.at_home; // bookkeeping, not output

  const amendmentFiles = files
    .filter((f) => /^blueprint\/amendments\/ba-\d{3}-/i.test(f.path))
    .map((f) => path.basename(f.path)).sort();

  let packClass = "unstated";
  for (const f of files) {
    if (!new RegExp("^" + packAs + "/(mvp-spec|evidence-quality-report)\\.md$", "i").test(f.path)) continue;
    const m = (f.text !== undefined ? f.text : f.buf.toString("utf8")).match(/\b(Validated|Hypothesis|Pre-feasibility)\b/);
    if (m) { packClass = m[1]; break; }
  }

  const has = (p) => files.some((f) => f.path === p);
  const readOrder = [];
  if (has("blueprint/amendment-log.md")) readOrder.push({ path: "blueprint/amendment-log.md" });
  for (const p of [packAs + "/mvp-spec.md", "blueprint/blueprint-overview.md", packAs + "/definition-of-done.md"])
    if (has(p)) readOrder.push({ path: p });
  if (files.some((f) => /^blueprint\/feature-specs\//.test(f.path)))
    readOrder.push({ path: "blueprint/feature-specs/", note: "the spec for the feature you are implementing" });
  for (const p of ["blueprint/interaction-map.md", "blueprint/data-schema.md", "blueprint/test-plan.md", "blueprint/build-plan.md"])
    if (has(p)) readOrder.push({ path: p });

  return {
    files, ids, amendmentFiles, packClass, readOrder,
    amendmentsThrough: amendmentFiles.length ? amendmentFiles[amendmentFiles.length - 1].replace(/-.*$/, "") : "none",
  };
}

/**
 * Locate an idea workspace from a starting directory. Returns { root, ideas: [names] }
 * or null. Stops at the workspace boundary rather than climbing into someone else's tree.
 */
const WORKSPACE_MARKERS = [".git", ".claude", "package.json", "pyproject.toml", "go.mod", "Cargo.toml"];
function findWorkspace(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i++) {
    const cand = path.join(dir, "ideas");
    try {
      if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) {
        const ideas = fs.readdirSync(cand, { withFileTypes: true })
          .filter((e) => e.isDirectory() && fs.existsSync(path.join(cand, e.name, "state.json")))
          .map((e) => e.name);
        if (ideas.length) return { root: dir, ideasDir: cand, ideas };
      }
    } catch { /* keep climbing */ }
    const atBoundary = WORKSPACE_MARKERS.some((m) => {
      try { return fs.existsSync(path.join(dir, m)); } catch { return false; }
    }) || path.dirname(dir) === dir;
    if (atBoundary) return null;
    dir = path.dirname(dir);
  }
  return null;
}

module.exports = {
  ID_KINDS, SKIP_NAMES, buildIndex, collectFiles, findWorkspace,
  sections, sectionOf, tableRows, titleOf, purposeOf, walk,
};
