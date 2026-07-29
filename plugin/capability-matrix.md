# Capability Matrix: What's available, what to setup, what to do without

> ⚠️ CURRENT DIRECTION: [plugin-spec.md](plugin-spec.md) — Analysis mode (zero setup) is the default; Tier 1.2/1.3 (hosting, analytics) and Tier 2 only needed when enabling Market-evidence mode. Standard integration declaration mechanism: `userConfig` in plugin.json (verified docs 2026-07-29). Note: Maze/UserTesting API (T3.2) is an UNVERIFIED claim — must confirm before including in build.

> Design principle (decision finalized 2026-07-29): **every integration is optional**. Plugin's main flow runs complete 0→5 using only Claude Code's native capabilities; each connected integration unlocks better flow / more autonomy / higher evidence grade — but without it the overall flow doesn't break.

## 1. Graceful degradation architecture

**Per-task degradation ladder** — every pipeline work has all 4 tiers; plugin auto-selects the highest available:

1. **Enhanced-auto** — has integration: Claude auto-completes, best quality/speed.
2. **Baseline-auto** — native capabilities only: Claude still auto-completes but thinner (e.g., mining via WebSearch instead of dedicated scraping).
3. **Handoff** — Claude fully prepares (kit, script, step-by-step guide) and hands off to you for outside work, then receives results back for analysis. **Important note: this tier often delivers HIGHER evidence grade** (you interview yourself = grade A, mining = grade B) — integration buys AUTONOMY and SPEED, not always quality.
4. **Simulate (grade D)** — model simulation: only for hypothesis generation, doesn't count toward gates.

**Capability detection mechanism**: skill `/validate:setup` audits environment (which MCP tools are available, which env keys exist, test-calls each) → writes `capabilities.json` to state → every stage-skill reads this profile to pick tier, and artifact records what tier evidence came from. When you add more integrations mid-run, just re-run `/validate:setup` — new flows unlock without changing anything else.

**Plugin guarantee**: with any combination of integrations (even zero), plugin always reaches scope lock and outputs MVP pack — with Evidence Quality Report stating achieved grade and **"if you connect X then block Y can reach grade Z"**.

## 2. Claude Code's NATIVE capabilities (zero setup — backbone of main flow)

| Native capability | Serves | Real limits |
|---|---|---|
| **WebSearch / WebFetch** | Scan competitors (Stage 1), benchmarking, basic community mining (V1), source verification | Blocked at anti-bot sites (G2, Capterra, LinkedIn); heavy JS pages; rate limits |
| **Code execution + filesystem (Bash, Read/Write/Edit)** | Spike/PoC (3.1), eval harness (3.3), mock HTML (2.7), landing page code (2.8), state + artifact + git | Runs locally; deploy to internet needs integration |
| **Subagents (Agent tool)** | Fan-out competitor scan 5-tier, review mining, gatekeeper rebuttal, coldstart-tester | Can't use AskUserQuestion in subagent |
| **AskUserQuestion** | Stage 0 elicitation, gate review checkpoints | Main loop only |
| **The model itself** | All analysis, synthesis, clustering, artifact writing; grade D simulation | Not an evidence source |
| **Run on schedule (cron `claude -p` / scheduled tasks)** | Monitor funnel over days (wait for smoke test/pre-order data) | User must enable; not required — substitute with open session + `/validate:status` |

**With just these capabilities (Minimal profile)**, plugin completes: Stage 0 complete · Stage 1 ~80% (bot blocks force you to paste raw content) · Stage 2 in handoff form (interview kit prepared, mock local, landing code ready — you deploy/show people/sell) · Stage 3 spike + eval on public data or data you provide · Stages 4–5 complete. Output: full MVP pack; evidence grade depends on work you do yourself in handoff tier.

## 3. Integration menu — evaluate each one

Each integration assessed on 3 axes: **autonomy gained** (what more Claude can do) · **evidence grade** (which gate tier it unlocks) · **setup cost & risk**.

