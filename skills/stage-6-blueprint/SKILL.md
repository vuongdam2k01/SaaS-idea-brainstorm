---
name: stage-6-blueprint
description: Stage 6 of the SaaS validation pipeline - turn the locked MVP Pack into a complete implementation blueprint before any product code. Use when an idea in ideas/<slug>/ has passed LOCK (or recorded an unvalidated-build decision) and the founder is preparing to build - feature specs, field-level data schema, UX spec, API and integration contracts, NFRs, test plan, build plan, level-2 cold-start test, gate BP.
user-invocable: false
---

Stage 6: the implementation blueprint. The MVP Pack answers **what, why, and where the boundary is**;
this stage answers **exactly how, at the product level** — so that "vô số vấn đề phát sinh khi
implement" get answered here, with the founder, instead of being invented mid-build by whoever is
typing. Output: `blueprint/` beside `mvp-pack/`. Quality bar: the **level-2 cold-start test** — a
competent build session reading only pack + blueprint can implement every feature **without
inventing any product decision**. Load `method-rules`; read `state.json`; resolve the operating
cycle (fragment cycles use `cycles/<id>/blueprint/`). Templates: the `stage-6-blueprint-templates`
skill. The BP contract: the `method-rules-gate-contracts` skill (Gate BP section).

**Working posture for the whole stage**: the model drafts, the founder decides. Resolution order
for every open decision is normative: **(1) pack trace → (2) standing charter rule, cited by item id
and replayed at the next checkpoint → (3) ask the founder.** Consulting the charter FIRST matters:
it is the declared interpretive authority, and re-asking what the founder already settled is how
decision fatigue produces rubber-stamping. Every detail not derivable from the pack starts
`[GUESS]`; it is lifted only by founder confirmation (intent), a pack trace (derivation), or an
explicit journaled **delegation** — `[DELEGATED — charter item CH-nn, scope: <class of decision>]`,
which is a founder act with a record, never a silent model choice. **`auto_continue` never covers a
blueprint product decision.** Batch decisions with AskUserQuestion (≤4 per batch; when it is
unavailable, present the same content in prose and take the decision from the reply — the mechanism
may degrade, the checkpoint may not), **schema-affecting decisions first** (they are the expensive
ones), then behaviour, then copy. Capture every veto and strong preference into
`founder-charter.md` as usual — the charter is not frozen for new *build-phase* intent items even
though its locked pipeline items never change. This stage is a sequence of working sessions, not one
pass; end every session with files written, the overview index rows updated, and
`state.blueprint.updated` bumped.

## 6.0 Entry guard — run FIRST

0. **Resume branch**: if `state.blueprint` already exists for this cycle, do not re-run the entry
   guard as a from-scratch gate — read `blueprint-overview.md`'s index (the normative resume
   ledger: one row per artifact AND per FS), report progress to the founder, and continue at the
   first non-`ready` row, starting with its "next open decision batch" line.
