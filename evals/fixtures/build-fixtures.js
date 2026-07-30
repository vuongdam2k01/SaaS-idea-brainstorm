#!/usr/bin/env node
/**
 * Build the seeded-defect fixtures for the gatekeeper interpretation-layer evals.
 *
 * Generated rather than committed as static trees for one reason: every fixture must
 * stay TRANSPARENT to the deterministic validators (they all exit 0 on it), because a
 * fixture a script can catch is measuring code, not the interpretation layer. Keeping
 * the generator next to the assertion in tests/hook-tests.js makes that property
 * checkable on every run instead of being a comment nobody re-reads.
 *
 * Usage: node evals/fixtures/build-fixtures.js <out-dir>
 */
"use strict";
const fs = require("fs");
const path = require("path");

const SIGNED = "2026-07-20";
const THRESHOLDS = {
  signed_date: SIGNED,
  v1_past_behavior_pct: 60,
  v1_min_sample: 12,
  v3_min_commitments: 5,
  r1_eval_pass_pct: null,
  custom: {},
  revisions: [],
};

const fm = (o) =>
  "---\n" + Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("\n") + "\n---\n";

const artifactFm = (artifact, idea, stage, gate, grade) =>
  fm({
    artifact, idea, stage, gate, status: "ready",
    evidence_grade: grade, rung: "baseline-auto",
    pipeline_version: "1.2.0", updated: "2026-07-30",
  });

function journal(idea) {
  return (
    "| date | type | decision | alternatives considered | rationale | evidence | detail |\n" +
    "|---|---|---|---|---|---|---|\n" +
    `| ${SIGNED} | threshold-snapshot | F signing ceremony | — | thresholds pre-registered before any collection | state.thresholds | ${JSON.stringify(THRESHOLDS)} |\n`
  );
}

function state(idea) {
  return JSON.stringify(
    {
      schema_version: "1.1.0", pipeline_version: "1.2.0", idea,
      title: idea, created: "2026-07-15", updated: "2026-07-30",
      mode: "analysis", auto_continue: false, active: ["0.4"],
      gates: {
        F: { status: "in_progress", evidence_floor: "none", passed_date: null, notes: "" },
        C: { status: "pending", evidence_floor: "B", passed_date: null, notes: "" },
      },
      thresholds: THRESHOLDS,
      kill_criteria: [],
      budget: { cap_usd: 0, spent_usd: 0, log: [] },
      waiting_on: [],
      artifacts: { "evidence-ledger": "evidence-ledger.md", "beachhead-icp": "beachhead-icp.md" },
    },
    null, 2
  );
}

/** 15 clean, genuinely behavioural, fully-cited prospects — the floor must be cleared
 *  so the fixture fails for its seeded reason and nothing else. */
function cleanProspects(from, to) {
  const out = [];
  for (let i = from; i <= to; i++) {
    out.push(
      `| P${i} | platform lead, ${30 + i}-engineer SaaS co | 4 | "we built a nightly job that diffs our runbooks against the terraform plan and opens a ticket per mismatch" | E${i} | forum-profile-${i}.example | 2026-07-2${i % 10} | work email from their conference talk, replies expected | contacted |`
    );
  }
  return out;
}
function cleanLedger(from, to) {
  const out = [];
  for (let i = from; i <= to; i++) {
    out.push(
      `| E${i} | 2026-07-2${i % 10} | forum user (P${i}) | community | https://example.invalid/thread/${i} | 2026-07-30 | miner-run-1 | RS-${i} | "we built a nightly job that diffs our runbooks against the terraform plan and opens a ticket per mismatch" | A1 | B | supports | one 40-person infra team, 2026 |`
    );
  }
  return out;
}
const LEDGER_HEAD =
  "| id | date | source | type | url_or_ref | retrieved | via | root_source_id | verbatim_or_observation | assumption | grade | bearing | scope_limits |\n" +
  "|---|---|---|---|---|---|---|---|---|---|---|---|---|\n";
const ICP_HEAD =
  "| Pid | Segment descriptor (NO real names) | Tier | Behaviour that establishes the tier | Evidence (E-id) | Resolved entity | Observed at | Reach channel | Funnel status |\n" +
  "|---|---|---|---|---|---|---|---|---|\n";

