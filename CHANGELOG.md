# Changelog

The full working record (design rounds, adversarial review transcripts, dogfood run reports, the
multi-session conflict inventory and its resolution log) was development residue and has been removed
from the working tree — it remains recoverable in git history at commit `b7a7e09` and earlier
(`git show b7a7e09:plugin/conflicts-inventory.md`, etc.).

## v1.3.0 — 2026-07-30 · conflict resolution + consolidation

One pass resolving every conflict catalogued after two Claude Code sessions (and a Codex reviewer)
worked the repo in parallel.

- **Gate F passable again**: `validate-beachhead.js` is the single prospect validator. It absorbed
  the parallel `validate-prospect-tracker.js` (deleted) — resolved-entity dedup ("one business under
  two names"), "is a competitor" rejected as tier evidence, listicle-only basis rejected,
  `observed_at` dating, duplicate-Pid — on top of the existing behaviour/E-id/reach cells.
- **Legacy path** (LEGACY_RUNGS precedent): pre-1.2.0 workspaces with the old table shape get a
  `legacy-shape` warning and no mechanical count instead of a retroactive hard fail.
- **Prospect table has one canonical 9-column shape**, emitted identically by the stage-0 template
  skill and the manual template, fixture-checked from every producer (the mechanism that had already
  caught ledger-template drift twice, now covering the table that diverged).
- **Process safety**: `node --check` on every shipped `.js` is the first test case (a bulk edit once
  silently broke three scripts behind fail-open hooks); `scripts/preflight.js` runs syntax sweep +
  both suites + Codex agent parity in one command.
- **Single sources declared**: `skills/` is normative (process/ and templates/ subordinate, stated
  in-file); the version is declared once in `plugin.json` and a contract test keeps every
  `pipeline_version` literal in skills equal to it.
- **State protection**: `state-write.js` upgraded from "prefer" to MUST (observed compliance of the
  soft rule was 0/21 with one real truncation); `guard-thresholds.js` now deterministically blocks
  any direct edit that drops a load-bearing `state.json` key.
- **Contract clarifications**: reachable ≠ contacted written into gate F (contact/funnel belongs to
  V1; a criterion demanding it at F is an invented gate predicate); `audit-trail.md`'s exemption
  from pack-internal id resolution declared explicitly; `signing-blocked` added to the decision-log
  `type` enum (+ enum contract test).
- **Vocabulary parity fixture**: `THRESHOLD_FIELDS` and the sealed-field set must stay identical
  between the hook and `verify-threshold-snapshot.js` — drift is a test failure.
- **Eval fixtures write to the OS temp dir** by default, never into a repo (a generated fixture is a
  real `ideas/<slug>/state.json` tree the session-start sentinel would otherwise pick up).
- **Coverage inventory updated**: 73 requirements, 48% deterministic (code+hook); the 8 unenforced
  prose rules are individually dispositioned in `coverage-report.js` (5 intentional with reasons,
  3 marked DEBT).
- Dogfood workspaces moved out of `ideas/` (the "state never inside the plugin" rule now holds
  without exceptions), later archived out of the repo entirely.

## v1.2.0 — 2026-07-30 · post-LOCK maintenance layer + evidence-ledger integrity overhaul

Ten adversarial design/implementation review rounds with Codex (gpt-5.6-sol, xhigh).

- **Post-LOCK life**: new skills `declare-drift` (incremental drift inbox), `reconcile` (on-demand
  reconciliation against declared or observed product reality, two-phase hash-final), and
  `run-validation` (execute/adjudicate signed validation runs). Maintenance rules: mutation policies
  (append-only / versioned-projection / immutable-snapshot), claim-domain authority, a closed
  claim-transition table (retro evidence may refute, never confirm), reality intake with source
  registry and an execution/secrets boundary.
- **State schema 1.2.0**: cycles index + fragments, `maintenance` block, `health_criteria`,
  `validation_runs`; `state-write.js` enforces downgrade rejection, locked-cycle subtree freeze,
  root↔fragment correspondence, kill-criterion disposition validation.
- **Evidence-ledger overhaul**: `root_source_id` independence ceiling (syndicated reposts are ONE
  source; independence is computed, never self-declared), `bearing` / `epistemic_status` /
  `publication_disposition` separated (three things had all been called "status"), superseded rows
  excluded from every denominator.
- **New deterministic helpers**: `validate-evidence-ledger.js`, `artifact-manifest.js` (gate-input
  manifests — the verdict is pinned to a hashed artifact set), `pack-verdict.js` (the pack label is
  computed, never hand-written), sampling-frame snapshots hashed before collection.
- **Gate-check**: LOCK kill-criterion disposition ceremony (post-PASS only), ceremony-only charter
  mode, cycle resolution + drift boundary.
- **Hooks**: phase-conditional artifact validation, locked-cycle historical artifact guard,
  byte-exact append-only enforcement extended to drift-inbox / evidence-ledger / charter.
- `rung` enum reduced to exactly three values (`enhanced-auto | baseline-auto | handoff`) —
  `simulate` removed: simulation is epistemic provenance (grade D / `[GUESS]`), not an execution
  capability.

## v1.1.0 — 2026-07-29 · initial release

First public version (the "v1.0" numbering belongs to the pre-release design drafts: scalar
`current_stage` state, no DAG, no capability probes — replaced before first commit by the
`active[]` DAG, the `{status, rung, provider, verified_at, probe}` capability object, and the
15-skill layout). Shipped: the 6-stage pipeline (framing → competitive → validate V1-V3 → verify
R1-R2 → positioning → scope lock) with 9 gates, A/B/C/D evidence grading, `[GUESS]` labeling,
pre-registered thresholds with a signing ceremony, kill criteria, the four research/audit agents
(competitor-scanner, community-review-miner, gatekeeper, coldstart-tester) with Codex TOML parity,
three hooks (session-start, guard-thresholds, validate-artifact), atomic `state-write.js`, manual
no-plugin mode (`templates/` + `process/`), and 29 hook regression tests.
