---
name: method-rules-artifact-schema
description: Canonical artifact frontmatter and evidence-ledger row format for the SaaS validation pipeline. Load before writing any artifact under ideas/<slug>/.
user-invocable: false
---

# Artifact frontmatter & evidence ledger schema

Frontmatter is **phase-conditional**: artifacts with `phase: maintenance` follow the schema in the `method-rules-maintenance-rules` skill §9 instead of the block below. `phase: pipeline` (or no `phase` key) means exactly the rules below — nothing changes for pipeline artifacts.

## Frontmatter (required on every pipeline-phase `.md` artifact under `ideas/<slug>/`, except README and files under `private/`)

```yaml
---
artifact: problem-hypothesis        # kebab-case id, unique within the idea
idea: <slug>
stage: 0                            # 0..6
gate: F                             # F | C | V1 | V2 | V3 | R1 | R2 | P | LOCK | BP
status: draft                       # draft | ready | locked
evidence_grade: none                # highest grade backing this artifact: A | B | C | D | none
rung: baseline-auto                 # enhanced-auto | baseline-auto | handoff  (exactly three — see below)
pipeline_version: 1.9.0
updated: YYYY-MM-DD
---
```

A PostToolUse hook validates these keys; missing frontmatter blocks with a fix instruction. `status: locked` is reserved for signed artifacts (kill-criteria, DoD, final positioning, mvp-spec) — a PreToolUse hook escalates edits to locked files.

**`rung` has exactly three values** — `enhanced-auto | baseline-auto | handoff`. Two former values are gone by design (v1.2.0):
- `handoff-only` was a synonym of `handoff` and added nothing over the capability's own `status: unavailable|unknown`. Normalized on next legal touch; never emitted.
- `simulate` was never an execution capability — it is **epistemic provenance**, and it maps deterministically onto grade D / `[GUESS]`, which already cannot enter the ledger or satisfy any gate. Keeping it as a rung invited "simulation completed the task" reasoning. When evidence cannot be obtained, the honest outcomes are a **handoff** or an **accepted-open gate**, never a simulated completion. Simulation is described only in the grade-D and `[GUESS]` rules.

Legacy `handoff-only`/`simulate` are tolerated on untouched pre-v1.2 artifacts and migrated on next legal edit (`handoff-only` → `handoff`; simulated material stays explicitly grade D / `[GUESS]`).

## Evidence ledger (`evidence-ledger.md`, one per idea)

The single source of truth for all evidence. Downstream artifacts cite entries by id.

```markdown
| id | date | source | root_source_id | type | url_or_ref | retrieved | via | verbatim_or_observation | assumption | grade | bearing | scope_limits | relationship | supersedes |
|----|------|--------|----------------|------|-----------|-----------|-----|-------------------------|------------|-------|---------|--------------|--------------|------------|
| E1 | 2026-07-29 | reddit u/... | RS-reddit-thread-1f2a | community | https://... | 2026-07-29 | miner-run-3 | "exact quote" | A3 | B | supports | one user, US, 2025 | — | — |
```

**Three different things were all called `status`.** They are now named apart, because a gate predicate that says "status" could silently read the wrong one:

| Field | Lives on | Values | Answers |
|---|---|---|---|
| `status` | artifact frontmatter | `draft \| ready \| locked` | lifecycle: may this file still be edited? |
| `bearing` | evidence-ledger row (was `status`) | `supports \| contradicts \| unclear` | what this evidence does to its assumption |
| `epistemic_status` | claim register, maintenance-rules §3 | `guess \| supported \| contradicted-retro \| refuted \| retired` | how well-established a product claim is |
| `publication_disposition` | outward-message inventories only (stage 2/4) | `publish-as-fact \| publish-with-qualification \| test-as-proposition \| do-not-publish` | may this wording go outward, and framed how? |

`publication_disposition` is **derived from** `epistemic_status`, never equal to it, and **never writes back**: choosing to test a claim as a proposition does not make it better supported. The permitted defaults are in method-rules §11.

