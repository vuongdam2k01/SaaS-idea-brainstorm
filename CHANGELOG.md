# Changelog

The full working record (design rounds, adversarial review transcripts, dogfood run reports, the
multi-session conflict inventory and its resolution log) was development residue and has been removed
from the working tree — it remains recoverable in git history at commit `fd7732b` and earlier
(`git show fd7732b:plugin/conflicts-inventory.md`, etc.).

## v1.7.0 — 2026-07-31 · depth review: subtraction, not addition (round 5)

Round 5 inverted the question — not "what is missing" but "is this too heavy, where is the
confidence unearned, and should we stop?" The review measured the surface (≈400 product judgements
and ~19,000 words of contract for a 5-step idea) and named a realistic abandonment point around
feature spec #4–5. **Net effect of this release: one contract split out, four requirement
reductions, three small additions, one blocker fixed.**

- **Blocker — `CH-nn` delegations dangled.** Stage 6 recorded delegated decisions against the live
  `founder-charter.md`, but the pack's charter copy **freezes at LOCK**, so a build-phase charter
  item is invisible to the build session and the level-2 tester — the exact readers the record was
  written for. Delegations now live in `blueprint-overview.md`'s **decision register** (`DR-n` with
  the founder's exact words, date and delegated scope); a charter id is legal only as provenance and
  only if it resolves in `mvp-pack/founder-charter.md`. Validator enforces both.
- **Contract split (context subtraction).** Gate BP's 2,264 words moved to
  `method-rules-gate-contracts-bp`, loaded only by stage 6, `amend-blueprint`, and a BP gate check —
  the same reasoning that put maintenance-rules outside the default bundle (method-rules §10).
  `method-rules-gate-contracts` drops from 5,452 → 3,269 words for the other nine gates.
- **Four reductions.** Copy dispositions narrowed to **pack-class claims** (outcome/benefit/
  quantity/guarantee/security/price/pitch), not every UI string — labels and error copy belong to
  their FS. Determinism strategy is **declared once per CAP and inherited** by test cases (~40
  duplicated cells removed). `INV-n` may no longer duplicate a DoD item — one rule, one home, so
  nothing can drift between two authorities. FS concurrency cells **cite** the conflict domain
  instead of restating it (the duplicated-authority class the review hunted).
- **Three additions, paid for by the reductions.** A `bp:profile` table declaring which optional
  layers apply and why (a simple CRUD product provably needs 9 files and skips the subsystem layer).
  Quantitative-assumption rows in the carry-forward table (attempts per success, per-user volume,
  retention) each marked with an E-id or `[GUESS]` — the gap where green checks and a wrong product
  coexist. And an honest-boundary statement in the BP contract **and in the validator's own footer**:
  what a green run does not mean.
- **§14 Requirement moratorium.** Standing rule: a new requirement may be added only if it names an
  **observed failure** or removes an existing requirement of equal weight. Rules born from
  hypothetical shapes dilute attention on the rules that were paid for in real dogfood runs. The
  honest next action is a run, not another design round — and the review's sharpest point stands:
  **all three dogfood runs died at or before gate F, while stage 6 is only reachable after nine
  gates succeed.** The designed-to-exercised ratio is now the live risk.
- Suites: 198 hook + 205 contract tests green (6 new: delegation resolution ×3, concurrency
  citation, INV-vs-DoD, determinism inheritance ×2). Coverage: 129 requirements, 61% deterministic.

## v1.6.0 — 2026-07-31 · idea-diversity layers (round-4 review)

