# Stage 3 artifact templates

## error-analysis/summary.md (canonical R1 artifact — merged by the coordinator after all batch workers finish; `error-analysis/batch-NNN.md` worker files are frontmatter-exempt raw trace data)
```markdown
---
artifact: error-analysis-summary
stage: 3
gate: R1
status: draft
evidence_grade: C
rung: <rung — note judge substitute used>
...
---
# Error analysis (open coding — ~100 traces to start; stop after ~20 consecutive traces with no new category)
| # | input (ref) | output (ref) | error noted | category (taxonomy) | fix-now or eval? |
|---|---|---|---|---|---|
## Failure taxonomy
| Category | Count | Severity | Design answer |
|---|---|---|---|
## Judge rung
- Human review: user reviewed ___ outputs on YYYY-MM-DD / none
- Model consensus: models used ___, agreement ___%
## Criteria (drifted freely while reading; final)
```

## promise-scope.md
```markdown
---
artifact: promise-scope ... gate: R1 ... status: draft   # locked at R1 pass
---
# Promise scope (locks at R1 — feeds positioning)
- Customer acceptance threshold (from V1/V2, E-ids): ___ · signed into thresholds.r1_eval_pass_pct on YYYY-MM-DD
- Eval result on real data: ___%
- Failure style: visibly-wrong / plausibly-wrong → HITL required? ___
- Marginal cost per use: $___ vs V3 price $___ → margin: ___
- Hard constraints: 
## The product PROMISES / REFUSES TO PROMISE
```

## data-acquisition-plan.md (R1 OPEN only — one of the three OPEN deliverables)
```markdown
---
artifact: data-acquisition-plan ... stage: 3 ... gate: R1 ... status: draft ...
---
# Data acquisition plan (R1 is OPEN because representative real data was unobtainable)
- What data is needed (shape, volume, sensitivity):
- Candidate sources (waitlist value-exchange / pilot contacts / partnerships / public sets ruled out and why):
- Who obtains it, how, by when:
- Consent/permission approach (rows go to spike/data-manifest.md when obtained):
- Trigger to re-run R1:
```
> The other two OPEN deliverables: feasibility-risk dossier = the risks section of promise-scope.md; `eval/README.md` = short statement of why no evaluation was possible + what the harness will measure once data exists.

## concierge-kit.md
```markdown
---
artifact: concierge-kit ... gate: R2 ... status: ready
---
# Concierge / automated-pilot kit
- Offer to committed contacts: · Delivery channel: · Session checklist:
## Delivery log (Pids only; work items and delivered outputs live in private/ as refs)
| Pid | date | work item ref (private/…) | result ref (private/…) | rung (manual/automated/dry-run) |
|---|---|---|---|---|
## Outcomes (not sentiment)
| Pid | hours saved (measured) | output used downstream? evidence ref |
|---|---|---|
## Proto-retention
| Pid | returned unprompted? | date |
|---|---|---|
## Manual-ops log (= the true MVP spec)
| # | step performed by hand | automatable? | belongs to core loop? |
|---|---|---|---|
```