- `type`: `person` | `community` | `review` | `survey` | `payment` | `usage` | `spike-data`
- `source`: who/where, specific enough to re-find — **pseudonymous P-ids for real contacts** (identity map in `private/contacts.md`). `url_or_ref`: URL, or file ref for user-provided material (e.g. `private/interview-03.txt`).
- `retrieved` + `via` (provenance): when it was fetched and by which run/query — sources change or vanish; for fragile sources save an excerpt snapshot under `private/snapshots/E<id>.txt` so a later failed spot-check can distinguish "changed upstream" from "fabricated".
- `verbatim_or_observation`: exact quote in quotes, or a measured observation. Paraphrases must be tagged `PARAPHRASE:` and are down-weighted at gates.
- `assumption`: the assumption-map id (A1, A2, ...) this entry bears on. `bearing`: `supports` | `contradicts` | `unclear` → rolled up into the assumption map.
- **`root_source_id`** — the identity of the ORIGINAL source, not the page you read it on. Two rows sharing a `root_source_id` are **one** piece of evidence for counting purposes: a syndicated repost, a quote-tweet, an aggregator summary, and the original post are the same root. Independence is **computed from distinct root sources** and is never self-declared — there is no "independent_of" field to assert, because asserting independence is exactly the error this prevents. Same root, different readers ≠ corroboration.
- **`scope_limits`** — who/where/when this claim actually covers (population, geography, time window). A row with no stated limits is treated as narrowest-possible scope at gates, not broadest.
- **`relationship` / `supersedes`** — `relationship` links this row to others it corroborates or contradicts (`supports:E4`, `contradicts:E7`); `supersedes` names a row this one replaces (a corrected transcript, a re-measured number). **Rows are never edited away or deleted**: a wrong row is superseded, keeping the history of what we believed and when. Contradictions stay visible in the ledger — they are not moved to an appendix.
- Shared provenance vocabulary: `retrieved`/`via`/`scope_limits` here mean the same as `observed_at`/`resolved_ref`/`coverage_limitations` on maintenance-phase reality observations, deliberately. But the two stores stay separate (see below).
- **Evidence rows (`E-`) vs reality observations (`O-`)**: empirical claims are supported only by graded evidence rows; implemented-reality facts come from scoped observations in reconcile intake (maintenance-rules §5). An `O-` reference may **contradict or narrow** a claim; it can never make one `supported`. If one source serves both — a billing export, say — create ONE observation and let an evidence row cite its `observation_id`; do not duplicate the raw source, and do not let an `O-` id sit in a field that counts as empirical support. Merging the two stores would open a laundering path from "code observed" to "market claim supported".
- **Grade D never appears in the ledger.** Model-generated material lives in the "Open hypotheses" section of the artifact that produced it.

## GUESS labeling

Any model-drafted value inside an artifact that is not yet backed by a ledger entry is written as `[GUESS] <content>`. Canvas cells, personas, threshold suggestions — all start as `[GUESS]`. What removes the tag depends on the claim's domain: **intent claims** (what the founder wants, values, priorities) are lifted by explicit user confirmation; **market, behavioral, and feasibility claims** are lifted only by graded evidence (ledger id) — the founder confirming their own guess about the market does not make it evidence. Record which mechanism lifted each tag.

## Standard artifact set per idea

