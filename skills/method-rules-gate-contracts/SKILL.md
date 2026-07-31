---
name: method-rules-gate-contracts
description: Normative per-gate contracts for the SaaS validation pipeline - required artifacts, prerequisites, metrics, OPEN rules, and the exact pack-verdict predicate. Load before any gate work.
user-invocable: false
---

# Gate contracts (normative)

The single source of truth for what each gate requires — a **normative, LLM-interpreted contract with deterministic hook checks** (deterministic helpers now cover the manifest, ledger and pack-verdict checks; the remaining predicates are LLM-interpreted by design). Gate-check enforces these BEFORE the gatekeeper runs. `requires` = gates that must be `passed` (or `open` where allowed) first — verdicts violating prerequisites are rejected.

| Gate | Requires | Required artifacts (acceptable statuses) | Metric / check | OPEN allowed? |
|---|---|---|---|---|
| **F** | — | idea-brief (ready — incl. the **intake classification table** with every statement classed `source-stated`/`evidence-backed`/`interpretation`/`assumption`/`unknown`, and **zero unresolved blocking questions**; unknowns are expected, unanswered blockers are not), **founder-charter (present, seeded, ready for playback)**, problem-hypothesis (ready, no-solution + refutation condition), lean-canvas (ready, labeled), beachhead-icp (ready, **target 20 on-segment tier-4/5 pseudonymous prospects, hard minimum 15 to pass** — sub-tier entries quarantined and uncounted; every counted row carries the behaviour that establishes the tier, its `E-id`, a **resolved entity** (dedup key), an **observed-at date** and a reach channel, and the table **passes `scripts/validate-beachhead.js` (exit 0)** — the single prospect validator; a prose tracker asserts a count, it does not let anyone check one, which is how run #3 turned 3-5 real prospects into a claimed 16; **contact/funnel status is NOT an F predicate** (that belongs to V1); 15–19 qualifying PASSES but Layer 2/3 must log a mandatory reach-risk finding; fewer than 15 qualifying is a Layer 1 formal FAIL, full stop — a founder acknowledging the shortfall does NOT pass it, that would be a will-override, which never satisfies a gate per the boundary below), assumption-map (ready, every deadly assumption has Test Card + threshold — a deferred threshold is legal ONLY with an explicit load-by date in its kill criterion), kill-criteria (draft → **locked by the F signing ceremony**), decision-log exists | Signing ceremony (gate-check Layer 0, first F check only) sets signed_date + locks kill-criteria + appends threshold-snapshot; Layer 1 then verifies it. Later gates only verify. **If `state.market_shape` ≠ single-sided, additionally**: `sides[]` recorded with founder-confirmed `constrained`/`paying` roles; the **constrained side** carries the full bar in `beachhead-icp.md`; every other side has its own `beachhead-icp-<side>.md` (same 9-column shape) passing `validate-beachhead.js --file … --min thresholds.custom.f_secondary_min` (founder-set, sealed — the plugin never invents this floor); the cold-start seeding strategy section exists and is executable by this founder; the premortem produced a dated chicken-egg kill criterion | No |
| **C** | F | competitive-map (**draft** — stays draft by design until stage-2 calibration), review-mining (**ready** — stage 1 promotes it after clustering completes), **`private/research-raw-competitor-scanner.md` + `private/research-raw-community-review-miner.md`** (or an explicit `not-run` record where the execution branch permits it) — a grade-B claim whose agent trail evaporated is unauditable | 5 tiers populated w/ verified sources; **pricing normalized** (currency, tax basis, billing period, edition, seat/usage, locale, list vs effective, `observed_at`) and **capability states recorded** (announced/beta/documented/generally-available/observed/withdrawn) — an un-normalized price comparison is a formal blocker; syndicated sources deduped to the original; market verdict recorded in decision-log | No |
| **V1** | C | evidence-ledger (ready), interview-kit (ready), `private/participant-data-manifest.md` (**required iff any interactive contact happened** — consent basis, retention deadline, withdrawal state; mirrored into `state.privacy.retention_duties`) | past-behavior % ≥ threshold on the **pre-registered neutral sampling frame** (see stage-2), held in its own `sampling-frame-v1.md`, hashed with the shared manifest helper and journaled in a `sampling-frame-snapshot` row BEFORE collection began (V1 re-runs `verify`; a post-hoc edit fails like a moved threshold); honest denominator ≥ v1_min_sample AND ≤ the ledger validator's `max_independent_count`; withdrawn/invalid contacts excluded and listed. **If not single-sided**: one pre-registered frame per side (`sampling-frame-v1-<side>.md`, each with its own snapshot row, all re-verified); the full past-behavior threshold binds the **constrained side**; other sides carry grade-B participation evidence against their own frame; **denominators are never merged across sides** | No |
| **V2** | V1 | solution-directions (ready, **with a recorded ChatGPT-gap result per surviving direction** — what was tried, what the model produced, where it fell short), landing-kit (ready) | one direction wins + nameable value layer + behavioral signal ≥ floor; the ChatGPT-gap record is **reproducible** — exact prompt/transcript ref, model + provider + version, date, tool/config state, representative input ref, preserved output ref, and the failure criterion written BEFORE judging. Founder/model attempts stay **grade D**; only a real customer's attempt counts toward the behavioural signal, computed over **valid sessions only**; **`rescued` (assisted) completions never count as support** and invalid/withdrawn sessions are excluded and listed; an `invalid` experiment (instrument failed) is repaired and re-run, never reported as a market result. **If not single-sided**: the winning direction names its matchmaking mechanism AND its single-player value — no single-player value is legal ONLY with a founder-executable seeding plan (a plan whose mechanism is someone else's cooperation is a wish) plus the armed, dated cold-start kill criterion | Yes (analysis mode) |
| **V3** | V2 (passed or open) | presell-kit (ready) | ≥ v3_min_commitments real-money commitments outside personal network (grade A only) — **from the paying side** when sides exist; non-paying sides commit in Mom-Test currency (signed listings, committed supply — interactive = grade A) against founder-set `thresholds.custom.v3_secondary_commitments`; a failed payment path is an `invalid` run to repair, not a market signal | Yes (analysis mode) |
| **R1** | F (may start right after F; runs parallel to stage 2) | **PASS requires**: spike/ + data-manifest, **`spike/run-contract.json` validated by `scripts/validate-run-contract.js` (exit 0) BEFORE the scored run** (min_n bound to the signed Test Card, declared strata enforced in code, `cost.unit` explicit with every attempt billed including retries, pass mark read from the signed registry, blind human raters for any subjective metric), `error-analysis/summary.md` (ready; `batch-NNN.md` worker files are frontmatter-exempt trace data), eval/ with results, promise-scope (ready). **OPEN requires instead**: feasibility-risk dossier (promise-scope risks section, ready) + `data-acquisition-plan.md` (ready) + `eval/README.md` stating why no evaluation was possible | PASS: eval ≥ r1_eval_pass_pct on real data + marginal cost < price. Subjective-quality PASS additionally requires a human-labeled anchor set (see evidence rules) | Yes — R1 open ⇒ pack verdict downgrades to **Pre-feasibility** |
| **R2** | R1 (passed or open), V3 (passed or open) | concierge-kit (ready with delivery log or dry-run) | outcomes match promise + ≥1 unprompted return | Yes (analysis mode) |
| **P** | **V1 + V3, R1, R2 all resolved** (passed or open — positioning consumes R2 proof and V3 pricing) | positioning (ready→**locked** on pass) | alternatives 100% ledger-traced; copy-test survived; pitch tested or explicitly UNTESTED; **every outward claim carries a `publication_disposition`** and no `do-not-publish` wording survives in any kit; message experiments vary **one** variable | No (thesis label instead) |
| **LOCK** | V2, V3, R1, R2, P all resolved (passed/open per rules above) | mvp-pack complete & **self-contained** (see below), definition-of-done (**`ready`, dated/frozen — gate-check Layer 3 promotes it to `locked` on PASS, not stage 5**), **founder-charter already `locked`** (stage 5 invokes gate-check's charter ceremony in **ceremony-only mode BEFORE materializing the pack** — zero `[INFERRED]` items, decision protocol completed; the full LOCK check only *verifies* this and FAILs with "run stage 5's ceremony first" rather than starting a ceremony against a pack that does not exist yet) | cold-start test passes; every core-loop step traced; cut list non-empty; **pack label matches `scripts/pack-verdict.js` and still carries `(PROSPECTIVE — LOCK not yet passed)` until this gate passes** (Layer 3 re-runs the helper without `--assuming-lock-pass`, confirms the verdict is unchanged, and only then strips the marker — a final label on an unpassed LOCK is a blocker); **minimum service promise complete** (every field answered or explicitly `N/A because …` — eligibility, supported + explicitly-unsupported use, beta disclosure, data/retention/deletion, export-correction-recovery, support intake, break behaviour, exit/sunset; no invented SLA or response-time numbers; **per-side rows where sides' promises differ**, and for a regulated domain the explicitly-unsupported field states the regulated boundary — "not for clinical decisions", "not investment advice"). **After the Layer 3 PASS decision (never before — a failed LOCK must leave no post-LOCK state), gate-check runs the kill-criterion disposition ceremony**: every still-`armed` kill criterion is dispositioned `retire | carry | replace` (each a `criterion-disposition` journal row; carry/replace write post-LOCK health criteria, and the ceremony publishes `health-criteria-v1.md` as locked — see maintenance-rules §10), then the cycle's owned state subtree freezes (state-schema freeze rule); post-LOCK life is governed by the `method-rules-maintenance-rules` skill | No |
| **BP** | LOCK `passed` in the operating cycle (sole exception: LOCK `failed` **and** a complete `mvp-pack/` exists on disk **and** `unvalidated-build-decision.md` + its `will-override` row exist — see the BP section; a UBD against any earlier gate is a STOP, there is no pack to refine) | `blueprint/` complete, every required pipeline artifact `ready`: blueprint-overview, `feature-specs/fs-*` (≥1 per core-loop step), data-schema, ux-spec, api-contract, integration-specs, nfr-spec, test-plan, build-plan — plus `deferred-register.md` (maintenance-phase, append-only, no status), **`interaction-map.md`** (required iff any entity has ≥2 writers, any capability is async, or any invariant exists), and **`subsystem-specs/ss-NN-*.md`** (one per engine/model/pipeline named in tech-design's ADRs; AI-core without an llm-kind spec is a blocker) | Full-coverage predicates (BP section below) + **`scripts/validate-blueprint.js` exits 0** + **level-2 cold-start test passed with a persisted, hash-matched report** + **pack hashes still match the LOCK verdict manifest** + **refines-never-expands** holds + zero unresolved markers (`[GUESS]`-family, `[OPEN]`, `[TBD]`, `[INFERRED]`, bare `___`, unsubstituted `<…>`) + **outward-claim preflight over the ux-spec copy inventory** | No |

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

## Contract changes are not retroactive

A pack or artifact locked under an earlier contract version stays valid: `immutable-snapshot` means the
signed thing is never revised, so a requirement added later (the minimum service promise, the ledger's
lineage columns, the intake classification table) is **not** grounds to reopen a passed gate or
relabel a locked pack. New requirements bind the next gate check in a cycle that has not yet reached
them, and any new cycle. A pre-1.2 ledger is migrated on its next legal edit, not rewritten under an
already-recorded verdict — and a verdict recorded before `artifact_manifest_sha256` existed is never
back-filled with a hash nobody computed.

## Cross-gate formal checks (every gate, Layer 1 — details in gate-check)

- **Artifact-set manifest**: the required artifacts are hashed into a `gate-input` manifest before Layer 2 and re-verified immediately before the verdict; the `gate-verdict` row records `artifact_manifest_sha256` + manifest path. Mismatch = blocker (the reviewed set changed). Where the decision is time-sensitive the row also carries `evidence_cutoff` and `reopen_on` (the condition that would reopen it).
- **Prospect count** (F, and any gate that counts prospects): `scripts/validate-beachhead.js <idea-dir>` must exit 0 — the **single** prospect validator (it absorbed the former `validate-prospect-tracker.js`; two validators over one table once made F unpassable). It enforces the countable cells mechanically — tier, the behaviour establishing it, a resolvable `E-id`, a resolved entity (duplicate businesses under two names are run #3's failure), an `observed_at` date, and a reach channel that permits an expected reply — plus the run #3 semantic floors ("is a competitor" is not tier evidence; a listicle mention with no first-party confirmation does not count) and computes the qualifying count against the floor. An estimated tier (`4 (est.)`) is `[GUESS]` and uncounted. A pre-1.2.0 workspace with the old table shape is accepted with a `legacy-shape` warning and NO mechanical count (LEGACY_RUNGS precedent) — migrate on the next legal edit; until then Layer 2 counts by hand. Its `possibly-prescriptive` warnings are heuristics for Layer 2, never verdicts: whether a quote is really behavioural stays a reading (gatekeeper item 18).
- **Threshold snapshot integrity** (EVERY gate): `scripts/verify-threshold-snapshot.js <idea-dir>` must exit 0. It replays the signed snapshot plus approved revisions against `state.thresholds`; `signed_date` is sealed and no revision entry can move it. Hook-independent by design — this is the guarantee, not `guard-thresholds.js`, which is defence-in-depth and fails open. Its `self_authored` warning marks the limit of what any file check can establish: chain reconstruction, never founder approval.
- **Ledger structure** (V1, P, LOCK): `scripts/validate-evidence-ledger.js` must exit 0. Its `max_independent_count` caps any denominator — rows sharing a `root_source_id` are ONE source; superseded rows never count.
- **Prospect tiers are ledgered evidence, not assessments** (F, and any later gate that counts prospects). A `beachhead-icp.md` row counts toward the tier-4/5 minimum only if it carries (a) the **behaviour** that establishes the tier — a past act, in the person's words or as an observation — (b) its **`E-id`** in `evidence-ledger.md`, and (c) a **reach channel through which a reply is plausible** (a public forum handle is not one). **Reachable ≠ contacted** (this boundary was disputed across two dogfood runs — settled in v1.3.0): F asks whether a plausible reply channel *exists*, which is a property of the list and belongs to F because run #2 produced 8 "real" prospects of whom not one could be reached — the most valuable finding of that run. Whether anyone *was* contacted, replied, or moved down the funnel is an outcome and belongs to V1; any criterion demanding `funnel status ≥ contacted` at F is an invented gate predicate and is rejected. Rows failing any of the three are quarantined and uncounted, exactly like grade-D items; a tier resting on the model's reading of a source is `[GUESS]`. **Prescriptive statements are not behaviour**: "you should keep docs in the repo" is advice, and the speaker may have done none of it — if the sentence could have been written by someone who never did the thing, the row is tier 1–3 at most. This is deliberately outside `validate-evidence-ledger.js`'s reach: run #2 produced six "tier 4 (est.)" prospects of which five were advice-givers and four had no ledger entry at all, so the ledger validator structurally could not see them. Layer 1 checks the three cells mechanically; whether a quote is really behavioural is a Layer 2 judgement.
- **Outward-claim preflight** (V2, P, LOCK, BP): every outward claim has a `publication_disposition` consistent with its support (method-rules §11); a `do-not-publish` claim inside a kit about to run — or on a screen in the blueprint's copy inventory — is a blocker.
- **No cross-domain recertification** (method-rules §12): evidence collected for another gate may inform or reopen this one, never satisfy it.

## Pack verdict predicate (exact, no ambiguity)

- **Validated MVP Pack** = V1,V2,V3,R1,R2,P,LOCK all `passed` AND V3 evidence grade A.
- **Hypothesis MVP Pack** = LOCK reached, R1 `passed`, and ≥1 of V2/V3/R2 `open`.
- **Pre-feasibility Hypothesis Pack** = LOCK reached with R1 `open` (feasibility itself unproven — the pack must say so on line 1).
- Anything else = pipeline not finished; no pack is issued.

## Self-contained pack requirement (checked at LOCK)

`mvp-pack/` must contain **copies**, not references. Contents depend on R1's verdict:
- **R1 passed** → `mvp-pack/eval/` = snapshot of the harness + results + threshold.
- **R1 open** (Pre-feasibility path) → `mvp-pack/eval/` = copies of `eval/README.md` (why no evaluation was possible), `data-acquisition-plan.md`, and the feasibility-risk dossier — a Pre-feasibility pack ships its risk file, not a nonexistent harness.
- Always: `mvp-pack/experiments/{landing,presell,concierge}/` snapshots of open-gate kits, and **`mvp-pack/founder-charter.md`** (locked, post-final-playback).
- Always: **`mvp-pack/audit-trail.md`** — a copy of the redacted review record. The pack tells a builder what was decided; this tells them **which parts of it are contested and were never remediated**, which is the difference between a spec and a spec you can trust. Run #2 ended with ten unremediated blockers and three contested headline claims; a pack shipping without that record would read as settled. The verbatim gatekeeper reports stay in `private/` and deliberately do **not** travel (identities), so this redacted copy is the only form that survives into the pack — and `private/` is gitignored, so it is also the only form that survives a clone. A pack whose `audit-trail.md` has fewer gate attempts than `decision-log.md` has `gate-verdict` rows is incomplete: some verdict was recorded with no reviewable trail.
Always also: a **redacted `evidence-ledger.md`** and the executed `concierge-kit.md`/manual-ops log whenever the pack cites their ids — or, equivalently, a generated `traceability-index.md` containing exactly the cited ids and what each one says.

**Every id cited inside the pack resolves inside the pack.** LOCK Layer 1 parses `mvp-spec.md`, positioning, and the technical design for `E-`/`A-`/`K-`/ops references and **fails on any that cannot be resolved from pack contents alone**. **Declared exemption — `audit-trail.md`** (declared in v1.3.0): the audit trail is a *review record*, and its function is to say "contested per gatekeeper B4" even when B4's verbatim report deliberately does not travel (identities stay in `private/`). Its references to `private/` paths and gatekeeper-report ids are therefore legal and expected — anyone extending the Layer 1 parser to "every file in the pack" must keep this exemption, or the rule would fail LOCK on the very file the contract requires. Run #3's cold-start test found "dozens of bare ids (A1-A9, V1-V3, K2/K5/K11, M1-M4, PR1-PR3) with no definition" — each one a question the build session has to come back and ask, which is the exact failure the self-contained rule exists to prevent.

Cold-start test runs against a copy of `mvp-pack/` alone in a clean directory.

## Will-override boundary (evidence firewall for intent)

A `will-override` NEVER upgrades evidence, alters a metric, turns FAIL into PASS, or satisfies any part of the pack predicate. If the founder chooses to build despite a failed mandatory gate, the pipeline produces an explicit **Unvalidated Build Decision** exit artifact (journaled, charter-referenced) — gate states and the pack verdict remain truthful. Invariant changes require an `invariant-change` journal row with exact old/new wording + founder approval, even while the charter is still `draft`.

## Evidence rules for R1 quality claims

- **Deterministic metrics computed over representative real data = grade C** (schema validity, exact-match, latency, cost — code-checked).
- **Subjective quality judged by an LLM without human-labeled anchors = grade D, diagnostic only** — it never satisfies the PASS metric (one model grading another model's output is model-generated evidence; the "model is never an evidence source" rule applies).
- Subjective-quality PASS requires either a **human-labeled anchor set** (user labels a held-out sample; judge must reach ~75–90% agreement before its verdicts count as C) or an **external outcome measurement** (R2 real-usage results). Without either → R1 cannot PASS on subjective quality; accept OPEN and produce the Pre-feasibility pack.

## Artifact lifecycle ownership (draft → ready → locked)

Each artifact has one promoting owner: the stage skill that completes it promotes `draft → ready`; gate-check promotes `ready → locked` where the contract says so (kill-criteria at F sign-off, positioning at P, DoD + mvp-spec + **founder-charter (via the ceremony-only charter invocation stage 5 makes before materializing the pack; the full LOCK check verifies, never initiates)** at LOCK, **the required blueprint pipeline artifacts listed in the BP row at BP** (the maintenance-phase files beside them — deferred-register, amendment-log — have no `status` and sit outside promotion)). Exception by design: competitive-map stays `draft` through gate C and is promoted to `ready` by stage 2 after customer-word calibration. No other transitions are legal; hooks escalate edits to `locked` files.

## Signing snapshot (hook-independent integrity)

When thresholds are signed (gate F) the gate-check appends to decision-log: `threshold-snapshot | {json of thresholds}`. Every later gate-check recomputes and compares current thresholds against the latest snapshot + approved revisions; mismatch = blocker finding regardless of whether hooks were active.
