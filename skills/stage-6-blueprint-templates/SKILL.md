---
name: stage-6-blueprint-templates
description: Artifact templates for stage 6 of the SaaS validation pipeline. Load when writing that stage's artifacts.
user-invocable: false
---

# Stage 6 — Implementation Blueprint templates (ideas/<slug>/blueprint/)

Shared frontmatter for every **pipeline** file below (values per file; `deferred-register.md` is the
one maintenance-phase exception, see its own block):

```yaml
---
artifact: <matches filename>     # e.g. fs-01-upload-report, data-schema
idea: <slug>
stage: 6
gate: BP
status: draft                    # ready when its checklist has no unanswered cell; locked at gate BP
evidence_grade: none             # blueprint files are design contracts, not evidence claims
rung: baseline-auto
pipeline_version: 1.14.0
updated: YYYY-MM-DD
---
```

**Join keys and anchors are load-bearing, not decoration** — `scripts/validate-blueprint.js` parses
the first markdown table after each `<!-- bp:… -->` anchor, and joins documents on the id
vocabularies below. Keep every anchor, id shape, and fixed token exactly as written (they are
identifiers per method-rules §Language — never translated), while all prose and cell contents follow
`state.language`:

| vocabulary | shape | declared in | referenced by |
|---|---|---|---|
| feature spec | `fs-NN` (filename `fs-NN-<slug>.md`) | feature-specs/ | overview index, test-plan, event dictionary |
| acceptance criterion | `AC-NN-<n>` (NN = its FS) | FS acceptance table | test-plan coverage map |
| field | `entity.field` (lowercase snake) | data-schema entities | FS field tables, api-contract cells (`entity.field: type`) |
| screen | `SC-<n>` | ux-spec screen inventory | FS states, flows, first-run |
| error code | `E<nnn>` | api-contract errors column | FS state rows (`code` column) |
| event | snake_case event name | overview event dictionary | FS instrumentation |
| DoD / MSP item | `DOD-<n>` / `MSP-<n>` | the pack (stage-5 templates ≥1.4.1) | FS traces, test-plan sources |
| deferral | `DF-<n>` | deferred-register.md | closure rows |
| amendment | `BA-<nnn>` (file `ba-<nnn>-<slug>.md`) | blueprint/amendments/ (post-BP) | amendment-log.md |
| subsystem / capability | `ss-NN` (file `ss-NN-<slug>.md`) / `CAP-NN-<n>` | subsystem-specs/ capabilities table | FS `uses` lines, JOB rows, budgets |
| eval binding | `EV-<n>` (threshold restated from mvp-pack/eval) | llm-kind ss spec evals table | AC cells, test-plan coverage |
| state transition | `ST-<entity>-<n>` | data-schema state-machines table | FS `touches`, conflict domains |
| invariant / job | `INV-<n>` / `JOB-<n>` | interaction-map.md | test-plan coverage / FS states |
| delegated decision | `DR-<n>` | blueprint-overview decision register | FS open-decision cells |
| state-row tokens | `error` \| `empty` \| `loading` \| `success` (+ `queued` \| `running` \| `cancelled` \| `partial` for async-CAP features) | FS/ux state tables | validator (fixed tokens, untranslated) |

