---
name: stage-0-framing-templates
description: Artifact templates for stage 0 of the SaaS validation pipeline. Load when writing that stage's artifacts.
user-invocable: false
---

# Stage 0 artifact templates

Frontmatter per artifact-schema (method-rules skill). Write artifacts in the user's language; keep methodology terms in English.

## idea-brief.md (the foundational artifact — created at new-idea, completed at 0.0, evolves for the idea's whole life)

```markdown
---
artifact: idea-brief
idea: <slug>
stage: 0
gate: F
status: draft
evidence_grade: none
rung: baseline-auto
pipeline_version: 1.3.0
updated: YYYY-MM-DD
---
# Idea brief — <title>
## Raw idea (verbatim, immutable)
> exact original words from the user · date received

## Intake classification (what was SAID vs what I READ INTO it)
> `[GUESS]` says "not backed yet"; this table says "where did it come from". Different questions.
> An `interpretation` row may NEVER be promoted to `source-stated` by the model — only the founder
> confirming it does that, and the Source column then cites that exchange.

| # | Statement | Class (`source-stated` / `evidence-backed` / `interpretation` / `assumption` / `unknown`) | Source (founder's words + date · E-id · or "my reading of ___") |
|---|---|---|---|

## Open questions
**Blocking** (each names what it blocks; gate F requires zero unresolved — unknowns are fine, unanswered blockers are not):

| # | Question | What it blocks (section/decision) | Answer + date |
|---|---|---|---|

**Non-blocking** (carried forward, revisited when cheap):

| # | Question | Why it can wait |
|---|---|---|

## What it is (refined articulation)
One paragraph: the product concept as currently imagined. [GUESS] until confirmed.
## For whom / what job it does
## How it's imagined to work (solution concept — captured here so problem-hypothesis.md can stay solution-free)
## Vision & rough roadmap (~18-month horizon — what earlyvangelists actually buy)
## Why now
## Why this founder (founder–market fit: reach into the segment, domain expertise, willing to serve these customers daily?)
## Constraints & preferences
Budget: · Time: · Team: · Stack preferences: · Non-negotiables:
## Founder's definition of success
## Evolution log (every pivot recorded — the brief is living)
| date | what changed in the concept | driven by (gate / E-ids) |
|---|---|---|
```

## founder-charter.md (living intent record — created at new-idea, extracted continuously, ships in mvp-pack as the interpretive authority for undecided downstream questions)

