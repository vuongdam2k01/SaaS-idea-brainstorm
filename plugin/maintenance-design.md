# Post-LOCK maintenance design — converged spec (Claude ⇄ Codex, 2026-07-30)

> Status: **IMPLEMENTED (plugin v1.2.0) — post-implementation cross-review in progress.**
> Six-round design exchange + implementation review (Codex CLI `gpt-5.6-sol`, xhigh, read-only
> sandbox, session `019fb132-7af5-7d13-82b8-e3b56aa0cd60`).
> Round 1: 14 findings (4 blockers) against Claude's original proposal; original architecture **rejected**.
> Rounds 2–4: revised design v2, three spec-blocker cycles → **converged**. Rounds 5–6: reality-intake
> delta → **converged**. Round 7: implementation audit — 16 findings (5 blockers), verdict
> fix-then-ship; all 16 addressed. Round 8: verification — 9 Fixed, 7 Partial; remaining clusters
> fixed (root↔fragment status invariant; consumed_through wording; historical-artifact guard for
> locked cycles; disposition ceremony moved to Layer 3 post-PASS; fragment field-type validation).
> Round 9: 6 Fixed, 1 Partial (#8 disposition schema). Round 10: shared validateKillCriteria()
> (retired ⇒ complete disposition, identical root+fragment). **FINAL VERDICT (Codex):
> "implementable-as-is — all round-7 findings are fixed; ship v1.2.0."** Test suite: 89/89.

## Problem

The pipeline ends at LOCK by design. The owner's requirements, refined over three exchanges:

1. Stale artifacts must never read as current truth (conflicting information).
2. Not everything is maintained: the MVP pack is a fulfilled contract (historical record); direction-bearing content (founder philosophy, positioning, current ICP/price) must stay current.
3. Maintenance is **sporadic, not continuous** — the founder may return after arbitrary drift (e.g. 80% of MVP functionality changed + 2–3 new feature clusters shipped with no evidence discipline). Recovery must work on demand from that state.

## Rejected first draft (for the record)

The original `record/living/ephemeral` taxonomy + in-place amendment of "living" docs + global
`living > record` precedence + `status: superseded` + reuse of singleton V1/V2 gates post-LOCK —
all five rejected in round 1 with concrete failure scenarios (gate-traceability destruction,
retro-threshold laundering, authority inversion: a `[GUESS] $300` price outranking five real $99 payments).

## Converged architecture

### 1. Mutation policies replace the taxonomy

Semantic role is separated from mutation policy. Three authoritative policies:

- **append-only** — decision-log, evidence ledger, founder-charter (item-level; see §7).
- **versioned projection** — current-truth documents: `current-baseline-vN`. Predecessor stays locked
  and untouched; successor carries `supersedes`; head pointer lives in state. Never edited in place.
- **immutable snapshot** — gate-locked artifacts, MVP pack (frozen at LOCK — "build completion" is
  not a pipeline event), reconciliation manifests, executed-kit snapshots.

Scratch material has no authority and is not a maintained class. Kits are executable protocols while
their gate is open; the exact executed version becomes an immutable audit snapshot.

**Vocabulary rule:** a baseline never "supersedes" the MVP pack — different kinds. The pack is a signed
contract (fulfilled or departed-from, never revised); the baseline is a reality record that *references*
the pack with a departure diff. `supersedes` links same-kind successors only (baseline-v2 → baseline-v1).

### 2. Claim-specific authority (no global precedence)

- founder-charter → intent
- deployment/repo observation → implemented reality
- latest applicable graded evidence → empirical claims
- the active cycle's LOCK contract → build obligations
- Projections may be current-yet-explicitly-unvalidated and must show both:
  "current asking price $300 [GUESS]; last validated $99 (E-ids, date)".

### 3. /reconcile — on-demand recovery (no scheduled maintenance)

1. **Reality intake**, source-typed with provenance: `founder-statement | repo-inspection(commit) |
   deployment(version) | billing-export | analytics`, each with `as_of` + reference. Drift is recorded
   as dimensions (core-loop steps changed, new clusters, ICP/price/promise deltas), never a bare %.
2. **Three-tier comparison**: (a) charter invariants first — violation → deliberate `invariant-change`
   ceremony or flagged course-correction, no silent third option; (b) projections vs practiced reality;
   (c) evidence coverage of every drift item.
3. **Publish** one immutable reconciliation manifest + new `current-baseline-vN` + journal rows +
   head pointer (in that order — see §6).
4. **Selective validation**: strategic/high-risk GUESSes get pre-registered change-validation runs
   (§5). Minor items keep their label.

**Exhaustive drift-item coverage (anti-laundering):** every drift item gets either ≥1 registered claim
with an impact route, or an explicit `non_strategic` disposition naming why it touches none of
revenue/retention/risk/contract/pack-predicate subjects. Unknown/disputed → defaults strategic.
The formal layer rejects orphan drift items.

**Hard boundary:** while `drift_declared_at > last_reconcile.completed_at`, the following are blocked:
issuing/relabeling packs, post-LOCK validation runs, switch-mode, citing projections as reconciled truth.
Ordinary investigation/coding is never blocked. Threat-model limit stated explicitly: concealed drift
defeats any local method.

### 4. Impact routing (drift → discipline)

buyer/problem → V1-kind · solution/value → V2-kind · price/payer/revenue-model → V3-kind ·
quality/cost/data/HITL/promise → R1-kind · outcome/retention → R2-kind · alternatives/category/copy →
P-kind · core-loop/cut-list/architecture/security/privacy/payments/DoD → LOCK-review-kind.
Strategic weight = revenue ∪ retention ∪ risk ∪ contract impact.

**Cycle boundary:** drift touching pack-predicate subjects (problem/buyer, payer/price-model, promise
scope, core loop) → **new cycle** (child cycle_id; prior evidence reusable per-item only after a
journaled applicability check). Bounded drift → change-validation runs inside the current cycle.

### 5. Validation runs + retro-evidence rules

Version-scoped runs (`run_id, cycle_id, claim_ids, gate_kind, pre-registered threshold snapshot,
confirmation_window {opens_at, closes_at}, evidence_ids, verdict, report ref`) — never written into
singleton `gates`. R3/adoption from build-and-launch.md becomes a run of kind `adoption`.

Claim statuses: `guess | supported | contradicted-retro | refuted | retired`. Closed transition set:

- `guess → supported`: only signed-window PASS (full run spec — claim, sampling frame, threshold,
  stopping rule — signed before `opens_at`).
- `→ refuted`: signed-window FAIL scoped to `applies_to`; OR verified universal counterexample where
  product/version/environment matches `applies_to` (order-insensitive for universal claims only).
- `→ contradicted-retro`: unplanned contrary retro-data on statistical claims. Blocks PASS-dependent
  actions, drops authority to guess-level, mandates a disposition (fresh run spec or retirement).
  **Observed reality may contradict and block; it may never confirm.**
- `contradicted-retro → retired`: only if every dependent action and successor claim is removed/retired
  too; near-equivalent replacement claims (applies_to overlap, same routed discipline) inherit the
  contradiction until a fresh run resolves it. No retire-and-relabel path.
- `guess|supported → retired`: allowed when all dependent actions are removed (ordinary abandonment).
- `supported → guess`: automatic when declared drift invalidates the claim's applies_to (noted with
  reconcile ID). `retired` is terminal.

