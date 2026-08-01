---
name: stage-4-positioning-templates
description: Artifact templates for stage 4 of the SaaS validation pipeline. Load when writing that stage's artifacts.
user-invocable: false
---

# Stage 4 artifact template

## positioning.md
```markdown
---
artifact: positioning
idea: <slug>
stage: 4
gate: P
status: draft            # locked at gate P pass
evidence_grade: B
rung: <rung>
pipeline_version: 1.10.0
updated: YYYY-MM-DD
---
# Positioning THESIS (pre-product: expect revision once real customers arrive; do not tighten early)
## 1. Best customers
| Pid | why (understood fast / committed fast) | E-ids |
|---|---|---|
## 2. Competitive alternatives (FROM LEDGER ONLY — phantoms eliminated)
| alternative | evidence (who considers it, E-ids) |
|---|---|
| eliminated phantom | reason (no customer mentioned) |
## 3. Unique attributes (consistent with promise-scope.md)
## 4. Value & proof ("so what?" test applied)
| attribute | value to customer | proof (R2 measurements, E-ids) |
|---|---|---|
## 5. Target segment (paying segment vs complaining segment noted)
## 6. Market category
- Style: head-to-head / big-fish-small-pond (default) / new-game (~10% cases)
- Category chosen + why it makes the value obvious:
- Relevant trend (optional, answers "why now", never replaces category):
## 7. Copy test
- If cloned in a month, what survives: 
## 8. Pitch (customer verbatim language)
> "Unlike ___, this ___ for ___ because ___."
- Test result: reactions (handoff) / A/B data (market-evidence) / UNTESTED (analysis — carried forward)
```