### Tier 1 — High leverage, cheap setup (recommend first)

**T1.1 · Scraping/search specialist (firecrawl MCP or equivalent + Reddit API)**
- Unlocks: trustworthy G2/Capterra/app store review scraping (1.3); deep systematic community mining for V1 (2.1–2.3) — **this is the backbone of autonomous-mode grade B evidence**; crawl competitor pages (1.1–1.2).
- Without: native WebSearch (thin, often blocked) → handoff to you to paste raw reviews/threads.
- Setup: 1 API key + 1 MCP entry. Cost: free tier sufficient for one idea. Risk: low (read-only).
- Grade upgrade: V1 from "thin B/handoff" → "thick B, autonomous".

**T1.2 · Deploy hosting (Vercel / Netlify / Railway — CLI login or MCP)**
- Unlocks: live landing page (2.8), live interactive mock for real people (2.7), automated pilot app (R2), A/B test pitch (4.5). **Foundation condition for any grade C+ evidence collected auto**.
- Without: Claude builds complete code + 5-min deploy guide → you deploy yourself (light handoff); or mock runs local.
- Setup: 1 CLI login. Cost: free tier. Risk: low.
- Upgrade: enables measuring real behavior instead of just "showing people".

**T1.3 · Analytics (Plausible or PostHog — API key)**
- Unlocks: Claude auto-reads smoke test numbers, conversion, A/B — closes feedback loop (2.8, 4.5, R3 later). Pair with T1.2.
- Without: you read dashboard numbers and paste them (2-min handoff); or Claude embeds simple counters if already hosting.
- Setup: 1 API key. Cost: free tier / cheap. Risk: low (read numbers from your own account only).

### Tier 2 — Opens grade A evidence and outreach

**T2.1 · Stripe restricted key (payment link/checkout only)**
- Unlocks: auto pre-order funnel with **real money** — V3 grade A without you selling (2.9); billing for automated pilot (R2).
- Without: **excellent fallback** — you create payment link once on Stripe dashboard then paste URL; Claude embeds in landing. Still grade A, just 5 min of your time. (Because this fallback is so good, the key is convenient but not critical.)
- Setup: create restricted key. Risk: medium — limit key scope, don't grant refund/transfer perms.

**T2.2 · Email (Resend/SMTP + mailbox outreach)**
- Unlocks: async outreach to 20-name list (interview via email — real replies = grade A-), drip for waitlist, exit survey, pilot delivery (R2).
- Without: Claude composes full email sequence → you copy-paste from your own mailbox (handoff; many founders prefer this because email from personal address has higher reply rate).
- Setup: API key + domain verification for sending. Risk: medium — **every outreach send always goes through your approval**, plugin never sends silently.