The founder's fourth attack: ideas are enormously diverse and four biases remained — single-segment
validation, screen-shaped blueprints, no compliance home, and a frozen subsystem vocabulary. Round 4
converged all 11 design questions; the review corrected three of my proposals with better rules and
found one real blocker (a second side's table would silently corrupt the F count).

- **Two-sided/multi-sided products** (schema 1.3.0): `state.market_shape` + `state.sides[]` with
  **roles, not a winner** — `constrained` (carries the full F/V1 bar; counting the abundant side is
  trivially satisfiable) and `paying` (carries V3); often one side, then nothing changes. Each other
  side gets its **own** `beachhead-icp-<side>.md` (`validate-beachhead.js --file`, confined names —
  two tables in one file was a proven corruption path) with a **founder-set, sealed floor**
  (`thresholds.custom.f_secondary_min` — the plugin never invents this number). Per-side sampling
  frames, denominators never merged; V2 requires matchmaking mechanism + single-player value or a
  **founder-executable seeding plan** ("partner with an aggregator" is a wish, not a plan) + an
  armed chicken-egg kill criterion generated at 0.6 — which is why classification (new **0.3b**)
  lands strictly before the F signing. V3: money from the paying side; Mom-Test commitments
  (signed listings, committed supply) from the rest. Blueprint: per-side first-run flows and the
  aha's side recorded. `sides` is cycle-owned and freezes with the cycle.
- **Headless surfaces**: `ux-spec` declares `surface: ui|headless-api|cli|sdk|mixed`, overridable
  **per SC row** (`mixed` as a union of requirements would manufacture junk N/A cells); headless
  rows drop the `loading` requirement (error/empty/async tokens stay); `api-contract` requires an
  **api-lifecycle** section for any non-ui surface (versioning, deprecation window, breaking-change
  policy, key rotation — promises made the instant a customer integrates); the **accessibility
  anchor is never N/A** — per-surface substitution (headless → stable error codes, documented
  limits, deprecation policy).
- **Regulated domains**: 0.3b founder-confirmed classification → deadly assumption with
  `load_before_event = first outside user touches real regulated data` (a **blocking pre-launch
  item** in build-and-launch, not an unpassable validation gate — the v1.3.0 F lesson) + a
  compliance kill criterion; `nfr-spec` requires `bp:compliance` ALWAYS — `REG-n` rows with source
  refs, or `N/A — <basis>` ("no regulation applies" is itself a claim; null reasons rejected);
  model-drafted obligations are `[GUESS]` and never satisfy the section; at LOCK the MSP's
  explicitly-unsupported field states the regulated boundary.
- **Subsystem vocabulary growth**: `ledger` kind shipped now (internal balances/credits — inside
  tech-design's money-100%-understand zone; anchors ledger-model, idempotency, reconciliation,
  **failure-semantics** — the charge-succeeded-generation-failed rule that actually gets invented
  mid-build); **agentic-llm conditional anchors** (`takes_actions: yes` ⇒ action-authorization +
  run-limits); `integration-sync` and `search` documented as queued candidates (an unexercised kind
  ships dead anchors). Coverage: 122 requirements registered; suites 198 hook + 197 contract, all
  green (new seeded defects: headless-without-lifecycle, baseless compliance N/A, N/A'd
  accessibility, --file traversal).

## v1.5.0 — 2026-07-31 · interaction + subsystem layers (round-3 review)

The founder's third attack landed: the blueprint's vocabulary was CRUD-biased, and cross-feature
semantics had no mandatory home — an LLM core or a 3D engine got smeared across edge-case rows while
"LLM regenerates the scene during a hand-edit" was specified nowhere. Round 3 with the Opus reviewer
converged all nine design questions plus five additional findings; everything shipped.

- **Interaction layer** (`interaction-map.md`): the required unit is the **conflict domain**, not the
  pair — one row per entity with ≥2 writers, whose `writers` cell must **set-equal the validator's
  computed writer set** (a forgotten writer is the real failure mode); real answers required
  (who-wins/merge/lock/loser-sees/undo — `none` rejected), scope token with a cut-list join when
  multi-user is out of scope; pairwise table demoted to exceptions. Per-FS **`touches`** declarations
  with a deliberately asymmetric cross-check (omission = error, over-declaring = warning). **State
  machines became tables** (`ST-n` from/to/trigger/guard): every transition owned (fs must claim it
  in touches; `system:` triggers need a user-visible consequence or `invisible <reason>`). Global
  **invariants `INV-n`** trace pack-side and join the test plan. **Jobs are the third class**: async
  capability ⇒ JOB rows (durable/cancellable/second-submit/disconnect/result-lifetime/notification)
  + `queued|running|cancelled|partial` states on the using FS — a four-minute generation is a durable
  object, not a loading spinner; undo-across-a-generation-boundary is decided here.
- **Subsystem layer** (`subsystem-specs/ss-NN-*.md`): first-class home for the non-CRUD core, one per
  ADR-named engine, closed `kind` enum (`llm|graphics|realtime|pipeline|generic`) with
  kind-conditional required anchors (declared once in gate-contracts, mirrored in the validator,
  parity-tested — third instance of the pattern). Capabilities are ids (`CAP-NN-n`) with budgets;
  FS cite them on a separate `uses` line (never the trace line — that would launder a missing pack
  trace); **orphan capability = scope addition** (the orphan-field analogue). **Stochastic
  acceptance binds to evals**: `EV-n` thresholds string-verified against `mvp-pack/eval/` (restated,
  never invented), every llm-backed FS has ≥1 AC citing an EV, every EV cited + test-covered.
  Budgets checked by **containment** (CAP ≤ nfr — catches the 90s generation under a 5s screen
  promise) and llm cost budgets show per-user caps with arithmetic against R1's marginal cost.
- **Round-3 extra findings**: generated-artifact lifecycle section (quota/eviction/export/deletion —
  the concrete MSP answer for a 200 MB scene); **determinism strategy** cell on every llm/async test
  case (blank = error — a stochastic core with no strategy makes CI flaky by construction) + `eval`
  test kind; **model/document-version pinning** with a saved-output change policy (the
  highest-regret unanswered decision); data-schema gained state-machine + non-relational-store
  sections (a scene graph forced into `entity.field` is how the schema lies).
- **Wiring**: BAR targets span the new id spaces (ss/CAP/EV/ST/INV/JOB); level-2 cold-start walks
  conflict pairs + async jobs + subsystem implementability; stage-6 decomposition asks the non-CRUD
  question; amendments/coldstart/refines-never-expands unchanged by design (subsystem specs trace to
  ADRs). Coverage inventory: 109 requirements, 59% deterministic (was 95 @ 55%). Suites: 194 hook +
  189 contract, green; the fixture's Vietnamese-bodied blueprint now exercises both layers, with 7
  new seeded-defect tests (writer-set mismatch, trigger-less transition, orphan CAP, invented EV
  threshold, missing async state, blank determinism, touches omission).

## v1.4.1 — 2026-07-31 · stage 6 hardened by adversarial cross-model review

Two-round exchange with an Opus reviewer over the fresh v1.4.0 stage (12 findings: 3 blocker,
7 major, 2 minor; round 2 converged five contested design points). Everything below came out of
that exchange.

- **Blueprint Amendment mechanism** (blocker #1 — the founder's "mid-build discovery" case): a locked
  blueprint is *amended, never edited*. New `amend-blueprint` skill: founder-answered **scope test**
  routes pack-predicate changes to declare-drift and in-scope spec defects/gaps to an immutable
  `blueprint/amendments/ba-NNN` record + append-only `amendment-log.md` — which is now **first in the
  build read order**. Gate BP is never re-opened; locked bytes never change; `guard-thresholds.js`
  names the legal route instead of a dead end. Three new maintenance kinds
  (`blueprint-amendment`, `blueprint-amendment-log`, `deferred-register`) with reserved-path
  dispatch (suffix-anchored so fragment cycles cannot escape) and arithmetic id binding
  (`ba-007-*.md` ⇔ `amendment_id: BA-007`). `state.blueprint` gains `amendments` + an `abandoned`
  status; a cycle switch on a non-locked blueprint is rejected (no silent orphaning), and reconcile
  must say what happens to an in-flight blueprint when proposing a new cycle.
- **`scripts/validate-blueprint.js`** (blocker #2 — nine mutually-referential docs had zero
  deterministic checks): join keys added to the templates (`AC-NN-n`, `entity.field`, `SC-n`,
  `E-nnn`, event names, `DOD-n`/`MSP-n`, `DF-n`) plus language-stable `<!-- bp:… -->` /
  `<!-- pack:… -->` anchors, then a validator that checks set/status, the marker family
  (`[GUESS]`-family, `[OPEN]`, `[TBD]`, `[INFERRED]`, bare `___`, `<placeholders>`), cell
  completeness, referential integrity both directions, the **three-way FS↔schema↔API type check**
  (the archetypal mid-build logic conflict), traceability, DOD/MSP/AC test coverage,
  self-containment, pack-hash verification, and amendment integrity. Legacy packs degrade to named
  warnings — Layer 2 reads more, never less; blueprint-side checks are errors unconditionally.
  Registered in `coverage-report.js` (22 new requirements with honest tiers).
- **Cold-start runs are persisted evidence** (blocker #3): both levels now write
  `coldstart-l{1,2}-YYYYMMDD-NN.md` (tracked, never overwritten, FAIL runs too) with the per-file
  sha table of the exact copied set (hashed by `artifact-manifest.js` — one hashing implementation),
  and gate-check Layer 1 re-hashes the current set against the **latest** report mechanically. The
  L1 verdict travels via `audit-trail.md`'s LOCK section.
- **Guidance-loop fixes**: UBD entry is ONE sentence in all three contract files (LOCK failed + pack
  on disk + UBD & will-override; a UBD against an earlier gate is a stop — no pack, no stage 6);
  normative decision resolution order **pack trace → charter (cited by item id) → founder**, with a
  journaled `[DELEGATED — charter item, scope]` disposition, `auto_continue` never covering product
  decisions, and a prose fallback when AskUserQuestion is absent; `blueprint-overview.md` is the
  normative multi-session **resume ledger** with a 6.0 resume branch; the deferred register moved
  out of lockable `build-plan.md` into its own append-only `deferred-register.md` (`DF-n` rows,
  closures by reference); outward-claim preflight extended to BP over the new ux-spec copy
  inventory; **first-run flow (signup → aha)** and a consolidated **event dictionary** are now
  required artifact sections; `[GUESSED]` vocabulary defect fixed; guard-thresholds no longer
  freezes stage-6 drafting under the locked cycle's historical rule.
- **Stale files the review named**: maintenance-rules' "complete matrix" now assigns the blueprint
  class; method-rules §10 carries the sixth fact (amended, never edited); build-and-launch routes
  spec defects to amend-blueprint and puts the amendment log first on build day one;
  `artifact_kind` gained a hook↔skill parity fixture (THRESHOLD_FIELDS precedent).
- **Tests**: validator fixture tests (a valid Vietnamese-bodied blueprint passes; seeded
  type-conflict/uncovered-AC/marker/unknown-event/do-not-publish/dangling-amendment defects fail),
  artifact_kind parity, BAR id binding, abandonment transitions, coldstart-report exemption —
  suites now at 194 hook + 174 contract, all green. Coverage inventory: 95 requirements,
  55% deterministic (was 73 @ 48% — stage 6 added 22 requirements, 18 of them code/hook-enforced).

## v1.4.0 — 2026-07-31 · stage 6: implementation blueprint (gate BP)

The founder's finding that motivated it: the MVP Pack is a scope contract, and its cold-start bar —
"nothing *already decided* left to ask" — deliberately excused every product-level how-exactly
question (UI flow, field validation, error copy, webhook retries) as "build-session decision". Those
questions then got invented mid-build. Stage 6 closes that gap **after** LOCK, so validation
discipline is untouched and specs are never written for an unproven idea.

- **New stage 6** (`stage-6-blueprint` + templates + `templates/6-blueprint.md`): guided, post-LOCK,
  pre-build production of `blueprint/` — blueprint-overview, per-feature specs (acceptance criteria,
  field-level validation, error/empty/loading states, answered edge-case checklist,
  instrumentation), field-level data-schema, ux-spec, api-contract, integration-specs, nfr-spec,
  test-plan, build-plan. The model drafts, the founder decides; every invented detail is `[GUESS]`
  until a pack trace or founder confirmation lifts it.
- **New gate BP** (gate-contracts): coverage predicates over the pack (every core-loop step → spec;
  every tech-design entity → field-level schema; every DoD/MSP item → executable scenario; every
  tracking event → instrumentation), **refines-never-expands** (an untraceable spec is a scope
  addition → drop or declare-drift; the pack stays read-only), zero unresolved product decisions,
  no OPEN verdict. Entry: LOCK passed, or the recorded unvalidated-build-decision path.
- **Level-2 cold-start test**: new `blueprint-coldstart-tester` agent — reading only pack +
  blueprint in a clean copy, list every *product decision* a build session would still have to
  invent. Level 1 (`coldstart-tester`) keeps guarding LOCK; the two bars are cross-referenced.
- **State**: optional root `state.blueprint` block (`{cycle_id, status, gate, updated}`) — root-level
  because a LOCKed cycle's `gates` subtree is frozen (same placement reasoning as `maintenance`).
  `state-write.js` validates it when present: closed key set, locked⇔passed pairing, anti-erasure
  (never dropped; a locked record is frozen; supersession only via a new cycle's blueprint).
- **Hooks**: `validate-artifact.js` accepts stage 6 / gate BP (+ stage↔gate pairing), and its
  pipeline-version allowlists finally include 1.3.0/1.4.0 — template-stamped `1.3.0` artifacts had
  been silently blockable (latent since v1.3.0). `session-start.js` surfaces an in-progress
  blueprint so a fresh session resumes stage 6 instead of drifting into build.
- **Handoffs rewired**: stage 5's LOCK PASS now hands off to stage 6 ("build does not start here");
  `build-and-launch.md` applies after BP with **pack + blueprint as the two-layer contract**;
  gatekeeper gained the BP attack item (scope additions, model-resolved decisions, invented SLAs);
  `status` reports the blueprint phase; pipeline.md/READMEs document stage 6 and the BP row.
- **Tests**: 13 new hook tests (gate BP frontmatter, blueprint block acceptance/rejection/freeze),
  10 new contract tests (end-to-end BP wiring across contract files). Version literals swept to
  1.4.0 (enforced by the existing one-version test).

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
