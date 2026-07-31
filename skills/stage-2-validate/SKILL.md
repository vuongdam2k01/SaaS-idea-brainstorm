---
name: stage-2-validate
description: Stage 2 of the SaaS validation pipeline - market validation through three sequential gates - V1 problem evidence, V2 solution direction, V3 money commitment. Use when an idea in ideas/<slug>/ has passed gate F/C and needs problem mining or interviews, solution directions with the ChatGPT-gap test, mocks, landing/pre-sell kits, or willingness-to-pay analysis.
user-invocable: false
---

Stage 2: three sequential gates — problem → solution → money. Skipping a gate creates false positives at that gate. Validation = observed real behavior, never collected compliments. Load `method-rules`; read `state.json` (mode + capabilities decide rungs). Templates: the `stage-2-validate-templates` skill. If the assumption map has a deadly feasibility assumption (AI-core always does), remind the user stage 3 starts NOW in parallel — don't wait for V3.

**Every experiment in this stage can end in four ways, and the fourth is not a soft version of the third**: `supported` · `weakened` · `inconclusive` · **`invalid`**. An experiment is `invalid` when the *instrument* failed, not the hypothesis — the mock was broken, the tracking never fired, the wrong audience showed up, the payment link 404'd, consent was mismatched, the sample was contaminated. An invalid run is **repaired and re-run**; its numbers never enter the ledger and never move a gate. Reporting instrumentation failure as market evidence ("we ran it and nobody converted") is one of the easiest ways to kill a good idea with a bug. Before any run that measures something, do the cheap instrumentation check: fire the event yourself, load the page, submit a test row — a dry run with synthetic input validates mechanics only and is never itself evidence.

**Participant data**: any interactive contact (interview, mock session, pilot) requires a row in `private/participant-data-manifest.md` BEFORE material enters any artifact — consent basis, what was recorded, allowed use, retention deadline, withdrawal state (method-rules §7 and its template below).

## Gate V1 — is the problem real and painful enough

