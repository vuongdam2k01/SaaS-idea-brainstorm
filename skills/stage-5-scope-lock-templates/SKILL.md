---
name: stage-5-scope-lock-templates
description: Artifact templates for stage 5 of the SaaS validation pipeline. Load when writing that stage's artifacts.
user-invocable: false
---

# Stage 5 — MVP Pack templates (ideas/<slug>/mvp-pack/)

## mvp-spec.md (entry point)
```markdown
---
artifact: mvp-spec
idea: <slug>
stage: 5
gate: LOCK
status: draft            # locked at gate LOCK
evidence_grade: <highest backing grade>
rung: <rung>
pipeline_version: 1.10.0
updated: YYYY-MM-DD
---
# MVP Spec — <title>   [label COMPUTED by `scripts/pack-verdict.js`, never chosen]
> **Until LOCK passes the label reads `<LABEL> (PROSPECTIVE — LOCK not yet passed)`.** It is written
> before the gate because the gate reviews the pack that contains it; gate-check strips the marker on
> PASS and only then is the label final. A pack whose label has no marker while `gates.LOCK` is not
> `passed` is a Layer 1 blocker — that is the case where a prospective VALIDATED stamp outlived a
> failed gate. If label and gate state ever disagree, the gate state is right.
> Read order for a build session: this file → tech-design.md → definition-of-done.md → **founder-charter.md** (the interpretive authority: how the founder decides anything this pack doesn't decide) → carry-forward.md → evidence-quality-report.md
## Core loop (≤5–7 steps, each traced)
<!-- pack:core-loop -->
| # | User does | System does | User gets | Trace (E-ids / ops-log) |
|---|---|---|---|---|
## Aha event (named, measurable)
<!-- pack:aha -->
- Event: `event_name` — definition: ___ — source: R2 observation / dry-run [ASSUMED]
## Cut list — v1 will NOT do
| feature cut | who asked (Pid/E-id) | why cut (no paying-customer trace) |
|---|---|---|
## Positioning summary (from positioning.md)
- Pitch: "Unlike ___, this ___ for ___ because ___."
- Promises / refuses to promise (from promise-scope.md):
## Pricing
- Anchor: $___ vs real alternative ___ · Model: ___ · Paying segment: ___

## Minimum service promise (the smallest HONEST promise around this MVP)
> Scope is only half the contract. Real money was committed at V3, so the people who paid have
> expectations — write the ones we can actually keep. **Invent nothing**: no SLA percentages, no
> uptime numbers, no support-response times the founder has not agreed to. Every field is answered
> or explicitly `N/A because ___`; a blank is a LOCK blocker.

<!-- pack:msp -->
| id | Field | Commitment |
|---|---|---|
| MSP-1 | Who may use it (eligibility) | |
| MSP-2 | Supported use cases | |
| MSP-3 | **Explicitly NOT supported** (say it plainly, so nobody buys the wrong thing) | |
| MSP-4 | Beta / experimental status disclosed how | |
| MSP-5 | Data collected · purpose | |
| MSP-6 | Retention · deletion path · who can request it | |
| MSP-7 | Export / manual correction / recovery expectation | |
| MSP-8 | Support intake (where a user reports a problem) + who answers | |
| MSP-9 | What happens if it breaks (rollback / manual fallback / honest "we fix it next day") | |
| MSP-10 | Pause / exit / sunset behaviour (what happens to their data) | |

(The `MSP-<n>` ids are join keys — stage 6's blueprint and `scripts/validate-blueprint.js` reference
them; keep them verbatim and untranslated.)

"Minimum" means removing whatever does not protect the value, the learning, safety, or an honest
promise. It never means dropping security, privacy, data integrity, accessibility, or a support path.
```

