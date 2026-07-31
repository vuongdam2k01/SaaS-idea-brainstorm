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
  // Fall back to a repo-local scratch dir when the system temp is not writable:
  // a reviewer in a restricted sandbox could not execute this suite at all, which
  // is worse than leaving a .tmp-tests/ directory behind.
  try {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  } catch {
    const local = path.join(ROOT, ".tmp-tests");
    fs.mkdirSync(local, { recursive: true });
    return fs.mkdtempSync(path.join(local, prefix));
  }
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

  // Edge cases found by probing the validator after it was written (round 10):
  // every one of these silently over-counted independence or zeroed a count.
  const probe = (name, body) => {
    const p = path.join(dir, name + ".md");
    fs.writeFileSync(p, body);
    return JSON.parse(runNode("scripts/validate-evidence-ledger.js", [p, "--json"]).stdout);
  };

  const caseOnly = probe("case", header + row("E1", "RS-a") + row("E2", "rs-A") + row("E3", "RS-b"));
  check(
    "root ids differing only in case are ONE source",
    caseOnly.summary.max_independent_count === 2,
    `max_independent_count=${caseOnly.summary.max_independent_count} (RS-a and rs-A must collapse)`
  );

  const blankish = probe("blankish", header + row("E1", "n/a") + row("E2", "   ") + row("E3", "RS-b"));
  check(
    'placeholder root ids ("n/a", whitespace) are treated as missing, not as sources',
    blankish.findings.filter((f) => f.code === "missing-root-source").length === 2
  );

  const cycle = probe("cycle", header + row("E1", "RS-a", "B", "supports", "—", "E2") + row("E2", "RS-b", "B", "supports", "—", "E1"));
  check("a supersession loop is an error, not a silently empty ledger", cycle.findings.some((f) => f.code === "supersession-cycle"));

  const multiTarget = probe(
    "multitarget",
    header + row("E1", "RS-a", "B", "supports", "—", "E2 E3") + row("E2", "RS-b", "B", "supports", "—", "E1") + row("E3", "RS-c")
  );
  check(
    "a row superseding two rows is rejected (the extra edge used to hide a loop)",
    multiTarget.findings.some((f) => f.code === "multiple-supersede-targets"),
    JSON.stringify(multiTarget.findings.map((f) => f.code))
  );

  const retracted = probe("retracted", header + row("E1", "RS-a") + row("E2", "RS-b", "B", "supports", "—", "E1") + row("E3", "RS-c"));
  check(
    "a superseded row's source no longer raises the ceiling",
    retracted.summary.max_independent_count === 2,
    `max_independent_count=${retracted.summary.max_independent_count} (E1 was superseded, so RS-a must not count)`
  );

  const twoTables = probe(
    "twotables",
    header + row("E1", "RS-a") + "\n## Pain clusters\n| cluster | count / N | representative E-ids | notes |\n|---|---|---|---|\n| billing | 3/10 | E1 | x |\n"
  );
  check(
    "the cluster table later in the same file is not parsed as evidence rows",
    twoTables.errors === 0 && twoTables.summary.rows === 1,
    `errors=${twoTables.errors} rows=${twoTables.summary.rows}`
  );

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
console.log("== marketplace install: no skill depends on reading a file off disk ==");
{
  // Dogfood run #3, first command ever issued against a real marketplace install:
  //   Skill  method-rules                                      -> OK
  //   Read   ~/.claude/plugins/cache/.../state-schema.md        -> DENIED
  //   Bash   cat ".../state-schema.md"                          -> BLOCKED
  //   Glob   **/state-schema.md                                 -> No files found
  // and `/new-idea` created nothing at all. The Skill tool injects SKILL.md only;
  // its siblings were reached by relative markdown link, which resolves inside the
  // plugin cache — outside the session's allowed directories. Every earlier review
  // ran INSIDE the repo, where those same paths resolve in the cwd, so no amount of
  // reading the repo could surface it. This test is the standing substitute for an
  // install a reviewer cannot perform from here.
  const skillDirs = fs
    .readdirSync(path.join(ROOT, "skills"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  // 1) A skill package ships exactly one loadable unit: SKILL.md.
  const withSiblings = skillDirs.filter((d) =>
    fs.readdirSync(path.join(ROOT, "skills", d)).some((f) => f.endsWith(".md") && f !== "SKILL.md")
  );
  check(
    "no skill package ships a sibling .md a marketplace install cannot read",
    withSiblings.length === 0,
    withSiblings.join(", ")
  );

  // 2) The normative documents are loadable skills, not loose files.
  for (const s of [
    "method-rules-state-schema",
    "method-rules-artifact-schema",
    "method-rules-gate-contracts",
    "method-rules-maintenance-rules",
  ]) {
    check(`${s} is a loadable skill`, fs.existsSync(path.join(ROOT, "skills", s, "SKILL.md")));
  }
  for (const s of ["0-framing", "1-competitive", "2-validate", "3-verify", "4-positioning", "5-scope-lock"]) {
    check(
      `stage-${s} templates are a loadable skill`,
      fs.existsSync(path.join(ROOT, "skills", `stage-${s}-templates`, "SKILL.md"))
    );
  }

  // 3) No skill still points at a moved document by filename.
  const stale = [];
  for (const d of skillDirs) {
    const body = fs.readFileSync(path.join(ROOT, "skills", d, "SKILL.md"), "utf8");
    for (const doc of ["state-schema.md", "artifact-schema.md", "gate-contracts.md", "maintenance-rules.md", "templates.md"]) {
      if (body.includes(doc)) stale.push(`${d} -> ${doc}`);
    }
  }
  check("no skill references a moved document by filename", stale.length === 0, stale.join(", "));

  // 4) Every skill name a skill tells you to load actually exists. A dangling
  //    load instruction fails exactly like the original bug, just later.
  const known = new Set(skillDirs);
  const dangling = [];
  for (const d of skillDirs) {
    const body = fs.readFileSync(path.join(ROOT, "skills", d, "SKILL.md"), "utf8");
    for (const m of body.matchAll(/`([a-z0-9-]+)`\s+skill/g)) {
      const name = m[1];
      if (/^(method-rules|stage-[0-5])/.test(name) && !known.has(name)) dangling.push(`${d} -> ${name}`);
    }
  }
  check("every referenced skill name resolves to a shipped skill", dangling.length === 0, dangling.join(", "));
}

// ---------------------------------------------------------------------------
console.log("== run-#3 absorbed contracts ==");
{
  const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
  const gc = read("skills/method-rules-gate-contracts/SKILL.md");
  const s5 = read("skills/stage-5-scope-lock/SKILL.md");
  const s3 = read("skills/stage-3-verify/SKILL.md");
  const gk = read("skills/gate-check/SKILL.md");
  const mr = read("skills/method-rules/SKILL.md");

  check("stage 5 aborts before generating anything when the predicate says NO PACK",
    /5\.0 Entry guard/.test(s5) && /NO PACK/.test(s5) && /architecture-risk-preflight/.test(s5));
  check("stage 5 names the sequencing inversion it prevents",
    /before R1 had measured/.test(s5) || /unrun spike/.test(s5));
  check("gate F blocks a generated criterion that adds a gate predicate",
    /Contract-authorization check/.test(gk) && /funnel status ≥ contacted/.test(gk));
  check("deferred thresholds bind to an event, not only a date",
    /load_before_event/.test(gk));
  check("the gatekeeper runs in advisory mode on a Layer 1 failure",
    /advisory/.test(gk));
  check("R1 requires a validated run contract before the scored run",
    /run-contract\.json/.test(gc) && /validate-run-contract/.test(gc));
  check("the run contract names the cost unit and bills retries",
    /cost\.unit/.test(s3) && /retries included/.test(s3));
  check("gate C requires the raw agent trails",
    /research-raw-competitor-scanner/.test(gc));
  check("the F tracker must pass the prospect validator and contact is not a predicate",
    /validate-beachhead/.test(gc) && /NOT an F predicate/.test(gc));
  check("only ONE prospect validator ships (v1.3.0: two made gate F unpassable)",
    !fs.existsSync(path.join(ROOT, "scripts", "validate-prospect-tracker.js")));
  check("V2 requires a reproducible ChatGPT-gap record",
    /reproducible/.test(gc) && /failure criterion written BEFORE judging/.test(gc));
  check("method-rules carries a language rule",
    /## 12\. Language/.test(mr) && /diacritics intact/.test(mr));
  check("pseudonymity covers identifying evidence strings, not just names",
    /Pseudonymity is nominal/.test(mr));

  for (const s of ["scripts/validate-run-contract.js", "scripts/validate-beachhead.js"]) {
    check(`${s} ships and parses`, fs.existsSync(path.join(ROOT, s)));
  }
}

// ---------------------------------------------------------------------------
// The run #3 tracker checks now live inside validate-beachhead.js (v1.3.0:
// two validators over one table made gate F unpassable — this suite and
// hook-tests each tested only "their" validator, which is how it slipped by).
console.log("== prospect validator (merged run #3 checks) ==");
{
  const dir = tmpdir("prospect-");
  const hdr =
    "| Pid | Segment | Tier | Behaviour that establishes the tier | Evidence (E-id) | Resolved entity | Observed at | Reach channel | Funnel status |\n" +
    "|---|---|---|---|---|---|---|---|---|\n";
  const row = (pid, tier, behav, eid, ref, seen = "2026-07-30", reach = "work email, replies expected") =>
    `| ${pid} | seg | ${tier} | ${behav} | ${eid} | ${ref} | ${seen} | ${reach} | contacted |\n`;

  let n = 0;
  const run = (body, min, eids) => {
    const d = path.join(dir, "w" + ++n);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, "beachhead-icp.md"), body);
    fs.writeFileSync(path.join(d, "evidence-ledger.md"),
      "| id | date | grade |\n|---|---|---|\n" + (eids || []).map((e) => `| ${e} | 2026-07-30 | B |`).join("\n") + "\n");
    const r = runNode("scripts/validate-beachhead.js", [d, "--json", "--min", String(min)]);
    return JSON.parse(r.stdout);
  };
  const codes = (o) => o.errors.concat(o.warnings).map((f) => f.code);

  let o = run(hdr + row("P1", "4", "we built a bespoke per-order sheet", "E1", "acme.example"), 15, ["E1"]);
  check("below the floor is an error, not a note", codes(o).includes("below-floor"));

  o = run(hdr + row("P1", "tier 1–2 (ước tính)", "guessy", "E1", "a.example") + row("P2", "4", "we built our own tracker", "E2", "b.example"), 1, ["E1", "E2"]);
  check("an estimated/uncertain tier is quarantined, not rounded up", o.qualifying === 1);

  o = run(hdr + row("P1", "4", "is a competitor with its own product", "E1", "a.example"), 1, ["E1"]);
  check("'is a competitor' is rejected as tier-4 evidence", codes(o).includes("competitor-as-tier-evidence"));

  o = run(hdr + row("P1", "4", "listed in a toplist roundup", "E1", "a.example"), 1, ["E1"]);
  check("a listicle-only basis is rejected", codes(o).includes("listicle-only"));

  o = run(hdr + row("P1", "4", "we built our own tracker", "E1", "acme.example") + row("P2", "5", "we built our own tracker", "E2", "ACME.example"), 1, ["E1", "E2"]);
  check("two rows resolving to one entity are caught", codes(o).includes("duplicate-entity"));

  const okBody = hdr + Array.from({ length: 15 }, (_, i) => row("P" + (i + 1), "4", "we built our own tracking sheet", "E" + (i + 1), "e" + i + ".example")).join("");
  o = run(okBody, 15, Array.from({ length: 15 }, (_, i) => "E" + (i + 1)));
  check("a clean 15-row tracker passes", o.ok === true && o.qualifying === 15, JSON.stringify(codes(o)));
  check("15–19 still raises the reach-risk warning", codes(o).includes("reach-risk"));
}

// ---------------------------------------------------------------------------
console.log("== the shipped producers agree with the validator ==");
{
  // Codex's round-10 blocker: the stage-2 TEMPLATE emitted the old columns, so a
  // normal run produced a ledger its own validator rejected. Generating the fixture
  // FROM each producer is the only way that stays caught.
  const producers = [
    "skills/stage-2-validate-templates/SKILL.md",
    "templates/2-validate.md",
    "README.md",
    "skills/method-rules-artifact-schema/SKILL.md",
  ];
  const dir = tmpdir("producers-");
  const sample = {
    id: "E1",
    date: "2026-07-01",
    source: "P1",
    root_source_id: "RS-thread-1",
    type: "community",
    url_or_ref: "https://example.test/1",
    retrieved: "2026-07-01",
    via: "miner-run-1",
    verbatim_or_observation: '"exact quote"',
    assumption: "A1",
    grade: "B",
    bearing: "supports",
    scope_limits: "1 user, US, 2025",
    relationship: "—",
    supersedes: "—",
  };
  for (const rel of producers) {
    const text = fs.readFileSync(path.join(ROOT, rel), "utf8");
    const header = text
      .split(/\r?\n/)
      .find((l) => /^\|\s*id\s*\|/.test(l.trim()) && /root_source_id/.test(l) && /grade/.test(l));
    if (!header) {
      check(`${rel} publishes a v1.2 ledger header`, false, "no header row containing id + root_source_id + grade");
      continue;
    }
    const keys = header
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    // BOTH directions. Checking only "are the producer's columns known?" let a
    // producer that DROPPED columns pass — which is how the root template shipped
    // without its four provenance columns. A fixture that can only catch renames
    // is not a fixture against divergence.
    const unknown = keys.filter((k) => !(k in sample));
    const missing = Object.keys(sample).filter((k) => !keys.includes(k));
    if (unknown.length || missing.length) {
      check(
        `${rel} emits exactly the documented ledger columns`,
        false,
        [unknown.length ? `unknown/renamed: ${unknown.join(", ")}` : null, missing.length ? `MISSING: ${missing.join(", ")}` : null]
          .filter(Boolean)
          .join(" · ")
      );
      continue;
    }
    const gen =
      `${header.trim()}\n|${keys.map(() => "---").join("|")}|\n` +
      `| ${keys.map((k) => sample[k]).join(" | ")} |\n`;
    const genPath = path.join(dir, rel.replace(/[\\/]/g, "_") + ".ledger.md");
    fs.writeFileSync(genPath, gen);
    const out = JSON.parse(runNode("scripts/validate-evidence-ledger.js", [genPath, "--json"]).stdout);
    check(
      `a ledger generated from ${rel} validates clean`,
      out.errors === 0,
      out.findings.filter((f) => f.level === "error").map((f) => `${f.code} ${f.message}`).join("; ")
    );
  }
}

// ---------------------------------------------------------------------------
console.log("== one version, declared once ==");
{
  // plugin.json is the ONLY place the current version is declared. Docs stopped
  // self-declaring; the remaining literals are the pipeline_version values that
  // skill templates stamp into new artifacts — those MUST track the manifest, or
  // every new artifact is born already drifted.
  const claude = JSON.parse(fs.readFileSync(path.join(ROOT, ".claude-plugin", "plugin.json"), "utf8"));
  const codex = JSON.parse(fs.readFileSync(path.join(ROOT, ".codex-plugin", "plugin.json"), "utf8"));
  check("claude and codex manifests carry the same version", claude.version === codex.version, `${claude.version} vs ${codex.version}`);
  const skillFiles = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "SKILL.md") skillFiles.push(p);
    }
  })(path.join(ROOT, "skills"));
  const bad = [];
  for (const f of skillFiles) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(/["']?pipeline_version["']?:\s*["']?(\d+\.\d+\.\d+)["']?/g)) {
      if (m[1] !== claude.version) bad.push(`${path.relative(ROOT, f)}: ${m[1]}`);
    }
  }
  check(`every pipeline_version literal in skills/ equals plugin.json (${claude.version})`, bad.length === 0, bad.join("; "));
}

