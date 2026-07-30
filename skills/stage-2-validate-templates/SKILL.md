---
name: stage-2-validate-templates
description: Artifact templates for stage 2 of the SaaS validation pipeline. Load when writing that stage's artifacts.
user-invocable: false
---

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
## Sampling frame (V1) — POINTER ONLY; the frame itself lives in `sampling-frame-v1.md`
- Frame file: `sampling-frame-v1.md` · manifest: `private/manifest-v1-frame.json` · sha256: ___
- Journaled as `sampling-frame-snapshot` on: YYYY-MM-DD (BEFORE collection began)
> The frame is **not** duplicated here. Two copies means the protected one and the narrated one can
> diverge, and only the file is hashed — so the metric could be argued against an edited copy. Read the
> file for the queries, sources, window, inclusion/exclusion, dedupe rule, stopping rule and claim scope.
| id | date | source | root_source_id | type | url_or_ref | retrieved | via | verbatim_or_observation | assumption | grade | bearing | scope_limits | relationship | supersedes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
> Rows from targeted behavior-searches are tagged `exploratory` in `via` and excluded from the V1 denominator.
> `root_source_id` = the ORIGINAL source, not the page you read it on (`RS-<slug>`): rows sharing a root
> are **one** source in every denominator, however many reposts carried the same complaint — independence
> is computed from distinct roots, never declared. `bearing` is `supports|contradicts|unclear` (the field
> formerly called `status`). `scope_limits` = who/where/when this actually covers; blank means gates read
> it at its narrowest. A wrong row is `superseded` by a corrected one — never edited away, and a
> superseded row stops counting. A pipe inside a quote must be escaped (`\|`) — the validator reads
> escaped pipes correctly, but an UNESCAPED one shifts every later column and silently misreads
> grade/bearing/root. For long quotes keep the cell short and put the full excerpt in
> `private/snapshots/E<id>.txt`.
> Validate before any gate that consumes it: `node scripts/validate-evidence-ledger.js <path> --json`.
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
| Dir | Approach | Tied to evidence (E-ids) | ChatGPT-gap result (REQUIRED: what you actually tried + what the model produced + where it fell short) | Added-value layer | Verdict |
|---|---|---|---|---|---|
> The ChatGPT-gap result must be recorded per surviving direction, not asserted. Your own prompting is
> grade D (model-generated) — it informs the analysis and never the gate; only real customers'
> documented attempts count (mined "tried AI and failed" = B, observed attempt = C).

## Mock sessions — accounting (this table IS the denominator)
| Session | Pid | Direction | Task given (goal + context, no UI instructions) | Interventions (every hint given) | Outcome (unassisted/rescued/failed/abandoned) | Confounds | Valid? |
|---|---|---|---|---|---|---|---|
- Valid sessions: ___ / total ___ · **excluded** (invalid/cancelled/withdrawn, listed with reason): ___
- **Only `unassisted` outcomes count as support.** `rescued` = the moderator completed it, not the user.
- No prevalence claims from these sessions (formative sample shows *that*, not *how often*).

## Findings (one row per finding, in this order — an interpretation may be disputed without losing the observation)
| # | Observation (what happened, verbatim/behavioral) | Interpretation | Impact (consequence × recoverability, not sample frequency) | Recommendation | Sessions (ids) |
|---|---|---|---|---|---|

## Behavioral reactions (separate from usability findings)
| Pid/source E-id | Direction | Asked price? | Asked timeline? | Pulled colleague? | Switching-threshold read |
|---|---|---|---|---|---|

## Experiment outcome
- Verdict: `supported` | `weakened` | `inconclusive` | **`invalid`** (instrument failed — repair + re-run; numbers do NOT enter the ledger)
- Instrumentation check performed before the run: (what you fired/loaded/submitted, and when)
## Winning direction + core value layer (locked at V2)
```

## participant-data-manifest.md — **`private/` ONLY, never in a public artifact**
```markdown
# Participant data manifest (private)
> One row per interactive contact, written BEFORE their material enters any artifact.
> The retention date is an obligation with a named human owner — this plugin surfaces it when it
> comes due; it cannot guarantee calendar-time deletion on its own, and never deletes anything
> without explicit approval over the exact files.

| duty_id | Pid | kind (interview/mock/pilot) | first contact | consent basis (what they were told, how) | recorded? (notes/audio/screen) | allowed use | retention deadline | withdrawal state | disposition (date + what was deleted) |
|---|---|---|---|---|---|---|---|---|---|

- Publication rule: only pseudonymous ids + aggregate/redacted excerpts leave `private/`.
- Withdrawal: on request, mark `withdrawn`, stop using their material, and exclude their session from
  every denominator (excluded sessions are listed, never silently dropped).
- Mirror each row's `{duty_id, participant_id, delete_by, status, kind}` into
  `state.json.privacy.retention_duties` — a closed key set, nothing else (no names, no consent text).
  One duty per row, with its own `D<n>` id: a participant interviewed AND filmed has two duties, and
  keying on the participant alone let one of them disappear.
- Extending a deadline means writing a **new `delete_by` on the still-`active` duty**. There is no
  "extended" status — a status the overdue scan skips is a duty that goes quiet.
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