| Stage | Artifacts |
|---|---|
| 0 | `idea-brief.md` (foundational, living), `problem-hypothesis.md`, `lean-canvas.md`, `beachhead-icp.md` (incl. prospect funnel tracker), `assumption-map.md` (incl. Test & Learning Cards), `kill-criteria.md` |
| 1 | `competitive-map.md`, `review-mining.md` |
| 2 | `sampling-frame-v1.md` (hashed + journaled before mining), `evidence-ledger.md` (incl. pain/theme clusters), `solution-directions.md`, `landing-kit.md`, `presell-kit.md` (+ `interview-kit.md` for handoff/carry-forward) |
| 3 | `spike/` (code + `data-manifest.md`), `error-analysis/` (canonical `summary.md`; `batch-NNN.md` worker files are frontmatter-exempt trace data), `eval/` (harness — or `eval/README.md` when R1 is OPEN), `promise-scope.md`, `concierge-kit.md`, `data-acquisition-plan.md` (R1 OPEN only) |
| 4 | `positioning.md` |
| 5 | `mvp-pack/` → `mvp-spec.md`, `tech-design.md`, `definition-of-done.md`, `carry-forward.md`, `evidence-quality-report.md` |
| 6 | `blueprint/` → `blueprint-overview.md`, `feature-specs/fs-NN-<slug>.md` (one per core-loop step/feature), `data-schema.md`, `ux-spec.md`, `api-contract.md`, `integration-specs.md`, `nfr-spec.md`, `test-plan.md`, `build-plan.md`, `interaction-map.md` (when required), `subsystem-specs/ss-NN-<slug>.md` (one per ADR-named engine; frontmatter adds `kind`) — post-LOCK, gate BP; the pack itself is read-only. Beside them, maintenance-phase: `deferred-register.md` (append-only), and post-BP `amendment-log.md` + `amendments/ba-NNN-<slug>.md` (amend-blueprint skill) |
| Cross-stage | `decision-log.md` (append-only journal, created at init), `audit-trail.md` (append-only, tracked, redacted review record — see below), `founder-charter.md` (append-superseding intent ledger, created at init, ships in mvp-pack — item rules in maintenance-rules §7), `post-mortem.md` (written only when an idea is stopped), `unvalidated-build-decision.md` (written only when the founder builds against a failed mandatory gate — see below) |
| Post-LOCK (`phase: maintenance` — schema in maintenance-rules §9) | `current-baseline-vN.md`, `reconcile/<id>/manifest-<id>.json` (canonical) + `manifest-<id>.md` (labelled human view) (+ intake/claims files), `validation-runs/<run_id>-spec.md` + `<run_id>-report.md`, `drift-inbox.md`, `health-criteria-vN.md` |

## decision-log.md (append-only — the idea's decision history)

Every material decision gets one appended row; nothing is ever rewritten. Gate-check appends automatically; stage skills append on pivots.

```markdown
| date | type | decision | alternatives considered | rationale | evidence (E-ids / gatekeeper findings) | detail |
|---|---|---|---|---|---|---|
```

Six columns for every row, plus one typed `detail` cell whose contents depend on `type` — imposing
gate-verdict bookkeeping on every journal event (a spend, a mode switch) cost migration and context for
nothing. `detail` holds `key=value; key=value` pairs:

| For `type` | `detail` carries |
|---|---|
| `gate-verdict` | `scope=<approved scope verbatim, and what was NOT approved>; manifest=<path>@<sha256>; cutoff=<date>; reopen_on=<condition>` |
| `threshold-snapshot` / `sampling-frame-snapshot` | for a threshold snapshot the JSON; for a sampling frame the frame FILE path + `@<sha256>` (the file is the artifact; there is no second copy of the text) |
| `spend` | `usd=<amount>; item=<what>` |
| `will-override` / `invariant-change` | the charter item id, and for an invariant the exact old → new wording |
| `reconciliation` | `reconcile=<id>; manifest=<path>@<sha256>` |
| `signing-blocked` | `outcome=declined\|blocked; unmet=<the preflight items that were not met>` — the F signing ceremony ran and did **not** produce a signature. `thresholds.signed_date` stays null so the ceremony re-fires; there is no row for "we decided not to ask" (gate-check Layer 0) |
| anything else | free text, or empty |