## blueprint-overview.md (entry point + resume ledger)
```markdown
# Implementation Blueprint — <title>   [pack verdict VERBATIM from mvp-spec.md — never upgraded; on the UBD path it keeps its (PROSPECTIVE …) marker]
> Line 1 carries `supports unvalidated-build-decision.md (<date>)` iff that is the entry path.
> Read order for a build session: **blueprint/amendment-log.md if it exists (current truth = locked blueprint + amendments)** → mvp-pack/ (its own read order) → this file → feature-specs/ → data-schema.md → ux-spec.md → api-contract.md → integration-specs.md → nfr-spec.md → test-plan.md → build-plan.md → deferred-register.md
## Blueprint profile — which optional layers apply, and why (a simple CRUD product provably needs
## the 9 core files and skips subsystems/interaction-map; declaring it stops "required" reading as universal)
<!-- bp:profile -->
| layer | applies? | why |
|---|---|---|
| subsystem specs | yes/no | (an ADR names an engine/model/pipeline?) |
| interaction map | yes/no | (≥2 writers on an entity, an async capability, or an invariant?) |
| compliance rows | yes/no | (regulated domain flagged at 0.3b?) |
| per-side flows | yes/no | (state.sides has ≥2 sides?) |
| surface | ui/headless-api/cli/sdk/mixed | (declared in ux-spec frontmatter) |
## Artifact & feature index — THE resume ledger (one row per blueprint artifact AND per FS; a resuming session continues at the first non-ready row)
<!-- bp:index -->
| id (artifact / fs-NN) | title | pack trace (core-loop step # / DOD-n / MSP-n) | status | open decisions |
|---|---|---|---|---|
Next open decision batch: ___ (which artifact, which questions — updated every working session)
## Event dictionary (single source for payloads; FS instrumentation references, never redefines)
<!-- bp:event-dictionary -->
| event (snake_case) | pack tracking-plan trace (aha row REQUIRED, marked `aha`) | payload fields | fired by (fs-NN list) |
|---|---|---|---|
## Decision register — every DELEGATED decision (the founder let the model choose a CLASS of
## decision). Lives here, not in the charter: the pack's charter copy froze at LOCK, so a build-phase
## charter item is invisible to the build session that must obey it. A charter id may be cited as
## provenance only if it resolves in mvp-pack/founder-charter.md.
<!-- bp:decisions -->
| DR-n | scope delegated (class of decision) | founder's exact words | date | charter provenance (optional, must resolve in the pack copy) |
|---|---|---|---|---|
## Carry-forward awareness — open assumptions AND every quantitative assumption the blueprint rests
## on (attempts per success, per-user volume, concurrent users, artifact retention): each marked with
## its E-id if observed, or [GUESS]. A number nobody observed is the way green checks and a wrong
## product coexist — this table is where reality gets to disagree, and it feeds amend-blueprint/drift.
<!-- bp:carry-forward -->
| open assumption / quantity | value + source (E-id or [GUESS]) | which FS/docs depend on it | what changes if it falls |
|---|---|---|---|
```

## feature-specs/fs-NN-<slug>.md (one per core-loop step / behaviour-implying DoD module)
```markdown
# fs-NN — <feature>
<!-- bp:trace -->
- **Pack trace**: core-loop step ___ / DOD-__ / MSP-__ (untraceable = scope addition = not written)
- **User story** (V1 verbatim where it exists; invented wording = [GUESS] until founder lifts it):
## Touches (declared entity access — the cross-check is asymmetric: an entity this FS mentions in
## fields/states/instrumentation/api but does not declare here is an ERROR; declared-but-unmentioned
## is only a warning, so declare generously)
<!-- bp:touches -->
| entity | access (read / write / transition:ST-…) | why |
|---|---|---|
## Uses (subsystem capabilities — NEVER on the trace line; the trace line is the pack-side join)
<!-- bp:uses -->
- CAP-__-__ (or `none`)
## Main flow
<!-- bp:flow -->
1. user does ___ → system does ___ → user sees ___
## Acceptance criteria (binary; test-plan cites the AC id, never restates)
<!-- bp:acceptance -->
| id | Given | When | Then |
|---|---|---|---|
| AC-NN-1 | | | |
## Fields & validation (field keys MUST exist in data-schema.md)
<!-- bp:fields -->
| entity.field | type | rules/limits | default | on invalid (user-visible copy) |
|---|---|---|---|---|
## States (fixed tokens error/empty/loading/success; an FS using an `async: yes` CAP must ALSO have
## queued/running/cancelled/partial rows — the four screens everyone forgets; code references api-contract)
<!-- bp:states -->
| state | screen (SC-n) | trigger | code (E-nnn or —) | user sees (copy) | user can do |
|---|---|---|---|---|---|
## Edge cases — answered, never blank ("N/A <reason>" is legal)
<!-- bp:edge-cases -->
| case | behaviour |
|---|---|
| empty / duplicate / oversized input | |
| permission boundary (incl. cross-tenant) | |
| dependency failure (LLM / webhook / export target) | |
| retry / idempotency (user does it twice) | |
| concurrency (two sessions, same record) | cite `interaction-map` conflict domain if this entity has other writers — do not restate |
| timezone / locale / currency (where dates or money appear) | |
## Instrumentation (events MUST exist in the overview event dictionary — reference, don't redefine payloads)
<!-- bp:instrumentation -->
| event (from dictionary) | fired when |
|---|---|
## Open decisions   <!-- empty at status: ready -->
<!-- bp:open-decisions -->
| # | question | resolution order tried (pack trace → charter rule → founder) | founder's answer or `[DELEGATED — DR-n]` (date) |
|---|---|---|---|
```

