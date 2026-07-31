---
name: method-rules-gate-contracts-bp
description: Normative contract for gate BP (stage 6, the implementation blueprint) - coverage predicates, interaction and subsystem layers, surfaces, compliance, amendment boundary. Load only when working on stage 6 or checking gate BP.
user-invocable: false
---

# Gate BP contract (normative satellite of `method-rules-gate-contracts`)

Split out of the main contract in v1.7.0 for the same reason maintenance-rules
lives outside the default bundle (method-rules §10): this is ~2,300 words that
**gates F, C, V1, V2, V3, R1, R2, P and LOCK never need**, and gate-check loads
the contract at every gate. The main file keeps BP's one-line row so the gate
list stays complete; everything else about BP lives here.

**Load this skill when**: you are running the `stage-6-blueprint` skill, the
`amend-blueprint` skill, or a gate check whose gate is `BP`. Otherwise do not.

## Gate BP (stage 6 — implementation blueprint, post-LOCK, pre-build)

BP is the only gate that runs **after** LOCK. Its state deliberately does not live in the cycle's
`gates` object — that subtree froze when the cycle locked — but in the root-level
`state.blueprint.gate` block (state-schema), the same placement reasoning as `maintenance`.
Everything else about gate discipline is unchanged: three layers, gatekeeper, manifest pin,
`gate-verdict` journal row, audit-trail section, founder approval.

- **Entry** (one sentence, identical in stage 6, gate-check, and here): `gates.LOCK` is `passed` —
  OR `gates.LOCK` is `failed` AND a complete `mvp-pack/` exists on disk AND
  `unvalidated-build-decision.md` + its `will-override` journal row exist. A UBD recorded against any
  earlier gate is an explicit **stop**: there is no pack to refine — stage 6 needs the pack's core
  loop, DoD and MSP; return to stage 5. On the legitimate UBD path the pack label keeps its
  `(PROSPECTIVE — LOCK not yet passed)` marker (Layer 3 strips it only on a LOCK PASS) and
  `blueprint-overview.md` quotes it verbatim including the marker, with the UBD reference on line 1.
- **Refines, never expands.** Every feature spec traces to a core-loop step, a DoD module (`DOD-n`),
  an MSP field (`MSP-n`), or a cut-list boundary decision in the locked pack. A spec with no pack
  trace is a **scope addition** and a formal blocker — the legal routes are: drop it, or the founder
  declares a scope change, which is drift against a locked pack (declare-drift → reconcile → possibly
  a new cycle), never a silent blueprint line. The cut list binds the blueprint exactly as it binds
  the build.
- **Coverage predicates** — the deterministic core is `scripts/validate-blueprint.js` (exit 0
  required; its warnings are handed to Layer 2 **by name**, the `possibly-prescriptive` precedent —
  a legacy pack without `DOD-n`/`MSP-n`/anchor ids gets *more* Layer-2 reading, never less). It
  checks: the artifact set + statuses; the marker family; cell completeness (edge cases answered,
  `N/A <reason>` legal, blanks not); referential integrity both directions over the join keys
  (fs-NN, AC-NN-n, SC-n, E-nnn, `entity.field`, event names, `DOD-n`/`MSP-n`, `DF-n`); the
  **three-way type check** (FS fields vs `data-schema` vs `api-contract` — the archetypal
  mid-build logic conflict, caught before code); traceability; test coverage (every DOD/MSP → ≥1
  scenario, every AC cited exactly once); self-containment; pack-hash verification. Beyond the
  script, Layer 1 verifies by reading: the **event dictionary** in `blueprint-overview.md` is the
  single payload source (aha event first) and FS instrumentation only references it; `ux-spec.md`
  contains the **first-run flow (signup → aha)** with the pack's time bound restated; every
  buy-don't-build item has an integration spec including its failure path; `build-plan.md` orders
  milestones core-loop-first and applies the environment rules (dev/prod split, migrations via CI).