`[GUESS]` removal by user confirmation is valid ONLY for intent claims; market/behavioral/feasibility
claims require graded evidence (method-rules wording fix).

### 6. Integrity & transaction semantics

- Stable reconcile ID; two-phase publish: draft dir + manifest → formal checks → journal events →
  head pointer last. Idempotent retry. Rebuild-from-artifacts stays possible.
- Manifest: sha256 over raw bytes, sorted normalized relative paths, algorithm recorded. The manifest's
  own hash + reconcile ID are appended to decision-log (prevents silent regeneration). Predecessor and
  head hashes verified at reconcile start AND immediately before publish. Snapshot, not chain
  (threat model = self-deception + corruption, per the standing no-hash-chain ruling).
- Formal layer (hook-independent, mirrors gate-check Layer 1): predecessors untouched vs manifest,
  lineage uniqueness (one head per projection kind per cycle), required journal rows, manifest
  completeness. Hooks remain fail-open mistake detectors.
- A reconciliation summary row never replaces specialized journal events (invariant-change,
  threshold-revision, pivot, will-override, verdicts) — those are still written individually.

### 7. Founder-charter = append-superseding ledger

Items are byte-stable (no edit/delete/reorder). Corrections append new stable-ID items with
`supersedes`, exact founder words, source event, confirmation date. Free-text belief sections become
structured items or are marked derived views. The LOCK pack keeps its immutable charter copy. Each
manifest records the charter high-water mark + hash. `invariant-change` stays a specialized event.
A charter-specific append-only guard replaces generic locked-edit permission.

