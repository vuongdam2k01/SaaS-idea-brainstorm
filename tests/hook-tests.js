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

console.log(`\n${pass} passed, ${fail} failed`);
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
