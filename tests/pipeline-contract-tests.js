#!/usr/bin/env node
/**
 * Contract fixtures for the mechanisms absorbed from the hermes solo-dev review
 * (Codex rounds 8–9). Every absorbed item that has a deterministic component
 * ships one failing-then-passing fixture here — the round-6 lesson was that
 * "the language is present" is not the same as "the mechanism works".
 *
 * Prose-only rules (MSP completeness, claim disposition, usability accounting)
 * are enforced by gate predicates and reviewed by the gatekeeper; what is
 * testable here is the code they lean on: the ledger validator, the shared
 * manifest helper, the rung enum, the privacy index, and the pack-label
 * derivation.
 *
 * Run: node tests/pipeline-contract-tests.js
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
let pass = 0;
let fail = 0;

function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  PASS ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function runNode(script, args, opts = {}) {
  // state-write.js reads its payload on stdin, so stdin must be a pipe whenever
  // `input` is supplied — stdio:["ignore",...] silently discarded it and every
  // privacy fixture "failed" for the wrong reason.
  const stdio = opts.input === undefined ? ["ignore", "pipe", "pipe"] : ["pipe", "pipe", "pipe"];
  try {
    const stdout = execFileSync(process.execPath, [path.join(ROOT, script), ...args], {
      encoding: "utf8",
      stdio,
      ...opts,
    });
    return { code: 0, stdout, stderr: "" };
  } catch (e) {
    return { code: e.status === undefined ? 1 : e.status, stdout: e.stdout || "", stderr: e.stderr || "" };
  }
}

// ---------------------------------------------------------------------------
console.log("== evidence-ledger validator: independence, supersession, grades ==");
{
  const dir = tmpdir("ledger-");
  const header =
    "| id | date | source | root_source_id | type | url_or_ref | retrieved | via | verbatim_or_observation | assumption | grade | bearing | scope_limits | relationship | supersedes |\n" +
    "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n";
  const row = (id, root, grade = "B", bearing = "supports", rel = "—", sup = "—") =>
    `| ${id} | 2026-07-01 | src | ${root} | community | https://x/${id} | 2026-07-01 | run-1 | "q" | A1 | ${grade} | ${bearing} | 1 user | ${rel} | ${sup} |\n`;

  // FAILING: four rows, two of which are the same root source (a repost).
  const bad = path.join(dir, "bad.md");
  fs.writeFileSync(bad, header + row("E1", "RS-a") + row("E2", "RS-a") + row("E3", "RS-b") + row("E4", "—", "D"));
  const r1 = runNode("scripts/validate-evidence-ledger.js", [bad, "--json"]);
  const out1 = JSON.parse(r1.stdout);
  check("grade D in ledger is an error", out1.findings.some((f) => f.code === "grade-d-in-ledger"));
  check("missing root_source_id is an error", out1.findings.some((f) => f.code === "missing-root-source"));
  check("exit code 1 on errors", r1.code === 1, `got ${r1.code}`);
  check(
    "shared root source collapses the independent count",
    out1.summary && out1.summary.max_independent_count === 2,
    `max_independent_count=${out1.summary && out1.summary.max_independent_count} (4 rows, 2 distinct roots)`
  );
  check(
    "reposted row is flagged, not silently counted",
    out1.findings.some((f) => f.code === "shared-root-source" && /E1, E2/.test(f.message))
  );

  // PASSING: distinct roots, superseded row excluded from the live count.
  const good = path.join(dir, "good.md");
  fs.writeFileSync(
    good,
    header + row("E1", "RS-a") + row("E2", "RS-b") + row("E3", "RS-c", "B", "contradicts", "contradicts:E1", "E2")
  );
  const r2 = runNode("scripts/validate-evidence-ledger.js", [good, "--json"]);
  const out2 = JSON.parse(r2.stdout);
  check("clean ledger exits 0", r2.code === 0, r2.stdout + r2.stderr);
  check("superseded row is not counted as live", out2.summary.live_rows === 2, `live_rows=${out2.summary.live_rows}`);
  check("contradiction is retained, not dropped", out2.summary.rows === 3);

  // Legacy vocabulary must be named, not silently accepted.
  const legacy = path.join(dir, "legacy.md");
  fs.writeFileSync(legacy, header + row("E1", "RS-a", "B", "confirms"));
  const r3 = runNode("scripts/validate-evidence-ledger.js", [legacy, "--json"]);
  check("legacy `confirms` bearing is rejected with the new name", JSON.parse(r3.stdout).findings.some((f) => f.code === "legacy-bearing"));

  // A ledger still using the old `status` column must be told to rename it.
  const oldcol = path.join(dir, "oldcol.md");
  fs.writeFileSync(
    oldcol,
    "| id | date | source | type | url_or_ref | grade | status |\n|---|---|---|---|---|---|---|\n" +
      "| E1 | 2026-07-01 | src | community | https://x | B | confirms |\n"
  );
  const r4 = runNode("scripts/validate-evidence-ledger.js", [oldcol, "--json"]);
  check(
    "pre-1.2 ledger shape is rejected with the rename instruction",
    JSON.parse(r4.stdout).findings.some((f) => f.code === "legacy-status-column")
  );
}

// ---------------------------------------------------------------------------
console.log("== artifact manifest: one helper, two purposes, no drift ==");
{
  const dir = tmpdir("manifest-");
  fs.mkdirSync(path.join(dir, "sub"));
  fs.writeFileSync(path.join(dir, "a.md"), "alpha\n");
  fs.writeFileSync(path.join(dir, "sub", "b.md"), "beta\n");
  const helper = require(path.join(ROOT, "scripts", "artifact-manifest.js"));

  const gate = helper.create(dir, ["a.md", "sub"], { purpose: "gate-input", id: "V1-20260730-01" });
  const recon = helper.create(dir, ["sub", "a.md"], { purpose: "reconciliation", id: "r-20260730-01" });
  check(
    "both callers hash the same file set identically (order-independent)",
    JSON.stringify(gate.entries) === JSON.stringify(recon.entries),
    "gate-input and reconciliation manifests disagree on entries"
  );
  check("algorithm is recorded", gate.algorithm === "sha256");
  check("paths are sorted", gate.entries.map((e) => e.path).join(",") === "a.md,sub/b.md");
  check("manifest carries its own hash", typeof gate.manifest_sha256 === "string" && gate.manifest_sha256.length === 64);
  check(
    "differing purpose does not change the entry hashes",
    gate.entries[0].sha256 === recon.entries[0].sha256
  );

  check("unchanged files verify", helper.verify(dir, gate).length === 0);
  fs.writeFileSync(path.join(dir, "sub", "b.md"), "beta changed\n");
  const problems = helper.verify(dir, gate);
  check("post-snapshot mutation is detected", problems.some((p) => p.code === "content-changed" && /sub\/b\.md/.test(p.detail)));

  const tampered = JSON.parse(JSON.stringify(gate));
  tampered.entries[0].sha256 = "0".repeat(64);
  check(
    "editing the manifest body breaks its self-hash",
    helper.verify(dir, tampered).some((p) => p.code === "manifest-self-hash-mismatch")
  );

  let threw = false;
  try {
    helper.create(dir, ["../escape.md"], { purpose: "gate-input" });
  } catch (e) {
    threw = /traverse/.test(e.message);
  }
  check("path traversal is rejected", threw);

  threw = false;
  try {
    helper.create(dir, ["a.md"], { purpose: "whatever" });
  } catch (e) {
    threw = /unknown purpose/.test(e.message);
  }
  check("unknown purpose is rejected", threw);

  const missing = helper.verify(dir, { entries: [{ path: "gone.md", sha256: "x" }] });
  check("a deleted artifact is reported", missing.some((p) => p.code === "missing-file"));

  // A file ADDED to an expanded directory leaves every hashed entry intact, so
  // without re-walking the directory the manifest would verify a set that grew.
  // This is the case that matters for mvp-pack/ at LOCK.
  const dir2 = tmpdir("manifest-add-");
  fs.mkdirSync(path.join(dir2, "pack"));
  fs.writeFileSync(path.join(dir2, "pack", "mvp-spec.md"), "spec\n");
  const packManifest = helper.create(dir2, ["pack"], { purpose: "gate-input", id: "LOCK-01" });
  check("expanded directories are recorded", Array.isArray(packManifest.expanded_dirs) && packManifest.expanded_dirs.includes("pack"));
  check("a freshly created pack verifies", helper.verify(dir2, packManifest).length === 0);
  fs.writeFileSync(path.join(dir2, "pack", "sneaked-in.md"), "extra\n");
  check(
    "a file added to the reviewed directory is caught",
    helper.verify(dir2, packManifest).some((p) => p.code === "file-added" && /sneaked-in/.test(p.detail))
  );

  // A symlink cannot be hashed honestly (it may point outside the idea dir).
  let symlinkRejected = null;
  try {
    fs.symlinkSync(path.join(dir2, "pack", "mvp-spec.md"), path.join(dir2, "link.md"));
    try {
      helper.create(dir2, ["link.md"], { purpose: "gate-input" });
      symlinkRejected = false;
    } catch (e) {
      symlinkRejected = /symlink/.test(e.message);
    }
  } catch {
    symlinkRejected = null; // no symlink privilege on this host: skip, don't fake a pass
  }
  if (symlinkRejected === null) console.log("  SKIP symlink rejection (no symlink privilege on this host)");
  else check("a symlinked target is rejected", symlinkRejected);
}

// ---------------------------------------------------------------------------
console.log("== rung enum: three values, legacy migrated not accepted ==");
{
  const dir = tmpdir("rung-");
  const ideaDir = path.join(dir, "ideas", "demo");
  fs.mkdirSync(ideaDir, { recursive: true });
  fs.writeFileSync(path.join(ideaDir, "state.json"), JSON.stringify({ pipeline_version: "1.2.0" }));

  const fm = (rung, version = "1.2.0") =>
    `---\nartifact: problem-hypothesis\nidea: demo\nstage: 0\ngate: F\nstatus: draft\n` +
    `evidence_grade: none\nrung: ${rung}\npipeline_version: ${version}\nupdated: 2026-07-30\n---\n# x\n`;

  const runHook = (file) => {
    const evt = JSON.stringify({ tool_input: { file_path: file }, cwd: dir });
    try {
      const stdout = execFileSync(process.execPath, [path.join(ROOT, "hooks", "scripts", "validate-artifact.js")], {
        input: evt,
        encoding: "utf8",
      });
      return stdout;
    } catch (e) {
      return (e.stdout || "") + (e.stderr || "");
    }
  };

  const p = path.join(ideaDir, "problem-hypothesis.md");
  fs.writeFileSync(p, fm("handoff"));
  check("`handoff` is accepted", !/invalid rung|retired rung/.test(runHook(p)));

  fs.writeFileSync(p, fm("simulate"));
  const simOut = runHook(p);
  check("`simulate` on a 1.2.0 artifact is rejected", /invalid rung/.test(simOut), simOut.slice(0, 200));

  fs.writeFileSync(p, fm("handoff-only", "1.1.0"));
  const legacyOut = runHook(p);
  check(
    "`handoff-only` on a pre-1.2 artifact gets a migration instruction, not a bare rejection",
    /retired rung/.test(legacyOut) && /migrate it now/.test(legacyOut) && !/invalid rung/.test(legacyOut),
    legacyOut.slice(0, 200)
  );
}

// ---------------------------------------------------------------------------
console.log("== privacy retention index: checkable, and non-sensitive by construction ==");
{
  // state-write enforces idea == containing directory name, so the fixture's
  // state.json must live in a directory called "demo".
  const dir = path.join(tmpdir("privacy-"), "demo");
  fs.mkdirSync(dir, { recursive: true });
  const statePath = path.join(dir, "state.json");
  const base = {
    schema_version: "1.2.0",
    pipeline_version: "1.2.0",
    idea: "demo",
    gates: {},
    thresholds: { signed_date: null, revisions: [] },
    kill_criteria: [],
    active: [],
    waiting_on: [],
    artifacts: {},
    cycles: [{ id: "C1", status: "validation", parent: null, state: null }],
    active_cycle: "C1",
    maintenance: {
      drift_declared_at: null,
      active_reconcile: null,
      last_reconcile: null,
      current_baseline: null,
      blocking_claims: [],
      reality_sources: [],
    },
    health_criteria: [],
    validation_runs: [],
  };

  const write = (privacy) => {
    const obj = { ...base, privacy };
    fs.writeFileSync(statePath, JSON.stringify(obj));
    return runNode("scripts/state-write.js", [statePath], { input: JSON.stringify(obj) });
  };

  const ok = write({ retention_duties: [{ participant_id: "P1", manifest_ref: "private/participant-data-manifest.md", delete_by: "2026-12-31", status: "active", last_checked_at: null }] });
  check("a well-formed duty is accepted", ok.code === 0, ok.stderr.slice(0, 200));

  const noDate = write({ retention_duties: [{ participant_id: "P1", status: "active" }] });
  check("a duty with no delete_by is rejected (a date nobody can check is not a safeguard)", noDate.code === 1);

  const realName = write({ retention_duties: [{ participant_id: "P1", delete_by: "2026-12-31", status: "active", name: "Jane Doe" }] });
  check("identifying data in state is rejected", realName.code === 1 && /private\/participant-data-manifest/.test(realName.stderr));

  const rawId = write({ retention_duties: [{ participant_id: "jane@example.com", delete_by: "2026-12-31", status: "active" }] });
  check("a non-pseudonymous participant id is rejected", rawId.code === 1 && /pseudonymous/.test(rawId.stderr));

  const badStatus = write({ retention_duties: [{ participant_id: "P1", delete_by: "2026-12-31", status: "deleted" }] });
  check("an out-of-enum duty status is rejected", badStatus.code === 1);
}

// ---------------------------------------------------------------------------
console.log("== session-start surfaces an overdue retention duty ==");
{
  const dir = tmpdir("sessionstart-");
  const ideaDir = path.join(dir, "ideas", "demo");
  fs.mkdirSync(ideaDir, { recursive: true });
  fs.writeFileSync(
    path.join(ideaDir, "state.json"),
    JSON.stringify({
      pipeline_version: "1.2.0",
      idea: "demo",
      active: ["2.V1"],
      mode: "analysis",
      gates: { V1: { status: "in_progress" } },
      kill_criteria: [],
      privacy: {
        retention_duties: [
          { participant_id: "P3", manifest_ref: "private/participant-data-manifest.md", delete_by: "2020-01-01", status: "active" },
          { participant_id: "P4", delete_by: "2020-01-01", status: "disposed" },
        ],
      },
    })
  );
  let out = "";
  try {
    out = execFileSync(process.execPath, [path.join(ROOT, "hooks", "scripts", "session-start.js")], {
      input: JSON.stringify({ cwd: dir }),
      encoding: "utf8",
    });
  } catch (e) {
    out = (e.stdout || "") + (e.stderr || "");
  }
  check("overdue duty is surfaced", /PARTICIPANT-DATA RETENTION DUE/.test(out), out.slice(0, 300));
  check("the participant id and manifest are named", /P3/.test(out) && /participant-data-manifest/.test(out));
  check("a disposed duty is not surfaced", !/P4/.test(out));
  check("the surfaced line does not authorize deletion", /never delete unprompted/.test(out));
}

// ---------------------------------------------------------------------------
console.log("== pack label is derived from gate state, not prose ==");
{
  // The predicate lives in gate-contracts.md; this fixture pins the derivation
  // so a hand-authored label can be caught by comparing against it.
  const label = (gates, v3grade) => {
    const all = ["V1", "V2", "V3", "R1", "R2", "P", "LOCK"];
    const passed = (g) => gates[g] === "passed";
    const resolved = (g) => gates[g] === "passed" || gates[g] === "open";
    if (!resolved("LOCK") && !passed("LOCK")) return "NO PACK";
    if (all.every(passed) && v3grade === "A") return "VALIDATED";
    if (passed("R1") && ["V2", "V3", "R2"].some((g) => gates[g] === "open")) return "HYPOTHESIS";
    if (gates.R1 === "open") return "PRE-FEASIBILITY HYPOTHESIS";
    return "NO PACK";
  };
  const allPassed = { V1: "passed", V2: "passed", V3: "passed", R1: "passed", R2: "passed", P: "passed", LOCK: "passed" };
  check("all passed + V3 grade A => VALIDATED", label(allPassed, "A") === "VALIDATED");
  check("all passed but V3 grade B => not VALIDATED", label(allPassed, "B") !== "VALIDATED");
  check("V3 open, R1 passed => HYPOTHESIS", label({ ...allPassed, V3: "open" }, "B") === "HYPOTHESIS");
  check(
    "R1 open => PRE-FEASIBILITY, even if everything else passed",
    label({ ...allPassed, R1: "open" }, "A") === "PRE-FEASIBILITY HYPOTHESIS"
  );
  check("LOCK not reached => no pack", label({ ...allPassed, LOCK: "pending" }, "A") === "NO PACK");
}

// ---------------------------------------------------------------------------
console.log("== LOCK ordering is stated unambiguously in the contract files ==");
{
  const gc = fs.readFileSync(path.join(ROOT, "skills", "method-rules", "gate-contracts.md"), "utf8");
  const gk = fs.readFileSync(path.join(ROOT, "skills", "gate-check", "SKILL.md"), "utf8");
  const s5 = fs.readFileSync(path.join(ROOT, "skills", "stage-5-scope-lock", "SKILL.md"), "utf8");
  check("gate-check documents a ceremony-only invocation that returns to the caller", /ceremony-only/.test(gk) && /returns? to (the caller|stage 5)/i.test(gk));
  check("a full LOCK check verifies the charter instead of starting a ceremony", /FAIL[\s\S]{0,200}charter ceremony/i.test(gk) || /only \*verifies\*/.test(gc));
  check("stage 5 owns the LOCK sequence order", /charter ceremony → materialize pack → cold-start test → full gate check/.test(s5));
  check("gate-check no longer claims to copy the pack itself", !/proceed to Layer 1, which verifies the charter is locked, then copy it into/.test(gk));
  check("MSP is required by the LOCK predicate", /minimum service promise complete/i.test(gc));
  check("cross-gate manifest + ledger + preflight checks are in the contract", /artifact_manifest_sha256/.test(gc) && /max_independent_count/.test(gc) && /publication_disposition/.test(gc));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