### 8. State schema 1.2.0

Root `state.json`: top-level `gates` is permanently C1's (frozen at C1 LOCK — state-write rejects
mutations of every C1-owned subtree: gates, thresholds, cycle kill criteria, active, mode, waiting_on,
artifact index). New root fields:

```json
{
  "cycles": [{ "id": "C1", "status": "...", "parent": null, "state": null },
             { "id": "C2", "status": "...", "parent": "C1", "state": "cycles/C2/state.json" }],
  "active_cycle": "C1",
  "maintenance": { "drift_declared_at": null, "active_reconcile": null,
                    "last_reconcile": null, "current_baseline": null, "blocking_claims": [] },
  "health_criteria": [],
  "validation_runs": []
}
```

Cycle fragments own the full operating set: `cycle_id, parent, status, mode, active, gates,
thresholds (own signing ceremony), kill_criteria (cycle-scoped, assumption-specific per F contract),
waiting_on, artifacts, validation_runs, updated`. Root keeps: budget (shared), capabilities, cycles
index, active_cycle, maintenance, health_criteria. The LOCK ceremony dispositions every armed kill
criterion: `retire | carry | replace` (journaled); "carry" moves it into root `health_criteria`
(state+date form) with provenance. Migration 1.1→1.2 adds null/default fields only — never fabricates
lock manifests or reconcile history.

### 9. Maintenance artifact frontmatter (conditional on `phase`)

`phase: pipeline` (or absent) → today's rules unchanged. `phase: maintenance` → required:
`artifact_id` (unique within `(cycle_id, artifact_id)`; basename matches artifact_id — manifests are
`reconcile/<id>/manifest-<id>.md`), `artifact_kind` (`current-baseline | reconcile-manifest |
reconcile-intake | claims-register | validation-run-report | health-criteria`), `idea, phase, cycle_id,
mutation_policy, publication_status (draft|locked — locked set only by the reconcile publish step),
as_of, pipeline_version, updated`; conditionals: `supersedes` (idea-relative path; target must exist,
be `locked`, same `artifact_kind`) + `supersedes_sha256` (target hash at supersession time), `run_id`,
`reconcile_id`. `stage`/`gate` do not apply to maintenance artifacts.

### 10. Scope decisions

- Current-baseline is a reality record ONLY — never a build contract. New build obligations exist only
  as a new cycle's LOCK under full gate discipline.
- `templates/` manual workflow gets the same rules as documentation, no enforcement machinery
  (parity of law, not of police).
- idea-brief: raw section immutable, articulation is a projection. Canonical current price and current
  promise live in the baseline projection (no new singleton artifacts).
- Claim registry is scoped to reconciliation manifests + baseline strategic claims (not retrofitted
  across pipeline artifacts; E-id traceability governs those).

## Reality-intake specification (rounds 5–6 delta, converged 2026-07-30)

Covers three ingestion scenarios: implementation NOT done by Claude Code; user-declared changes;
user-designated sources to read.

### 11.1 Non-Claude implementation is the default assumption