1. Entry (the contract's one sentence): `gates.LOCK` is `passed` — verify in state AND confirm the
   pack label no longer carries `(PROSPECTIVE …)`. Sole exception: `gates.LOCK` is `failed` AND a
   complete `mvp-pack/` exists on disk AND `unvalidated-build-decision.md` + its `will-override`
   journal row exist → proceed; the pack label KEEPS its `(PROSPECTIVE …)` marker on this path and
   `blueprint-overview.md` quotes it verbatim including the marker, with the UBD reference on
   line 1. A UBD recorded against any earlier gate is a **stop**: there is no pack to refine —
   stage 6 needs the pack's core loop, DoD and MSP; return to stage 5.
2. Drift boundary (gate-check's rule): declared-unreconciled drift blocks the BP *gate check* later;
   drafting may proceed, but say so.
3. Create `blueprint/` (+ `blueprint/feature-specs/`) and the root `state.blueprint` block via
   state-write: `{cycle_id, status: "in_progress", gate: {status: "pending", passed_date: null,
   notes: ""}, updated}`.
4. **Read the entire pack from disk** in its stated read order (mvp-spec → tech-design → DoD →
   charter → carry-forward → EQR → audit-trail). Files are the record; the conversation that
   produced the pack is not. Note every carry-forward assumption — specs built on an open assumption
   say so inline.

## 6.1 Decomposition — the blueprint work list

From the core loop (≤5–7 steps), derive the feature-spec list: normally one `fs-NN-<slug>.md` per
core-loop step, plus one per DoD conditional module that implies user-facing behaviour (payment
failure handling, data deletion path). **Then ask the non-CRUD question**: which parts of the loop
are an engine, a model, or a pipeline rather than forms-and-tables? Every ADR in `tech-design.md`
that names one spawns a `subsystem-specs/ss-NN-<slug>.md` (closed `kind` enum; AI-core without an
llm-kind spec is a BP blocker) — the LLM core and a 3D engine get first-class homes, not a smear
across edge-case rows. Plan `interaction-map.md` whenever two features will write one entity, any
capability is async, or a global invariant exists. Present the breakdown to the founder for approval — it fixes
the stage's scope of work. **Traceability seed**: each planned FS names its pack trace (core-loop
step #, `DOD-n`, `MSP-n`) before a word of spec is written. A planned FS with no trace is a scope
addition: drop it or route the founder to `declare-drift` (the pack is never edited — see the
refines-never-expands rule in the BP contract). Write `blueprint-overview.md` now, `status: draft` —
it carries the **resume ledger** (one index row per artifact and per FS, plus the "next open
decision batch" line, updated every session) and the **event dictionary** (single source for event
payloads, seeded from the pack's tracking plan with the aha event first; feature specs reference it
and never redefine payloads).

## 6.2 Feature specs → `feature-specs/fs-NN-<slug>.md` (the heart of the stage)

Per feature, in this order:

- **Trace + user story** in the customer's own words where V1 verbatims exist (the ledger seeded all
  copy; reuse it — invented user language is `[GUESS]`).
- **Touches + uses**: declare every entity this feature reads/writes/transitions (the validator's
  cross-check is asymmetric — omission is an error, over-declaring only a warning, so declare
  generously), and cite subsystem capabilities on the `uses` line (never on the trace line). An FS
  using an `async: yes` capability must also spec the `queued/running/cancelled/partial` states and
  have its JOB row in the interaction map. An FS on an llm capability writes its acceptance against
  `EV-n` eval ids, never exact output text.
- **Main flow + acceptance criteria** (given/when/then, binary checkable — they become test-plan
  cases verbatim).
- **Field-level behaviour**: every input's type, validation rule, limits, defaults; every derived
  value's formula shown inline (traceability rule 4: derived numbers carry their arithmetic).
- **The three states nobody specs until it's too late**: error, empty, loading — per screen-touching
  feature, each with its user-visible copy.
- **Edge-case checklist, answered not just listed**: empty/duplicate/oversized input · permission
  boundary (who else can see/do this — cross-tenant explicitly) · dependency failure (the LLM call,
  the webhook, the export target) · retry/idempotency (what happens when the user does it twice) ·
  concurrency (two sessions, same record) · timezone/locale/currency where any date or money
  appears. "N/A because ___" is a legal answer; a blank is not.
- **Instrumentation**: which tracking-plan events this feature fires, with payload fields.

Founder-question protocol: collect open decisions per FS, present in batches (AskUserQuestion),
record answers directly into the spec, lift the `[GUESS]` tags, and log intent signals to the
charter. Never resolve a product question by picking the plausible answer yourself — that is exactly
the failure mode the level-2 test exists to catch. Promote each FS `draft → ready` when its checklist
has no unanswered cell.

## 6.3 Data schema → `data-schema.md`

`tech-design.md` fixed entities/relations/states; this file goes field-level: per entity every field
with type, constraints, nullability, defaults; indexes for the access paths the core loop implies;
state machines spelled out (allowed transitions); migration approach + seed data; retention/deletion
mechanics for every MSP data commitment (a promised deletion path needs a column/job design, not a
sentence). **State machines are tables** (`ST-<entity>-<n>` from/to/trigger/guard — every transition
owned by an fs-NN that claims it in `touches`, or `system:<…>` with a user-visible consequence or an
explicit `invisible <reason>`); **non-relational stores** (documents/graphs/blobs) are indexed here
but modelled in their owning subsystem spec — forcing a scene graph into `entity.field` is how the
schema lies. Consistency check both directions: every tech-design entity appears here; every field
here serves a feature spec or a DoD/MSP duty — an orphan field is scope creep in schema form.

## 6.4 UX spec → `ux-spec.md`

Screen inventory (`SC-n`, purpose, entry points); user flows as step lists for the happy path AND
each error path a feature spec defined; the **first-run flow (signup → aha event)** — required, with
the aha event's trigger point marked and its time bound restated from the pack, because screens plus
empty states do not compose into a first-run sequence and "% reaching aha" is what the soft launch
measures; per-screen states (loading/empty/error/success) referencing the FS copy; navigation map;
accessibility floor (MSP rule: "minimum" never means minimum safety — keyboard/contrast/labels are
not cuttable); and the **outward copy inventory**: every user-visible claim with its source
(positioning pitch, V1 verbatims, or proposition) and a `publication_disposition` per claim — the
outward-claim preflight applies at gate BP because product copy ships to paying users.

## 6.5 Interface contracts → `api-contract.md` + `integration-specs.md`

- `api-contract.md`: every interface the product exposes or consumes internally — endpoints/actions,
  request/response shapes with field types, auth model per endpoint, error codes and their meaning to
  the UI (paired with the FS error states).
- `integration-specs.md`: one section per buy-don't-build item (auth, payments, email, analytics,
  storage — as chosen in tech-design's ADRs): provider, exact scope used, config/env vars named,
  webhook contracts (events consumed, signature verification, idempotency, retry window), failure
  path (provider down ≠ product down: state the degraded behaviour), sandbox/test-mode plan, and
  cost basis. The build-and-launch payment-webhook rules land here as spec, not as a reminder.

## 6.5b Subsystems & interaction map → `subsystem-specs/ss-NN-*.md` + `interaction-map.md`

The founder-decides discipline is at its most important here, because these are the decisions with
the longest regret horizon. Per subsystem (kind-conditional anchors per the BP contract): capability
table with budgets traced to R1 (invent nothing), degradation ladder, and for llm-kind — context
assembly, output contract + repair, `EV-n` bindings string-verifiable against `mvp-pack/eval/`,
per-user cost cap with the arithmetic shown against R1's marginal cost, **pinning** (model/version +
what happens to saved outputs when it changes); for graphics/pipeline — document model, asset
pipeline, perf budgets contained by nfr targets, compatibility matrix, interaction semantics
(undo/redo command model), and the **generated-artifact lifecycle** answering the MSP export/deletion
promises concretely. Then `interaction-map.md`: conflict-domain rows for every multi-writer entity
(the writers cell must equal the computed set), scope token with a cut-list join when multi-user is
out, invariants `INV-n` traced and test-covered, and JOB rows for everything async — undo across a
generation boundary is decided here, with the founder, not discovered in a merge conflict.

