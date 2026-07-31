---
name: stage-0-framing
description: Stage 0 of the SaaS validation pipeline - turn a raw idea into a testable hypothesis set. Use when an idea in ideas/<slug>/ is at stage 0 - problem framing, lean canvas, market type, beachhead ICP, assumption map, kill criteria.
user-invocable: false
---

Stage 0: framing. Load `method-rules` first; read `state.json` for the idea. Goal: a raw idea becomes a falsifiable hypothesis set, and we know exactly what must be tested first. This stage is elicitation + structuring — work WITH the user; your drafts are `[GUESS]` until they confirm or evidence backs them. Artifact templates: the `stage-0-framing-templates` skill.

## 0.0 Idea brief → `idea-brief.md`

Before decomposing anything, complete the idea brief (created at new-idea; template in the `stage-0-framing-templates` skill): raw idea verbatim (immutable), refined articulation of **what it is**, for whom, **how it's imagined to work** (the solution concept), vision & rough roadmap (Blank: the first product spec comes from the founders' vision, and earlyvangelists buy the whole vision, not just v1 — so the vision must be written down: it is the thing this pipeline tests), why now / why this founder (reach, expertise, willingness to serve this segment daily), constraints, and the founder's definition of success. Elicit from the user; your drafts stay `[GUESS]`. The brief is a **living document** with an evolution log — every pivot the pipeline forces gets recorded there with its evidence trail.

## 0.0b Classify the intake, and rank what is actually blocking

`[GUESS]` answers "is this backed yet?" — it does not answer "where did this come from?", and those are
different questions at intake. Everything the founder said, and everything you read into it, goes into
one compact table in `idea-brief.md`:

| # | Statement | Class | Source |
|---|---|---|---|

Five classes: **`source-stated`** (the founder's own words — quote them), **`evidence-backed`** (an
E-id supports it), **`interpretation`** (your reading of what they said — *this is the class that
silently becomes "the customer said"* if unlabeled), **`assumption`** (unverified but required for the
idea to work → it belongs in the assumption map), **`unknown`** (missing and it may change the
framing). One rule makes the table worth keeping: **you may not promote your own `interpretation` to
`source-stated`** — only the founder confirming it does that, and then the row cites the exchange.

Then split your open questions in two: **blocking** (the answer changes the actor, the problem, the
outcome, scope, risk, or what to research first — each one names the section it blocks) and
**non-blocking** (useful, does not change the route). Ask the blocking ones now, in one bundled
AskUserQuestion; carry the rest. Gate F requires **zero unresolved blocking questions** — not zero
unknowns. Unknowns are the point of the pipeline; unanswered blocking questions mean we do not yet
know what to test first, and research started in that state gets thrown away.

**Claim ids (applies from 0.0 onward).** Every decision-bearing market/behaviour/feasibility statement gets a stable id (`CL1`, `CL2`, …) and exactly ONE current epistemic label, recorded once in `idea-brief.md`. Any other artifact restating that claim **cites the id** and may not carry a stronger label than the registry row. Gate F Layer 1 compares labels across artifacts; a mismatch is a blocker.

> Run #3: the claim "60-70% of young guests are invited by chat" was correctly disqualified as vendor marketing in `review-mining.md`, correctly labelled `[GUESS]` in `lean-canvas.md`, and stated as "Thực tế đã được ghi nhận" (recorded fact) with no label and no evidence id in `problem-hypothesis.md` — a file already promoted to `ready` for gate F. Two of three artifacts applied the rule; the labelling instructions were not the problem, the absence of a cross-artifact comparison was.

## 0.1 Separate the problem from the solution → `problem-hypothesis.md`