// ---------------------------------------------------------------------------
console.log("== threshold vocabulary: hook and verifier stay identical ==");
{
  // v1.3.0: THRESHOLD_FIELDS is declared in BOTH guard-thresholds.js (hook)
  // and verify-threshold-snapshot.js (script), and the sealed-field set carries a
  // different NAME in each (NON_REVISABLE vs SEALED). Two hand-kept copies of one
  // vocabulary is the exact mechanism that caused the template blocker twice —
  // this fixture makes any drift a test failure. (Extracted textually: the hook
  // reads stdin at require time, so it cannot be require()d.)
  const grab = (file, re) => {
    const m = fs.readFileSync(path.join(ROOT, file), "utf8").match(re);
    if (!m) return null;
    return m[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean).sort();
  };
  const hookFields = grab("hooks/scripts/guard-thresholds.js", /const THRESHOLD_FIELDS = \[([^\]]*)\]/);
  const scriptFields = grab("scripts/verify-threshold-snapshot.js", /const THRESHOLD_FIELDS = \[([^\]]*)\]/);
  check("both declare THRESHOLD_FIELDS", !!hookFields && !!scriptFields);
  check("THRESHOLD_FIELDS identical in hook and verifier",
    JSON.stringify(hookFields) === JSON.stringify(scriptFields),
    `hook=[${hookFields}] script=[${scriptFields}]`);
  const hookSealed = grab("hooks/scripts/guard-thresholds.js", /NON_REVISABLE = new Set\(\[([^\]]*)\]\)/);
  const scriptSealed = grab("scripts/verify-threshold-snapshot.js", /SEALED = new Set\(\[([^\]]*)\]\)/);
  check("sealed-field sets identical in hook (NON_REVISABLE) and verifier (SEALED)",
    !!hookSealed && !!scriptSealed && JSON.stringify(hookSealed) === JSON.stringify(scriptSealed),
    `hook=[${hookSealed}] script=[${scriptSealed}]`);
}

