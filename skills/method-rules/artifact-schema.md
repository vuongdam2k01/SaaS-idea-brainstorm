# Artifact frontmatter & evidence ledger schema (v1.1.0)

## Frontmatter (required on every `.md` artifact under `ideas/<slug>/`, except README and files under `private/`)

```yaml
---
artifact: problem-hypothesis        # kebab-case id, unique within the idea
idea: <slug>
stage: 0                            # 0..5
gate: F                             # F | C | V1 | V2 | V3 | R1 | R2 | P | LOCK
status: draft                       # draft | ready | locked
evidence_grade: none                # highest grade backing this artifact: A | B | C | D | none
rung: baseline-auto                 # enhanced-auto | baseline-auto | handoff | simulate
pipeline_version: 1.1.0
updated: YYYY-MM-DD
---
```

A PostToolUse hook validates these keys; missing frontmatter blocks with a fix instruction. `status: locked` is reserved for signed artifacts (kill-criteria, DoD, final positioning, mvp-spec) — a PreToolUse hook escalates edits to locked files.

## Evidence ledger (`evidence-ledger.md`, one per idea)

The single source of truth for all evidence. Downstream artifacts cite entries by id.

```markdown
| id | date | source | type | url_or_ref | retrieved | via | verbatim_or_observation | assumption | grade | status |
|----|------|--------|------|-----------|-----------|-----|-------------------------|------------|-------|--------|
| E1 | 2026-07-29 | reddit u/... | community | https://... | 2026-07-29 | miner-run-3 | "exact quote" | A3 | B | confirms |
```

- `type`: `person` | `community` | `review` | `survey` | `payment` | `usage` | `spike-data`
- `source`: who/where, specific enough to re-find — **pseudonymous P-ids for real contacts** (identity map in `private/contacts.md`). `url_or_ref`: URL, or file ref for user-provided material (e.g. `private/interview-03.txt`).
- `retrieved` + `via` (provenance): when it was fetched and by which run/query — sources change or vanish; for fragile sources save an excerpt snapshot under `private/snapshots/E<id>.txt` so a later failed spot-check can distinguish "changed upstream" from "fabricated".
- `verbatim_or_observation`: exact quote in quotes, or a measured observation. Paraphrases must be tagged `PARAPHRASE:` and are down-weighted at gates.
- `assumption`: the assumption-map id (A1, A2, ...) this entry bears on. `status`: `confirms` | `refutes` | `unclear` → rolled up into the assumption map.
- **Grade D never appears in the ledger.** Model-generated material lives in the "Open hypotheses" section of the artifact that produced it.

## GUESS labeling

Any model-drafted value inside an artifact that is not yet backed by a ledger entry is written as `[GUESS] <content>`. Canvas cells, personas, threshold suggestions — all start as `[GUESS]`. Only evidence (ledger id) or explicit user confirmation removes the tag; record which.

## Standard artifact set per idea

| Stage | Artifacts |
|---|---|
| 0 | `idea-brief.md` (foundational, living), `problem-hypothesis.md`, `lean-canvas.md`, `beachhead-icp.md` (incl. prospect funnel tracker), `assumption-map.md` (incl. Test & Learning Cards), `kill-criteria.md` |
| 1 | `competitive-map.md`, `review-mining.md` |
| 2 | `evidence-ledger.md` (incl. pain/theme clusters), `solution-directions.md`, `landing-kit.md`, `presell-kit.md` (+ `interview-kit.md` for handoff/carry-forward) |
| 3 | `spike/` (code + `data-manifest.md`), `error-analysis/` (canonical `summary.md`; `batch-NNN.md` worker files are frontmatter-exempt trace data), `eval/` (harness — or `eval/README.md` when R1 is OPEN), `promise-scope.md`, `concierge-kit.md`, `data-acquisition-plan.md` (R1 OPEN only) |
| 4 | `positioning.md` |
| 5 | `mvp-pack/` → `mvp-spec.md`, `tech-design.md`, `definition-of-done.md`, `carry-forward.md`, `evidence-quality-report.md` |
| Cross-stage | `decision-log.md` (append-only journal, created at init), `founder-charter.md` (living intent record, created at init, ships in mvp-pack), `post-mortem.md` (written only when an idea is stopped), `unvalidated-build-decision.md` (written only when the founder builds against a failed mandatory gate — see below) |

## decision-log.md (append-only — the idea's decision history)

Every material decision gets one appended row; nothing is ever rewritten. Gate-check appends automatically; stage skills append on pivots.

```markdown
| date | type | decision | alternatives considered | rationale | evidence (E-ids / gatekeeper findings) |
|---|---|---|---|---|---|
```
`type`: `gate-verdict` (incl. gatekeeper findings count + blockers) | `pivot` (segment/problem/solution — what changed, from what) | `mode-switch` | `threshold-revision` (mirrors state.thresholds.revisions) | `spend` (mirrors state.budget.log) | `market-verdict` | `will-override` (founder knowingly decides against evidence — cite E-ids + charter item) | `invariant-change` (a charter invariant is added/reworded/removed — exact old wording, exact new wording, founder approval; legal even while the charter is still `draft`) | `other`.

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

Per the will-override boundary (gate-contracts.md): a will-override never upgrades evidence, alters a metric, or flips a FAIL to a PASS. If the founder chooses to build anyway, this artifact is the honest paper trail — gate states and the pack verdict stay truthful regardless of this decision.

```markdown
---
artifact: unvalidated-build-decision
idea: <slug>
stage: <stage the failed gate belongs to>
gate: <the failed gate, e.g. V1>
status: ready
evidence_grade: <the failed gate's actual evidence grade, honestly>
rung: baseline-auto
pipeline_version: 1.1.0
updated: YYYY-MM-DD
---
# Unvalidated build decision — <title>
- **Failed gate**: <gate> — verdict FAIL, dated <date>, per gatekeeper report `private/gatekeeper-<gate>-<date>-<n>.md`
- **What the evidence said** (E-ids, metric vs threshold):
- **Founder's exact words** (the override — charter item id, e.g. W-id in founder-charter.md):
- **What will be built anyway**:
- **Decision-log reference**: `will-override` row, date ___
```

Created by whichever skill is active when the founder overrides a FAIL; gate-check never creates or edits this file itself, and its existence never changes any gate's recorded status.

## Evidence Quality Report format (`mvp-pack/evidence-quality-report.md`)

Per decision block of the pack: the gate it came through, evidence grade distribution (count by A/B/C; D excluded by definition), rung used, and the upgrade path ("running <kit> would raise this block to grade <X>"). Ends with the pack verdict computed by the **exact predicate in [gate-contracts.md](gate-contracts.md)** — `Validated` / `Hypothesis` / `Pre-feasibility Hypothesis` — and an honest one-paragraph summary of what is known vs assumed. Confidence language throughout the pack must match the grades (gatekeeper checks this at LOCK).