## data-schema.md
```markdown
# Data schema (field-level — tech-design.md fixed the entities; this makes them buildable)
<!-- bp:entities -->
## <entity>
| entity.field | type | constraints | default | serves (fs-NN / DOD-n / MSP-n / DF-n) |
|---|---|---|---|---|
<!-- bp:state-machines -->
## State machines (every transition has an owner; system-triggered ones need a user-visible
## consequence in some FS state/ux flow, or `invisible because ___`)
| ST-<entity>-<n> | from | to | trigger (fs-NN / system:<ss-NN·JOB-n·provider>) | guard |
|---|---|---|---|---|
<!-- bp:stores -->
## Non-relational stores (documents, graphs, blobs — the model lives in the OWNING subsystem spec;
## this table only indexes it: forcing a scene graph into entity.field is how the schema lies)
| store | kind (document/graph/blob) | owned by (ss-NN) | schema version + forward-compat rule |
|---|---|---|---|
<!-- bp:indexes -->
## Indexes (from core-loop access paths)
<!-- bp:migrations -->
## Migrations approach & seed data (relational AND document-schema: what happens to a saved
## document created under an older schema/model version — see the owning ss spec's pinning section)
<!-- bp:retention -->
## Retention / deletion mechanics (one row per MSP data commitment — a promise needs a job design)
| MSP-n | mechanism (column/job/endpoint) | verified by (test-plan case) |
|---|---|---|
```

## ux-spec.md
Frontmatter adds `surface: ui | headless-api | cli | sdk | mixed` (closed enum, default ui — an
API/CLI/SDK product IS a surface; a "screen" is then an endpoint group / command / doc page).
```markdown
# UX spec
<!-- bp:screens -->
## Surface inventory (per-row surface overrides the frontmatter default; requirements key off the ROW)
| SC-n | purpose | entry points | states (error/empty/loading/success → fs-NN refs) | surface |
|---|---|---|---|---|
<!-- bp:flows -->
## Flows (happy path + EVERY error path the feature specs define)
| flow | steps (SC-n list) | exit conditions |
|---|---|---|
<!-- bp:first-run -->
## First-run flow (signup → aha event) — REQUIRED; when state.sides[] has ≥2 sides, ONE FLOW PER SIDE
## (side column names the side id; record which side the pack's aha measures + the other side's activation event)
| step | SC-n | user does | system does | distance to aha | side |
|---|---|---|---|---|---|
Aha event: `<event from dictionary>` — time bound restated from the pack: ___
<!-- bp:navigation -->
## Navigation map
<!-- bp:copy -->
## Outward CLAIM inventory — **pack-class claims only**, not every UI string: anything asserting an
## outcome, benefit, quantity, guarantee, security/compliance property, price/terms, or a restatement
## of the pitch. Labels, field hints, empty-state prompts and error copy are NOT claims and are
## specified in their FS. (v1.7.0 narrowing: a disposition per UI string was bureaucracy; the real
## risk is marketing-grade assertions, which ship to paying users.)
| where (SC-n / state row) | claim (verbatim) | source (positioning / E-id / proposition) | publication_disposition |
|---|---|---|---|
<!-- bp:accessibility -->
## Accessibility floor — NEVER N/A; substitute per surface, don't cut:
## UI → keyboard, contrast, labels/alt, focus order · headless → stable machine-readable error codes,
## documented rate limits, deprecation/versioning policy (the "can a consumer safely depend on this" floor)
```

## api-contract.md
```markdown
# API / interface contract
<!-- bp:endpoints -->
| endpoint/action | auth | request (`entity.field: type` tokens) | response (`entity.field: type` tokens) | errors (E-nnn → meaning → FS state row) |
|---|---|---|---|---|
<!-- bp:api-lifecycle -->
## API lifecycle (REQUIRED for any non-ui surface — promises made the instant a customer integrates;
## joined to MSP-9 "what happens when it breaks"): versioning scheme ___ · deprecation window ___ ·
## breaking-change policy ___ · key issuance/rotation ___
```

## integration-specs.md
```markdown
# Integration specs (one section per buy-don't-build item from tech-design ADRs)
<!-- bp:integrations -->
## <provider — auth|payments|email|analytics|storage>
- Scope used: ___ · Config/env vars: ___ · Cost basis: ___
- Webhooks: events consumed ___ · signature verification ___ · idempotency ___ · retry window ___
- Failure path (provider down ≠ product down — degraded behaviour): ___
- Sandbox/test-mode plan: ___
```

