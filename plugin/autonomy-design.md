# Autonomous-First Mode Design

> ⚠️ CURRENT DIRECTION: see [plugin-spec.md](plugin-spec.md) — Analysis mode is the default; this file's content (automatic market-evidence funnel) is now an **opt-in extension**, not core. The A/B/C/D evidence grading system in this file remains the shared standard.

> Design decision (2026-07-29): plugin **encompasses all work and stages** from clarifying raw idea to locking the official MVP. Claude Code executes everything autonomously; missing capabilities are supplemented with setup (MCP, API, credentials). Accept some unrealistic elements to keep the plugin self-contained. This document replaces the "human work / machine work" division in [stage-support-map.md](stage-support-map.md) with a new principle.

## Replacement principle: evidence grading instead of role division

All Claude work is autonomous. In return, each piece of evidence in an artifact carries a **grade** recorded in frontmatter:

| Grade | Definition | Example |
|---|---|---|
| **A** | Real money or committed behavior from real people, obtained through autonomous funnel | Pre-order payment via Stripe link; async interview response from real outreach |
| **B** | Real words/behavior, no direct interaction | Community mining (Reddit, IndieHackers, HN, niche forums); 1–3 star reviews; user-testing panel results |
| **C** | Measurable anonymous behavior | Traffic, pricing clicks, signups, A/B test headlines on landing page |
| **D** | Model output | Simulated interviews, synthetic personas, self-consistency checks |

Operating principles:
1. **No work blocked by missing people** — there is always an autonomous method for every task, even if that method only achieves grade D.
2. **Grade D never counts toward gates** — it generates hypotheses and refines questions, not validation. This is the boundary "accept some unrealism" while keeping integrity.
3. **Each gate has an evidence grade floor** (configurable). Default recommendation: V1 floor B, V2 floor C, V3 floor **A — money cannot be simulated**. If users lower the V3 floor below A, the plugin runs completely but the final output name changes: **"Validated MVP Pack"** → **"Hypothesis MVP Pack"** — same structure, different claim.
4. Final MVP pack includes **Evidence Quality Report**: grade composition of each decision block — build phase knows exactly what foundation each piece stands on.

## Autonomous method for each stage

### Stage 0 — Framing (100% autonomous)
- 0.1–0.3: Claude auto-builds problem hypothesis, canvas, market type from raw idea + desk research. User only needs one message with rough idea.
- 0.4 "20 real names": autonomous AND still real — research 20 individuals/organizations with real names from public data (companies in the space, people posting about the problem in communities, directories) — grade B. No fabrication; each name includes source.
- 0.5–0.6: assumption map + kill criteria auto-drafted with defaults by idea type; kill criteria add **spending budget** (because autonomous mode spends real money: ads, panels, APIs).
- User checkpoint: one final review gate (can turn off — auto-continue mode).

### Stage 1 — Competitive (100% autonomous — unchanged)
Same as old design: fan-out agents + URL verification for each entry. Need: search/scraping MCP; multiple sources (app store, Trustpilot, Reddit) to avoid G2/Capterra bot blocks.

### Stage 2 — Validate: replace fieldwork with autonomous funnel

| Original work | Autonomous method | Grade |
|---|---|---|
| 2.1–2.2 Conduct 10–15 interviews | **(a) Deep community mining**: extract posts/threads where real people describe problem, workarounds, costs — apply same logic as V1 (count past behavior: who built their own sheet, who looked for tools, who tried AI and failed) on mined sample; **(b) async outreach**: compose + send Mom Test questions via email/DM to 20-name list (need mailbox + send approval), real replies = grade A-; **(c) simulate persona interviews**: only for refining questions and generating hypotheses | B / A- / D |
| 2.3–2.4 Evidence ledger | Auto: every mined quote has URL + date; top two signals auto-flag | B |
| 2.5–2.6 Solution direction + ChatGPT test | Fully autonomous (same as before) | — |
| 2.7 Mock + user testing | Build interactive mock → deploy → **(a)** anonymous user behavior analytics (grade C); **(b)** user-testing panel via API (Maze/UserTesting — real people, paid) = grade B+ | C / B+ |
| 2.8 Smoke test | Deploy landing (copy from mined language) + capped ad budget + analytics — measure **payment-intent conversion**, not raw signups | C |
| 2.9 Pre-sell | **Auto pre-order funnel**: landing + real Stripe payment link (pre-order/deposit refundable) + auto email drip + exit survey for non-buyers. Real money collected doesn't require founder doing sales | **A** |
| 2.10 Rejection log | Exit survey + auto clustering | B- |

**Tradeoffs must be declared upfront** (see Tradeoffs section): autonomous funnel validates **self-serve, low-touch, ~$10–100/month products** well; validates enterprise sales-led products poorly. Plugin detects this at 0.3/0.4 and warns if the idea falls into the latter category.

### Stage 3 — Verify