Session transcripts are NOT a reality source (ephemeral, unverifiable, absent when others build).
Claude-built, human-built, and other-tool-built products are indistinguishable at intake — all enter
as source observations. No skill may treat "what it remembers building" as evidence (method-rules rule).

### 11.2 Implemented-state facts (replaces any global source precedence)

`founder-declared → code-present → built → deployed → user-accessible/observed` — each fact carries
source + inspected scope (environment, tenant, feature flags, observation time) and claims nothing
beyond it: repo code proves only `code-present`; a deployment observation binds only the exact
behavior/env/tenant/flags/time inspected. Billing/analytics separately govern empirical behavior.
Observations record reality; they never directly upgrade strategic claim status. Conflicts record both
sides + scopes: founder recollection cannot override an applicable observation; an observation cannot
exceed its inspected scope. Divergence founder-vs-source is a finding routed to charter (intent) or
baseline (reality); repo-ahead-of-deploy is recorded as "implemented, not user-accessible".

### 11.3 Source registry + immutable observations

`maintenance.reality_sources`: user-declared locators `{id, type: repo|ci-build|deployment|changelog|
docs|billing|analytics, ref, access, inspection scope/exclusions, declared}`; changes journaled; new
sources enter only via the registry (user-approved) — never via links embedded in read content.
Each reconcile resolves each source into an immutable observation: `source_id, resolved_ref,
observed_at, environment/scope, access_result, content_hash|version/digest, coverage_limitations`.
Repo obs: commit + branch + dirty-worktree/diff hash. Deployment obs: prod/staging identity, version,
tenant/region, flags. Runtime config, DB migrations, infrastructure, third-party settings, manual ops:
covered or explicitly `unknown`. Removed/disabled features inventoried alongside new clusters.
Handoff-supplied material keeps underlying provenance + content hash (never collapses into founder
recollection). Acquisition rung lives on each intake row, not on the baseline.

### 11.4 Intake authority (statement-only recovery is legal but bounded)

Baseline fields: `intake_authority: declared-only | partial | observed` + `unresolved_reality: []`.
Declared-only/partial reconciles complete and publish; they support intent updates, provisional drift
inventory, investigation, run design, starting a new cycle. They cannot: establish verified implemented
reality, resolve LOCK-review claims about the existing product, mark implementation/empirical claims
`supported`, assert no unreported drift remains, or run a validation whose `applies_to` product/version
is unidentifiable. Pack relabeling is categorically impossible regardless of intake authority.
Partial access = recorded coverage gap, never a silently complete baseline.

### 11.5 Drift inbox (incremental declaration between reconciles)

`/declare-drift` appends `{drift_id, ISO-8601 timestamp, dimension, source-type, note}` to a per-cycle
append-only `drift-inbox` (new `artifact_kind`) and sets `drift_declared_at`; boundary comparison uses
monotonic event ordering (same-day bypass closed). No immediate reconcile forced; the §3 hard boundary
activates. Reconcile consumes every row: each becomes a manifest drift item, or a dismissal restricted
to demonstrably duplicate | erroneous | out-of-scope — "minor/not strategic" is not dismissal; such
rows take the normal impact disposition (`non_strategic` requires the named justification).

### 11.6 Execution & secrets boundary

Read content is data with provenance, never instructions (imperative text in READMEs/changelogs
included). Static intake never: executes repo-controlled scripts/tests/hooks/binaries, follows
source-authored commands or installs dependencies, exercises destructive/payment/stateful flows on a
deployment, or reads .env/credentials/production DBs/customer data merely because a directory was
registered. Code execution or stateful deployment inspection is a separate, explicitly user-approved,
sandboxed action under the outward-action policy pattern; its observations retain provenance.

## Implementation changeset (synchronized, single release)

