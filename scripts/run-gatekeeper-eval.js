#!/usr/bin/env node
/**
 * Gatekeeper catch-rate harness (saas-idea-brainstorm plugin).
 *
 * The interpretation layer has exactly one defence and it is not deterministic, so
 * the only honest description of it is a measured rate. `claude plugin eval` is the
 * right long-term home for this (see evals/README.md) but it is early-access and was
 * gated where this was authored, so this harness does the same job with plain
 * `claude -p`: build the seeded-defect fixtures, run a fresh gatekeeper against each
 * one N times, and report how often the seeded defect is actually reported.
 *
 * It spends real tokens — one gatekeeper run per fixture per repetition. Start at
 * --runs 3.
 *
 * A run counts as a CATCH when the report matches the fixture's expectation pattern.
 * That is a keyword match, so treat the number as a floor: a gatekeeper can describe
 * the same defect in words the pattern misses (undercount), and could in principle
 * mention the keyword while missing the point (overcount). Read `--verbose` output on
 * a sample before trusting a rate to two decimal places.
 *
 * Usage:
 *   node scripts/run-gatekeeper-eval.js [--runs 3] [--case <name>] [--json <path>] [--verbose]
 * Exit codes: 0 = ran (whatever the rate), 2 = could not run.
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const { build, FIXTURES } = require(path.join(ROOT, "evals", "fixtures", "build-fixtures.js"));

const PROMPT = (ideaRel) =>
  `Run the stage-F gatekeeper review for the idea at \`${ideaRel}\`.\n\n` +
  `Use the saas-idea-brainstorm gatekeeper agent (subagent_type "saas-idea-brainstorm:gatekeeper"), ` +
  `wait for it inline, and reproduce its findings verbatim and ranked in your reply. ` +
  `Gate: F. Its job is to find reasons the gate FAILS. Do not soften anything and do not ` +
  `summarize the findings away — I need the full list.`;

function parseArgs(argv) {
  const a = argv.slice(2);
  const num = (f, d) => {
    const i = a.indexOf(f);
    if (i === -1) return d;
    const v = Number(a[i + 1]);
    return Number.isFinite(v) ? v : d;
  };
  const str = (f) => {
    const i = a.indexOf(f);
    return i === -1 ? null : a[i + 1];
  };
  return { runs: num("--runs", 3), only: str("--case"), json: str("--json"), verbose: a.includes("--verbose") };
}

function main(argv) {
  const opts = parseArgs(argv);
  const probe = spawnSync("claude", ["--version"], { encoding: "utf8", shell: process.platform === "win32" });
  if (probe.status !== 0) {
    process.stderr.write("UNUSABLE: `claude` is not on PATH — this harness drives the real CLI.\n");
    return 2;
  }

  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sib-gkeval-"));
  const fixtures = build(workRoot).filter((f) => !opts.only || f.name === opts.only);
  if (!fixtures.length) {
    process.stderr.write(`UNUSABLE: no fixture matched --case ${opts.only}\n`);
    return 2;
  }

  process.stdout.write(
    `gatekeeper catch-rate — ${fixtures.length} fixture(s) x ${opts.runs} run(s)\n` +
      `CLI ${probe.stdout.trim()} · workdir ${workRoot}\n\n`
  );

  const results = [];
  for (const f of fixtures) {
    const expect = FIXTURES[f.name].expect;
    const runs = [];
    for (let i = 1; i <= opts.runs; i++) {
      const started = Date.now();
      const r = spawnSync(
        "claude",
        ["-p", PROMPT(path.join("ideas", f.name).replace(/\\/g, "/")),
         "--permission-mode", "bypassPermissions", "--output-format", "json"],
        { cwd: f.root, encoding: "utf8", input: "", maxBuffer: 64 * 1024 * 1024,
          shell: process.platform === "win32" }
      );
      let text = "", cost = null;
      try {
        const j = JSON.parse(r.stdout || "{}");
        text = j.result || "";
        cost = j.total_cost_usd ?? null;
      } catch {
        text = r.stdout || "";
      }
      const caught = expect.test(text);
      runs.push({ run: i, caught, cost, seconds: Math.round((Date.now() - started) / 1000), chars: text.length });
      process.stdout.write(
        `  ${f.name} run ${i}/${opts.runs}: ${caught ? "CATCH" : "MISS "}` +
          `  (${Math.round((Date.now() - started) / 1000)}s${cost !== null ? `, $${cost.toFixed(3)}` : ""})\n`
      );
      if (opts.verbose) process.stdout.write("    ---\n" + text.split("\n").map((l) => "    " + l).join("\n") + "\n    ---\n");
    }
    const caught = runs.filter((r) => r.caught).length;
    const rate = caught / runs.length;
    results.push({ fixture: f.name, seeded: f.seeded, caught, of: runs.length, rate, runs });
    process.stdout.write(`  => ${f.name}: ${caught}/${runs.length} caught (rate ${rate.toFixed(2)})\n\n`);
  }

  process.stdout.write("catch rate by fixture (do NOT average these — they fail differently):\n");
  for (const r of results) process.stdout.write(`  ${r.rate.toFixed(2)}  ${r.fixture}  (${r.caught}/${r.of})\n`);
  const zero = results.filter((r) => r.caught === 0);
  if (zero.length) {
    process.stdout.write(
      `\nUNDEFENDED: ${zero.map((r) => r.fixture).join(", ")} — never caught in ${opts.runs} run(s). ` +
        `Record it (detector \`nothing\`); a sterner prompt is not the fix, ` +
        `moving the shape into a script is.\n`
    );
  }
  process.stdout.write(
    "\nThis is a keyword-matched floor, not a precise rate. Read a sample with --verbose before quoting it, " +
      "and record whatever you measure (see evals/README.md) so the enforcement map stops saying \"unknown\".\n"
  );

  if (opts.json) {
    fs.mkdirSync(path.dirname(opts.json), { recursive: true });
    fs.writeFileSync(opts.json, JSON.stringify({ runs_per_fixture: opts.runs, results }, null, 2) + "\n");
    process.stdout.write(`\nwrote ${opts.json}\n`);
  }
  return 0;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { main };
