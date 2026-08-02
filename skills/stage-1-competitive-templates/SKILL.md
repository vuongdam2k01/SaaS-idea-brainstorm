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
pipeline_version: 1.13.0
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
pipeline_version: 1.13.0
updated: YYYY-MM-DD
---
# Negative-review mining (1–3★, verbatim only)
| Unmet-need cluster | Count | Representative verbatim | Product | URL |
|---|---|---|---|---|
## Blocked sources (handoff candidates)
| Site | URL | What we need from it |
|---|---|---|
```

## source-registry.md (v1.4.0 — idea root, not stage-scoped; created on the first research fetch)

No frontmatter (a living index, like `decision-log.md`'s table shape, but rows are **updated in
place** on a rescan rather than appended — see `method-rules-artifact-schema`). One row per
**canonical URL** (`scripts/lib/url-canon.js`) ever fetched by `competitor-scanner` or
`community-review-miner`. Consult before fetching: a URL already here with `claims_extracted`
non-empty is a candidate to skip.

```markdown
# Source registry — <idea title>
| canonical_url | content_hash | first_seen_run | claims_extracted | rescan_count | last_rescan_justification |
|---|---|---|---|---|---|
```

- `content_hash`: sha256 of the fetched content at `first_seen_run` (or the latest rescan).
- `claims_extracted`: evidence-ledger `E-` ids this source backs.
- `rescan_count`: `0` is normal; incrementing it **requires** a non-empty `last_rescan_justification`
  (checked by `scripts/validate-source-registry.js`, advisory at gate-check Layer 1 for now).
