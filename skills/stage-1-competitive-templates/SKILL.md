---
name: stage-1-competitive-templates
description: Artifact templates for stage 1 of the SaaS validation pipeline. Load when writing that stage's artifacts.
user-invocable: false
---

# Stage 1 artifact templates

## competitive-map.md

```markdown
---
artifact: competitive-map
idea: <slug>
stage: 1
gate: C
status: draft          # stays draft until calibrated by customer words in stage 2
evidence_grade: B
rung: <enhanced-auto|baseline-auto|handoff>
pipeline_version: 1.2.0
updated: YYYY-MM-DD
---
# Competitive map (DRAFT — calibrate against customer words in stage 2; do not position against phantom competitors)
## 5-tier map
| Tier | Name | What it is | Source URL | Verified | Customers actually mention it? (fill in stage 2) |
|---|---|---|---|---|---|
| 1 direct | | | | | |
| 2 indirect | | | | | |
| 3 DIY | | | | | |
| 4 general AI | | | | | |
| 5 do nothing | status quo — 40–60% of B2B purchases end in no decision (JOLT Effect) | | — | — | |
## Competitor profiles
### <name>
- Positioning: · ICP: · Main channel: · Age: · Health signals:
- **Pricing (normalized — never compare un-normalized numbers)**

| plan/edition | list price | effective price (promo/annual/quote) | currency | tax incl.? | billing period | seat/usage basis | locale | observed_at | effective_at | source URL |
|---|---|---|---|---|---|---|---|---|---|---|

- **Capabilities (state, not just presence)**

| capability | state (announced/beta/documented/generally-available/observed/withdrawn) | source URL | observed_at |
|---|---|---|---|

> Annual-prepaid vs monthly, another currency, another edition, or tax treatment can each fake a
> 20–40% price difference. A withdrawn feature is a signal in the *opposite* direction from a shipped
> one — never flatten the two into "they have it".
> **Re-scan before LOCK?** Report deltas against the rows above (what changed, when observed), not a
> silent overwrite: the earlier observation was true when it was made.
## Market verdict
- Scenario: proven-money / red-flag-empty / crowded-but-bad
- Justification & dead-predecessor findings:
- User's call (proceed / stop / investigate):
```

## review-mining.md

```markdown
---
artifact: review-mining
idea: <slug>
stage: 1
gate: C
status: draft
evidence_grade: B
rung: <rung>
pipeline_version: 1.2.0
updated: YYYY-MM-DD
---
# Negative-review mining (1–3★, verbatim only)
| Unmet-need cluster | Count | Representative verbatim | Product | URL |
|---|---|---|---|---|
## Blocked sources (handoff candidates)
| Site | URL | What we need from it |
|---|---|---|
```