| Original work | Autonomous method | Grade |
|---|---|---|
| 3.1 Spike + real data | Build 100%; real data from: public dataset in domain + **"exchange value for data" mechanism** — waitlist/pre-order users upload real files to get results early (fully auto real data collection) | B+ |
| 3.2 Error analysis | Claude auto open-codes ~100 traces + failure taxonomy; compensate for missing human arbiter with **multi-model consensus** (cross-check with different model) — note this is weaker than standard | C- |
| 3.3 Eval | Code eval + binary judge as standard; judge–person agreement replaced by agreement between independent models | C |
| 3.4–3.5 Unit economics + constraints | Fully autonomous (calculation) | — |
| 3.6–3.9 Concierge (R2) | **Automated pilot** — for AI-core products this is the sweet spot of autonomous mode: the "wizard" in Wizard-of-Oz is Claude itself. Invite waitlist/pre-order users to use service early; spike + Claude delivers real results on their real work via email/web; measure hours saved (survey), measure **real proto-retention** (who comes back on their own); auto-log actions = MVP spec | **A-/B+** |

### Stage 4 — Positioning (100% autonomous)
- Alternatives extracted from mined evidence + exit surveys (replace transcripts); phantom competitors eliminated by checking "did mined customers mention them".
- 4.5 pitch testing: **A/B test headline/pitch on landing** — measure by real conversion, statistically stronger than "ask a few customers" (grade C but large n).
- Still label positioning thesis.

### Stage 5 — Scope Lock (100% autonomous)
Same as old design (Claude writes everything + coldstart-tester agent). User signature becomes a final review checkpoint — can turn off in auto-continue mode, then plugin self-locks and records "auto-locked".

## Capability stack needed (fill gaps)

| # | Capability | Serves | How to provide | Required? |
|---|---|---|---|---|
| 1 | Web search + scraping (firecrawl MCP or equivalent; Reddit API) | Stages 1, community mining V1, 20 names | `.mcp.json` bundle in plugin | **Required** |
| 2 | Deploy hosting (Vercel/Netlify/Railway MCP or CLI) | Landing, mock, pilot app | MCP/CLI + token | **Required** |
| 3 | Analytics (Plausible/PostHog API) | Measure C-grade: traffic, conversion, A/B | API key | **Required** |
| 4 | Payments (Stripe restricted key — payment link/checkout) | V3 real money, pilot billing | API key limited scope | **Required for grade A** |
| 5 | Email sending (Resend/SMTP) + mailbox outreach | Drip, exit survey, async outreach, pilot delivery | API key; **outreach always via approval** | Strong |
| 6 | Ads (Google/Meta API) + **budget cap** | Pull traffic for smoke test | API + budget cap in state | Optional (without it use organic — slower) |
| 7 | User-testing panel (Maze/UserTesting API) | Upgrade mock test from C to B+ | Paid API | Optional |
| 8 | LLM API keys (multi-model) | Spike, eval, multi-model consensus | Env | **Required** |
| 9 | Domain (Cloudflare API) | Landing with custom domain | API or one manual step | Optional |

Operating note: actions **spending money and reaching outward** (run ads, send outreach, publish, collect money) still go through Claude Code's permission layer. Correct mechanism per docs (direct verification 2026-07-29): pre-approve via `allowed-tools` in skill frontmatter — **NOT via plugin settings.json** (that file only supports 2 keys `agent` and `subagentStatusLine`, can't declare permissions — was a mistake in prior version, now fixed); integration API keys declared via `userConfig` in plugin.json (Claude Code asks user when enabling plugin, `sensitive: true` stores in secure storage instead of settings); spending caps in state and kill criteria check budget too. "Fully autonomous" means no work requires a person to *do it*, not that there's no guardrail.

## Tradeoffs accepted (declare upfront, don't hide)

1. **Lost depth of "why"**: interactive interviews dig out reasons behind behavior; mining + surveys only see behavior and written words. Risk of treating symptom as cause increases → partially mitigated by async outreach + exit survey.
2. **Selection bias lean**: autonomous funnel skews toward PLG self-serve. Not a flaw — is a constraint to declare at gate F: "idea type X validates well this way, type Y will score low".
3. **False positive changes form**: from "social courtesy praise" (interviews) to "curious clicks" (funnel) → all V2/V3 thresholds anchor to payment-intent and money, not signups.
4. **Error analysis lacks human arbiter** is the weakest methodological point (standard explicitly says "cannot delegate") — multi-model consensus is weaker substitute, recorded as grade C-, and Evidence Quality Report must note it.
5. **Spend real money**: ads + panels + APIs — kill criteria require budget cap; this is a cost type the standard doesn't have.

## What DOES NOT change vs. original pipeline

All stage structure, gate ordering, pre-set thresholds, evidence traceability, kill criteria, output contract (MVP pack + cold-start test) remain unchanged. Only **how evidence is collected** (auto instead of fieldwork) and add **evidence grade axis** so all substitutions are transparent. Three-layer gates (machine form-check → gatekeeper rebuttal → review checkpoint) unchanged; review checkpoint can turn off.
