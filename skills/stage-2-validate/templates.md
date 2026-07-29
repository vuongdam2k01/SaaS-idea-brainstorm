# Stage 2 artifact templates

All files carry standard frontmatter (artifact-schema). Key structures:

## evidence-ledger.md
```markdown
---
artifact: evidence-ledger
stage: 2
gate: V1
status: draft
evidence_grade: B
...
---
# Evidence ledger (single source of truth — grade D never enters; real contacts as P-ids only)
## Sampling frame (V1 — REGISTERED BEFORE MINING; the gate metric counts only from this frame)
- Neutral queries, EXACT strings (problem-space language, NOT success-condition language):
- Sources + per-source result cutoff (e.g. "first 50 results/threads per query"):
- Time window: · Inclusion/exclusion rules: · Dedupe rule across sources (by author handle/URL):
- **Stopping rule (pre-registered)**: mining stops when the frame is exhausted OR after ___ consecutive new results yield no new distinct individual — never when the ratio looks favorable.
- Claim scope: results support statements about **search-indexed discussants of this problem**, not market prevalence — phrase V1 conclusions accordingly.
- Registered on: YYYY-MM-DD
| id | date | source | type | url_or_ref | retrieved | via | verbatim_or_observation | assumption | grade | status |
|---|---|---|---|---|---|---|---|---|---|---|
> Rows from targeted behavior-searches are tagged `exploratory` in `via` and excluded from the V1 denominator.
## Pain / theme clusters (synthesis over the ledger)
| cluster | count / N | representative E-ids | notes |
|---|---|---|---|
> Every experiment result (mining round, landing run, pre-sell round) also produces a Learning Card row in assumption-map.md — the ledger holds facts, the Learning Cards hold what we concluded and what we do next.
## V1 metric
- Sample (distinct individuals): N = ___ · with past solution-seeking/workaround behavior: ___ (___%)
- Pre-registered threshold: ≥ ___% of ≥ ___ (signed YYYY-MM-DD) → PASS/FAIL
## First-class signals
- [ ] Maintained DIY workaround found: (E-ids)
- [ ] Tried general AI directly and failed: (E-ids)
## Commitment log (interactive contacts only)
| Pid | date | commitment given (time/reputation/money) | note (no identifying details) |
|---|---|---|---|
```

## interview-kit.md
```markdown
---
artifact: interview-kit ... gate: V1 ...
---
# Interview kit (Mom Test discipline: past & present only; never pitch; no hypotheticals)
## 4 mandatory questions
1. When did this problem last happen? 2. How did you handle it? 3. What did it cost (hours/money)? 4. Have you ever actively looked for a solution?
## Competitor calibration
What do you use today? What else did you try? Why did you drop it? What keeps you on it?
## Idea-specific probes
## Logistics
Target: tier-4/5 names from beachhead-icp.md · record or take verbatim notes · drop raw material into private/ · end every contact by asking for a concrete commitment (time/reputation/money)
```

## solution-directions.md
```markdown
---
artifact: solution-directions ... gate: V2 ...
---
# Solution directions
| Dir | Approach | Tied to evidence (E-ids) | ChatGPT-gap result | Added-value layer | Verdict |
|---|---|---|---|---|---|
## Mock reactions (behavioral only)
| Pid/source E-id | Direction | Asked price? | Asked timeline? | Pulled colleague? | Switching-threshold read |
|---|---|---|---|---|---|
## Winning direction + core value layer (locked at V2)
```

## landing-kit.md
```markdown
---
artifact: landing-kit ... gate: V2 ... status: ready   # ready-to-run kit even if gate accepted OPEN
---
# Landing kit
- Value prop (verbatim-derived, cite E-ids): · CTA: · Pricing section (for intent measurement):
- Page: ./landing/ (built, self-contained)
- Traffic plan: organic drafts (user posts) / paid (within budget cap) / none
- Measurement: conversion to payment-intent (NOT raw signups; signup→paid benchmark 5–15%)
- Pre-registered threshold: ___ (signed date)
## Results (fill when run)
```

## presell-kit.md
```markdown
---
artifact: presell-kit ... gate: V3 ... status: ready
---
# Pre-sell kit
- Price anchor: ___ based on real alternative cost (E-ids) · Model: ___
- Commitment ladder: card → deposit → prepay → paid pilot · B2B manual-service-first offer:
- Pitch script:
- Payment link: (Stripe link — manual creation is fine and still grade A)
## Willingness-to-pay analysis (analysis mode)
| Signal | Source (E-id/URL) | Implied price tolerance |
|---|---|---|
## Commitments (real money only — Pids; identities & payment details in private/ only)
| Pid | relationship (outside personal?) | ladder level | amount | date |
|---|---|---|---|---|
## Refusal log
| Pid/source E-id | verbatim reason | cluster |
|---|---|---|
- Pre-registered threshold: ≥ ___ commitments (signed date) → PASS / FAIL / OPEN
```