- **Interaction layer (v1.5.0 — features meet HERE, not in prose).** Each FS declares its entity
  access in a `touches` table; the cross-check is deliberately **asymmetric** — an entity the FS uses
  elsewhere (fields, state-machine triggers) but does not declare is an *error* (omission is the
  failure mode), a declared-but-unmentioned entity is only a warning (pure reads legitimately mention
  nothing; an error there would push people to under-declare). The required unit of conflict
  resolution is the **conflict domain**, not the pair: one `interaction-map.md` row per entity with
  ≥2 writers — and its `writers` cell must **set-equal the validator's computed writer set** (a
  forgotten writer is the actual failure). Every domain row answers who-wins · merge rule ·
  lock/lease · loser-sees · undo-scope with a real answer ("last write wins" is an answer; `none`
  isn't) and carries a scope token (`single-user-multi-session` | `multi-user`; multi-user out of
  scope → cite the cut-list row, so absence is explicit, not silent). `no interaction <reason>` is
  legal only in the pairwise-exceptions table. **State machines are tables** (`ST-<entity>-<n>`,
  from/to/trigger/guard): every transition has an owner (`fs-NN` — which must claim it in its
  `touches` — or `system:<…>`); a trigger-less transition is dead schema or a missing spec, and a
  system-triggered one needs a user-visible consequence in some FS state/ux flow or an explicit
  `invisible <reason>`. **Global invariants** (`INV-n`) trace pack-side or derive from ST/CAP (an
  untraced invariant is a new product promise wearing an invariant's clothes) and join the test plan
  like DoD/MSP. **Jobs are the third class**: a multi-minute generation is a durable object, not a
  loading state — any async capability requires JOB rows (durable? cancellable? second submit?
  disconnect? result lifetime? notification?), the using FS's states table must carry
  `queued|running|cancelled|partial`, and undo-across-a-generation-boundary lives in the jobs
  section because undo is a job-vs-edit interaction.
- **Subsystem layer (v1.5.0 — the non-CRUD core gets a first-class home).** One
  `subsystem-specs/ss-NN-<slug>.md` per engine/model/pipeline named in tech-design's ADRs, with a
  **closed `kind` enum** (`llm | graphics | realtime | pipeline | generic` — an open field would let
  a spec dodge its kind's required anchors). Capabilities are ids (`CAP-NN-<n>`) with budgets
  (p95 latency, cost/call, async?, source) — FS cite them on a separate `uses` line, **never on the
  trace line** (the trace line is the pack-side join; a subsystem reference there would launder a
  missing pack trace). Every CAP must be used by ≥1 FS (**orphan capability = scope addition in
  subsystem form**, the orphan-field rule's exact analogue); a subsystem spec itself is not a scope
  addition iff it traces to an ADR / buy-don't-build item / domain-model element. CAP budgets are
  checked against nfr targets by **containment, not equality** (components fit inside user-visible
  end-to-end targets — this catches the 90-second generation under a 5-second screen promise).
  **Stochastic acceptance binds to evals**: llm-kind specs declare `EV-n` rows whose thresholds are
  **string-verifiable against `mvp-pack/eval/`** (restated, never invented — the threshold-snapshot
  mechanism applied to quality bars); every FS using an llm capability has ≥1 AC citing an EV-n;
  every EV is cited by ≥1 AC AND covered in the test plan (a threshold no acceptance depends on is a
  number with no consequence); exact-match Then-cells on llm-backed features are a named warning for
  Layer 2. llm-kind also requires **pinning** (model+provider+version and the change policy for
  already-saved outputs), **budgets** with a per-user period cap whose arithmetic is shown inline
  against R1's marginal cost (§4: derived numbers carry their arithmetic), and — like graphics and
  pipeline kinds — a **generated-artifact lifecycle** (storage, growth/user, quota + behaviour at
  the limit, version retention/eviction, export format as the concrete MSP answer, deletion
  mechanics). The test plan gains an `eval` kind and a **determinism strategy** cell, required on
  every llm/async-backed case (recorded-fixtures / seeded / live-eval-threshold / manual — blank is
  an error, the choice is Layer 2): a stochastic core with no determinism strategy makes CI flaky by
  construction.

  Per-kind required anchors (single source — `validate-blueprint.js` mirrors this table and a
  parity test keeps the two identical, the THRESHOLD_FIELDS precedent):

  | kind | required anchors beyond trace/capabilities/degradation |
  |---|---|
  | generic | — |
  | llm | context, output-contract, evals, budgets, pinning, artifact-lifecycle |
  | graphics | doc-model, assets, perf-budgets, compat, interaction-semantics, pinning, artifact-lifecycle |
  | pipeline | artifact-lifecycle |
  | realtime | sync-model |
  | ledger | ledger-model, idempotency, reconciliation, failure-semantics |

  `ledger` exists because internal balances/credits sit inside tech-design's "money = 100% understand"
  zone and LLM-credit products make them recurring; `failure-semantics` (charge succeeded, generation
  failed → refund/credit/retry rule) is the decision that actually gets invented mid-build.
  **Conditional anchors on `llm`**: a spec declaring `takes_actions: yes` (an agentic/tool-using
  core) additionally requires `action-authorization` (allowlist, what runs without asking, what is
  irreversible) and `run-limits` (step/loop cap, spend cap per run, blast radius, dry-run) — safety
  decisions squarely in this plugin's own domain. Queued kind candidates (wait for a real case; an
  unexercised kind ships dead anchors): `integration-sync` (bidirectional sync with an external
  system of record — ahead of) `search`.
- **Surfaces (v1.6.0 — screens are not the only product shape).** `ux-spec.md` frontmatter declares
  `surface: ui | headless-api | cli | sdk | mixed` (closed enum) and each SC-n row may override it in
  a `surface` column — requirements key off the ROW, because `mixed` as a union of requirements
  manufactures junk N/A cells. UI rows require the `loading` state; headless rows do not (error/empty
  always; async tokens always). For any non-ui surface, `api-contract.md` requires
  `<!-- bp:api-lifecycle -->` — versioning scheme, deprecation window, breaking-change policy, key
  issuance/rotation — promises made the instant a customer integrates, joined to the MSP
  "what happens when it breaks" field. The **accessibility anchor is never N/A**: per-surface
  substitution instead (UI → keyboard/contrast/labels/focus; headless → stable machine-readable
  error codes, documented limits, deprecation policy — the "can a consumer safely depend on this"
  floor). **Per-side singletons**: when `state.sides[]` has ≥2 sides, the first-run flow is one flow
  per side and the blueprint records which side the pack's aha event measures (the other side's
  activation event is named, or a genuine second aha routes through drift).
- **Compliance section (v1.6.0)**: `nfr-spec.md` requires `<!-- bp:compliance -->` ALWAYS — either
  `REG-n` rows (`regime | applies because (source ref — model-drafted obligations are [GUESS] and
  never satisfy the section) | obligation affecting MVP | mechanism (MSP-n/DOD-n/ss join) | verified
  by`) or an explicit `N/A — <basis>` where the basis is a charter item or source ref ("no
  regulation applies" is itself a claim; null reasons rejected). A compliance obligation implying
  user-visible behaviour (a consent screen, an audit-log view) is a **scope change unless it traces
  to MSP/DoD** — route it through `declare-drift`, never a quiet new FS. The hard professional-advice
  requirement sits where the risk becomes real: the regulated-domain Test Card's
  `load_before_event = first outside user touches real regulated data` makes it a blocking
  pre-launch-checklist item in `build-and-launch.md`, not an unpassable validation gate.
- **Decision discipline**: blueprint decisions are **product/intent decisions, not market claims** —
  the founder decides, the model drafts. Resolution order is normative: **pack trace → standing
  charter rule (cited by item id, replayed at the next checkpoint) → ask the founder.** Every
  invented detail starts `[GUESS]`; it is lifted only by founder confirmation (intent), a pack trace
  (derivation), or an explicit journaled **delegation** — `[DELEGATED — charter item CH-nn, scope:
  <class of decision>]`, a founder act with a record, never a silent model choice. **`auto_continue`
  never covers a blueprint product decision**, and when AskUserQuestion is unavailable the same
  content is presented in prose — the mechanism may degrade, the checkpoint may not. At the gate,
  zero unresolved markers remain anywhere under `blueprint/`. `deferred-register.md` (its own
  append-only maintenance file — never a section of `build-plan.md`) may carry only **non-product**
  deferrals (ops/external dependencies), each `DF-n` with owner + real date; closures are appended
  rows referencing the open id. A deferred product decision is precisely what the level-2 test
  exists to reject; whether a row is really non-product stays a Layer 2 reading.
- **Outward-claim preflight applies at BP** (as at V2/P/LOCK): the `ux-spec.md` copy inventory
  carries a `publication_disposition` per user-visible claim, consistent with its evidence — product
  copy ships to *paying* users. A `do-not-publish` claim on a screen is a blocker.
- **Level-2 cold-start test**: copy `mvp-pack/` AND `blueprint/` alone into a clean temporary
  directory and spawn `blueprint-coldstart-tester` (Agent tool) on the copy. Bar: *a competent build
  session could implement every feature today without inventing any product decision* — UI flow,
  field-level validation, error behaviour, API shapes, and copy are now in scope. Pure engineering
  choices with no user-visible consequence stay out of scope. Run it BEFORE the full gate check.
  **Persist the run**: verdict verbatim in `blueprint/coldstart-l2-YYYYMMDD-NN.md` (tracked; next
  unused NN, never overwrite — a FAIL run is persisted too) with the per-file sha256 table of the
  exact copied set inlined (generated by `scripts/artifact-manifest.js`, one hashing implementation),
  and the manifest at `private/manifest-coldstart-l2-YYYYMMDD-NN.json` cited as `path@sha256`.
  Layer 1 then checks mechanically: the **latest** report exists, says `VERDICT: PASS`, and its
  hash table matches a fresh manifest of the current set — a remembered PASS is not evidence
  (method-rules §1), and a PASS at NN=01 with a later FAIL at 02 must not pass the gate. (The
  cold-start reports are records of an agent run, not artifacts — frontmatter-exempt, and never part
  of the manifested set they certify.)
- **The pack is read-only — verified by arithmetic, not by reading.** Layer 1 re-runs
  `artifact-manifest.js verify` against **the LOCK verdict's own manifest**; any pack file whose hash
  moved since LOCK is a mechanical blocker naming the file (a pre-manifest legacy verdict downgrades
  this to a Layer-2 reading, reported by name). Stage 6 never touches gate states or the pack label;
  the blueprint quotes the pack's verdict string verbatim (a Hypothesis pack gets a Hypothesis
  blueprint — writing specs does not upgrade evidence). The pack-verdict predicate below is complete
  without BP by design.
- **No OPEN verdict.** PASS → gate-check promotes every required pipeline artifact `ready → locked`
  (the maintenance-phase files beside them — `deferred-register.md`, later `amendment-log.md` — have
  no `status` and sit outside promotion), sets `blueprint.status: locked` + `gate.status: passed`
  (one step — state-write enforces the pairing), journals the verdict; build begins per
  `process/build-and-launch.md`. FAIL → the verdict names the exact documents and predicates that
  failed; fix and re-run (a changed blueprint invalidates the earlier cold-start run and manifest,
  both are redone — same rule as stage 5).
- **After BP — amendments, never edits.** Build-time discoveries that are spec defects/gaps (still
  in scope) go through the `amend-blueprint` skill: founder-answered **scope test** routes
  pack-predicate changes to declare-drift and everything else to an immutable
  `blueprint/amendments/ba-NNN` record + an appended `amendment-log.md` row (first in the build read
  order). Gate BP stays `passed` and is never re-opened — amendments are post-gate work, exactly as
  validation runs are post-LOCK. Locked blueprint files stay byte-identical forever.
- **Drift boundary applies**: a declared-unreconciled drift blocks the BP gate check like every other
  gate ceremony (blueprint *drafting* is ordinary work and is never blocked).