const FIXTURES = {
  // ---------------------------------------------------------------------------
  "prescriptive-tier": {
    seeded:
      "P15 is counted as tier 4 on a sentence that is ADVICE, not behaviour: " +
      '"if you have PR templates, add a checklist item for docs". The speaker may never have done it.',
    expect: /P15|prescript|advice|imperative|behaviour|behavior/i,
    build(dir, idea) {
      fs.writeFileSync(
        path.join(dir, "beachhead-icp.md"),
        artifactFm("beachhead-icp", idea, 0, "F", "B") +
          "# Beachhead ICP\n\n## 20 real prospects\n\n" +
          ICP_HEAD +
          cleanProspects(1, 14).join("\n") +
          "\n" +
          // The seed. All three cells are present and resolve, so validate-beachhead
          // exits 0 — only a reader can see that the sentence is advice.
          `| P15 | SRE, 80-engineer fintech | 4 | "if you have PR templates, add a checklist item for docs" | E15 | forum-profile-15.example | 2026-07-28 | work email, replies expected | contacted |\n`
      );
      fs.writeFileSync(
        path.join(dir, "evidence-ledger.md"),
        artifactFm("evidence-ledger", idea, 2, "V1", "B") +
          "# Evidence ledger\n\n" +
          LEDGER_HEAD +
          cleanLedger(1, 14).join("\n") +
          "\n" +
          `| E15 | 2026-07-28 | forum user (P15) | community | https://example.invalid/thread/15 | 2026-07-30 | miner-run-1 | RS-15 | "if you have PR templates, add a checklist item for docs" | A1 | B | supports | one commenter, 2026 |\n`
      );
    },
  },
  // ---------------------------------------------------------------------------
  "derived-number": {
    seeded:
      "competitive-map.md claims a '~20x' engagement asymmetry. Its own cited numbers give " +
      "132/83/48 vs 2/4/3/2/2 — means 87.7 vs 2.6, i.e. ~34x, not 20x. The comparison sets are " +
      "also from different years, and the caveat that is present in private/scan-raw is absent here.",
    expect: /20\s*[x×]|arithmetic|recompute|34|caveat|comparab|different (period|year)/i,
    build(dir, idea) {
      fs.mkdirSync(path.join(dir, "private"), { recursive: true });
      fs.writeFileSync(path.join(dir, "private", ".gitignore"), "*\n!.gitignore\n");
      // The caveat EXISTS in the raw trail...
      fs.writeFileSync(
        path.join(dir, "private", "scan-raw-2026-07-30.md"),
        "# Raw competitive scan trail\n\n" +
          "Incident-framing launches: 132, 83, 48 points (2024 cohort).\n" +
          "Doc-freshness launches: 2, 4, 3, 2, 2 points (2026 cohort).\n\n" +
          "> CAVEAT: forum points measure launch-marketing skill and title luck as much as demand, " +
          "and none of the doc-freshness launches targeted this segment specifically. The two cohorts " +
          "are also two years apart, so they are not a like-for-like comparison.\n"
      );
      // ...and is gone from the artifact the founder reads, along with the arithmetic.
      fs.writeFileSync(
        path.join(dir, "competitive-map.md"),
        artifactFm("competitive-map", idea, 1, "C", "B") +
          "# Competitive map\n\n## The finding that matters most: the traction asymmetry\n\n" +
          "Incident-framed launches in this audience draw roughly **20x** the engagement of " +
          "doc-freshness launches (132/83/48 points versus 2/4/3/2/2). The framing with all the " +
          "attested pull is the one this idea has deprioritized, which reframes the whole market-type " +
          "question.\n\n" +
          "Source: E20. Raw trail: `private/scan-raw-2026-07-30.md`.\n"
      );
      fs.writeFileSync(
        path.join(dir, "beachhead-icp.md"),
        artifactFm("beachhead-icp", idea, 0, "F", "B") +
          "# Beachhead ICP\n\n## 20 real prospects\n\n" + ICP_HEAD + cleanProspects(1, 15).join("\n") + "\n"
      );
      fs.writeFileSync(
        path.join(dir, "evidence-ledger.md"),
        artifactFm("evidence-ledger", idea, 2, "V1", "B") +
          "# Evidence ledger\n\n" + LEDGER_HEAD + cleanLedger(1, 15).join("\n") + "\n" +
          `| E20 | 2026-07-30 | forum launch listings | community | https://example.invalid/launches | 2026-07-30 | miner-run-2 | RS-20 | "incident launches 132/83/48 pts; doc-freshness launches 2/4/3/2/2 pts" | A2 | B | supports | two cohorts, 2024 and 2026 |\n`
      );
    },
  },
  // ---------------------------------------------------------------------------
  "unledgered-claim": {
    seeded:
      "private/contacts.md asserts that P16 'imposed a quarterly runbook review across four teams' — " +
      "a behavioural claim about a real person with NO evidence-ledger entry, so it is ungraded and " +
      "outside every denominator and balance check. beachhead-icp.md then leans on it in prose.",
    expect: /P16|ledger|ungraded|unledger|outside the ledger|no E-?id|E-?id/i,
    build(dir, idea) {
      fs.mkdirSync(path.join(dir, "private"), { recursive: true });
      fs.writeFileSync(path.join(dir, "private", ".gitignore"), "*\n!.gitignore\n");
      fs.writeFileSync(
        path.join(dir, "private", "contacts.md"),
        "# Contacts (private)\n\n" +
          "| Pid | real name | contact | notes |\n|---|---|---|---|\n" +
          "| P16 | — (handle only) | none known | imposed a quarterly runbook review across four teams — strongest tier-4 signal in the set |\n"
      );
      fs.writeFileSync(
        path.join(dir, "beachhead-icp.md"),
        artifactFm("beachhead-icp", idea, 0, "F", "B") +
          "# Beachhead ICP\n\n## 20 real prospects\n\n" +
          ICP_HEAD + cleanProspects(1, 15).join("\n") + "\n\n" +
          "## Segment read\n\n" +
          "The strongest signal in the set is the respondent who **imposed a quarterly runbook review " +
          "across four teams** (see `private/contacts.md`, P16) — evidence that this pain reaches the " +
          "point of organisational process, not just individual annoyance. That is the behaviour the " +
          "tier-4 bar is trying to find.\n"
      );
      fs.writeFileSync(
        path.join(dir, "evidence-ledger.md"),
        artifactFm("evidence-ledger", idea, 2, "V1", "B") +
          "# Evidence ledger\n\n" + LEDGER_HEAD + cleanLedger(1, 15).join("\n") + "\n"
      );
    },
  },
};