```markdown
---
artifact: founder-charter
idea: <slug>
stage: 0
gate: F
status: draft            # locked at LOCK (with the pack); evolution continues via changelog
evidence_grade: none
rung: baseline-auto
pipeline_version: 1.3.0
updated: YYYY-MM-DD
---
# Founder charter — how <founder> decides
> Grades of will: stated (explicit words) > confirmed (inferred, played back, confirmed) > [INFERRED] (hypothesis — governs nothing).
> **Every belief/preference statement — Invariants, Preference rules, Anti-goals, Taste notes — is a structured item using this exact row shape**: `| id | founder's exact words | model paraphrase | grade | source (gate/date/journal row) | confirmed date | supersedes |`. Exact quotes + supersession history are what prevent the model from slowly rewriting intent while believing it is summarizing it. **Will-overrides in effect** is a different shape by design (see below) — it indexes decision-log rows rather than stating a belief, since a will-override is a one-time event, not a standing preference. Charter locked at LOCK via the non-skippable final playback ceremony (gate-check Layer 0 — never by auto_continue).
## Invariants (non-negotiables — changed only by explicit ceremony, journaled)
| id | founder's exact words | model paraphrase | grade | source (gate/date/journal row) | confirmed date | supersedes |
|---|---|---|---|---|---|---|
| I1 | "solo-maintainable forever, no VC path" | solo-maintainable forever; no VC path | stated | new-idea 2026-07-29 | 2026-07-29 | — |
## Definition of success (the founder's, not the market's)
## Preference rules (trade-off patterns, revisable by evidence — with history)
| id | founder's exact words | model paraphrase | grade | source (gate/date/journal row) | confirmed date | supersedes |
|---|---|---|---|---|---|---|
| P1 | "when it's close, ship it, don't polish it — except anything touching money" | shipping speed vs polish → speed, except in the money path | confirmed | D3, D7 | 2026-08-01 | — |
## Anti-goals (what this must never become)
| id | founder's exact words | model paraphrase | grade | source (gate/date/journal row) | confirmed date | supersedes |
|---|---|---|---|---|---|---|
| AG1 | | | | | | |
## Taste notes (tone, naming, UX feel — from reactions to mocks/copy)
| id | founder's exact words | model paraphrase | grade | source (gate/date/journal row) | confirmed date | supersedes |
|---|---|---|---|---|---|---|
| T1 | | | | | | |
## Will-overrides in effect (bets made knowingly against evidence — indexes decision-log `will-override` rows, does not restate them)
| id | decision-log row | what the evidence said | founder's exact words (the override) | why | confirmed date | supersedes |
|---|---|---|---|---|---|---|
| W1 | | | | | | |
## Decision protocol for the build phase
- Builder may decide alone: ___ · Must consult this charter: ___ · Must ask the founder: ___
## Changelog (playback confirmations at each gate; invariant ceremonies)
| date | gate | items confirmed / changed |
|---|---|---|
```

## problem-hypothesis.md

```markdown
---
artifact: problem-hypothesis
idea: <slug>
stage: 0
gate: F
status: draft
evidence_grade: none
rung: baseline-auto
pipeline_version: 1.3.0
updated: YYYY-MM-DD
---
# Problem hypothesis
- **Who**:
- **Situation / context**:
- **Desired outcome**:
- **Blocked by**:
- **Current cost** (hours / money / risk / emotion):
- **Trigger & frequency**:
- **Refutation condition** ("we are wrong if we observe…"):
## Open hypotheses
(model-drafted [GUESS] items not yet confirmed)
```

## lean-canvas.md

```markdown
---
artifact: lean-canvas
...same keys...
---
# Lean Canvas
| Cell | Content | Label |
|---|---|---|
| Problem | | [GUESS] |
| Segments | | [GUESS] |
| Unique value proposition | | [GUESS] |
| Solution | | [GUESS] |
| Channels | | [GUESS] |
| Revenue | | [GUESS] |
| Costs | | [GUESS] |
| Key metrics | | [GUESS] |
| Unfair advantage | | [GUESS] |
## Market type
- Type: existing / re-segmented (niche|low-cost) / new / clone
- Strategic consequence:
```

## beachhead-icp.md

```markdown
---
artifact: beachhead-icp
...same keys...
---
# Beachhead & ICP
## Segment scoring (1–5)
| Segment | Pain | Ability to pay | Our reach | Decision speed | Total |
|---|---|---|---|---|---|
> Constraint: "our reach" must not be the weakest axis of the chosen beachhead.
## Chosen beachhead
## ICP — earlyvangelist 5-tier scale
(1) has problem → (2) aware → (3) actively searching w/ timetable → (4) built interim solution → (5) has/can get budget.
Only tiers 4–5 qualify. ICP description:
## 20 real prospects (doubles as the prospect funnel tracker through stages 2–3)
| Pid | Segment descriptor (NO real names) | Tier | Behaviour that establishes the tier (verbatim or observation) | Evidence (E-id) | Resolved entity (canonical name/domain — dedup key, pseudonymous) | Observed at (YYYY-MM-DD) | Reach channel (type + whether a reply is plausible) | Funnel status |
|---|---|---|---|---|---|---|---|---|
> **Privacy**: this file is public within the repo — identities, profile URLs, and contact details live ONLY in `private/contacts.md` (`| Pid | real name | profile URL | contact | notes |`). A personal profile URL defeats pseudonymization — never put it here. Prospects are `P1…P20` with a descriptor ("ops lead at 50-person logistics co").
> Funnel status enum: `not-contacted` → `contacted` → `replied` → `interviewed` → `committed` / `declined`. Keep current through outreach, interviews (V1), and pre-sell (V3).
> Tier discipline (dogfood finding): the funnel bar counts **tier 4–5, on-segment entries only**. Sub-tier or adjacent-segment entries may be kept but must be explicitly quarantined ("nurture, not counted") — a list where 35% fails its own bar invites denominator games at V1.
> **A tier is an evidence claim, not an assessment** (dogfood finding, run #2). Tier 4 means *this person built or imposed an interim solution* — a past event. So the **Behaviour** cell holds what they actually did, in their words or as an observation, and the **Evidence** cell holds its `E-id`. A row whose tier rests on the model's reading rather than a ledgered source is `[GUESS]` and **uncounted**, exactly like a grade-D item.
> The failure mode this exists to stop: **prescriptive statements read as behaviour.** *"If you have PR templates, add a checklist item"* and *"documentation should live in the same repo"* are advice — the speaker is telling someone else what to do and may have done none of it. Run #2 turned five of six tier-4 estimates into asserted past behaviour this way, which manufactures the exact signal the tier scale measures. Test each row: **could this person have written this sentence without ever having done it?** If yes, it is tier 1–3 at most.
> **Reach is part of the claim.** A public forum handle is not a reach channel — it permits one public reply with no expectation of an answer. A row with no channel through which a reply is plausible does not count toward the funnel bar, however good the behavioural evidence is.
> **Provenance cells** (dogfood finding, run #3): **Resolved entity** is the canonical pseudonymous key for the person/business (e.g. a domain or `profile-P7`) — without it two rows can be the same entity under two names, which is exactly how run #3 double-counted a business. **Observed at** dates the tier evidence — tier evidence goes stale. And two anti-inflation floors: *"is a competitor"* is evidence the need was already MET (not a tier-4 workaround), and a listicle mention with no first-party confirmation is not a countable basis. `scripts/validate-beachhead.js` enforces all of this mechanically at gate F.
```

## assumption-map.md

```markdown
---
artifact: assumption-map
...same keys...
---
# Assumption map
| id | "We believe that…" | Category (D/F/V/U/E) | Deadly? | Unknown? | Cheapest refutation test | We are right if (threshold, set BEFORE) | Status |
|----|--------------------|----------------------|---------|----------|--------------------------|------------------------------------------|--------|
| A1 | | | | | | | untested |
> Statuses: untested | testing | confirmed (→ ledger ids) | refuted (→ ledger ids) | open
## Learning cards
| date | test | we observed | we learned | therefore we will |
|---|---|---|---|---|
```

## kill-criteria.md

```markdown
---
artifact: kill-criteria
...
status: draft        # becomes locked when the user signs
...
---
# Kill criteria (state + date form)
| # | If not [measurable state] | by [date] | then | Status |
|---|---------------------------|-----------|------|--------|
| K1 | | | stop / pivot | armed |
| KB | budget: total spend stays under $___ | — | stop | armed |
> `KB` (budget cap, if paid actions possible) is a standing ceiling, not a deadline — no `by_date`. It gets a stable id and a row here like every other criterion so `state.json.kill_criteria` can mirror it verbatim (the `method-rules-state-schema` skill) instead of living as unindexed prose.
## Signature
Signed by user on: YYYY-MM-DD
## Changelog
(revisions require explicit user approval + reason)
```