## tech-design.md
```markdown
---
artifact: tech-design ... gate: LOCK ...
---
# Technical design contract
## Domain model (the expensive-to-change part — think here)
<!-- pack:entities -->
Entities, relations, states (diagram or table; entity names lowercase snake_case — stage 6's
field-level schema joins on them):
## ADRs (one paragraph each: chose X over Y because Z)
| # | Decision | Chose | Over | Because |
|---|---|---|---|---|
## Buy-don't-build
<!-- pack:buy -->
auth: · payments: · email: · analytics: · storage:
## The final-20% list (planned up front)
- [ ] error handling · [ ] edge cases · [ ] authz/injection/rate-limit · [ ] failed payments · [ ] backup · [ ] dev/prod separation (no local write access to prod DB; migrations via CI only)
## Comprehension boundary (must understand 100%)
money, user data, auth/authz. Loose elsewhere.
## Event tracking plan (day one)
<!-- pack:tracking -->
| event | name | note |
|---|---|---|
| aha | `event_name` | REQUIRED |
## Eval harness (AI-core)
- Location: ./eval/ (snapshot copied INTO the pack) — ships as CI on build day one. Threshold: ___%
```

## definition-of-done.md
```markdown
---
artifact: definition-of-done ... status: ready ...   # NOT locked here — gate-check Layer 3 promotes ready→locked on LOCK PASS (single-owner rule, the `method-rules-artifact-schema` skill); stage 5 only freezes/dates the content
---
# Definition of Done (frozen BEFORE build — no self-negotiation later)
<!-- pack:dod -->
## Universal invariants (every product) — `DOD-<n>` ids are join keys, keep verbatim
- [ ] DOD-1 Core loop end-to-end
- [ ] DOD-2 Tracking fires the aha event
- [ ] DOD-3 Backup runs (and restore tested)
- [ ] DOD-4 Dogfooded
## Conditional modules — select by product profile; mark the rest N/A WITH a reason
- [ ] DOD-5 (paid product) Real payment collected; failed payment handled; pricing page — or N/A because: ___
- [ ] DOD-6 (multi-tenant) User A cannot see user B's data — or N/A because: ___
- [ ] DOD-7 (collects personal data) Privacy/terms pages + deletion path — or N/A because: ___
Frozen on: YYYY-MM-DD (content is fixed from this date; `status` still `ready` until LOCK PASS) · Changes require user-approved changelog entry below.
## Changelog
```

## carry-forward.md
```markdown
---
artifact: carry-forward ... gate: LOCK ...
---
# Carry-forward: what is still assumed (build phase must treat these as hypotheses, not facts)
| open item | gate | why open | kit (path inside this pack) | upgrade path |
|---|---|---|---|---|
| e.g. money commitment | V3 | analysis mode | ./experiments/presell/ | run kit → grade A |
## Learning plan (first 30 days post-build)
| channel | expectation (visitors/signups/paid) | good threshold | bad threshold |
|---|---|---|---|
```

## evidence-quality-report.md
```markdown
---
artifact: evidence-quality-report ... gate: LOCK ...
---
# Evidence Quality Report
| decision block | gate | evidence grades (A/B/C count) | rung used | upgrade path |
|---|---|---|---|---|
| problem is real | V1 | | | |
| direction & value layer | V2 | | | |
| willingness to pay | V3 | | | |
| feasibility | R1 | | | |
| value delivery | R2 | | | |
| positioning | P | | | |
## Verdict (COMPUTED from gate state — exact predicate in the `method-rules-gate-contracts` skill)
Inputs evaluated (so the derivation is checkable): V1 ___ · V2 ___ · V3 ___ (grade ___) · R1 ___ · R2 ___ · P ___ · LOCK ___
→ **VALIDATED** (all passed AND V3 grade A) | **HYPOTHESIS** (LOCK reached, R1 passed, ≥1 of V2/V3/R2 open) | **PRE-FEASIBILITY HYPOTHESIS** (R1 open)
This string must be byte-identical to the one in `mvp-spec.md`'s title line. If prose and gate state disagree, the gate state is right.
One honest paragraph: what is known vs what is assumed.
```