## 6.6 Non-functional requirements → `nfr-spec.md`

Performance/latency targets and capacity assumptions — each traced (R1 measurements, concierge
observation) or founder-confirmed `[GUESS]`-lifted, never silently invented; browser/device support;
security concretization of the final-20% list (authz matrix per role×resource, input-validation
strategy, rate limits with numbers, secrets handling, backup schedule + restore drill); operational
duties derived from the MSP (support intake channel, break behaviour, export path, sunset/data-return
mechanics). Rule from the MSP carries over verbatim: **invent nothing** — an unagreed SLA number in
an NFR is the same defect as in the pack.

## 6.7 Test plan → `test-plan.md`

Every DoD item, MSP commitment, invariant (`INV-n`) and eval binding (`EV-n`) maps to at least one
executable scenario; every FS acceptance criterion becomes a case (reference by AC id — do not
restate and drift); cross-tenant isolation and payment-failure paths get explicit scenarios (they
are DoD invariants); every llm/async-backed case carries a **determinism strategy**
(recorded-fixtures / seeded / live-eval-threshold / manual — a stochastic core with no determinism
strategy makes CI flaky by construction); for AI-core the pack's `eval/` harness is wired as CI from
build day one with its threshold restated; UAT and the soft-launch adoption run stay in
build-and-launch — reference, don't duplicate.