- **`scope=`** (gate-verdict) — the scope exactly as approved, plus what was explicitly not. A narrowed approval (one segment, one channel, lower spend, shorter window) is recorded as the narrower thing, never rounded up to the full proposal.
- **`manifest=`** (gate-verdict) — the manifest of the exact artifact set the verdict was made against (`scripts/artifact-manifest.js`, `--purpose gate-input`). Without it a verdict can silently appear to authorize a materially different set of files. Legacy rows without it stay valid and are never backfilled — that would fabricate a hash for content nobody hashed.
- **`cutoff=` / `reopen_on=`** (gate-verdict, when time-sensitive) — the date the evidence set closed, and the condition that would reopen it ("if the eval threshold is loaded", "if price changes", "after 2026-09-01"). An approval with no validity boundary quietly becomes permanent.
- **Column count is stable.** A pre-existing journal keeps its own header: append a new versioned table (with a `migration` row pointing at it) rather than rewriting old rows — the log is append-only, so its history includes its own format history.
`type`: `gate-verdict` (incl. gatekeeper findings count + blockers) | `pivot` (segment/problem/solution — what changed, from what) | `mode-switch` | `sampling-frame-snapshot` (V1 frame text + sha256, appended BEFORE collection starts — gate V1 recomputes and compares) | `threshold-revision` (mirrors state.thresholds.revisions) | `spend` (mirrors state.budget.log) | `market-verdict` | `will-override` (founder knowingly decides against evidence — cite E-ids + charter item) | `invariant-change` (a charter invariant is added/reworded/removed — exact old wording, exact new wording, founder approval; legal even while the charter is still `draft`) | `migration` (schema migration, from → to) | `reconciliation` (summary row: reconcile ID, manifest hash, drift dimensions, intake authority — never replaces the specialized rows above) | `run-signed` (validation-run spec signed: run_id, claim ids, threshold snapshot, window) | `run-verdict` (validation-run outcome: run_id, verdict, report ref) | `criterion-disposition` (LOCK ceremony: kill criterion retired/carried/replaced, provenance) | `source-registry-change` (reality source added/removed/rescoped, user-approved) | `signing-blocked` (the F signing ceremony ran and did NOT produce a signature — see the `detail` table above; was ordered by gate-check but missing from this enum until v1.3.0) | `blueprint-amendment` (amend-blueprint recorded a BA-id against a locked blueprint: targets, class, scope-test outcome) | `blueprint-abandoned` (an in-flight blueprint was deliberately abandoned because a new cycle superseded its pack — names the cycle) | `other`.

## audit-trail.md (append-only, tracked — the review record that survives a clone)

No frontmatter (journal format, like `decision-log.md`). Append-only, byte-exact prefix, hook-enforced.

