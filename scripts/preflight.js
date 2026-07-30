#!/usr/bin/env node
/**
 * Repo preflight (saas-idea-brainstorm plugin).
 *
 * One command that answers "is the repo in a shippable state right now?" —
 * written after a session in which parallel edits broke the syntax of three
 * scripts (including a fail-open hook, so nothing surfaced) and two test
 * suites each covered only "their" half of a duplicated mechanism
 * (the 2026-07-30 conflict pass — CHANGELOG.md v1.3.0). Run it after any bulk edit and before
 * any commit.
 *
 * Checks, in order (all must pass):
 *   1. node --check on every shipped .js file (also the first hook-tests case)
 *   2. tests/hook-tests.js
 *   3. tests/pipeline-contract-tests.js
 *   4. scripts/sync-codex-agents.js --check   (agent-body parity)
 *
 * Usage: node scripts/preflight.js
 * Exit 0 = all green. Exit 1 = at least one check failed (details above).
 */
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const results = [];

function step(name, fn) {
  process.stdout.write(`\n== preflight: ${name} ==\n`);
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    const detail = (e.stdout || "") + (e.stderr || "") || e.message;
    process.stdout.write(String(detail).trim().split("\n").slice(-15).join("\n") + "\n");
    results.push({ name, ok: false });
  }
}

step("syntax sweep (node --check)", () => {
  const skipDirs = new Set([".git", "node_modules", "ideas", "generated"]);
  const bad = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!skipDirs.has(e.name)) walk(path.join(dir, e.name)); }
      else if (e.name.endsWith(".js")) {
        const f = path.join(dir, e.name);
        try { execFileSync("node", ["--check", f], { stdio: "pipe" }); }
        catch (err) { bad.push(path.relative(ROOT, f) + ": " + String(err.stderr).split("\n")[0]); }
      }
    }
  })(ROOT);
  if (bad.length) throw new Error("syntax errors:\n" + bad.join("\n"));
  process.stdout.write("all shipped .js files parse\n");
});

step("hook tests", () => {
  const out = execFileSync("node", [path.join(ROOT, "tests", "hook-tests.js")], { encoding: "utf8" });
  process.stdout.write(out.trim().split("\n").pop() + "\n");
  if (!/ 0 failed/.test(out)) throw new Error(out);
});

step("pipeline contract tests", () => {
  const out = execFileSync("node", [path.join(ROOT, "tests", "pipeline-contract-tests.js")], { encoding: "utf8" });
  process.stdout.write(out.trim().split("\n").pop() + "\n");
  if (!/ 0 failed/.test(out)) throw new Error(out);
});

step("codex agent parity (--check)", () => {
  const out = execFileSync("node", [path.join(ROOT, "scripts", "sync-codex-agents.js"), "--check"], { encoding: "utf8" });
  process.stdout.write(out.trim() + "\n");
});

const failed = results.filter((r) => !r.ok);
process.stdout.write("\n== preflight summary ==\n");
for (const r of results) process.stdout.write(`  ${r.ok ? "PASS" : "FAIL"} ${r.name}\n`);
process.exit(failed.length ? 1 : 0);