function build(outDir) {
  const made = [];
  for (const [name, spec] of Object.entries(FIXTURES)) {
    const idea = name;
    const dir = path.join(outDir, name, "ideas", idea);
    fs.rmSync(path.join(outDir, name), { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "state.json"), state(idea));
    fs.writeFileSync(path.join(dir, "decision-log.md"), journal(idea));
    spec.build(dir, idea);
    fs.writeFileSync(
      path.join(outDir, name, "SEEDED-DEFECT.md"),
      `# Seeded defect: ${name}\n\n${spec.seeded}\n\n` +
        "This file documents the answer key. It is NOT placed inside `ideas/<idea>/`, so a gatekeeper " +
        "pointed at the idea directory cannot read it.\n"
    );
    made.push({ name, ideaDir: dir, root: path.join(outDir, name), seeded: spec.seeded });
  }
  return made;
}

if (require.main === module) {
  // Default OUTSIDE the repo (v1.3.0): a generated fixture is a
  // real `ideas/<slug>/state.json` tree, which the session-start sentinel would
  // pick up as a real idea if it ever landed inside a user's working repo.
  const out = process.argv[2] ||
    fs.mkdtempSync(path.join(require("os").tmpdir(), "sib-eval-fixtures-"));
  const made = build(out);
  for (const m of made) console.log(`built ${m.name} -> ${m.ideaDir}`);
}
module.exports = { build, FIXTURES };