## nfr-spec.md
```markdown
# Non-functional requirements (every number traced or founder-confirmed — an unagreed SLA is a defect)
<!-- bp:performance -->
## Performance & capacity
| target | number | source (E-id / R1 / concierge / founder-confirmed) |
|---|---|---|
<!-- bp:authz -->
## Platform support · Authz matrix (role × resource → allowed actions)
<!-- bp:security -->
## Security concretization (final-20% made checkable): input validation ___ · rate limits ___ · secrets ___ · backup schedule + restore drill ___
<!-- bp:ops -->
## Operational duties from the MSP: support intake ___ · break behaviour ___ · export path ___ · sunset/data return ___
<!-- bp:compliance -->
## Compliance — ALWAYS present: REG rows, or `N/A — <basis>` (charter item / source ref; "no regulation
## applies" is itself a claim; model-drafted obligations are [GUESS] and never satisfy the section)
| REG-n | regime | applies because (source ref) | obligation affecting MVP | mechanism (MSP-n/DOD-n/ss join) | verified by |
|---|---|---|---|---|---|
```

## test-plan.md
```markdown
# Test plan
<!-- bp:coverage -->
## Coverage map (every DOD-n + MSP-n + INV-n + EV-n → ≥1 scenario; every AC id → exactly one case BY REFERENCE)
| source (DOD-n / MSP-n / INV-n / EV-n / AC-NN-n) | scenario | kind (unit/integration/e2e/eval) | determinism (blank = INHERIT the CAP's declaration; fill only to override) |
|---|---|---|---|
Mandatory unless the matching DoD module is N/A: cross-tenant isolation · payment-failure path · backup restore.
A stochastic core with no determinism strategy makes CI flaky by construction — a blank cell on an
llm/async case is an error; WHICH strategy is right stays a founder/Layer-2 call.
<!-- bp:eval -->
## AI-core: eval harness from mvp-pack/eval/ wired as CI day one — threshold ___% (restated from pack)
## UAT & adoption run: per build-and-launch.md (reference, don't duplicate)
```

## build-plan.md
```markdown
# Build plan
<!-- bp:milestones -->
## Milestones (core loop end-to-end FIRST — walking skeleton)
| # | milestone | fs-NN ids | done when | depends on |
|---|---|---|---|---|
<!-- bp:environment -->
## Environment as spec (checkable, not advisory)
- [ ] repos/CI ___ · [ ] dev/prod split, no local write path to prod · [ ] migrations via CI only
- [ ] secrets policy ___ · [ ] error tracking + uptime alert to a real person before first outside user
```
(No deferred-register section here — deferrals live in `deferred-register.md`, their own append-only file.)

## interaction-map.md (REQUIRED whenever ≥2 FS write one entity, ≥1 CAP is async, or any INV exists)
```markdown
# Interaction map — where features meet
<!-- bp:conflict-domains -->
## Conflict domains (one row per entity/document with ≥2 writers — the writers cell must equal the
## validator's computed writer set; "last write wins" is an answer, a blank is not)
| entity | writers (fs-NN set) | scope (single-user-multi-session / multi-user) | who wins | merge rule | lock/lease | loser sees | undo scope |
|---|---|---|---|---|---|---|---|
If scope is single-user-multi-session and multi-user is out of MVP: cite the cut-list row that cuts it.
<!-- bp:pairwise-exceptions -->
## Pairwise exceptions (may be empty; `no interaction <reason>` is legal ONLY here, never in a domain row)
| fs-A | fs-B | interaction or `no interaction <reason>` |
|---|---|---|
<!-- bp:invariants -->
## Global invariants (each traces pack-side or derives from ST/CAP — an untraced invariant is a new
## product promise wearing an invariant's clothes; each covered in test-plan like DOD/MSP)
| INV-n | invariant | trace (pack / ST-… / CAP-…) | covered by |
|---|---|---|---|
An invariant already expressed as a DoD item (e.g. "user A cannot see user B's data" = DOD-6) stays
a DoD item and is NOT duplicated here — two homes for one rule means nothing can tell which is
authoritative when they drift. INV-n is for invariants the DoD does not express.
<!-- bp:jobs -->
## Jobs (a job outlives the screen AND the capability call — durable object, not a loading state.
## Undo-across-a-generation-boundary lives here, because undo is a job-vs-edit interaction.)
| JOB-n | triggered by (fs-NN / CAP-…) | durable? | cancellable? | on second submit | on disconnect/tab close | result lifetime | user notified how |
|---|---|---|---|---|---|---|---|
```