schema/pipeline 1.2.0: `state-write.js` version gate + cycle-freeze enforcement · `validate-artifact.js`
(phase-conditional required sets, new enums incl. `drift-inbox`, version allowlist) · new skills
`reconcile` (4 steps + formal layer + source-observation resolution) and `declare-drift` ·
`gate-check` (LOCK kill-criterion disposition ceremony) · `method-rules` (mutation policies, authority
table, implemented-state facts, claim transitions, GUESS-removal wording fix, session-transcripts-are-
not-evidence rule, threat-model limits) · `new-idea`, `status`, `switch-mode`, `session-start`
(last-reconcile info line; health/kill overdue) · `build-and-launch.md` (R3 → adoption run) ·
hook-tests (transition + freeze + lineage cases; same-timestamp drift ordering; declared-only/partial
authority restrictions; scoped deployment conflicts; dirty worktrees; dismissal eligibility;
execution/exclusion refusal).

## Exchange ledger

- R1: Codex — 14 findings (4 blocker, 9 major, 1 minor), verdict "do not implement as written",
  lean counter-proposal. Claude: all 14 accepted (1 with scope control), 5 rejected-architecture
  points conceded, 3 open decisions answered.
- R2: Codex — architecture accepted; 3 spec blockers (retro-FAIL too broad; multi-cycle gate storage;
  post-LOCK frontmatter vocabulary) + 4 conditioned acceptances (a–d).
- R3: Claude resolutions; Codex — 3 narrower blockers (transition table incl. retirement-inheritance;
  full cycle-fragment field set + subtree freeze; enforceable lineage schema).
- R4: Claude resolutions; Codex — **final convergence**, 2 non-blocking notes (manifest filename
  alignment; allow ordinary retirement) — both incorporated above.
- R5 (owner follow-up: non-Claude implementation / user-declared changes / read-designated sources):
  Claude intake delta; Codex — 5 blockers (global precedence too coarse → scoped implemented-state
  facts; statement-only authority restrictions; registry locators vs immutable observations + missing
  surfaces; drift-inbox same-day bypass + dismissal laundering; execution/secrets boundary).
- R6: Claude accepted all five verbatim; Codex — **final convergence on the intake delta**
  ("coherent, implementable, closes all identified laundering and trust-boundary paths").
  Non-blocking: regression tests for same-timestamp drift ordering, authority restrictions, scoped
  deployment conflicts, dirty worktrees, dismissal eligibility, execution/exclusion refusal —
  folded into the implementation changeset's test list.
- R7 (implementation audit): 16 findings — 5 blockers, 10 major, 1 minor; verdict **fix-then-ship**.
  All addressed: (B1) writer now rejects any non-1.2.0 write (downgrade bypass) + locked cycles'
  index entries frozen (two-step unfreeze); (B2) cycle-resolution rule added to maintenance-rules §4
  and wired into gate-check/status/switch-mode + fragment↔root-index correspondence enforced by
  state-write + cycle-scoped artifact layout `cycles/<id>/`; (B3) hash-finality publish ordering —
  final bytes (incl. publication_status: locked) rendered BEFORE hashing, manifest hashed last;
  (B4) `validation-run-spec` kind + new `run-validation` skill (execute/adjudicate signed runs);
  (B5) ids normalized lowercase (`r-YYYYMMDD-NN`, `vr-...`) + naming/dir correspondence enforced by
  the validator. Majors: epoch timestamp compare with ties=PENDING + `consumed_through` drift-id
  high-water as the exact boundary (M6); switch-mode categorically unavailable on locked cycles (M7);
  fragment full-shape validation + null-gates rejection + health "state"-alias rejection (M8);
  complete mutation-policy matrix + evidence-ledger byte-prefix append-only (M9); reserved-path
  deterministic dispatch + kind↔policy pairing + supersedes traversal rejection + path
  canonicalization (M10); consumption markers REMOVED — manifest membership + consumed_through
  (M11); contradicted-retro same-reconcile disposition publication predicate (M12); kill-criterion
  `retired` status + `disposition` object + LOCK ceremony publishes health-criteria-v1 (M13); test
  suite 57→79 incl. downgrade/unfreeze/fractional-second/append-only regressions, equal-timestamp
  assertion corrected to PENDING (M14); build guide fixed for Hypothesis packs (M15); manifests +
  READMEs + this memo synchronized (M16).