// ---------------------------------------------------------------------------
console.log("== decision-log type enum covers every ordered row type ==");
{
  // v1.3.0 fix: gate-check ordered a `signing-blocked` row while the closed
  // `type` enum did not list it — and decision-log has no validator, so the
  // mismatch drifted silently. The enum line must cover every type any skill
  // instructs the model to append.
  const schema = fs.readFileSync(path.join(ROOT, "skills", "method-rules-artifact-schema", "SKILL.md"), "utf8");
  const enumLine = schema.split(/\r?\n/).find((l) => /^`type`:\s*`gate-verdict`/.test(l.trim()));
  check("artifact-schema has the decision-log type enum line", !!enumLine);
  for (const t of ["signing-blocked", "criterion-disposition", "run-signed", "run-verdict", "reconciliation"]) {
    check(`type enum lists \`${t}\``, !!enumLine && enumLine.includes("`" + t + "`"));
  }
}

// ---------------------------------------------------------------------------
console.log("== the prospect-table producers agree with validate-beachhead ==");
{
  // Same mechanism as the ledger block above, applied to the table that caused
  // v1.3.0: the stage-0 template emitted one shape while a second validator
  // required another, so every by-the-book run failed gate F. Every producer of
  // the prospect table must generate a table the ONE validator accepts.
  const producers = [
    "skills/stage-0-framing-templates/SKILL.md",
    "templates/0-framing.md",
  ];
  const CANON = {
    pid: "P1",
    segment: "ops lead, 60-eng co",
    tier: "4",
    behaviour: "we built a nightly script that diffs runbooks against terraform",
    evidence: "E1",
    resolved: "acme.example",
    observed: "2026-07-30",
    reach: "work email, replies expected",
    funnel: "not-contacted",
  };
  const keyOf = (h) => {
    const n = h.toLowerCase();
    if (/^p?id\b|^pid/.test(n)) return "pid";
    if (/segment/.test(n)) return "segment";
    if (/behaviour|behavior/.test(n)) return "behaviour"; // before tier: "Behaviour that establishes the tier"
    if (/tier/.test(n)) return "tier";
    if (/evidence|e-?id/.test(n)) return "evidence";
    if (/resolved/.test(n)) return "resolved";
    if (/observed/.test(n)) return "observed";
    if (/reach/.test(n)) return "reach";
    if (/funnel|status/.test(n)) return "funnel";
    return null;
  };
  const dir = tmpdir("icp-producers-");
  let n = 0;
  for (const rel of producers) {
    const text = fs.readFileSync(path.join(ROOT, rel), "utf8");
    const header = text
      .split(/\r?\n/)
      .find((l) => /^\s*\|\s*Pid\s*\|/i.test(l) && /tier/i.test(l) && /behaviour|behavior/i.test(l));
    if (!header) {
      check(`${rel} publishes the canonical prospect-table header`, false, "no header row with Pid + Tier + Behaviour");
      continue;
    }
    const cols = header.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    const keys = cols.map(keyOf);
    const unknown = cols.filter((_, i) => keys[i] === null);
    const missing = Object.keys(CANON).filter((k) => !keys.includes(k));
    if (unknown.length || missing.length) {
      check(`${rel} emits exactly the documented prospect columns`, false,
        [unknown.length ? `unknown/renamed: ${unknown.join(", ")}` : null, missing.length ? `MISSING: ${missing.join(", ")}` : null]
          .filter(Boolean).join(" · "));
      continue;
    }
    const w = path.join(dir, "w" + ++n);
    fs.mkdirSync(w, { recursive: true });
    fs.writeFileSync(path.join(w, "beachhead-icp.md"),
      `${header.trim()}\n|${keys.map(() => "---").join("|")}|\n| ${keys.map((k) => CANON[k]).join(" | ")} |\n`);
    fs.writeFileSync(path.join(w, "evidence-ledger.md"),
      "| id | date | grade |\n|---|---|---|\n| E1 | 2026-07-30 | B |\n");
    const out = JSON.parse(runNode("scripts/validate-beachhead.js", [w, "--json", "--min", "1"]).stdout);
    check(`a prospect table generated from ${rel} validates clean`,
      out.ok === true && out.qualifying === 1,
      JSON.stringify(out.errors));
  }
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

  // Shape is checked before the filesystem now, so give the entry a well-formed
  // hash — otherwise this fixture would assert on malformed-entry-hash instead.
  const missing = helper.verify(dir, {
    manifest_version: "1.0",
    purpose: "gate-input",
    algorithm: "sha256",
    expanded_dirs: [],
    entries: [{ path: "gone.md", sha256: "a".repeat(64) }],
    manifest_sha256: "b".repeat(64),
  });
  check("a deleted artifact is reported", missing.some((p) => p.code === "missing-file"));

  // `--out private/...` is what gate-check prescribes, and private/ does not exist
  // in a fresh idea: an ENOENT there would block a gate for a reason unrelated to
  // the artifacts under review. Found by dry-running the LOCK sequence.
  {
    const fresh = tmpdir("manifest-out-");
    fs.writeFileSync(path.join(fresh, "a.md"), "x\n");
    // argv order is: create <idea-dir> [flags] <paths...>
    const r = runNode("scripts/artifact-manifest.js", ["create", fresh, "--purpose", "gate-input", "--out", "private/m.json", "a.md"]);
    const wrote = fs.existsSync(path.join(fresh, "private", "m.json"));
    check("--out creates its parent directory", wrote, `exit=${r.code} ${r.stderr.slice(0, 120)}`);
  }

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

  // Stripping expanded_dirs (a hand-edit, or a legacy manifest) would disable the
  // added-file check silently. Absent coverage must be reported, not assumed fine.
  const strippedManifest = JSON.parse(JSON.stringify(packManifest));
  delete strippedManifest.expanded_dirs;
  strippedManifest.manifest_sha256 = helper.manifestHash(strippedManifest);
  check(
    "a manifest without directory coverage is reported rather than trusted",
    helper.verify(dir2, strippedManifest).some((p) => p.code === "missing-directory-coverage")
  );
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
    schema_version: "1.3.0",
    market_shape: "single-sided",
    sides: [],
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

  const duty = (extra = {}) => ({
    duty_id: "D1",
    participant_id: "P1",
    manifest_ref: "private/participant-data-manifest.md",
    delete_by: "2026-12-31",
    status: "active",
    ...extra,
  });

  const ok = write({ retention_duties: [duty()] });
  check("a well-formed duty is accepted", ok.code === 0, ok.stderr.slice(0, 200));

  check(
    "a duty with no duty_id is rejected",
    write({ retention_duties: [{ participant_id: "P1", delete_by: "2026-12-31", status: "active" }] }).code === 1
  );
  check("duplicate duty_ids are rejected", write({ retention_duties: [duty(), duty()] }).code === 1);
  check(
    "a duty with no delete_by is rejected (a date nobody can check is not a safeguard)",
    write({ retention_duties: [{ duty_id: "D1", participant_id: "P1", status: "active" }] }).code === 1
  );
  check(
    "an impossible calendar date is rejected, not just a bad shape",
    write({ retention_duties: [duty({ delete_by: "2026-02-30" })] }).code === 1
  );
  check(
    "a non-pseudonymous participant id is rejected",
    write({ retention_duties: [duty({ participant_id: "jane@example.com" })] }).code === 1
  );
  check("an out-of-enum duty status is rejected", write({ retention_duties: [duty({ status: "deleted" })] }).code === 1);
  check(
    'there is no "extended" status - an extension is an active duty with a new date',
    write({ retention_duties: [duty({ status: "extended" })] }).code === 1
  );
  check(
    "manifest_ref must point inside private/",
    write({ retention_duties: [duty({ manifest_ref: "notes/whatever.md" })] }).code === 1
  );
  check(
    "manifest_ref cannot escape private/ via ..",
    write({ retention_duties: [duty({ manifest_ref: "private/../state.json" })] }).code === 1
  );

  // An allowlist, because no blacklist covers every way to spell a name.
  for (const key of ["name", "full_name", "contact_email", "participant_name", "profile_url", "anything_else"]) {
    const r = write({ retention_duties: [duty({ [key]: "x" })] });
    check(`unlisted key "${key}" is rejected (closed key set)`, r.code === 1 && new RegExp(key).test(r.stderr));
  }
  check(
    "a nested object cannot smuggle data into an allowed key",
    write({ retention_duties: [duty({ kind: { note: "Jane" } })] }).code === 1
  );

  // Duties may change status; they may not vanish.
  const writeOver = (first, second) => {
    fs.writeFileSync(statePath, JSON.stringify({ ...base, ...first }));
    return runNode("scripts/state-write.js", [statePath], { input: JSON.stringify({ ...base, ...second }) });
  };
  const live = { privacy: { retention_duties: [duty()] } };
  check("dropping the privacy key cannot erase a live duty", writeOver(live, {}).code === 1);
  check(
    "emptying retention_duties cannot erase a live duty",
    writeOver(live, { privacy: { retention_duties: [] } }).code === 1
  );
  check(
    "a duty CAN be closed by setting status disposed",
    writeOver(live, { privacy: { retention_duties: [duty({ status: "disposed" })] } }).code === 0
  );
  check(
    "two duties for one participant are tracked separately (one cannot vanish)",
    writeOver(
      { privacy: { retention_duties: [duty(), duty({ duty_id: "D2", kind: "mock" })] } },
      { privacy: { retention_duties: [duty()] } }
    ).code === 1
  );
  // A legacy duty predating duty_id must have a legal one-time migration path.
  check(
    "a legacy duty without duty_id can be given one",
    writeOver(
      { privacy: { retention_duties: [{ participant_id: "P1", manifest_ref: "private/participant-data-manifest.md", delete_by: "2026-12-31", status: "active" }] } },
      { privacy: { retention_duties: [duty()] } }
    ).code === 0
  );

  // An unreadable previous state must fail closed, not skip the check.
  fs.writeFileSync(statePath, "{ this is not json");
  check(
    "an unparsable previous state fails closed",
    runNode("scripts/state-write.js", [statePath], { input: JSON.stringify({ ...base, ...live }) }).code === 1
  );
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
          { duty_id: "D3", participant_id: "P3", manifest_ref: "private/participant-data-manifest.md", delete_by: "2020-01-01", status: "active" },
          { duty_id: "D4", participant_id: "P4", delete_by: "2020-01-01", status: "disposed" },
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
console.log("== pack verdict: prospective mode, real state shape, contract-exact ==");
{
  const dir = path.join(tmpdir("verdict-"), "demo");
  fs.mkdirSync(dir, { recursive: true });
  const statePath = path.join(dir, "state.json");
  const stateWith = (over = {}, grade = "A") => {
    const gates = {};
    for (const g of ["F", "C", "V1", "V2", "V3", "R1", "R2", "P", "LOCK"])
      gates[g] = { status: over[g] || "passed", evidence_floor: "B", passed_date: null, notes: "" };
    gates.V3.evidence_grade_observed = grade;
    fs.writeFileSync(statePath, JSON.stringify({ schema_version: "1.3.0",
    market_shape: "single-sided",
    sides: [], pipeline_version: "1.2.0", idea: "demo", gates }));
    return statePath;
  };

  // The CLI must work against the DOCUMENTED state shape — the earlier fixture
  // called verdict() directly and so missed that the reader looked for a field
  // that did not exist in the schema.
  let r = runNode("scripts/pack-verdict.js", [stateWith(), "--json"]);
  check("CLI reads V3's grade from the documented state field", JSON.parse(r.stdout).verdict === "VALIDATED", r.stdout + r.stderr);

  r = runNode("scripts/pack-verdict.js", [stateWith({ LOCK: "pending" }), "--json"]);
  check("pre-LOCK without the flag is NO PACK", JSON.parse(r.stdout).verdict === "NO PACK");

  r = runNode("scripts/pack-verdict.js", [stateWith({ LOCK: "pending" }), "--json", "--assuming-lock-pass"]);
  const pro = JSON.parse(r.stdout);
  check("stage 5 can compute the label before the gate runs", pro.verdict === "VALIDATED" && pro.prospective === true);

  r = runNode("scripts/pack-verdict.js", [stateWith({}, "B"), "--json"]);
  const inconsistent = JSON.parse(r.stdout);
  check(
    "V3 passed on a non-A grade is an inconsistency, not a quieter label",
    inconsistent.verdict === "NO PACK" && /one of the two records is wrong/.test(inconsistent.reasons[0])
  );

  r = runNode("scripts/pack-verdict.js", [stateWith({ P: "open" }), "--json"]);
  check("a gate open where the contract forbids open is NO PACK", JSON.parse(r.stdout).verdict === "NO PACK");

  // The prospective label must stay marked until LOCK actually passes, or a
  // VALIDATED stamp can outlive a gate that later failed.
  const proJson = JSON.parse(runNode("scripts/pack-verdict.js", [stateWith({ LOCK: "failed" }), "--json", "--assuming-lock-pass"]).stdout);
  check("a prospective verdict is flagged prospective even when LOCK has FAILED", proJson.prospective === true);
  const finalJson = JSON.parse(runNode("scripts/pack-verdict.js", [stateWith(), "--json"]).stdout);
  check("only a passed LOCK yields a non-prospective verdict", finalJson.prospective === false);
  const gc = fs.readFileSync(path.join(ROOT, "skills", "gate-check", "SKILL.md"), "utf8");
  check(
    "gate-check blocks a final-looking label on an unpassed LOCK",
    /PROSPECTIVE — LOCK not yet passed/.test(gc) && /is a blocker/.test(gc)
  );
  check("gate-check strips the marker only after recomputing without the flag", /WITHOUT `--assuming-lock-pass`/.test(gc));
}

// ---------------------------------------------------------------------------
console.log("== waiting_on entries must be able to end ==");
{
  const dir = path.join(tmpdir("waiting-"), "demo");
  fs.mkdirSync(dir, { recursive: true });
  const statePath = path.join(dir, "state.json");
  const base = {
    schema_version: "1.3.0",
    market_shape: "single-sided",
    sides: [],
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
  const write = (waiting_on) => {
    const obj = { ...base, waiting_on };
    fs.writeFileSync(statePath, JSON.stringify(obj));
    return runNode("scripts/state-write.js", [statePath], { input: JSON.stringify(obj) });
  };
  const full = {
    what: "interview transcripts",
    since: "2026-07-01",
    needed_for: "V1",
    resume_when: "3 transcripts land in private/",
    owner: "founder",
    expires_or_recheck_at: "2026-08-15",
  };
  check("a complete waiting_on entry is accepted", write([full]).code === 0);
  check("an entry with no resume_when is rejected", write([{ ...full, resume_when: "" }]).code === 1);
  check("an entry with no owner is rejected", write([{ ...full, owner: undefined }]).code === 1);
  check("a bare string entry is rejected", write(["waiting for transcripts"]).code === 1);
  check("an impossible recheck date is rejected", write([{ ...full, expires_or_recheck_at: "2026-13-01" }]).code === 1);

  // The same rule must hold for a cycle FRAGMENT: validating only the root left a
  // whole class of states unchecked.
  const fragDir = path.join(path.dirname(statePath), "cycles", "C2");
  fs.mkdirSync(fragDir, { recursive: true });
  const fragPath = path.join(fragDir, "state.json");
  const frag = (waiting_on) => {
    const obj = {
      cycle_id: "C2",
      parent: "C1",
      status: "validation",
      mode: "analysis",
      active: [],
      gates: {},
      thresholds: { signed_date: null, revisions: [] },
      kill_criteria: [],
      waiting_on,
      artifacts: {},
      validation_runs: [],
      updated: "2026-07-30",
    };
    fs.writeFileSync(fragPath, JSON.stringify(obj));
    return runNode("scripts/state-write.js", [fragPath], { input: JSON.stringify(obj) });
  };
  check("a fragment cycle's loose waiting_on entry is rejected too", frag(["legacy loose wait"]).code === 1);
  check("a null recheck date is allowed (no deadline yet)", write([{ ...full, expires_or_recheck_at: null }]).code === 0);
}

// ---------------------------------------------------------------------------
console.log("== manifest verification fails closed on shape ==");
{
  const helper = require(path.join(ROOT, "scripts", "artifact-manifest.js"));
  const dir = tmpdir("mf-shape-");
  fs.writeFileSync(path.join(dir, "a.md"), "x\n");
  const m = helper.create(dir, ["a.md"], { purpose: "gate-input", id: "V1-01" });
  const without = (key) => {
    const c = JSON.parse(JSON.stringify(m));
    delete c[key];
    if (key !== "manifest_sha256") c.manifest_sha256 = helper.manifestHash(c);
    return helper.verify(dir, c).map((p) => p.code);
  };
  check("a manifest with no self-hash is rejected", without("manifest_sha256").includes("missing-self-hash"));
  check("a manifest with no algorithm is rejected", without("algorithm").includes("algorithm-mismatch"));
  check("a manifest with no purpose is rejected", without("purpose").includes("invalid-purpose"));
  check("a manifest with no version is rejected", without("manifest_version").includes("unsupported-manifest-version"));
  const dup = JSON.parse(JSON.stringify(m));
  dup.entries.push(dup.entries[0]);
  dup.manifest_sha256 = helper.manifestHash(dup);
  check("duplicate entries are rejected", helper.verify(dir, dup).some((p) => p.code === "duplicate-entry"));
  const badHash = JSON.parse(JSON.stringify(m));
  badHash.entries[0].sha256 = "not-a-hash";
  badHash.manifest_sha256 = helper.manifestHash(badHash);
  check("a malformed entry hash is rejected", helper.verify(dir, badHash).some((p) => p.code === "malformed-entry-hash"));
}

// ---------------------------------------------------------------------------
console.log("== Codex agent bodies are generated, not hand-maintained ==");
{
  const r = runNode("scripts/sync-codex-agents.js", ["--check"]);
  check(
    "every .codex/agents/*.toml matches its agents/*.md source",
    r.code === 0,
    (r.stdout + r.stderr).trim().slice(0, 300)
  );
}

// ---------------------------------------------------------------------------
console.log("== pack label is derived from gate state, not prose ==");
{
  // Tests the SHIPPED predicate (scripts/pack-verdict.js), not a copy of it — a
  // fixture that reimplements the rule proves only that the fixture is consistent.
  const { verdict } = require(path.join(ROOT, "scripts", "pack-verdict.js"));
  const gates = (over = {}) => {
    const g = {};
    for (const name of ["V1", "V2", "V3", "R1", "R2", "P", "LOCK"]) g[name] = { status: over[name] || "passed" };
    return g;
  };
  check("all passed + V3 grade A => VALIDATED", verdict(gates(), "A").verdict === "VALIDATED");
  check(
    "all passed but V3 grade B => NO PACK (the contract has no such pack; the records disagree)",
    verdict(gates(), "B").verdict === "NO PACK" && /records is wrong/.test(verdict(gates(), "B").reasons[0])
  );
  check("V3 open, R1 passed => HYPOTHESIS", verdict(gates({ V3: "open" }), "B").verdict === "HYPOTHESIS");
  check(
    "R1 open => PRE-FEASIBILITY even if everything else passed with grade A",
    verdict(gates({ R1: "open" }), "A").verdict === "PRE-FEASIBILITY HYPOTHESIS"
  );
  check("LOCK not reached => NO PACK", verdict(gates({ LOCK: "pending" }), "A").verdict === "NO PACK");
  check("a failed gate => NO PACK", verdict(gates({ V1: "failed" }), "A").verdict === "NO PACK");
  check(
    "a gate open where the contract forbids open => NO PACK",
    verdict(gates({ P: "open" }), "A").verdict === "NO PACK"
  );
  check("the verdict always reports the inputs it evaluated", verdict(gates(), "A").inputs.v3_evidence_grade === "A");
}

// ---------------------------------------------------------------------------
console.log("== LOCK ordering is stated unambiguously in the contract files ==");
{
  const gc = fs.readFileSync(path.join(ROOT, "skills", "method-rules-gate-contracts", "SKILL.md"), "utf8");
  const gk = fs.readFileSync(path.join(ROOT, "skills", "gate-check", "SKILL.md"), "utf8");
  const s5 = fs.readFileSync(path.join(ROOT, "skills", "stage-5-scope-lock", "SKILL.md"), "utf8");
  check("gate-check documents a ceremony-only invocation that returns to the caller", /ceremony-only/.test(gk) && /returns? to (the caller|stage 5)/i.test(gk));
  check("a full LOCK check verifies the charter instead of starting a ceremony", /FAIL[\s\S]{0,200}charter ceremony/i.test(gk) || /only \*verifies\*/.test(gc));
  check("stage 5 owns the LOCK sequence order", /charter ceremony → materialize pack → cold-start test → full gate check/.test(s5));
  check("gate-check no longer claims to copy the pack itself", !/proceed to Layer 1, which verifies the charter is locked, then copy it into/.test(gk));
  check("MSP is required by the LOCK predicate", /minimum service promise complete/i.test(gc));
  check("cross-gate manifest + ledger + preflight checks are in the contract", /artifact_manifest_sha256/.test(gc) && /max_independent_count/.test(gc) && /publication_disposition/.test(gc));
}

// ---------------------------------------------------------------------------
console.log("== stage 6 (gate BP) is wired end-to-end across the contract files ==");
{
  // Stage 6 exists so that "the MVP is only a description" cannot recur: LOCK
  // hands off to the blueprint, the blueprint has its own gate, and build is
  // documented as starting only after BP. These checks pin the wiring, not the
  // prose.
  const gc = fs.readFileSync(path.join(ROOT, "skills", "method-rules-gate-contracts", "SKILL.md"), "utf8");
  const gk = fs.readFileSync(path.join(ROOT, "skills", "gate-check", "SKILL.md"), "utf8");
  const s5 = fs.readFileSync(path.join(ROOT, "skills", "stage-5-scope-lock", "SKILL.md"), "utf8");
  const s6 = fs.readFileSync(path.join(ROOT, "skills", "stage-6-blueprint", "SKILL.md"), "utf8");
  const ss = fs.readFileSync(path.join(ROOT, "skills", "method-rules-state-schema", "SKILL.md"), "utf8");
  const bl = fs.readFileSync(path.join(ROOT, "process", "build-and-launch.md"), "utf8");
  const gkAgent = fs.readFileSync(path.join(ROOT, "agents", "gatekeeper.md"), "utf8");
  check("gate-contracts has a BP contract row + Gate BP section", /\| \*\*BP\*\* \|/.test(gc) && /## Gate BP/.test(gc));
  check("refines-never-expands is a named BP rule", /refines?, never expands/i.test(gc));
  check("BP requires the level-2 cold-start test", /level-2 cold-start/i.test(gc) && /blueprint-coldstart-tester/.test(gc));
  check("BP state lives outside the frozen cycle gates (state-schema documents state.blueprint)", /\*\*`blueprint`\*\*\s*\(optional root key/.test(ss) && /frozen/.test(ss));
  check("gate-check has BP specifics and pins pack read-only", /## Gate BP specifics/.test(gk) && /state\.blueprint\.gate/.test(gk));
  check("stage 5 hands off to stage 6, not straight to build", /stage-6-blueprint/.test(s5) && /Build does not start here/i.test(s5));
  check("stage 6 owns its closing sequence (self-containment → level-2 cold-start → gate BP)", /blueprint-coldstart-tester/.test(s6) && /gate-check/.test(s6));
  check("build-and-launch starts after BP with the two-layer contract", /BP gate/.test(bl) && /two-layer contract/.test(bl));
  check("gatekeeper covers gate BP", /BP/.test(gkAgent) && /Blueprint discipline/.test(gkAgent));
  check("blueprint-coldstart-tester agent exists with the invent-nothing bar", /without inventing any product decision|invent/i.test(fs.readFileSync(path.join(ROOT, "agents", "blueprint-coldstart-tester.md"), "utf8")));
}

// ---------------------------------------------------------------------------
console.log("== validate-blueprint: fixture passes, seeded defects fail ==");
{
  // Producer-validator fixture idiom (the prospect-table precedent): the shapes
  // the stage-6 templates emit must be shapes the ONE validator accepts, and
  // each seeded defect below is a class the v1.4.1 review named — including the
  // archetypal FS-vs-schema limit conflict that motivated the whole script.
  const os = require("os");
  const { build } = require(path.join(ROOT, "tests", "blueprint-fixture.js"));
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sib-bpv-"));
  const runV = (idea, extra = []) => {
    try {
      const out = execFileSync("node", [path.join(ROOT, "scripts", "validate-blueprint.js"), idea, "--json"].concat(extra), { encoding: "utf8" });
      return { code: 0, ...JSON.parse(out) };
    } catch (e) {
      let parsed = {};
      try { parsed = JSON.parse(e.stdout); } catch { /* non-json failure */ }
      return { code: e.status === undefined ? -1 : e.status, ...parsed };
    }
  };
  const fresh = (name) => build(fs.mkdtempSync(path.join(tmpRoot, name + "-")));
  const has = (r, code) => (r.findings || []).some((f) => f.code === code);

  let idea = fresh("valid");
  let r = runV(idea, ["--at-gate"]);
  check("valid fixture passes --at-gate with 0 errors", r.code === 0 && r.errors === 0, JSON.stringify((r.findings || []).filter((f) => f.level === "error")));
  check("legacy warnings never fail a valid blueprint (no-lock-manifest is a warning)", has(r, "no-lock-manifest"));

  idea = fresh("typeconflict");
  const fsFile = path.join(idea, "blueprint", "feature-specs", "fs-01-upload.md");
  fs.writeFileSync(fsFile, fs.readFileSync(fsFile, "utf8").replace("| report.title | varchar(255) | max 255 |", "| report.title | varchar(500) | max 500 |"));
  r = runV(idea, ["--at-gate"]);
  check("FS max 500 vs schema varchar(255) => type-conflict error", r.code === 1 && has(r, "type-conflict"));

  idea = fresh("uncovered");
  const tp = path.join(idea, "blueprint", "test-plan.md");
  fs.writeFileSync(tp, fs.readFileSync(tp, "utf8").replace(/\| AC-02-1 \|[^\n]*\n/, ""));
  r = runV(idea, ["--at-gate"]);
  check("acceptance criterion missing from test-plan => ac-uncovered error", r.code === 1 && has(r, "ac-uncovered"));

  idea = fresh("marker");
  fs.appendFileSync(path.join(idea, "blueprint", "nfr-spec.md"), "\nRate limit: [GUESS] 10/phút\n");
  r = runV(idea, ["--at-gate"]);
  check("[GUESS] marker at the gate => error", r.code === 1 && has(r, "marker"));
  r = runV(idea);
  check("[GUESS] marker while drafting => warning only, exit 0", r.code === 0 && has(r, "marker"));

  idea = fresh("event");
  const fs2 = path.join(idea, "blueprint", "feature-specs", "fs-02-export.md");
  fs.writeFileSync(fs2, fs.readFileSync(fs2, "utf8").replace("`report_exported` | khi job hoàn tất", "`report_downloaded` | khi job hoàn tất"));
  r = runV(idea, ["--at-gate"]);
  check("instrumentation event not in the dictionary => unknown-event error", r.code === 1 && has(r, "unknown-event"));

  idea = fresh("copy");
  const ux = path.join(idea, "blueprint", "ux-spec.md");
  fs.writeFileSync(ux, fs.readFileSync(ux, "utf8").replace("test-as-proposition", "do-not-publish"));
  r = runV(idea, ["--at-gate"]);
  check("do-not-publish copy on a screen at the gate => error", r.code === 1 && has(r, "do-not-publish-on-screen"));

  idea = fresh("legacy");
  const spec = path.join(idea, "mvp-pack", "mvp-spec.md");
  for (const f of ["mvp-spec.md", "definition-of-done.md", "tech-design.md"]) {
    const p = path.join(idea, "mvp-pack", f);
    fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/<!--\s*pack:[a-z-]+\s*-->\r?\n/g, ""));
  }
  r = runV(idea, ["--at-gate"]);
  check("anchor-less pack => legacy-pack WARNING, still exit 0", r.code === 0 && has(r, "legacy-pack"));

  idea = fresh("amend");
  const amDir = path.join(idea, "blueprint", "amendments");
  fs.mkdirSync(amDir, { recursive: true });
  const bar = (target) => `---
artifact: ba-001-fix-title
artifact_kind: blueprint-amendment
idea: bpfix
phase: maintenance
cycle_id: C1
mutation_policy: immutable-snapshot
publication_status: locked
amendment_id: BA-001
as_of: 2026-08-10
pipeline_version: 1.4.1
updated: 2026-08-10
---
# BA-001
targets: \`${target}\`
class: defect
old: "max 255" / new: "max 255, trim whitespace"
`;
  fs.writeFileSync(path.join(amDir, "ba-001-fix-title.md"), bar("data-schema.md#report.title"));
  fs.writeFileSync(path.join(idea, "blueprint", "amendment-log.md"), `---
artifact: amendment-log
artifact_kind: blueprint-amendment-log
idea: bpfix
phase: maintenance
cycle_id: C1
mutation_policy: append-only
publication_status: draft
as_of: 2026-08-10
pipeline_version: 1.4.1
updated: 2026-08-10
---
| BA-id | date | targets | class | scope_test | summary |
|---|---|---|---|---|---|
| BA-001 | 2026-08-10 | data-schema.md#report.title | defect | NO | trim whitespace |
`);
  const st = JSON.parse(fs.readFileSync(path.join(idea, "state.json"), "utf8"));
  st.blueprint = { cycle_id: "C1", status: "locked", gate: { status: "passed", passed_date: "2026-08-01", notes: "" }, updated: "2026-08-10", amendments: { last_id: "BA-001", updated: "2026-08-10" } };
  fs.writeFileSync(path.join(idea, "state.json"), JSON.stringify(st, null, 2));
  r = runV(idea, ["--at-gate", "--with-amendments"]);
  check("valid amendment (resolving target, logged, state in sync) => 0 errors", r.code === 0 && r.errors === 0, JSON.stringify((r.findings || []).filter((f) => f.level === "error")));
  fs.writeFileSync(path.join(amDir, "ba-001-fix-title.md"), bar("data-schema.md#report.nonexistent"));
  r = runV(idea, ["--at-gate", "--with-amendments"]);
  check("amendment targeting a nonexistent id => amendment-target-id error", r.code === 1 && has(r, "amendment-target-id"));

  // ---- v1.5.0 interaction + subsystem layer mutations
  idea = fresh("writers");
  const im = path.join(idea, "blueprint", "interaction-map.md");
  fs.writeFileSync(im, fs.readFileSync(im, "utf8").replace("| report | fs-01, fs-02 |", "| report | fs-02 |"));
  r = runV(idea, ["--at-gate"]);
  check("forgotten writer in a conflict-domain row => writers-set-mismatch error", r.code === 1 && has(r, "writers-set-mismatch"));

  idea = fresh("sttrigger");
  const ds = path.join(idea, "blueprint", "data-schema.md");
  fs.writeFileSync(ds, fs.readFileSync(ds, "utf8").replace("| ST-report-1 | draft | exported | fs-02 |", "| ST-report-1 | draft | exported |  |"));
  r = runV(idea, ["--at-gate"]);
  check("transition with no trigger => st-no-trigger error (dead schema or missing spec)", r.code === 1 && has(r, "st-no-trigger"));

  idea = fresh("orphancap");
  const fs2b = path.join(idea, "blueprint", "feature-specs", "fs-02-export.md");
  fs.writeFileSync(fs2b, fs.readFileSync(fs2b, "utf8").replace("- CAP-01-1", "- none"));
  r = runV(idea, ["--at-gate"]);
  check("capability no FS uses => orphan-cap error (scope addition in subsystem form)", r.code === 1 && has(r, "orphan-cap"));

  idea = fresh("evinvent");
  const ss1 = path.join(idea, "blueprint", "subsystem-specs", "ss-01-digest-llm.md");
  fs.writeFileSync(ss1, fs.readFileSync(ss1, "utf8").replace("| EV-1 | độ đúng cụm vấn đề trên dữ liệu thật | 85% |", "| EV-1 | độ đúng cụm vấn đề trên dữ liệu thật | 92% |"));
  r = runV(idea, ["--at-gate"]);
  check("EV threshold absent from mvp-pack/eval => ev-threshold-invented error", r.code === 1 && has(r, "ev-threshold-invented"));

  idea = fresh("asyncstate");
  const fs2c = path.join(idea, "blueprint", "feature-specs", "fs-02-export.md");
  fs.writeFileSync(fs2c, fs.readFileSync(fs2c, "utf8").replace(/\| queued \|[^\n]*\n/, ""));
  r = runV(idea, ["--at-gate"]);
  check("async-CAP feature missing a queued state row => missing-async-state error", r.code === 1 && has(r, "missing-async-state"));

  idea = fresh("determinism");
  const tp2 = path.join(idea, "blueprint", "test-plan.md");
  fs.writeFileSync(tp2, fs.readFileSync(tp2, "utf8").replace("| AC-02-1 | xuất báo cáo + xoá theo yêu cầu | e2e | live-eval-threshold |", "| AC-02-1 | xuất báo cáo + xoá theo yêu cầu | e2e |  |"));
  r = runV(idea, ["--at-gate"]);
  check("llm/async-backed case with blank determinism cell => no-determinism-strategy error", r.code === 1 && has(r, "no-determinism-strategy"));

  idea = fresh("touches");
  const fs1b = path.join(idea, "blueprint", "feature-specs", "fs-01-upload.md");
  fs.writeFileSync(fs1b, fs.readFileSync(fs1b, "utf8").replace(/\| report \| write \|[^\n]*\n/, ""));
  r = runV(idea, ["--at-gate"]);
  check("entity used but not declared in touches => touches-omission error", r.code === 1 && has(r, "touches-omission"));

  // ---- v1.6.0 surface / compliance mutations
  idea = fresh("headless");
  const uxh = path.join(idea, "blueprint", "ux-spec.md");
  fs.writeFileSync(uxh, fs.readFileSync(uxh, "utf8").replace("rung: baseline-auto\n", "rung: baseline-auto\nsurface: headless-api\n"));
  for (const f of ["fs-01-upload.md", "fs-02-export.md"]) {
    const p2 = path.join(idea, "blueprint", "feature-specs", f);
    fs.writeFileSync(p2, fs.readFileSync(p2, "utf8").replace(/\| loading \|[^\n]*\n/, ""));
  }
  r = runV(idea, ["--at-gate"]);
  check("headless surface without api-lifecycle => error (integration promises need a home)", r.code === 1 && has(r, "api-lifecycle-missing"));
  const api = path.join(idea, "blueprint", "api-contract.md");
  fs.appendFileSync(api, "\n<!-- bp:api-lifecycle -->\n## Lifecycle: semver, deprecation 90 ngày, breaking chỉ theo major, key xoay mỗi quý\n");
  r = runV(idea, ["--at-gate"]);
  check("headless surface: loading rows not required once api-lifecycle exists => 0 errors", r.code === 0 && r.errors === 0, JSON.stringify((r.findings || []).filter((f) => f.level === "error")));

  idea = fresh("compliance");
  const nfr = path.join(idea, "blueprint", "nfr-spec.md");
  fs.writeFileSync(nfr, fs.readFileSync(nfr, "utf8").replace(/N\/A — founder[^\n]*\n/, "N/A\n"));
  r = runV(idea, ["--at-gate"]);
  check("compliance N/A without a recorded basis => error (no-regulation is a claim too)", r.code === 1 && has(r, "compliance-na-basis"));

  idea = fresh("accessna");
  const uxa = path.join(idea, "blueprint", "ux-spec.md");
  fs.writeFileSync(uxa, fs.readFileSync(uxa, "utf8").replace("## Sàn accessibility: keyboard, contrast, labels", "N/A"));
  r = runV(idea, ["--at-gate"]);
  check("accessibility N/A => error (the floor substitutes per surface, never cuts)", r.code === 1 && has(r, "accessibility-na"));

  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
console.log("== validate-beachhead --file confinement (two-sided lists) ==");
{
  const os = require("os");
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "sib-bh-"));
  const runB = (args) => {
    try { execFileSync("node", [path.join(ROOT, "scripts", "validate-beachhead.js"), d].concat(args), { encoding: "utf8", stdio: "pipe" }); return 0; }
    catch (e) { return e.status === undefined ? -1 : e.status; }
  };
  check("--file with traversal => usage/fatal exit", runB(["--file", "../evil.md"]) === 2);
  check("--file with a non-beachhead name => rejected", runB(["--file", "state.json"]) === 2);
  check("--file beachhead-icp-seller.md (missing) => fatal, not crash", runB(["--file", "beachhead-icp-seller.md"]) === 2);
  fs.rmSync(d, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
console.log("== SS_KIND_ANCHORS parity: gate-contracts table vs validate-blueprint.js ==");
{
  // Third instance of the one-vocabulary-two-declarations pattern
  // (THRESHOLD_FIELDS, artifact_kind — now subsystem kind anchors).
  const vb = fs.readFileSync(path.join(ROOT, "scripts", "validate-blueprint.js"), "utf8");
  const om = vb.match(/const SS_KIND_ANCHORS = \{([\s\S]*?)\};/);
  check("validator declares SS_KIND_ANCHORS", !!om);
  const validatorKinds = {};
  for (const m of om[1].matchAll(/(\w+):\s*\[([^\]]*)\]/g))
    validatorKinds[m[1]] = m[2].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean).sort();
  const gc = fs.readFileSync(path.join(ROOT, "skills", "method-rules-gate-contracts", "SKILL.md"), "utf8");
  const tbl = gc.match(/\| kind \| required anchors beyond trace\/capabilities\/degradation \|([\s\S]*?)\n\n/);
  check("gate-contracts declares the per-kind anchor table", !!tbl);
  const skillKinds = {};
  for (const line of tbl[1].split(/\r?\n/)) {
    const m = line.match(/^\s*\|\s*(\w+)\s*\|\s*([^|]*)\|/);
    if (!m || /^-+$/.test(m[1])) continue;
    skillKinds[m[1]] = m[2].trim() === "—" ? [] : m[2].split(",").map((s) => s.trim()).filter(Boolean).sort();
  }
  for (const k of Object.keys(validatorKinds))
    check(`kind "${k}" anchors identical in contract and validator`,
      JSON.stringify(validatorKinds[k]) === JSON.stringify(skillKinds[k] || null),
      `validator=[${validatorKinds[k]}] contract=[${skillKinds[k]}]`);
  check("contract table lists no kind the validator lacks",
    Object.keys(skillKinds).every((k) => k in validatorKinds),
    Object.keys(skillKinds).filter((k) => !(k in validatorKinds)).join(", "));
}

// ---------------------------------------------------------------------------
console.log("== artifact_kind parity: maintenance-rules §9 vs validate-artifact.js ==");
{
  // THRESHOLD_FIELDS precedent: one vocabulary, two hand-kept declarations —
  // drift must be a test failure, not a discovery. The skill declares the enum
  // in §9's artifact_kind comment; the hook declares MAINT_ENUMS.artifact_kind.
  const hook = fs.readFileSync(path.join(ROOT, "hooks", "scripts", "validate-artifact.js"), "utf8");
  const m = hook.match(/artifact_kind:\s*\[([\s\S]*?)\]/);
  const hookKinds = m[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean).sort();
  const skill = fs.readFileSync(path.join(ROOT, "skills", "method-rules-maintenance-rules", "SKILL.md"), "utf8");
  const block = skill.match(/artifact_kind: current-baseline\s+#([\s\S]*?)\nidea:/);
  const skillKinds = (block[1].match(/[a-z][a-z-]+[a-z]/g) || []).filter((k) => k !== "current-baseline" || true).sort();
  const missing = hookKinds.filter((k) => !skillKinds.includes(k));
  const extra = skillKinds.filter((k) => !hookKinds.includes(k) && k !== "current-baseline");
  check("every hook artifact_kind appears in maintenance-rules §9's enum comment", missing.length === 0, `missing from skill: ${missing.join(", ")}`);
  check("§9's enum comment lists no kind the hook rejects", extra.length === 0, `extra in skill: ${extra.join(", ")}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