## subsystem-specs/ss-NN-<slug>.md (one per engine/model/pipeline named in tech-design's ADRs)
Frontmatter adds one key to the shared block: `kind: llm | graphics | realtime | pipeline | generic`
(closed enum — an open field would let a spec dodge its kind's required anchors). Required anchors
per kind are declared in the gate-contracts BP section and mirrored by the validator (parity-tested).
```markdown
# ss-NN — <subsystem>   (kind: <kind>)
<!-- bp:trace -->
- **Pack trace**: ADR #__ / buy-don't-build item ___ / domain-model element ___ (a subsystem spec
  with no pack trace is a scope addition in subsystem form)
<!-- bp:capabilities -->
## Capabilities (FS reference these ids in their `uses` line; an orphan CAP no FS uses = scope addition)
| CAP-NN-<n> | what | inputs | output schema | p95 latency budget | cost/call budget | async? | source (R1/eval/founder-confirmed) | determinism (recorded-fixtures/seeded/live-eval-threshold/manual — INHERITED by every test case using this CAP) |
|---|---|---|---|---|---|---|---|---|
<!-- bp:degradation -->
## Degradation ladder (provider slow/down/quota — per rung: what the user gets instead)
<!-- llm kind only -->
<!-- bp:context -->
## Context assembly (what goes into the prompt, in what order, truncation rules — versioned as config)
<!-- bp:output-contract -->
## Output contract & repair (schema, validation, repair/retry strategy, give-up behaviour)
<!-- bp:evals -->
## Eval bindings (thresholds RESTATED from mvp-pack/eval — string-verifiable, never invented;
## every EV cited by ≥1 AC and present in test-plan coverage — a threshold no acceptance depends on
## is a number with no consequence)
| EV-n | what it scores | threshold | source (mvp-pack/eval ref) |
|---|---|---|---|
<!-- bp:budgets -->
## Budgets (cost/call AND per-user period cap, arithmetic shown inline against R1's marginal-cost
## number — an expensive core plus a generous quota is how unit economics quietly invert)
<!-- bp:pinning -->
## Pinning & change policy (llm: model + provider + version, what happens to saved outputs when it
## moves · graphics/pipeline: document schema version + forward-compat rule for older saved docs)
<!-- graphics/pipeline kinds -->
<!-- bp:doc-model -->
## Document/scene model (own notation — indexed from data-schema's non-relational stores)
<!-- bp:assets -->
## Asset pipeline (formats, size caps, processing, storage)
<!-- bp:perf-budgets -->
## Performance budgets (FPS × device classes; contained by nfr-spec's user-visible targets)
<!-- bp:compat -->
## Compatibility matrix (browser/GPU/device)
<!-- bp:interaction-semantics -->
## Interaction semantics (undo/redo command model, selection, coordinate systems/units)
<!-- bp:artifact-lifecycle -->
## Generated-artifact lifecycle (llm/graphics/pipeline kinds: storage location · growth per user ·
## quota + behaviour at the limit · version retention/eviction · export format — the CONCRETE answer
## to the MSP export promise · deletion mechanics; join the MSP-n ids so promise and mechanism are one id)
<!-- realtime kind -->
<!-- bp:sync-model -->
## Sync model (authority, conflict resolution, offline behaviour)
<!-- ledger kind -->
<!-- bp:ledger-model -->
## Ledger model (accounts, entries, sum-to-zero invariants — money = 100% understand)
<!-- bp:idempotency -->
## Idempotency (keys, dedupe windows — a double top-up is a real user's real money)
<!-- bp:reconciliation -->
## Reconciliation (against the payment provider: cadence, mismatch handling)
<!-- bp:failure-semantics -->
## Failure semantics (charge succeeded, generation failed → refund/credit/retry rule — the decision
## that actually gets invented mid-build)
<!-- llm kind with takes_actions: yes (frontmatter) -->
<!-- bp:action-authorization -->
## Action authorization (allowlist, what runs without asking, what is irreversible)
<!-- bp:run-limits -->
## Run limits (step/loop cap, spend cap per run, blast radius, dry-run)
```

## deferred-register.md (maintenance-phase, append-only — the ONE non-pipeline file in the set)
```markdown
---
artifact: deferred-register
artifact_kind: deferred-register
idea: <slug>
phase: maintenance
cycle_id: C<n>
mutation_policy: append-only
publication_status: draft
as_of: YYYY-MM-DD
pipeline_version: 1.14.0
updated: YYYY-MM-DD
---
# Deferred register (NON-PRODUCT deferrals only — a deferred product decision fails the level-2 test)
<!-- bp:deferred -->
| DF-n | item | why deferrable (ops/external) | owner | date | status (open / closed by DF-n closure row) |
|---|---|---|---|---|---|
Closure = a NEW appended row referencing the open DF-n, with date + evidence; rows are never edited.
```

## blueprint/amendments/ba-<nnn>-<slug>.md + blueprint/amendment-log.md (post-BP only)

Owned by the `amend-blueprint` skill — templates live there. Never created during stage 6 drafting.