1. **Interview kit** (`interview-kit.md`) — build it regardless of rung (it's a carry-forward deliverable): Mom Test discipline (past & present only, never pitch, no "would you use/buy"); 4 mandatory questions (last time it happened / how handled / what it cost / ever actively searched); competitor-calibration questions (what do you use / what did you try / why did you drop it / what keeps you on it); idea-specific probes. Offer role-play practice (you play the interviewee — label: practice, grade D, never evidence).
2. **Evidence collection by rung** — with a **pre-registered sampling frame** to kill selection bias:
   - Before any mining, write the frame into **`sampling-frame-v1.md`** (its only home — the ledger carries a pointer, never a second copy): neutral problem-space queries (describing the situation, NOT the success condition — never count from "alternative to X" / "built a spreadsheet for X" searches), sources + per-source cutoff, time window, inclusion/exclusion rules, dedupe method, stopping rule, claim scope.
   - **Snapshot the frame before collecting anything, as a FILE.** A `Registered on:` line is self-report: it can be edited once the numbers are in, and nothing would show it. So write the frame to its own file — `sampling-frame-v1.md` (queries verbatim, sources + cutoffs, window, inclusion/exclusion, dedupe rule, stopping rule, claim scope) — hash **that file**:
     `node "${CLAUDE_SKILL_DIR}/../../scripts/artifact-manifest.js" create <idea-dir> --purpose gate-input --id V1-frame --out private/manifest-v1-frame.json sampling-frame-v1.md`
     then append a `sampling-frame-snapshot` row to `decision-log.md` carrying that `manifest_sha256` and the file path, and only then start mining. Gate V1 re-runs `verify` on it: a frame edited after collection began fails exactly like a moved threshold. A file is hashable; "the exact text of a section" is not — two prose descriptions of which bytes to hash would never agree. The V1 denominator = all distinct individuals from the neutral frame discussing the problem space; the metric = % of THEM showing past behavior (searched / built workaround / paid / tried-AI-and-failed). Targeted behavior-searches are allowed but marked `exploratory` and excluded from the gate metric.
   - **Two-/multi-sided** (`state.market_shape != single-sided`): one frame per side —
     `sampling-frame-v1-<side>.md`, each hashed into its own manifest and journaled in its own
     `sampling-frame-snapshot` row BEFORE that side's collection starts; gate V1 verifies every
     frame. The **full past-behavior threshold applies to the constrained side**; other sides need
     problem/participation evidence at the grade-B floor against their own frame (accepted-open per
     the usual analysis-mode rules). **Denominators are never merged across sides** — a percentage
     over a mixed pool describes nobody.
   - *Auto (default)*: spawn `community-review-miner` (Task A) with the frame. Target ≥ `thresholds.v1_min_sample` distinct individuals in the neutral denominator.
   - *Handoff (higher grade)*: user runs interviews with the kit against tier-4/5 prospects (P-ids); transcripts into `private/`; you extract verbatims into the ledger (grade A — interactive). Track in `waiting_on`.
   - *Async outreach (if email capability and user approves each send — outward-action policy)*: kit as short email/DM to the 20 prospects; real replies = grade A.
3. **Ledger + synthesis** (`evidence-ledger.md`): every entry per artifact-schema; map to assumption ids; update assumption-map statuses; end each interactive contact recorded with its **commitment & advancement** (time/reputation/money given — compliments only = failed contact, log it as such). Update `competitive-map.md` "customers actually mention it?" column — this kills phantom competitors. Flag first-class signals: maintained DIY workarounds; tried-AI-and-failed.
4. **Gate V1**: metric = % of sample with past solution-seeking/workaround behavior vs `thresholds.v1_past_behavior_pct`. Run gate-check. Fail → segment pivot (back to 0.4) or problem pivot (back to 0.1 with the new data); a clear pivot direction is a good outcome.

## Gate V2 — does the solution approach land

1. **Directions** (`solution-directions.md`): 2–3 directions differing in **approach** (self-serve tool vs productized service vs plugin-in-their-tool), each tied to specific ledger ids — a direction that traces to nothing is out. Check each against the vision in `idea-brief.md`: deliberate departures from the original concept are fine but must be recorded in the brief's evolution log with their evidence.
2. **ChatGPT-gap test** per direction: could the customer do this by chatting with a frontier model directly? Actually try it — but grade honestly: **your own prompting is grade D** (model-generated; it informs the analysis, never the gate). Only real customers' documented attempts (mined "tried AI and failed" reports = B, or observed real attempts = C) count as evidence. If the answer is yes, the direction survives only by naming its **added-value layer**: workflow & state / proprietary data & integrations / bounded reliability (paying for *guaranteed correct*) / expertise burden removed / distribution. No nameable layer → cut ("UI wrapped around a prompt" dies at scale).
   **Two-/multi-sided**: a surviving direction must additionally name its **matchmaking mechanism**
   and its **single-player value** (what the first side gets while the other side is still absent).
   No single-player value is NOT an auto-fail (pure matching businesses legitimately lack one) and
   NOT a decorative "named risk" — it converts into a **conditional obligation**: the direction
   passes V2 only with a seeding plan **executable by this founder** (which side first, the
   substitute for the missing side, the cost, who does the work) plus the pre-registered cold-start
   kill criterion from 0.6 still armed and dated.
3. **Mock**: build an interactive mock (local HTML) per surviving direction — cost ≈ 0. Evaluation by rung: *handoff* — user shows it to interviewed people, reports **behavioral** reactions (asked price? asked "when can I use it"? pulled in a colleague?); *market-evidence mode + hosting* — deploy and measure (grade C); check the **switching threshold**: is it enough better to beat data-already-entered + habits + integrations (20% better usually isn't).

   **Session accounting is mandatory — the same Mom Test discipline applies to a demo, where the pull to sell is stronger than in an interview.** Per session record: the task as a **goal + context** ("get last month's numbers to your accountant"), never interface instructions and never internal feature names; every **intervention** (any hint, nudge or explanation given); the **outcome** — `unassisted` | `rescued` (completed only after help) | `failed` | `abandoned`; **confounds** (broken mock, wrong person, interrupted); and the finding written as **observation → interpretation → impact → recommendation**, so a reader can disagree with the interpretation while keeping the observation. Severity by consequence and recoverability, **not** by how many people hit it in a tiny sample.
   - **Denominator = valid sessions only.** Invalid, cancelled and withdrawn sessions are excluded from the denominator and listed separately — never silently dropped and never counted as evidence.
   - **`rescued` never counts as support.** A concept "worked" only in `unassisted` sessions. Coaching someone through a mock and recording success is how a team convinces itself a confusing product is usable.
   - Formative samples show *that* a problem exists, never *how often* it does — no prevalence claims from mock sessions.
4. **Landing kit** (`landing-kit.md`): copy strictly from ledger verbatims, one value prop, one CTA, pricing section for intent measurement. Analysis mode: kit stays ready-to-run (gate may be accepted OPEN). Market-evidence mode: deploy + drive traffic (organic posts drafted for the user; paid only within `budget.cap_usd`), measure **conversion to payment-intent**, not raw signups (signup→paid runs 5–15%; "20+ signups" is folklore, not a source).
5. **Gate V2**: one direction wins clearly (not "all three praised") + nameable value layer + strong behavioral reactions (or accepted-OPEN with kit ready). Lock: direction + core value layer (it seeds the architecture: workflow→data model; reliability→evals; proprietary data→pipeline). Fail → solution pivot at 2.5 — the cheapest pivot; this gate exists so it happens HERE, not after build.

## Gate V3 — commitment in money

1. **Pre-sell kit** (`presell-kit.md`): pitch script; price anchored to the **real alternative's cost** from the ledger (never to imagined competitors); commitment ladder (card-on-file → deposit → prepay → paid pilot); for B2B, a manual-service-first offer for 2–3 customers (doubles as stage-3 R2 input). Reference case: Drip — 11 of 17 committed at $99/mo before any code. Note: commitment at a real price ≠ start billing; bill when value is delivered.
2. **Willingness-to-pay analysis** (analysis mode): triangulate from real alternative costs, competitor pricing, mined budget signals — grade B; V3 recorded OPEN with the kit ready. **Market-evidence mode**: real payment link (Stripe API if available, else user creates a link manually in 5 minutes — still grade A) on the landing; automated drip if email available; refusal reasons via exit survey → `presell-kit.md` refusal log.
2b. **Two-/multi-sided commitments**: money runs on the **paying side** at the existing bar. The
   non-paying side's currency is the Mom-Test kind — time and reputation: signed listing agreements,
   committed supply, a calendar-booked onboarding. Real interactive commitments = grade A; their
   pre-set floor is founder-set `thresholds.custom.v3_secondary_commitments` (sealed like every
   threshold; never invented by the plugin). Praise from the non-paying side counts exactly as much
   as praise from the paying one: nothing.
3. **Gate V3**: ≥ `thresholds.v3_min_commitments` real-money commitments from outside personal relationships — or accepted-OPEN (analysis mode) making the final pack a *Hypothesis* pack. Money is the one signal that must never be simulated. Lock on pass: price anchor + revenue model + the segment that actually pays (sometimes ≠ the segment that complains loudest — cheap to discover here, expensive after launch). Fail → back to discovery with the refusal-log clusters; never "fix it with ads".