**T2.3 · Ads (Google/Meta API + budget cap)**
- Unlocks: fast traffic for smoke test — shrink V2/V3 from weeks (organic) to days.
- Without: organic channels — Claude writes posts for niche communities, you post (personal account identity, shouldn't delegate); slower, noisier but still works.
- Setup: heaviest on the list (ads account, API, billing). Cost: real money. Risk: money — require budget cap in state + include in kill criteria.
- Assessment: **this is a "speed" integration, not quality** — do last.

### Tier 3 — Nice to have

**T3.1 · Multi-model LLM keys (OpenAI/Google beyond Anthropic)** — unlocks: multi-model consensus for error analysis/eval (3.2–3.3, upgrade from self-scoring to C/C+); more realistic "if customer used ChatGPT" comparison (2.6). Without: single-model self-consistency (weaker, note in report). Setup: API keys. Cost: per-use, small.

**T3.2 · User-testing panel (Maze/UserTesting API)** — unlocks: real people using mock with screen recording (2.7 upgrade to B+). Without: anonymous analytics on live mock (C) or you bring trusted people to try. Cost: paid per test. Low priority.

**T3.3 · Domain API (Cloudflare)** — landing has custom domain (minor conversion lift, trust boost). Without: default hosting subdomain (vercel.app…) — sufficient for testing. Low priority.

## 4. Integration × Stage impact matrix

| Integration | Stage 0 | Stage 1 | Stage 2 (V1/V2/V3) | Stage 3 (R1/R2) | Stage 4 | Stage 5 |
|---|---|---|---|---|---|---|
| Scraping MCP | 20 names faster | ●●● | ●●● V1 mining | — | ● alternatives | — |
| Hosting deploy | — | — | ●●● V2 mock/landing | ●● pilot app | ●● A/B pitch | — |
| Analytics | — | — | ●●● measure V2/V3 | ● retention pilot | ●● pitch measurement | — |
| Stripe key | — | — | ●●● V3 grade A | ● pilot billing | — | — |
| Email | — | — | ●● outreach/drip | ●● pilot delivery | — | — |
| Ads | — | — | ●● speed V2/V3 | — | ● | — |
| Multi-LLM | — | — | ● ChatGPT test | ●● consensus eval | — | — |
| Panel | — | — | ● V2 upgrade to B+ | — | — | — |
| Domain | — | — | ● conversion | — | — | — |

(●●● = changes flow quality; ●● = significant upgrade; ● = marginal gain. Stages 0 and 5 are nearly integration-independent — run complete with native only.)

## 5. Clarification: why Stripe/hosting in a "pre-MVP build" pipeline

These are NOT product-building tools. Per the method ("validate, then build" — evidence before product), gates V2/V3/R2 happen **before** scope lock and need experiment instruments:
- **Landing page (V2)** = demand-measure machine for strangers — not product website.
- **Payment link (V3)** = commitment-measure machine (pre-order/deposit, refundable) — not product billing.
- **Pilot app (R2)** = concierge delivery mechanism — not MVP.
- **Spike R1 runs local — no hosting needed.** Hosting only needed to show something to strangers for measurement.

Therefore these integrations only serve **Market-evidence configuration**. In **Analysis-only configuration** they're not needed (see profiles below).

## 6. Four operating profiles

| Profile | Gate scope | Integrations needed | Output |
|---|---|---|---|
| **Analysis-only** | Stages 0, 1, V1 (mining), 2.5–2.6, R1 (local spike + eval), 4, 5. V2/V3/R2 recorded as "open assumption" in carry-forward | Nothing required (scraping helps mining; multi-LLM helps eval) | **Hypothesis MVP Pack** — MVP locked on analysis + grade B evidence, plus checklist of what still needs market testing |
| **Minimal market-evidence** (zero setup) | All gates; market experiments at handoff tier (Claude prepares kit, you execute) | Nothing | MVP pack — grade depends on work you do yourself |
| **Standard** | All gates, ~80% autonomous | T1.1 + T1.2 + T1.3 + manual Stripe link | Validated MVP Pack (V3 grade A via manual link) |
| **Full-auto** | All gates, maximum autonomy | Standard + T2.1–T2.3 + T3.1 | Validated MVP Pack, fastest |

Blended strategy: run **Analysis-only to quickly screen all ideas** (cheap, no setup); ideas that survive get switched to Market-evidence to collect real evidence — honors "cheapest test first" spirit.

## 7. Recommended setup order (leverage / cost)

1. **Scraping MCP** — backbone of Stage 1–2 evidence, free, 5 min.
2. **Hosting** — foundation for all live measurement, free, 5 min.
3. **Analytics** — close measurement loop, free, 5 min.
4. **Manual Stripe payment link** (no API key yet) — opens grade A for V3 with 5 min once per run.
5. **Email API** — when starting V1 outreach and have waitlist.
6. **Multi-LLM keys** — when entering R1 with AI-core product.
7. **Stripe API key / Ads / Panel / Domain** — only when needing speed or scale.

First three are the "minimal standard set" — ~15 min total setup, all free tier, biggest inflection from "plugin as research assistant" to "plugin as autonomous validation machine".
