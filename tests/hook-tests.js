#!/usr/bin/env node
/**
 * Reproducible hook tests (saas-idea-brainstorm plugin).
 * Run: node tests/hook-tests.js
 * Covers the adversarial-review findings, including the proven partial-edit
 * threshold bypass (review finding #9) as a regression test.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.resolve(__dirname, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "sib-hooktest-"));
let pass = 0,
  fail = 0;

function runHook(script, payload) {
  const out = execFileSync("node", [path.join(ROOT, "hooks", "scripts", script)], {
    input: JSON.stringify(payload),
    encoding: "utf8",
  });
  return out.trim() ? JSON.parse(out) : null;
}
function check(name, cond) {
  if (cond) {
    pass++;
    console.log("  PASS " + name);
  } else {
    fail++;
    console.log("  FAIL " + name);
  }
}
function mkIdea(slug, state) {
  const dir = path.join(TMP, "ideas", slug);
  fs.mkdirSync(dir, { recursive: true });
  if (state) fs.writeFileSync(path.join(dir, "state.json"), JSON.stringify(state, null, 2));
  return dir;
}

const SIGNED_STATE = {
  schema_version: "1.1.0",
  pipeline_version: "1.1.0",
  idea: "t",
  mode: "analysis",
  active: ["2.V1"],
  gates: { F: { status: "passed" }, V1: { status: "in_progress" } },
  thresholds: { signed_date: "2026-07-20", v1_past_behavior_pct: 60, v1_min_sample: 12, v3_min_commitments: 5, r1_eval_pass_pct: null, custom: {}, revisions: [] },
  kill_criteria: [{ id: "K1", desired_state: "reach 12 mined individuals", by_date: "2026-07-01", then: "stop", status: "armed" }],
  budget: { cap_usd: 0, spent_usd: 0, log: [] },
  waiting_on: [{ what: "interview transcripts", since: "2026-07-25", needed_for: "V1" }],
};

console.log("== session-start ==");
{
  const dir = mkIdea("t", SIGNED_STATE);
  // corrupt sibling idea must not suppress healthy one
  fs.mkdirSync(path.join(TMP, "ideas", "broken"), { recursive: true });
  fs.writeFileSync(path.join(TMP, "ideas", "broken", "state.json"), "{not json, pipeline_version");
  const sub = path.join(TMP, "somewhere", "deep");
  fs.mkdirSync(sub, { recursive: true });
  const r = runHook("session-start.js", { cwd: sub }); // walk-up finds TMP/ideas
  const ctx = r && r.hookSpecificOutput && r.hookSpecificOutput.additionalContext;
  check("walk-up from subdir finds ideas/", !!ctx);
  check("overdue kill criteria flagged", !!ctx && ctx.includes("KILL CRITERIA OVERDUE"));
  check(
    "overdue banner renders desired_state content, not 'undefined'",
    !!ctx && ctx.includes('"reach 12 mined individuals" not reached by 2026-07-01') && !ctx.includes("undefined")
  );
  check("healthy idea summarized despite corrupt sibling", !!ctx && ctx.includes("- t:"));
  check("corrupt idea reported", !!ctx && ctx.includes("unparsable"));
  const r2 = runHook("session-start.js", { cwd: os.tmpdir() });
  check("no pipeline => silent", r2 === null || !r2.hookSpecificOutput);
}

console.log("== validate-artifact ==");
{
  const dir = mkIdea("t2", SIGNED_STATE);
  const f = path.join(dir, "problem-hypothesis.md");
  fs.writeFileSync(f, "no frontmatter\n");
  let r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("missing frontmatter => block", r && r.decision === "block");
  fs.writeFileSync(f, "---\nartifact: problem-hypothesis\nidea: t2\nstage: 9\ngate: XX\nstatus: nonsense\nevidence_grade: Z\nrung: warp\npipeline_version: 1.1.0\nupdated: nope\n---\nbody\n");
  r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("invalid enums/date/stage => block", r && r.decision === "block" && /invalid/.test(r.reason));
  fs.writeFileSync(f, "---\nartifact: problem-hypothesis\nidea: t2\nstage: 0\ngate: F\nstatus: draft\nevidence_grade: none\nrung: baseline-auto\npipeline_version: 1.1.0\nupdated: 2026-07-29\n---\nbody\n");
  r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("valid frontmatter => silent", r === null);
  // unrelated repo (no sentinel)
  const foreign = path.join(TMP, "other", "ideas", "x");
  fs.mkdirSync(foreign, { recursive: true });
  const ff = path.join(foreign, "note.md");
  fs.writeFileSync(ff, "no frontmatter\n");
  r = runHook("validate-artifact.js", { tool_input: { file_path: ff } });
  check("no sentinel state.json => untouched", r === null);
}

console.log("== validate-artifact (round-3 regressions) ==");
{
  const dir = mkIdea("t2b", SIGNED_STATE);
  const f = path.join(dir, "problem-hypothesis.md");
  const fm = (over) => {
    const base = { artifact: "problem-hypothesis", idea: "t2b", stage: "0", gate: "F", status: "draft", evidence_grade: "none", rung: "baseline-auto", pipeline_version: "1.1.0", updated: "2026-07-29", ...over };
    return "---\n" + Object.entries(base).map(([k, v]) => `${k}: ${v}`).join("\n") + "\n---\nbody\n";
  };
  fs.writeFileSync(f, fm({ updated: "2026-99-99" }));
  let r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("impossible calendar date => block", r && r.decision === "block");
  fs.writeFileSync(f, fm({ idea: "other-idea" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("idea != path slug => block", r && r.decision === "block");
  fs.writeFileSync(f, fm({ pipeline_version: "9.9.9" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("unsupported pipeline_version => block", r && r.decision === "block");
  fs.writeFileSync(f, fm({ gate: "V3" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("gate/stage mismatch => block", r && r.decision === "block");
  fs.writeFileSync(f, fm({}));
  r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("fully valid v1.1 artifact => silent", r === null);
}

console.log("== guard-thresholds ==");
{
  const dir = mkIdea("t3", SIGNED_STATE);
  const sp = path.join(dir, "state.json");
  // REGRESSION (review #9): partial edit changing only the number
  let r = runHook("guard-thresholds.js", { tool_input: { file_path: sp, old_string: "60", new_string: "70" } });
  check("partial numeric edit on signed threshold => ask", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
  // removing signed_date via key omission in a full rewrite
  const ns = JSON.parse(JSON.stringify(SIGNED_STATE));
  ns.thresholds.v1_past_behavior_pct = 40;
  r = runHook("guard-thresholds.js", { tool_input: { file_path: sp, content: JSON.stringify(ns, null, 2) } });
  check("full rewrite changing threshold w/o revision => ask", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
  // legit revision recorded => allow
  const ok = JSON.parse(JSON.stringify(SIGNED_STATE));
  ok.thresholds.v1_past_behavior_pct = 40;
  ok.thresholds.revisions = [{ date: "2026-07-29", field: "v1_past_behavior_pct", from: 60, to: 40, reason: "user approved", user_approved: true }];
  r = runHook("guard-thresholds.js", { tool_input: { file_path: sp, content: JSON.stringify(ok, null, 2) } });
  check("threshold change WITH revisions entry => allow", r === null);
  // non-threshold state edit => allow
  r = runHook("guard-thresholds.js", { tool_input: { file_path: sp, old_string: '"needed_for": "V1"', new_string: '"needed_for": "V1x"' } });
  check("non-threshold state edit => silent", r === null);
  // locked artifact
  const dod = path.join(dir, "definition-of-done.md");
  fs.writeFileSync(dod, "---\nartifact: definition-of-done\nidea: t3\nstage: 5\ngate: LOCK\nstatus: locked\nevidence_grade: none\nrung: baseline-auto\npipeline_version: 1.1.0\nupdated: 2026-07-29\n---\nfrozen\n");
  r = runHook("guard-thresholds.js", { tool_input: { file_path: dod, old_string: "frozen", new_string: "changed" } });
  check("locked artifact edit => ask", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
  // decision-log append-only
  const dl = path.join(dir, "decision-log.md");
  fs.writeFileSync(dl, "| date | type | decision |\n| 2026-07-20 | gate-verdict | F passed |\n");
  r = runHook("guard-thresholds.js", { tool_input: { file_path: dl, content: "| date | type | decision |\n" } });
  check("decision-log truncation => ask", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
  r = runHook("guard-thresholds.js", { tool_input: { file_path: dl, content: "| date | type | decision |\n| 2026-07-20 | gate-verdict | F passed |\n| 2026-07-29 | pivot | segment |\n" } });
  check("decision-log append => allow", r === null);
  // ROUND-3 REGRESSIONS (Codex round-2 confirmed bypasses)
  r = runHook("guard-thresholds.js", { tool_input: { file_path: dl, content: "| PREPENDED | row | x |\n| date | type | decision |\n| 2026-07-20 | gate-verdict | F passed |\n" } });
  check("decision-log PREPEND => ask (prefix rule)", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
  const junk = JSON.parse(JSON.stringify(SIGNED_STATE));
  junk.thresholds.v1_past_behavior_pct = 40;
  junk.thresholds.revisions = [{}];
  r = runHook("guard-thresholds.js", { tool_input: { file_path: sp, content: JSON.stringify(junk, null, 2) } });
  check("empty {} revision entry => still ask", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
  // foreign state.json (no pipeline_version) must NOT be policed
  const fdir = path.join(TMP, "foreign2", "ideas", "z");
  fs.mkdirSync(fdir, { recursive: true });
  const fsp = path.join(fdir, "state.json");
  fs.writeFileSync(fsp, JSON.stringify({ thresholds: { signed_date: "2026-01-01", v1_past_behavior_pct: 60 } }));
  r = runHook("guard-thresholds.js", { tool_input: { file_path: fsp, old_string: "60", new_string: "70" } });
  check("foreign state.json (no pipeline_version) => untouched", r === null);
  // ROUND-4: revision entry missing from/to (Codex confirmed bypass) => ask
  const noFromTo = JSON.parse(JSON.stringify(SIGNED_STATE));
  noFromTo.thresholds.v1_past_behavior_pct = 40;
  noFromTo.thresholds.revisions = [{ field: "v1_past_behavior_pct", date: "not-a-date", reason: "ok", user_approved: true }];
  r = runHook("guard-thresholds.js", { tool_input: { file_path: sp, content: JSON.stringify(noFromTo, null, 2) } });
  check("revision missing from/to + bad date => still ask", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
}

console.log("== round-4 validator cases ==");
{
  const dir = mkIdea("t4", SIGNED_STATE);
  // batch trace files are frontmatter-exempt
  const bdir = path.join(dir, "error-analysis");
  fs.mkdirSync(bdir, { recursive: true });
  const bf = path.join(bdir, "batch-003.md");
  fs.writeFileSync(bf, "raw trace notes, no frontmatter\n");
  let r = runHook("validate-artifact.js", { tool_input: { file_path: bf } });
  check("error-analysis batch file => exempt", r === null);
  // artifact id must match filename
  const mm = path.join(dir, "lean-canvas.md");
  fs.writeFileSync(mm, "---\nartifact: problem-hypothesis\nidea: t4\nstage: 0\ngate: F\nstatus: draft\nevidence_grade: none\nrung: baseline-auto\npipeline_version: 1.1.0\nupdated: 2026-07-29\n---\nbody\n");
  r = runHook("validate-artifact.js", { tool_input: { file_path: mm } });
  check("artifact id != filename => block", r && r.decision === "block");
  // foreign state.json that only MENTIONS pipeline_version in a note => no validation
  const gdir = path.join(TMP, "foreign3", "ideas", "q");
  fs.mkdirSync(gdir, { recursive: true });
  fs.writeFileSync(path.join(gdir, "state.json"), JSON.stringify({ note: "this mentions pipeline_version in text only" }));
  const gf = path.join(gdir, "whatever.md");
  fs.writeFileSync(gf, "no frontmatter\n");
  r = runHook("validate-artifact.js", { tool_input: { file_path: gf } });
  check("sentinel is parsed property, not substring => untouched", r === null);
}

console.log("== v1.2 maintenance frontmatter (validate-artifact) ==");
{
  const dir = mkIdea("t5", SIGNED_STATE);
  const mfm = (over) => {
    const base = {
      artifact: "current-baseline-v1", artifact_kind: "current-baseline", idea: "t5",
      phase: "maintenance", cycle_id: "C1", mutation_policy: "versioned-projection",
      publication_status: "draft", as_of: "2026-07-30", pipeline_version: "1.2.0", updated: "2026-07-30",
      ...over,
    };
    return "---\n" + Object.entries(base).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`).join("\n") + "\n---\nbody\n";
  };
  const f = path.join(dir, "current-baseline-v1.md");
  fs.writeFileSync(f, mfm({}));
  let r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("valid maintenance baseline v1 => silent", r === null);
  fs.writeFileSync(f, mfm({ stage: "5", gate: "LOCK" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("maintenance artifact carrying stage/gate => block", r && r.decision === "block");
  fs.writeFileSync(f, mfm({ artifact_kind: "nonsense" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("invalid artifact_kind => block", r && r.decision === "block");
  fs.writeFileSync(f, mfm({ mutation_policy: undefined }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("missing mutation_policy => block", r && r.decision === "block");
  // baseline v2 requires supersedes + supersedes_sha256
  const f2 = path.join(dir, "current-baseline-v2.md");
  fs.writeFileSync(f2, mfm({ artifact: "current-baseline-v2" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: f2 } });
  check("baseline v2 without supersedes(+sha256) => block", r && r.decision === "block");
  fs.writeFileSync(f2, mfm({ artifact: "current-baseline-v2", supersedes: "current-baseline-v1.md", supersedes_sha256: "a".repeat(64) }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: f2 } });
  check("baseline v2 with supersedes + sha256 => silent", r === null);
  // validation-run report/spec: run_id + <run_id>-report/-spec naming + directory
  const vr = path.join(dir, "validation-runs");
  fs.mkdirSync(vr, { recursive: true });
  const rf = path.join(vr, "vr-20260730-01-report.md");
  fs.writeFileSync(rf, mfm({ artifact: "vr-20260730-01-report", artifact_kind: "validation-run-report", mutation_policy: "immutable-snapshot" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: rf } });
  check("validation-run-report without run_id => block", r && r.decision === "block");
  fs.writeFileSync(rf, mfm({ artifact: "vr-20260730-01-report", artifact_kind: "validation-run-report", mutation_policy: "immutable-snapshot", run_id: "vr-20260730-01" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: rf } });
  check("validation-run-report with run_id + naming => silent", r === null);
  const sf = path.join(vr, "vr-20260730-01-spec.md");
  fs.writeFileSync(sf, mfm({ artifact: "vr-20260730-01-spec", artifact_kind: "validation-run-spec", mutation_policy: "immutable-snapshot", run_id: "vr-20260730-02" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: sf } });
  check("run-spec id/run_id mismatch => block", r && r.decision === "block");
  // unknown phase => block; pipeline artifacts at 1.2.0 => still fine
  fs.writeFileSync(f, mfm({ phase: "afterlife" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("unknown phase => block", r && r.decision === "block");
  const pf = path.join(dir, "problem-hypothesis.md");
  fs.writeFileSync(pf, "---\nartifact: problem-hypothesis\nidea: t5\nstage: 0\ngate: F\nstatus: draft\nevidence_grade: none\nrung: baseline-auto\npipeline_version: 1.2.0\nupdated: 2026-07-30\n---\nbody\n");
  r = runHook("validate-artifact.js", { tool_input: { file_path: pf } });
  check("pipeline artifact at pipeline_version 1.2.0 => silent", r === null);
}

console.log("== round-7 validator regressions (Codex impl review) ==");
{
  const dir = mkIdea("t5b", SIGNED_STATE);
  const mfm = (over) => {
    const base = {
      artifact: "current-baseline-v1", artifact_kind: "current-baseline", idea: "t5b",
      phase: "maintenance", cycle_id: "C1", mutation_policy: "versioned-projection",
      publication_status: "draft", as_of: "2026-07-30", pipeline_version: "1.2.0", updated: "2026-07-30",
      ...over,
    };
    return "---\n" + Object.entries(base).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`).join("\n") + "\n---\nbody\n";
  };
  // reserved maintenance filename without phase => block (phase laundering)
  const f = path.join(dir, "current-baseline-v1.md");
  fs.writeFileSync(f, "---\nartifact: current-baseline-v1\nidea: t5b\nstage: 5\ngate: LOCK\nstatus: draft\nevidence_grade: none\nrung: baseline-auto\npipeline_version: 1.2.0\nupdated: 2026-07-30\n---\nbody\n");
  let r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("reserved maintenance filename without phase => block", r && r.decision === "block");
  // kind/policy pairing enforced
  fs.writeFileSync(f, mfm({ mutation_policy: "immutable-snapshot" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: f } });
  check("kind-policy mismatch => block", r && r.decision === "block");
  // supersedes traversal => block
  const f2 = path.join(dir, "current-baseline-v2.md");
  fs.writeFileSync(f2, mfm({ artifact: "current-baseline-v2", supersedes: "../other-idea/current-baseline-v1.md", supersedes_sha256: "a".repeat(64) }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: f2 } });
  check("supersedes traversal => block", r && r.decision === "block");
  // reconcile manifest: correct dir + naming passes; wrong dir blocks
  const rdir = path.join(dir, "reconcile", "r-20260730-01");
  fs.mkdirSync(rdir, { recursive: true });
  const mf = path.join(rdir, "manifest-r-20260730-01.md");
  fs.writeFileSync(mf, mfm({ artifact: "manifest-r-20260730-01", artifact_kind: "reconcile-manifest", mutation_policy: "immutable-snapshot", reconcile_id: "r-20260730-01" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: mf } });
  check("reconcile manifest correct naming => silent", r === null);
  fs.writeFileSync(mf, mfm({ artifact: "manifest-r-20260730-01", artifact_kind: "reconcile-manifest", mutation_policy: "immutable-snapshot", reconcile_id: "r-20260730-99" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: mf } });
  check("reconcile dir/reconcile_id mismatch => block", r && r.decision === "block");
  // health-criteria v2 without lineage => block
  const h2 = path.join(dir, "health-criteria-v2.md");
  fs.writeFileSync(h2, mfm({ artifact: "health-criteria-v2", artifact_kind: "health-criteria" }));
  r = runHook("validate-artifact.js", { tool_input: { file_path: h2 } });
  check("health-criteria v2 without supersedes => block", r && r.decision === "block");
  // canonicalization: ".." in the path is collapsed before dispatch
  const trav = path.join(dir, "sub", "..", "current-baseline-v1.md");
  fs.mkdirSync(path.join(dir, "sub"), { recursive: true });
  fs.writeFileSync(f, "no frontmatter\n");
  r = runHook("validate-artifact.js", { tool_input: { file_path: trav } });
  check("path with .. canonicalized (still validated) => block", r && r.decision === "block");
}

console.log("== round-7 guard regressions ==");
{
  const dir = mkIdea("t6b", SIGNED_STATE);
  const el = path.join(dir, "evidence-ledger.md");
  fs.writeFileSync(el, "---\nartifact: evidence-ledger\n---\n| E1 | 2026-07-01 | P1 | person | ref | 2026-07-01 | run | \"q\" | A1 | B | confirms |\n");
  let r = runHook("guard-thresholds.js", { tool_input: { file_path: el, content: "---\nartifact: evidence-ledger\n---\n" } });
  check("evidence-ledger truncation => ask", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
  r = runHook("guard-thresholds.js", { tool_input: { file_path: el, old_string: "| B | confirms |", new_string: "| A | confirms |" } });
  check("evidence-ledger row edit (grade upgrade) => ask", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
  r = runHook("guard-thresholds.js", { tool_input: { file_path: el, content: fs.readFileSync(el, "utf8") + "| E2 | 2026-07-30 | P2 | person | ref | 2026-07-30 | run | \"q2\" | A1 | B | confirms |\n" } });
  check("evidence-ledger append => allow", r === null);
}

console.log("== v1.2 guard: drift-inbox append-only + publication_status locked ==");
{
  const dir = mkIdea("t6", SIGNED_STATE);
  const di = path.join(dir, "drift-inbox.md");
  fs.writeFileSync(di, "---\nartifact: drift-inbox\n---\n| drift_id | ts | dimension | source_type | note |\n| D-001 | 2026-07-30T10:00:00Z | price | founder-statement | raised to $49 |\n");
  let r = runHook("guard-thresholds.js", { tool_input: { file_path: di, content: "---\nartifact: drift-inbox\n---\n| drift_id | ts | dimension | source_type | note |\n" } });
  check("drift-inbox row deletion => ask", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
  r = runHook("guard-thresholds.js", { tool_input: { file_path: di, content: fs.readFileSync(di, "utf8") + "| D-002 | 2026-07-30T11:00:00Z | icp | founder-statement | agencies now |\n" } });
  check("drift-inbox append => allow", r === null);
  const bl = path.join(dir, "current-baseline-v1.md");
  fs.writeFileSync(bl, "---\nartifact: current-baseline-v1\nphase: maintenance\npublication_status: locked\n---\ncontent\n");
  r = runHook("guard-thresholds.js", { tool_input: { file_path: bl, old_string: "content", new_string: "changed" } });
  check("publication_status locked baseline edit => ask", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
  // locked charter: pure append allowed, rewrite asks
  const ch = path.join(dir, "founder-charter.md");
  fs.writeFileSync(ch, "---\nartifact: founder-charter\nstatus: locked\n---\n| I1 | words | para | stated | F/2026-07-01 | 2026-07-01 | |\n");
  r = runHook("guard-thresholds.js", { tool_input: { file_path: ch, content: fs.readFileSync(ch, "utf8") + "| I2 | new words | para | stated | R-20260730-01 | 2026-07-30 | I1 |\n" } });
  check("locked charter pure append => allow", r === null);
  r = runHook("guard-thresholds.js", { tool_input: { file_path: ch, old_string: "| I1 | words", new_string: "| I1 | reworded" } });
  check("locked charter item rewrite => ask", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
}

console.log("== v1.2 state-write: schema accept + cycle freeze ==");
{
  const sw = path.join(ROOT, "scripts", "state-write.js");
  const dir = mkIdea("t7", null);
  const sp = path.join(dir, "state.json");
  const v12 = {
    schema_version: "1.2.0", pipeline_version: "1.2.0", idea: "t7", mode: "analysis", active: [],
    gates: { LOCK: { status: "passed" } },
    thresholds: { signed_date: "2026-07-01", revisions: [] },
    kill_criteria: [],
    budget: { cap_usd: 0, spent_usd: 0, log: [] },
    waiting_on: [], artifacts: {},
    cycles: [{ id: "C1", status: "locked", parent: null, state: null }],
    active_cycle: "C1",
    maintenance: { drift_declared_at: null, active_reconcile: null, last_reconcile: null, current_baseline: null, blocking_claims: [], reality_sources: [] },
    health_criteria: [{ id: "H1", desired_state: "retention >= 40% by window", by_date: "2026-12-01", then: "review", status: "armed" }],
    validation_runs: [],
  };
  const run = (obj, tgt) => {
    try {
      execFileSync("node", [sw, tgt], { input: JSON.stringify(obj), encoding: "utf8" });
      return { ok: true };
    } catch (e) {
      return { ok: false, err: String(e.stderr || e.message) };
    }
  };
  let res = run(v12, sp);
  check("v1.2 state accepted", res.ok);
  // ROUND-7 REGRESSION: schema downgrade bypass — 1.1-shaped rewrite must be rejected
  const down = JSON.parse(JSON.stringify(v12));
  down.schema_version = "1.1.0";
  down.gates.LOCK.status = "pending";
  delete down.cycles; delete down.active_cycle; delete down.maintenance; delete down.health_criteria; delete down.validation_runs;
  res = run(down, sp);
  check("schema downgrade write => rejected", !res.ok && /requires 1\.2\.0/.test(res.err));
  // frozen inline cycle: changing gates must be rejected
  const mut = JSON.parse(JSON.stringify(v12));
  mut.gates.LOCK.status = "pending";
  res = run(mut, sp);
  check("frozen locked cycle gate edit => rejected", !res.ok && /frozen/.test(res.err));
  // ROUND-7 REGRESSION: two-step unfreeze — mutating the locked cycle's index entry first
  const unfreeze = JSON.parse(JSON.stringify(v12));
  unfreeze.cycles[0].status = "validation";
  res = run(unfreeze, sp);
  check("two-step unfreeze (cycles entry edit) => rejected", !res.ok && /cycles\[\] entry is frozen/.test(res.err));
  // maintenance-only update on frozen cycle => allowed
  const maintUpd = JSON.parse(JSON.stringify(v12));
  maintUpd.maintenance.drift_declared_at = "2026-07-30T12:00:00Z";
  res = run(maintUpd, sp);
  check("maintenance update on frozen cycle => accepted", res.ok);
  // adding a NEW cycle while C1 frozen => allowed (C1 entry untouched)
  const addC2 = JSON.parse(JSON.stringify(maintUpd));
  addC2.cycles.push({ id: "C2", status: "validation", parent: "C1", state: "cycles/C2/state.json" });
  addC2.active_cycle = "C2";
  res = run(addC2, sp);
  check("new cycle registration while C1 frozen => accepted", res.ok);
  // v1.2 requires maintenance block
  const noMaint = JSON.parse(JSON.stringify(v12));
  delete noMaint.maintenance;
  res = run(noMaint, path.join(mkIdea("t7b", null), "state.json"));
  check("v1.2 without maintenance block => rejected", !res.ok && /maintenance/.test(res.err));
  // invalid health criterion + retired "state" alias
  const badH = JSON.parse(JSON.stringify(v12));
  badH.idea = "t7c";
  badH.health_criteria = [{ id: "H1", status: "armed" }];
  res = run(badH, path.join(mkIdea("t7c", null), "state.json"));
  check("invalid health_criteria entry => rejected", !res.ok && /health_criteria/.test(res.err));
  const aliasH = JSON.parse(JSON.stringify(v12));
  aliasH.idea = "t7d";
  aliasH.health_criteria = [{ id: "H1", state: "retention", desired_state: "retention", status: "armed" }];
  res = run(aliasH, path.join(mkIdea("t7d", null), "state.json"));
  check('health_criteria retired "state" alias => rejected', !res.ok && /retired field "state"/.test(res.err));
  // null gates => rejected
  const nullG = JSON.parse(JSON.stringify(v12));
  nullG.idea = "t7e";
  nullG.gates = null;
  res = run(nullG, path.join(mkIdea("t7e", null), "state.json"));
  check("null gates object => rejected", !res.ok && /non-null object/.test(res.err));
  // ROUND-9: retired criterion requires a complete disposition {result, date}
  const retNoDisp = JSON.parse(JSON.stringify(v12));
  retNoDisp.idea = "t7f";
  retNoDisp.kill_criteria = [{ id: "K1", desired_state: "x", by_date: null, then: "stop", status: "retired" }];
  res = run(retNoDisp, path.join(mkIdea("t7f", null), "state.json"));
  check("retired criterion without disposition => rejected", !res.ok && /retired but has no disposition/.test(res.err));
  const dispNoDate = JSON.parse(JSON.stringify(v12));
  dispNoDate.idea = "t7g";
  dispNoDate.kill_criteria = [{ id: "K1", desired_state: "x", by_date: null, then: "stop", status: "retired", disposition: { result: "carry" } }];
  res = run(dispNoDate, path.join(mkIdea("t7g", null), "state.json"));
  check("disposition without valid date => rejected", !res.ok && /disposition must be/.test(res.err));
  const dispOk = JSON.parse(JSON.stringify(v12));
  dispOk.idea = "t7h";
  dispOk.kill_criteria = [{ id: "K1", desired_state: "x", by_date: null, then: "stop", status: "retired", disposition: { result: "carry", date: "2026-07-30", health_id: "H1" } }];
  res = run(dispOk, path.join(mkIdea("t7h", null), "state.json"));
  check("retired criterion with complete disposition => accepted", res.ok);
  // cycle fragment: unindexed => rejected; indexed => accepted; freeze; malformed
  const cdir = path.join(dir, "cycles", "C2");
  fs.mkdirSync(cdir, { recursive: true });
  const fp2 = path.join(cdir, "state.json");
  const frag = {
    cycle_id: "C2", parent: "C1", status: "validation", mode: "analysis", active: ["0.0"],
    gates: { F: { status: "pending" } }, thresholds: { signed_date: null, revisions: [] },
    kill_criteria: [], waiting_on: [], artifacts: {}, validation_runs: [], updated: "2026-07-30",
  };
  // root currently DOES index C2 (addC2 written above) — but with parent C1; parent mismatch check:
  const wrongParent = JSON.parse(JSON.stringify(frag));
  wrongParent.parent = "C0";
  res = run(wrongParent, fp2);
  check("fragment parent != root index parent => rejected", !res.ok && /disagrees with root index/.test(res.err));
  res = run(frag, fp2);
  check("indexed cycle fragment accepted", res.ok);
  // ROUND-7 REGRESSION: fragment missing required operating keys => rejected
  const thin = { cycle_id: "C2", status: "validation", gates: { F: { status: "pending" } }, thresholds: {}, kill_criteria: [], updated: "2026-07-30" };
  res = run(thin, fp2);
  check("fragment missing parent/mode/active/... => rejected", !res.ok && /missing required key/.test(res.err));
  // ROUND-9: fragment dispositions validated identically to root
  const fragBadDisp = JSON.parse(JSON.stringify(frag));
  fragBadDisp.kill_criteria = [{ id: "K1", desired_state: "x", by_date: null, then: "stop", status: "retired" }];
  res = run(fragBadDisp, fp2);
  check("fragment retired criterion without disposition => rejected", !res.ok && /retired but has no disposition/.test(res.err));
  // ROUND-8 REGRESSION: fragment status must equal the root index entry's status
  const aheadLock = JSON.parse(JSON.stringify(frag));
  aheadLock.status = "locked"; // root still says validation
  res = run(aheadLock, fp2);
  check("fragment status != root index status => rejected", !res.ok && /disagrees with root index status/.test(res.err));
  // correct protocol: update the root entry first, then the fragment
  const rootLockC2 = JSON.parse(JSON.stringify(addC2));
  rootLockC2.cycles[1].status = "locked";
  res = run(rootLockC2, sp);
  check("root index C2 -> locked accepted", res.ok);
  const lockedFrag = JSON.parse(JSON.stringify(frag));
  lockedFrag.status = "locked";
  res = run(lockedFrag, fp2);
  check("fragment lock transition (root already locked) accepted", res.ok);
  const tamper = JSON.parse(JSON.stringify(lockedFrag));
  tamper.gates.F.status = "passed";
  res = run(tamper, fp2);
  check("locked fragment gate edit => rejected", !res.ok && /frozen/.test(res.err));
  // frozen fragment: even flipping status back is rejected (no two-step unfreeze) —
  // caught by the status-invariant (root still locked) and, failing that, the freeze rule
  const thaw = JSON.parse(JSON.stringify(lockedFrag));
  thaw.status = "validation";
  res = run(thaw, fp2);
  check("frozen fragment status revert => rejected", !res.ok && /(frozen|disagrees with root index status)/.test(res.err));
  // wrong directory/cycle_id correspondence
  const wrongId = JSON.parse(JSON.stringify(frag));
  wrongId.cycle_id = "C3";
  res = run(wrongId, fp2);
  check("fragment cycle_id != directory => rejected", !res.ok && /does not match directory/.test(res.err));
  // unindexed fragment (C9 not in root cycles) => rejected
  const c9dir = path.join(dir, "cycles", "C9");
  fs.mkdirSync(c9dir, { recursive: true });
  const fragC9 = JSON.parse(JSON.stringify(frag));
  fragC9.cycle_id = "C9";
  res = run(fragC9, path.join(c9dir, "state.json"));
  check("unindexed fragment => rejected", !res.ok && /does not index cycle/.test(res.err));
}

console.log("== round-8 guard: historical artifacts of a locked cycle ==");
{
  const st = {
    schema_version: "1.2.0", pipeline_version: "1.2.0", idea: "t12", mode: "analysis", active: [],
    gates: { LOCK: { status: "passed" } }, thresholds: { signed_date: null, revisions: [] },
    kill_criteria: [], budget: { cap_usd: 0, spent_usd: 0, log: [] }, waiting_on: [], artifacts: {},
    cycles: [{ id: "C1", status: "locked", parent: null, state: null }], active_cycle: "C1",
    maintenance: { drift_declared_at: null, active_reconcile: null, last_reconcile: null, current_baseline: null, blocking_claims: [], reality_sources: [] },
    health_criteria: [], validation_runs: [],
  };
  const dir = mkIdea("t12", st);
  const pos = path.join(dir, "positioning.md");
  fs.writeFileSync(pos, "---\nartifact: positioning\nidea: t12\nstage: 4\ngate: P\nstatus: ready\nevidence_grade: B\nrung: baseline-auto\npipeline_version: 1.2.0\nupdated: 2026-07-30\n---\nold thesis\n");
  let r = runHook("guard-thresholds.js", { tool_input: { file_path: pos, old_string: "old thesis", new_string: "new thesis" } });
  check("ready pipeline artifact in LOCKED cycle edit => ask", r && r.hookSpecificOutput && r.hookSpecificOutput.permissionDecision === "ask");
  // maintenance draft baseline stays editable
  const bl = path.join(dir, "current-baseline-v1.md");
  fs.writeFileSync(bl, "---\nartifact: current-baseline-v1\nphase: maintenance\npublication_status: draft\n---\ndraft content\n");
  r = runHook("guard-thresholds.js", { tool_input: { file_path: bl, old_string: "draft content", new_string: "amended draft" } });
  check("maintenance DRAFT baseline in locked cycle => allowed", r === null);
  // decision-log append still allowed in locked cycle
  const dl = path.join(dir, "decision-log.md");
  fs.writeFileSync(dl, "| date | type | decision |\n");
  r = runHook("guard-thresholds.js", { tool_input: { file_path: dl, content: "| date | type | decision |\n| 2026-07-30 | reconciliation | r-20260730-01 |\n" } });
  check("decision-log append in locked cycle => allowed", r === null);
  // same artifact in an UNLOCKED cycle stays editable
  const st2 = JSON.parse(JSON.stringify(st));
  st2.idea = "t13";
  st2.cycles[0].status = "validation";
  const dir2 = mkIdea("t13", st2);
  const pos2 = path.join(dir2, "positioning.md");
  fs.writeFileSync(pos2, "---\nartifact: positioning\nidea: t13\nstage: 4\ngate: P\nstatus: ready\nevidence_grade: B\nrung: baseline-auto\npipeline_version: 1.2.0\nupdated: 2026-07-30\n---\nthesis\n");
  r = runHook("guard-thresholds.js", { tool_input: { file_path: pos2, old_string: "thesis", new_string: "new thesis" } });
  check("ready artifact in UNLOCKED cycle edit => allowed", r === null);
}

console.log("== v1.2 session-start: drift boundary + reconcile line ==");
{
  const st = JSON.parse(JSON.stringify(SIGNED_STATE));
  st.idea = "t8";
  st.kill_criteria = [];
  st.schema_version = "1.2.0";
  st.maintenance = {
    drift_declared_at: "2026-07-30T12:00:00Z",
    active_reconcile: null,
    last_reconcile: { id: "R-20260701-01", completed_at: "2026-07-01T09:00:00Z", intake_authority: "partial" },
    current_baseline: "current-baseline-v1.md",
    blocking_claims: [], reality_sources: [],
  };
  st.health_criteria = [{ id: "H1", desired_state: "retention holds", by_date: "2026-07-01", then: "review", status: "armed" }];
  mkIdea("t8", st);
  const r = runHook("session-start.js", { cwd: TMP });
  const ctx = r && r.hookSpecificOutput && r.hookSpecificOutput.additionalContext;
  check("drift boundary surfaced", !!ctx && ctx.includes("DRIFT DECLARED") && ctx.includes("blocked until reconcile"));
  check("last reconcile line present", !!ctx && ctx.includes("R-20260701-01"));
  check("overdue health criteria flagged", !!ctx && ctx.includes("HEALTH CRITERIA OVERDUE"));
  // ROUND-7: equal timestamps are PENDING (conservative — same-second collision),
  // and fractional-second ordering must be chronological, not lexicographic.
  const st2 = JSON.parse(JSON.stringify(st));
  st2.idea = "t9";
  st2.health_criteria = [];
  st2.maintenance.drift_declared_at = "2026-07-01T09:00:00Z"; // == completed_at
  mkIdea("t9", st2);
  const r2 = runHook("session-start.js", { cwd: TMP });
  const ctx2 = r2 && r2.hookSpecificOutput && r2.hookSpecificOutput.additionalContext;
  const t9line = ctx2 && ctx2.split("\n").find((l) => l.startsWith("- t9:"));
  check("drift == last reconcile timestamp => PENDING (conservative)", !!t9line && t9line.includes("DRIFT DECLARED"));
  const st3 = JSON.parse(JSON.stringify(st));
  st3.idea = "t10";
  st3.health_criteria = [];
  // lexicographically ".500Z" < "Z", but chronologically LATER — must be pending
  st3.maintenance.last_reconcile.completed_at = "2026-07-01T09:00:00Z";
  st3.maintenance.drift_declared_at = "2026-07-01T09:00:00.500Z";
  mkIdea("t10", st3);
  const r3 = runHook("session-start.js", { cwd: TMP });
  const ctx3 = r3 && r3.hookSpecificOutput && r3.hookSpecificOutput.additionalContext;
  const t10line = ctx3 && ctx3.split("\n").find((l) => l.startsWith("- t10:"));
  check("fractional-second later drift => PENDING (epoch compare)", !!t10line && t10line.includes("DRIFT DECLARED"));
  const st4 = JSON.parse(JSON.stringify(st));
  st4.idea = "t11";
  st4.health_criteria = [];
  // drift genuinely BEFORE the reconcile => reconciled, no flag
  st4.maintenance.last_reconcile.completed_at = "2026-07-02T09:00:00Z";
  st4.maintenance.drift_declared_at = "2026-07-01T09:00:00Z";
  mkIdea("t11", st4);
  const r4 = runHook("session-start.js", { cwd: TMP });
  const ctx4 = r4 && r4.hookSpecificOutput && r4.hookSpecificOutput.additionalContext;
  const t11line = ctx4 && ctx4.split("\n").find((l) => l.startsWith("- t11:"));
  check("drift before last reconcile => no boundary flag", !!t11line && !t11line.includes("DRIFT DECLARED"));
}

console.log(`\n${pass} passed, ${fail} failed`);
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
