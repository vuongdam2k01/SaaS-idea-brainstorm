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
pipeline_version: 1.1.0
updated: YYYY-MM-DD
---
# MVP Spec — <title>   [VALIDATED PACK | HYPOTHESIS PACK | PRE-FEASIBILITY HYPOTHESIS PACK]
> Read order for a build session: this file → tech-design.md → definition-of-done.md → **founder-charter.md** (the interpretive authority: how the founder decides anything this pack doesn't decide) → carry-forward.md → evidence-quality-report.md
## Core loop (≤5–7 steps, each traced)
| # | User does | System does | User gets | Trace (E-ids / ops-log) |
|---|---|---|---|---|
## Aha event (named, measurable)
- Event: `event_name` — definition: ___ — source: R2 observation / dry-run [ASSUMED]
## Cut list — v1 will NOT do
| feature cut | who asked (Pid/E-id) | why cut (no paying-customer trace) |
|---|---|---|
## Positioning summary (from positioning.md)
- Pitch: "Unlike ___, this ___ for ___ because ___."
- Promises / refuses to promise (from promise-scope.md):
## Pricing
- Anchor: $___ vs real alternative ___ · Model: ___ · Paying segment: ___
```

## tech-design.md
```markdown
---
artifact: tech-design ... gate: LOCK ...
---
# Technical design contract
## Domain model (the expensive-to-change part — think here)
Entities, relations, states (diagram or table):
## ADRs (one paragraph each: chose X over Y because Z)
| # | Decision | Chose | Over | Because |
|---|---|---|---|---|
## Buy-don't-build
auth: · payments: · email: · analytics: · storage:
## The final-20% list (planned up front)
- [ ] error handling · [ ] edge cases · [ ] authz/injection/rate-limit · [ ] failed payments · [ ] backup · [ ] dev/prod separation (no local write access to prod DB; migrations via CI only)
## Comprehension boundary (must understand 100%)
money, user data, auth/authz. Loose elsewhere.
## Event tracking plan (day one)
| event | name | note |
|---|---|---|
| aha | `event_name` | REQUIRED |
## Eval harness (AI-core)
- Location: ./eval/ (snapshot copied INTO the pack) — ships as CI on build day one. Threshold: ___%
```

## definition-of-done.md
```markdown
---
artifact: definition-of-done ... status: ready ...   # NOT locked here — gate-check Layer 3 promotes ready→locked on LOCK PASS (single-owner rule, artifact-schema.md); stage 5 only freezes/dates the content
---
# Definition of Done (frozen BEFORE build — no self-negotiation later)
## Universal invariants (every product)
- [ ] Core loop end-to-end
- [ ] Tracking fires the aha event
- [ ] Backup runs (and restore tested)
- [ ] Dogfooded
## Conditional modules — select by product profile; mark the rest N/A WITH a reason
- [ ] (paid product) Real payment collected; failed payment handled; pricing page — or N/A because: ___
- [ ] (multi-tenant) User A cannot see user B's data — or N/A because: ___
- [ ] (collects personal data) Privacy/terms pages + deletion path — or N/A because: ___
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
## Verdict (exact predicate — gate-contracts.md)
**VALIDATED** (V1,V2,V3,R1,R2,P,LOCK all passed AND V3 grade A) | **HYPOTHESIS** (LOCK reached, R1 passed, ≥1 of V2/V3/R2 open) | **PRE-FEASIBILITY HYPOTHESIS** (R1 open)
One honest paragraph: what is known vs what is assumed.
```