## 6.8 Build plan → `build-plan.md`

Milestone order with the **core loop end-to-end first** (walking skeleton), then DoD modules, then
polish — each milestone lists its FS ids and its "done when"; dependency notes (what blocks what);
environment setup as spec: repos, CI, dev/prod separation with no local write path to prod,
migrations via CI only, secrets policy, error tracking + uptime alerting wired before first outside
user (build-and-launch's non-negotiables, turned into checkable setup steps). Deferrals go to
**`deferred-register.md`** — its own append-only maintenance-phase file, NEVER a section of
`build-plan.md` (a live to-do list inside a file that locks at BP either never closes or forces a
silent edit): `DF-n` rows, non-product deferrals only (ops/external waits), each with owner + real
date; closures are new appended rows referencing the open id, with date + evidence. A product
decision may never be deferred here.

## 6.9 Self-containment, level-2 cold-start & gate BP

Stage 6 owns this closing sequence, in order:

1. **Validator pass**: run
   `node "${CLAUDE_SKILL_DIR}/../../scripts/validate-blueprint.js" <idea-dir> --at-gate --json` and
   fix every error — the marker family (`[GUESS]`-family, `[OPEN]`, `[TBD]`, `[INFERRED]`, bare
   `___`, unsubstituted `<…>`), unanswered cells, broken joins, FS↔schema↔API type disagreements,
   dangling traces. Its warnings go to the founder by name. Every required pipeline artifact
   `ready`.
2. **Level-2 cold-start test**: copy `mvp-pack/` and `blueprint/` alone into a clean temporary
   directory and spawn `blueprint-coldstart-tester` (Agent tool) on the copy — testing in place
   would miss broken cross-references. **Persist the run before anything else**: create the manifest
   over the copied set (`artifact-manifest.js create … --out private/manifest-coldstart-l2-<date>-<NN>.json`),
   then write `blueprint/coldstart-l2-<date>-<NN>.md` (next unused NN — never overwrite; a FAIL run
   is persisted too) containing the verdict verbatim, the manifest citation `path@sha256`, and the
   per-file sha table inlined from the manifest. Any in-scope open question → fix, re-run (new NN).
   Do not invoke the gate before the latest report is a PASS; the BP predicate requires it, so an
   early check is a guaranteed FAIL.
3. **Invoke `gate-check` for BP** as a full check (its Gate BP specifics section). On PASS,
   gate-check locks the blueprint set and the state block, and build begins per
   `${CLAUDE_SKILL_DIR}/../../process/build-and-launch.md` with **pack + blueprint as the two-layer
   contract** — the pack bounds scope, the blueprint binds implementation. On FAIL, fix the named
   documents and return to step 1 (a changed blueprint invalidates the cold-start run and manifest).

During build, two different discoveries route two different ways: a **spec defect or gap** (still in
MVP scope — an edge case only code exposes, a provider behaving differently than documented, a logic
conflict between two specs) goes through the **`amend-blueprint` skill** — founder-answered scope
test, immutable `ba-NNN` amendment record, append-only `amendment-log.md` first in the build read
order; locked files never change. **Scope-level departure** (features changed/added/removed, price
or buyer shifted) is drift: `declare-drift`, then `reconcile`. If a reconcile proposes a new cycle
while this blueprint is unfinished, the blueprint is explicitly `abandoned` (state write + a
`blueprint-abandoned` journal row) — never silently orphaned.
