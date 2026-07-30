# SaaS Idea Validation Pipeline — Final version

> **Source of truth**: the `skills/` directory is normative — it is what the plugin actually
> executes. This document explains the method and its *why*, with sources. **If this document and a
> skill ever disagree, the skill wins**; treat the disagreement as a doc bug and fix it here.

From raw idea to when **MVP scope is locked**. Each task states: purpose, method, output; each stage ends with advancement condition.

**Backbone is Customer Development** (Steve Blank) — **recursive, iterative**: each step is a loop not pipeline; failure at any stage means go back to prior, not push forward with wrong assumptions. Core principle: *"Validate, then build. Your first validation proof is a credit card, not praise."*

---

# STAGE 0 — FRAMING

Goal: convert vague idea into structured testable hypothesis set, know exactly what to test first.

### 0.1. Separate problem from solution
- Ideas almost always arrive as solution ("I want to build app X"). Job one: reverse-engineer the implicit problem inside.
- Rewrite as 5-part structure: **Who** — in **context/situation** — trying to **achieve what outcome** — blocked by **what barrier** — currently **paying what** (hours, money, risk, emotion).
- Identify **trigger and frequency**: when does problem surface? Daily, monthly, only on event? Frequency × intensity × available budget = true problem scale, future revenue model (yearly problem hard to sustain subscription).
- Test falsifiability: "what observation would prove me wrong?"
- **Output:** one-page problem hypothesis. **Pass when:** statement has no solution in it, has disqualifying condition.
- **Classify the intake first.** `[GUESS]` answers "is this backed?", not "where did this come from" — and at intake those differ. Every statement in the idea brief is classed `source-stated` (founder's own words) / `evidence-backed` (an E-id) / `interpretation` (your reading of what they said) / `assumption` / `unknown`. One rule makes it worth keeping: **the model may never promote its own `interpretation` to `source-stated`** — only the founder confirming it does that. Then split open questions into **blocking** (the answer changes actor, problem, outcome, scope, risk, or research order — each naming what it blocks) vs non-blocking. Gate F requires **zero unresolved blocking questions**, not zero unknowns: unknowns are the point of the pipeline; an unanswered blocker means we do not yet know what to test first, and research started in that state gets thrown away.

### 0.2. Build one-page Lean Canvas
- Fill 9 boxes: problem, segment, unique value, solution, channels, revenue, costs, key metrics, unfair advantage.
- True purpose of canvas isn't "have canvas" — **expose which boxes are blank assumptions**. Label each: has evidence / guessing.
- **Output:** canvas with box-status labels.

### 0.3. Determine Market Type
- Classify market: **existing** (compete head-to-head with established players), **resegmented** (niche or cheapen existing market), or **new entirely** (educate market).
- Why decide early: each type demands different validate strategy, positioning, launch. New market = focus interviews on "do they see the problem"; existing market = focus on "why leave current solution".
- **Output:** one-line market type + strategic consequences.

### 0.4. Choose beachhead and list 20 names
- List 4–8 possible segments facing this problem.
- Score each on 4 axes: **pain level / budget / reach access / purchase speed**.
- Choose **one** beachhead. Constraint: "reach" cannot be the weakest axis — distribution is solo dev's main constraint, picking unreachable group loses before start.
- Apply **EarlyVangelist filter** (Blank — Maslow 5-tier): (1) has problem → (2) knows they have it → (3) actively seeking solution + have timeline → (4) pain enough already self-patched → (5) committed or fast to budget. **Only tiers 4–5 are true earlyvangelist** — feedback from 1–2 nearly useless for 2-year horizon. This is your interview audience and first customer profile.
- List **20 real individuals/organizations by name** in segment. Can't list 20 = segment is still concept, not people. Never fabricate names.
- **Output:** scoring table + ICP profile + 20-name list.

### 0.5. Build Assumption Map
- Unload all assumptions as "We believe that…" statements — forces shift to "could be wrong" mindset.
- Classify each: **Desirability** (do they want it), **Viability** (makes money — price, buy frequency, channel cost), **Feasibility** (make quality level needed), **Adoption** (will they switch habits). Core standard is D/F/V; add **Usability** (can use it) and **Ethical** (harm?). Don't argue which category — point is to generate across all types.
- Plot on matrix: **criticality × uncertainty**. "High criticality + high uncertainty" = top priority.
- For each critical assumption: design **cheapest test that could disprove it** (not confirm), write pre-set pass/fail threshold. Standard format: Strategyzer Test Card — *We believe that / To verify we will / And measure / We are right if…*; after test, write Learning Card (learned what → do what).
- Special note for AI-in-core products: assumption "model hits sufficient accuracy on real customer data" is **critical Feasibility** — rank alongside problem hypotheses, triggers Verify stage parallel immediately.
- **Output:** assumption map with tests + thresholds for all critical items.

### 0.6. Write kill criteria
- Set stop thresholds **before you start**, anchor to market signals not effort. Standard format (Annie Duke, *Quit*): kill criteria = **state + date** — "if haven't achieved [measurable state X] by [date Y] → stop". Example: "reach target-people-count before D with payment-convert <Y% → stop"; "retention dies after 2 revision rounds → stop".
- Generate using **premortem**: imagine failed, work backward on causes, convert each to measurable criterion.
- Write now because mid-run you'll always find reasons to continue.
- **Output:** kill criteria document, signed with date.

**▶ STAGE ADVANCEMENT:** problem hypothesis has no solution + has disqualifying condition + 20 real names + assumption map has tests+thresholds + kill criteria signed.

---

# STAGE 1 — COMPETITIVE & ALTERNATIVES

Run immediately after 0.1, before interviews — findings shape interview questions.

### 1.1. Scan 5 competitive tiers
- Scan by **problem keyword** (JTBD), not product category — competitor is anything customer "hires" to do the job:
  - Tier 1: direct (same problem, same approach).
  - Tier 2: indirect (same problem, different approach — agency, freelancer, outsource).
  - Tier 3: DIY (Excel, Notion, Zapier, duct-tape workflow).
  - Tier 4: general tools — especially **using ChatGPT/Claude directly**. For AI products, often the real competitor.
  - Tier 5: **do nothing** — status quo, biggest competitor of any new product (The JOLT Effect — Dixon & McKenna, 2M+ sales calls: **40–60%** B2B purchase processes end "no decision"; this is the source for positioning later).
- Sources: search by **problem keyword** (not solution keyword), G2/Capterra/Product Hunt/AlternativeTo, niche communities (search "how do you handle X", "alternative to Y"). If using AI for competitor list: **verify each one**, AI often fabricates competitors and features.

### 1.2. Profile key competitors
- For each direct/indirect competitor of note: positioning, their ICP, pricing & revenue model, main channel, company age, health signals (update frequency, hiring, funding).
- **Normalize before comparing, or you compare nothing.** Every price carries currency, tax basis, billing period (monthly vs annual-prepaid quietly differs ~20%), plan edition, seat/usage basis, locale, `observed_at`, and **list price kept apart from effective price** (promo/annual/enterprise quote). Every capability carries a state: `announced | beta | documented | generally-available | observed | withdrawn` — a launch post is not a shipped feature, and a withdrawn feature is a signal in the *opposite* direction. Syndicated announcements and aggregator write-ups **collapse to the original source**: five reposts are one source.

### 1.3. Mine negative reviews (1–3 stars)
- Read and cluster by **unmet need**, preserve verbatim — this is gold: real need, customer language, free.

### 1.4. Market verdict
- **Is this market proven to have money?**
  - Crowded with healthy competitors = money exists; question becomes "what's my wedge".
  - Nobody builds = red flag (usually means problem doesn't hurt enough). Investigate: did anyone build before and die? Why? (Internet Archive, post-mortems on IndieHackers/HN).
  - Competitors exist but weak = is it weakness from laziness or from hard-to-see constraints (ops, compliance, sales cycle)? (Only get full answer after interviews.)
- Record verdict.

**▶ ADVANCEMENT:** 5-tier map complete + key profiles + mined reviews clustered + market verdict recorded.

---

# STAGE 2 — VALIDATE (3 sequential gates: V1 → V2 → V3)

Core principle: validation is **observing real behavior**, not collecting praise. Skip a gate = false positive at that gate.

## Gate V1 — Problem is real and hurts enough

### 2.1. Compose interview kit
- Follow **Mom Test** principles: ask past/present only, never pitch idea (pitching ruins data — person talks about your idea not their life).
- 4 required questions: *When did you last hit this problem? / How do you handle it? / How much time/money? / Ever looked for solution?*
- Embed competitive-map fix questions: *what tool are you using? tried others? why stop? what keeps you using current?*
- Add custom questions per problem hypothesis.
- **Output:** interview kit.

### 2.2. Conduct 10–15 interviews
- Benchmark from Running Lean (Ash Maurya): after ~10–15, patterns repeat and you're an expert on segment workflow; stop when new calls aren't surfacing new info.
- Target: list of 20 from 0.4, **prioritize tier 4–5 EarlyVangelist**.
- **Record/notes carefully.** This step cannot be delegated, cannot be simulated — AI personas and simulated interviews aren't evidence.

### 2.3. Synthesize + evidence ledger
- **Claude excels here**: transcript → pattern clusters, count frequency types of pain.
- Extract **customer verbatim** — vocabulary will seed all later copy, pitch, landing.
- Map each finding back to assumption A# in map, update status (confirmed/rejected/unclear).
- Update competitor map: **mark which competitors customer actually mentioned** (often: competitor you thought critical = unknown to customer; everyone uses Excel = true competitor).
- Evidence ledger rule: every entry must have *who said, when, verbatim, which assumption*. Untraced = not evidence.
- **Independence is computed, never declared.** Each row records `root_source_id` — the ORIGINAL source, not the page you read it on. Rows sharing a root are **one** source in every denominator, however many reposts carried the same complaint. Also per row: `scope_limits` (who/where/when it actually covers — blank means gates read it at its narrowest), `bearing` (`supports|contradicts|unclear`), and `supersedes` for a correction. **Rows are superseded, never deleted**, and a superseded row stops counting. Run `scripts/validate-evidence-ledger.js` before any gate that consumes the ledger; its `max_independent_count` is a hard ceiling on the denominator.
- **The sampling frame lives in its own file** (`sampling-frame-v1.md`), hashed and journaled BEFORE collection starts. A "registered on" line inside the ledger is self-report — it can be edited once the numbers arrive and nothing would show it. Gate V1 re-verifies the hash: a frame edited after collection began fails exactly like a moved threshold.
- **Participant data has a lifecycle, not just a location.** Any interactive contact gets a row in `private/participant-data-manifest.md` BEFORE their material enters an artifact: consent basis, what was recorded, allowed use, retention deadline, withdrawal state. Withdrawal means stop using it AND exclude that session from every denominator (excluded sessions are listed, never silently dropped).
- End each call with **commitment & advancement** (Mom Test ch.5): person must give one of 3 "currency" — time (book next concrete call), credibility (introduce peer/boss), money (deposit, LOI). Call that got only praise = your interview failed. Log commitments, not sentiment.

### 2.4. Hunt tier-one signals
- Auto-flag in transcripts: **self-made solution still in use** (sheet with 40 columns, duct-tape workflow) = pays with time = real pain.
- Auto-flag: **tried AI directly and failed** = proves pain exists + hints at value gap above prompt level.

**▶ GATE V1 — PASS when:** %sample with *proactively-sought or DIY-built solution* past behavior ≥ pre-set threshold (ref: 60%) — measure behavior, not agreement.
**FAIL:** pivot segment (problem real, wrong people → back to 0.4) or pivot problem (interview revealed worse problem → back to 0.1 with new data). Fail with clear pivot direction = good result, not setback.

## Gate V2 — Solution direction works

### 2.5. Draft 2–3 solution directions (different by APPROACH)
- Different approach, not just UI variation: self-serve tool vs semi-automated service vs plugin into existing tool customer uses.
- Each direction traces to evidence cluster from V1 — direction can't trace = self-flag it.

### 2.6. ChatGPT test each direction
- Question: can customer handle this with chat-model directly?
- If yes → direction survives only if it adds explicit value tier: *workflow-state (save, loop, collaborate, history) / proprietary or integrated data / reliability with guarantees (pay for certainty) / expertise unload (customer doesn't know what to ask, how to judge) / distribution (where customer already is)*.
- No value tier → die. "Prompt wrapped in UI" products failed en masse because users + model vendors both swallowed that layer.

### 2.7. Mock/prototype no-code → test on people you interviewed
- Cost building mock near zero now — validation unit shifts from "describe verbally" to "touch and try". Build for each direction.
- Measure **behavior**, not praise: ask price? ask when available? ask to stay connected? bring colleague to see?
- **Account for every session** — the Mom Test applies to a demo too, where the pull to sell is stronger than in an interview. Per session: the task as a **goal + context** (never interface instructions, never internal feature names), every **intervention** (any hint given), the outcome — `unassisted` / `rescued` (finished only after help) / `failed` / `abandoned` — plus confounds. **The denominator is valid sessions only**, and **`rescued` never counts as support**: coaching someone through a mock and recording success is how a team convinces itself a confusing product is usable. Findings are written observation → interpretation → impact → recommendation, so a reader can dispute the interpretation without losing the observation. A formative sample shows *that* a problem exists, never *how often*.
- **A fourth outcome exists and it is not a softer failure: `invalid`.** The instrument failed, not the hypothesis — broken mock, tracking never fired, wrong audience, dead payment link, contaminated sample. An invalid run is repaired and re-run; its numbers never enter the ledger and never move a gate. Reporting instrumentation failure as market evidence ("we ran it and nobody converted") is one of the easiest ways to kill a good idea with a bug. Before any run that measures something, fire the event yourself first.
- Benchmark against switching threshold: direction better enough to leave current solution? (Better 20% usually insufficient to absorb switching cost: data entry, habits, integrations.)

### 2.8. Smoke test / landing page
- One value prop, one call-to-action, traffic to right ICP.
- **Claim preflight before anything goes outward.** Every claim in the copy carries a disposition: `publish-as-fact` (supported within its stated scope, support cited) · `publish-with-qualification` (the condition appears in the copy itself, never diluted into a "may" or a footnote) · `test-as-proposition` (unproven, framed as what the product *will* do — this is the legitimate heart of a landing test) · `do-not-publish`. Testing propositions is the point; what is forbidden is fabricated **support**: invented customer results or testimonials, numbers with no measurement behind them, guarantees, security/compliance assurances, roadmap items written in the present tense, internal test figures presented as universal outcomes.
- Pre-set threshold. Note: "20+ signup" is community heuristic without source — measure **payment-intent conversion** instead (signup→paid usually 5–15%; pre-order/deposit = strong). Landing/waitlist are weak signals (real case on Indie Hackers: 300+ waitlist → 3 paying). Signup is support play, not gate replacement.
- Reference frame: **2/20/200 (Rob Walling)** — 2h screen idea → 20h landing+interviews → 200h MVP manual. Validation is risk reduction by tier, not binary pass/fail once.

**▶ GATE V2 — PASS when:** one direction clearly wins (not "all three praised"), that direction names value tier, gets few strong behavior signals.
**FAIL:** pivot solution — keep problem + segment, change approach (cheapest pivot; happens HERE by design, not after build).
**LOCK on exit:** solution direction + core value tier (architecture seeds: workflow → data model; reliability → eval/guardrail; proprietary data → pipeline/integration).

## Gate V3 — Money commitment

### 2.9. Pre-sell before product exists
- Real price (neo **real-cost alternative** customer uses, not imaginary competitor).
- Commitment ladder: card signup → deposit → prepay → pilot contract.
- B2B: sell **manual service version** to first 2–3 customers — both proves money and feeds direct input into Verify (you run the manual work = real MVP spec).
- Memory: in AI context, money is **nearly the only un-fakeable signal**. Asking for money is uncomfortable — discomfort itself is the test.
- Reference case: Rob Walling emailed 17 in network, stated $99/month price directly — **11 committed before he wrote code**. Nuance: commit at real price before build ≠ start billing; only bill when customer receives real value (after onboarding works).

### 2.10. Log reasons for rejection
- Cluster systematically, iteratively. Repo of refusal reasons > any compliment — refines price and positioning.
- Trap to avoid: validate forever without building — gate has threshold N to cut both directions.

**▶ GATE V3 — PASS when:** ≥N real money commitments from people outside personal network (N pre-set, typically 3–10 by price; benchmark: Drip 11 of 17 at $99/mo before code).
**LOCK on exit:** neo price + revenue model + real-paying segment (often ≠ pain-screaming segment — discovery here is cheap, post-launch is expensive).

**If you fail all V gates:** go back to Customer Discovery, redesign per what you learned. Mistake most deadly: skip Customer Validation and jump straight to hiring sales/buying ads (premature scaling → Death Spiral).

---

# STAGE 3 — VERIFY (run PARALLEL to Stage 2)

Start when assumption map (0.5) surfaces critical Feasibility assumption — don't wait for Validation done. Reason: if Verify fails, all Validate effort for that direction wasted. Two chains = different evidence: "demo runs" ≠ "need exists"; "people say they hurt" ≠ "AI good enough".

## Gate R1 — Make it at required quality

**AI-core products: R1 is where most silently die post-launch because it's skipped. Correct order: error-analysis-first** (not write-eval-then-build).

### 3.1. Build dirty spike/PoC
- **Core only:** real-input → process → real-output. No UI, no auth, nothing else.
- **Get real data** from people you interviewed in V1/V2 (relationship task — only you).

### 3.2. Error-analysis by hand (open coding — cannot delegate)
- **Principle "cannot delegate"** means practically: work WITH you, not FOR you. You run spike batch, build annotation table, suggest taxonomy; **you're the arbiter "what's correct"** — read output, note errors. Criteria form from this reading itself, criteria can shift (normal "criteria drift").
- Benchmark (Hamel Husain & Shreya Shankar): read **~100 traces** to start; cluster errors as failure taxonomy; **stop-rule**: when ~20 straight traces show no new error type (theoretical saturation).
- Separate "fix immediately" from "write eval for": many errors are regular bugs — fix inline. Only write eval for recurring or expensive errors.

### 3.3. Build eval from actual errors (not imagined)
- Convert **found errors** into eval — never write eval for imagined errors (LLM error surface near-infinite, can't pre-guess).
- Test set from failure taxonomy, covers important paths + failure modes. If synthetic: generate by structured dimensions, not prompt "give test queries".
- **Tools right for job**: code eval for deterministic (schema, format, latency, forbidden words) first; LLM-as-judge only for subjective cases.
- Judge discipline: **binary pass/fail, no 1–5 scale**; one evaluator per criterion; judge is prompt too — as crafted as product prompt; **measure judge–expert agreement on held-out labeled set (~75–90% needed before trusting judge)**.
- Minimal for solo dev: every major change, spend 30 min reading 20–50 outputs. Successful AI projects spend 60–80% dev time on error-analysis + eval.

### 3.4. Answer 3 defining questions
1. **Quality now vs customer's accept threshold** (ask in V1/V2 — 90% sufficient for suggest use case, not for replacing person with consequences): current score = ___% vs threshold = ___%?
2. **Error type when wrong**: easy-to-spot or looks-right-wrong? Second type needs human-in-loop in design.
3. **Marginal cost per use** (tokens, compute) vs price from V3 — unit economics positive from design?

### 3.5. Identify hard constraints
- Data needed but can't get, latency limits, integration boundaries with systems customer uses.

**▶ GATE R1 — PASS when:** eval hits threshold on real data + marginal cost < price with viable margin + failure cases have design solution.
**FAIL — 3 exits, all change product direction:** narrow problem (do 1 use case well vs 10 average) / add human-in-loop (rebrand "auto" → "assistant") / back to 2.5 change solution direction.
**LOCK on exit:** promise scope — what product promises + doesn't promise. Direct input to positioning.

## Gate R2 — Value actually reaches user (concierge / Wizard-of-Oz)

Feasibility proven doesn't mean value delivered. R2 tests end-to-end on real people.

### 3.6. Run concierge (3–5 customers pre-committed V3)
- You execute service (± spike from R1), customer gets **real results on their real work**. Customer doesn't know backend is manual.

### 3.7. Measure results, not sentiment
- **Real hours saved?** Output actually used next (report sent, customer's-customer shown, decision made)? Or received and shelved?

### 3.8. Watch proto-retention
- After first use, does **anyone self-return for second without prompting**? Earliest retention signal pre-product — retention can't be fixed by marketing post-launch.

### 3.9. Log manual operations (= true MVP spec)
- Every step you do by hand during concierge — this list is truer MVP spec than any spec written from imagination, because it's what actually delivers value.

**▶ GATE R2 — PASS when:** measured result matches problem hypothesis promise + someone self-returned.
**LOCK on exit:** core loop true (from observation) + aha event defined (from observation, not guessed).

---

# STAGE 4 — POSITIONING (Dunford — order mandatory, no rearrange)

Start after V1 (have customer words), finalize after V3+R1 (have money + promise scope).

Nuance: pre-product, you get **positioning thesis** — educated guess, expect partial wrongness, refine post-launch (Dunford: ~20 product launches, never fully right upfront). Don't sieze positioning too early — mislocked early can shut good market.

### 4.1. List best customers
- From pre-sell log: who understood fast, committed fast. Positioning builds from this group, not average.

### 4.2. Competitive alternatives from customer words
- Pull **only from V1 transcripts**: what customers actually weigh if your product doesn't exist. Usually: "do nothing", Excel, "hire intern" — not competitors from Stage 1 research.
- Eliminate phantom competitors: company could theoretically compete but customer never mentioned — positioning against phantom dilutes message.

### 4.3. Five-component chain (order mandatory)
1. **Competitive alternatives** (from 4.2) →
2. **Unique attributes**: what you do they don't →
3. **Value & proof**: attribute → customer value, with proof from R2 (hours saved, actual output) →
4. **Customers who care most**: segment for whom that value is critical →
5. **Market category**: pick **existing** category in customer head (don't create new category without massive education budget — bootstrap can't do it). Three styles (Dunford): Head-to-Head / **Big Fish Small Pond** (dominate subsegment of existing category — right for startup) / Create New Game (~10% justified; ~90% recent IPOs position in existing; new category = educate whole market).
6. *(Optional — "plus one")* **Relevant trends**: answers "why now", used with category not instead.

### 4.4. Copycat test
- If competitor copies this feature in one month (AI-speed), what differences remain?
- Empty answer → shift differentiator to hard-to-copy: narrower niche, data, relationship, distribution, deep workflow.

### 4.5. Write and test pitch
- **One sentence, customer verbatim from V1**: *"Unlike [real alternative], this [differentiator] for [ICP] because [proof]."*
- **Test on real customers** — don't self-score.
- If you A/B test messages, **vary exactly one thing per variant** (audience lead OR problem framing OR outcome OR mechanism OR proof). Change two and the result attributes to nothing.

**▶ ADVANCEMENT:** alternatives from customer words + differentiator survives copycat test + pitch tested real.
**LOCK:** official positioning — drives copy, neo price, feature order in scope.

---

# STAGE 5 — SCOPE LOCK

Entrance condition: passed V3 (have payer) + R2 (value delivered) + Positioning done.

### 5.1. Core loop from observation
- Pull from concierge log (3.9), write as ≤5–7 steps: *user does A → system does B → user gets C*.
- **Verify each step traces**: each traces to evidence E# or concierge log, step can't trace = suspect cut candidate.

### 5.2. Aha moment = measurable event
- Not "user sees value" but named event with measurement: *"user exports report within 10 min of signup"*. From R2 observation, not guess.

### 5.3. Cut list
- Explicit list of **what DOESN'T get built v1**. Rule: keep only features **paying customers** need for core loop.
- Cut list is as important as build list — barriers scope creep, especially with AI where "add a bit more" feels free but costs total time.

### 5.4. Technical design contract
- **Domain model / schema**: main entities, relationships, states. Hardest to fix post-launch (user data migration) — only thing worth pre-thinking. UI changes cheap, schema changes expensive.
- **Condensed ADR**: each big decision one paragraph (choose what, vs what, why) — doubles as AI-coding context.
- **Buy-not-build list**: auth, payment, email, analytics, storage.
- **Final-20% boundary listed upfront** (error handling, edge cases, basic security, payment failure, backup, staging) — budgeted in plan, not "discovered" at deadline.
- **Code-understanding boundary**: zones you must 100% understand (money, user data, auth/permission) vs zones you can looser. Money/data/auth = non-negotiable.
- **Event tracking plan**: event names established upfront, **must include aha event** (5.2). Cabling post-launch = data lost forever.

### 5.4b. Minimum service promise (scope is only half the contract)
- V3 collected real money, so people have expectations before a line of product code exists. Write the promises you can actually keep: who may use it, supported use cases and **explicitly unsupported** ones, beta disclosure, what data is collected + retention + deletion path, export/correction/recovery expectation, where a user reports a problem and who answers, what happens when it breaks, and what happens to their data if the product pauses or shuts down.
- Two rules: **invent nothing** (no SLA percentage, uptime figure, or response time the founder has not agreed to — an unanswered field is `N/A because ___`, never a plausible-sounding guess), and **"minimum" never means minimum safety** — drop whatever does not protect value, learning, safety or an honest promise, but never security, privacy, data integrity, accessibility, or a way to report a problem. A build session cannot infer a service boundary from a feature list.

### 5.5. Freeze Definition of Done
- Checklist for v1 complete, **freeze now** — before build, not during (you'll negotiate with yourself). Minimum: core loop end-to-end, real money + handle failure, user A can't see user B data, aha event fires, backup runs, pricing/terms/privacy pages, dogfood done.
- Signature date locked.

**▶ FINAL GATE — SCOPE LOCKED when:**
- [ ] Each core loop step traces to evidence
- [ ] Cut list exists and non-empty
- [ ] Aha is named measurable event
- [ ] Schema drawable
- [ ] DoD frozen
- [ ] Scope small enough you **feel slightly worried it's too little** (sign of right sizing)

→ **MVP scope is locked. Pipeline ends. Transition to build with this scope as contract** — see [build-and-launch.md](build-and-launch.md).

---

# ONE-PAGE SUMMARY

| Stage | Work | Evidence to pass gate | Lock achieved |
|---|---|---|---|
| **0. Framing** | 0.1 problem separate · 0.2 canvas · 0.3 market type · 0.4 ICP + 20 names · 0.5 assumption map · 0.6 kill criteria | Falsifiable hypothesis, tests present | Problem staked, ICP |
| **1. Competitive** | 1.1 scan 5-tier · 1.2 profiles · 1.3 mine bad reviews · 1.4 market verdict | Complete 5-tier map | Question set, market verdict |
| **2. Validate** | V1: 2.1–2.4 interview+synthesize · V2: 2.5–2.8 direction+test+mock+smoke · V3: 2.9–2.10 pre-sell | V1: past behavior threshold · V2: clear winner · V3: N money | Problem+language → direction+value → price+real-segment |
| **3. Verify** (parallel) | R1: 3.1–3.5 spike+error-analysis+eval+econ · R2: 3.6–3.9 concierge+measure+retention+log | R1: eval passes on real · R2: result matches promise | Promise scope → core loop + aha true |
| **4. Positioning** | 4.1 best customers · 4.2 alternatives · 4.3 5 parts · 4.4 copycat · 4.5 pitch | Pitch clicks real customers | Official positioning |
| **5. Scope Lock** | 5.1 loop traced · 5.2 aha named · 5.3 cut · 5.4 design · 5.5 DoD | All gate conditions | **Locked MVP scope** |

Two more principles were added after an adversarial review against a full solo-dev agent team (see `plugin/solo-dev-comparison.md`): **(4)** evidence gathered for one gate may inform or reopen another, but never *satisfy* it — a landing conversion is not willingness to pay, an eval score is not delivered value, a usability observation is not problem prevalence; **(5)** when the same failure recurs twice with no new evidence between attempts, stop and hand control back rather than looping — a third identical attempt is not new information.

Three principles run through every stage: **(1)** all evidence traces to real person or real data — AI everywhere except evidence source; **(2)** all pass/fail thresholds written pre-test, no post-hoc moving goalposts; **(3)** fail at gate N → go back to gate N-1 with fresh data, don't push forward on wrong guess.