**Why it exists** (dogfood finding, run #2). Gatekeeper reports and gate manifests are persisted under
`private/`, which carries its own `.gitignore` (`*` + `!.gitignore`) so identities never leak. That is
correct for privacy and wrong for auditability: `private/` does not travel. Run #2 ended with **19
references across 8 public artifacts** pointing at `private/gatekeeper-F-*.md`,
`private/manifest-*.json`, `private/contacts.md` and a research trail — every one of them dangling on a
fresh clone, while the artifacts making the contested claims travelled fine. A reader saw "contested per
gatekeeper B4" and could not open B4. So the verbatim report stays private and a **redacted derivative is
tracked**:

```markdown
## <GATE> attempt <NN> — <YYYY-MM-DD> — <PASS|FAIL|OPEN-ACCEPTED|signing-blocked>
manifest: <path>@<sha256>   ·   verbatim report: private/gatekeeper-<gate>-YYYYMMDD-NN.md (not in git by design)
blockers: <n> · non-blocking: <n>

| id | severity | finding (redacted) | lands on | status |
|---|---|---|---|---|
| B4 | blocker | the ~20x traction figure is unsupported by its own citations; caveat present in the raw scan trail was dropped when promoted | competitive-map.md:80-92 | unremediated |
```

Rules:
- **Redaction, not summarization.** Keep each finding's claim and where it lands — that is what a later
  reader needs to know whether to trust an artifact. Replace only what `private/` exists to protect: real
  names, contact details and personal profile URLs become `P<id>`; quotes whose only source is a private
  file become an `E<id>` reference. Quotes already public in `evidence-ledger.md` stay verbatim.
- **Never soften.** A redacted finding that reads milder than the original defeats the purpose; severity
  and wording carry over. If redaction would make a finding unintelligible, say so in the cell rather
  than dropping it.
- **`status`** tracks remediation across attempts: `unremediated` | `fixed in <attempt>` | `contested` |
  `withdrawn`. This is how a clone learns that ten blockers were found and none were fixed.
- Written by gate-check Layer 2 immediately after the verbatim report is persisted, and by the
  `signing-blocked` path with an empty findings table. One section per gate attempt, appended.
- The missing `private/` files are **expected absence, not damage** — a clone reading this file has the
  reasoning; it just cannot re-read the original. Say that in the header line rather than leaving a
  reader to wonder whether the repo is broken.

## post-mortem.md (only when the idea is stopped)

Written when kill criteria trigger and the user confirms stop, or a gate fails terminally with no pivot direction. Purpose: the learning survives the idea.

```markdown
# Post-mortem — <title>
- What we believed (from idea-brief + assumption-map):
- What killed it (E-ids, gate, kill criterion):
- What we'd do differently:
- Reusable assets (ledger verbatims, competitor map, kits, segment knowledge — usable by future ideas):
- Total spend (time / money):
```

## unvalidated-build-decision.md (only when building against a failed mandatory gate)

Per the will-override boundary (the `method-rules-gate-contracts` skill): a will-override never upgrades evidence, alters a metric, or flips a FAIL to a PASS. If the founder chooses to build anyway, this artifact is the honest paper trail — gate states and the pack verdict stay truthful regardless of this decision.

```markdown
---
artifact: unvalidated-build-decision
idea: <slug>
stage: <stage the failed gate belongs to>
gate: <the failed gate, e.g. V1>
status: ready
evidence_grade: <the failed gate's actual evidence grade, honestly>
rung: baseline-auto
pipeline_version: 1.9.0
updated: YYYY-MM-DD
---
# Unvalidated build decision — <title>
- **Failed gate**: <gate> — verdict FAIL, dated <date>, per gatekeeper report `private/gatekeeper-<gate>-<date>-<n>.md`
- **What the evidence said** (E-ids, metric vs threshold):
- **Founder's exact words** (the override — charter item id, e.g. W-id in founder-charter.md):
- **What will be built anyway**:
- **Decision-log reference**: `will-override` row, date ___
```

**Owner: gate-check's FAIL override sub-ceremony** — never a stage skill. Gate-check is the only component that simultaneously holds every required input (the formal FAIL, the persisted gatekeeper report, the failed metric vs threshold, the founder's explicit decision, and the authority to append `will-override`), and gate-check may be invoked directly with several DAG branches active, so no stage skill can be relied on to be "the one in progress". Making the evidence-producing stage author its own exception record would also create an avoidable laundering boundary. Gate-check never creates the file automatically on FAIL: it requires the separate non-skippable override checkpoint, and it writes the file and the `will-override` row in one step. Its existence never changes any gate's recorded status or the pack predicate.

## Evidence Quality Report format (`mvp-pack/evidence-quality-report.md`)

Per decision block of the pack: the gate it came through, evidence grade distribution (count by A/B/C; D excluded by definition), rung used, and the upgrade path ("running <kit> would raise this block to grade <X>"). Ends with the pack verdict computed by the **exact predicate in the `method-rules-gate-contracts` skill** — `Validated` / `Hypothesis` / `Pre-feasibility Hypothesis` — and an honest one-paragraph summary of what is known vs assumed. Confidence language throughout the pack must match the grades (gatekeeper checks this at LOCK).