Raw ideas arrive as solutions ("I want to build app X"). Extract the implied problem by interviewing the user: **Who** — in **what situation** — trying to **achieve what outcome** — **blocked by what** — currently **paying what cost** (hours, money, risk, emotion). Also: **trigger & frequency** (frequency × intensity × available budget = real opportunity size; a once-a-year problem can't feed a subscription). If their statement still contains the solution, point it out and rewrite — and everything solution-flavored you strip out goes INTO `idea-brief.md` (solution concept / vision sections), **captured, not discarded**. Finish with the falsifiability question: "what observation would prove us wrong?" Done when: statement contains no solution AND has a refutation condition.

## 0.2 Lean Canvas → `lean-canvas.md`

Draft all 9 cells yourself from what you heard — every cell labeled `[GUESS]`. Then walk the user through: which cells have real backing? Only they upgrade a label. The canvas's real purpose is exposing which cells are blank guesses.

## 0.3 Market type

Research briefly (WebSearch) + ask (AskUserQuestion): existing / re-segmented (niche or low-cost) / new / clone (Blank's types). State the strategic consequence in the canvas: market type changes validation focus (existing → "why would they leave their current tool"; new → "do they even recognize the problem"; new markets can be flat for years — do not judge them by existing-market traction bars).

## 0.3b Market shape + regulated domain (classify BEFORE 0.4 — and strictly before the F signing, because 0.6's premortem must see both)

Two more founder-confirmed classifications, recorded the moment they are made:

- **Market shape**: `single-sided | two-sided | multi-sided` (AskUserQuestion; the model may propose
  with reasoning, only the founder confirms). If not single-sided, name the **sides with ROLES, not
  a winner**: `constrained` (the side that is hard to get — where the chicken-egg death happens) and
  `paying` (the side money comes from); they often coincide, and then one list serves both. Write
  `market_shape` + `sides[]` (`{id, role, label}`) into state via state-write (journal the
  classification), and note the strategic consequence in the canvas. Gates bind to roles: **F and V1
  run their full bar on the constrained side** (running them on the abundant side is trivially
  satisfiable and teaches nothing), **V3 runs on the paying side**.
- **Regulated domain**: does this product touch health, money-handling, legal, children's data, or
  another regulated space? Founder-confirmed; model-drafted regulatory claims are `[GUESS]`. If yes:
  0.5 must carry a deadly Viability/Ethical assumption for it (Test Card with
  `load_before_event = first outside user touches real regulated data` — which lands it in the
  pre-launch checklist, not an unpassable validation gate), and 0.6's premortem must generate a
  compliance kill criterion.

## 0.4 Beachhead + ICP + 20 real names → `beachhead-icp.md`

List 4–8 candidate segments; score each 1–5 on pain / ability to pay / **your reach** / decision speed. Reach must not be the weakest axis of the chosen beachhead — distribution is the binding constraint. Then define the ICP with Blank's 5-tier earlyvangelist scale: (1) has the problem → (2) knows it → (3) actively searching with a timetable → (4) has cobbled an interim solution → (5) has or can quickly get budget. **Only tiers 4–5 are true earlyvangelists**; feedback from tiers 1–2 is near-worthless. Then 20 real prospects: research them from public sources — never invent people; the user adds prospects from their own network. **Privacy split**: identities + profile URLs + contacts go ONLY into `private/contacts.md`; the public tracker records each prospect as `P<n>` with a segment descriptor and origin type. Fewer than 20 findable prospects is itself a signal about reach.

**Two-sided/multi-sided branch** (`state.market_shape != single-sided`): the **constrained side's**
list lives in `beachhead-icp.md` and meets the existing mechanical bar unchanged. **Every other
side gets its own file `beachhead-icp-<side>.md`** — identical 9-column table shape, validated with
`validate-beachhead.js --file beachhead-icp-<side>.md --min <n>` (a second table inside one file
silently corrupts the F count; separate files are the rule). The other side's floor `<n>` is
**founder-set and pre-registered** as `thresholds.custom.f_secondary_min` — the plugin never invents
this number (15/20 came from dogfood evidence; a fabricated second floor would violate the rule it
enforces); sealed at the F signing like every threshold, no deferral without a `load_before_event`.
`beachhead-icp.md` additionally carries a **cold-start seeding strategy** section: which side first ·
what substitutes for the missing side (single-player value, seeded/concierge supply, fake-door
matching) · what it costs · **who does the work — executable by THIS founder**: a plan whose
mechanism is someone else's cooperation ("partner with an aggregator") is a wish, not a plan. The
reach axis is scored per side.

## 0.5 Assumption map → `assumption-map.md`

Generate assumptions in "We believe that…" form across ALL categories — Desirability / Feasibility / Viability (+ Usability, Ethical per Torres). Don't debate which category an assumption belongs to; categories exist to generate coverage. Place on the deadly × unknown matrix; the deadly+unknown corner is the priority queue. For each: design the **cheapest test that could refute it** (not the nicest test to confirm it) as a Test Card — *We believe that / To verify we will / And measure / We are right if…* — with the threshold filled BEFORE running. AI-core products: "the model reaches usable quality on real customer data" is a **deadly feasibility assumption** — rank it with the top demand assumptions and note that stage 3 (Verify) starts in parallel with stage 2 because of it. Copy the reference thresholds from `state.json` and let the user adjust — but do NOT set `signed_date` here: the signing itself happens in gate-check's F signing ceremony (which sets `signed_date`, locks kill-criteria, and appends the threshold-snapshot row in one step).

## 0.6 Kill criteria → `kill-criteria.md`

Run a premortem with the user: imagine the idea dead in 6 months — why? For a two-/multi-sided
shape the premortem MUST consider the chicken-egg death spiral (neither side arrives because the
other hasn't) and produce a pre-registered cold-start kill criterion with a date; for a regulated
domain it MUST produce a compliance criterion. This is why 0.3b runs before F: kill-criteria lock at
the F signing, so a classification that slips past F leaves these criteria no legal way in. Convert each cause into a criterion in **state + date** form: "if not [measurable X] by [date Y] → stop". Add a budget criterion if any paid actions are possible. Write to the file (`status: draft` — the F signing ceremony locks it); mirror **EVERY criterion, including the budget one,** into `state.json.kill_criteria` — the state index is what deadline surfacing reads; a criterion missing there silently blows its date (dogfood finding). Any deliberately deferred threshold (e.g. `r1_eval_pass_pct: null`) must carry an explicit load-by date in its criterion text and later be loaded via a `thresholds.revisions` entry.

## Gate F

Update `state.json` (artifacts index, statuses `ready`). Tell the user gate F is ready and run the gate-check skill (F requires: idea brief complete with vision and constraints; no-solution hypothesis with refutation condition; labeled canvas; market type; 20 names; every deadly assumption has a test + threshold; kill criteria signed). Meanwhile, stage 1 (competitive scan) can start immediately after 0.1 — offer to kick it off in parallel.
