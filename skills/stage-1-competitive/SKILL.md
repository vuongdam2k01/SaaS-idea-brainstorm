---
name: stage-1-competitive
description: Stage 1 of the SaaS validation pipeline - competitive and alternatives scan. Use when an idea in ideas/<slug>/ needs the 5-tier competitor map, competitor profiles, negative-review mining, and the market verdict. Runs right after task 0.1, before any interviews/mining for stage 2.
user-invocable: false
---

Stage 1: competitive & alternatives scan. Load `method-rules`; read `state.json`. Runs immediately after 0.1 — its output shapes stage 2's questions. Templates: [templates.md](templates.md).

## Execution

1. **Spawn agents in parallel** (Agent tool, one message):
   - `competitor-scanner` — with the problem statement, segment, and JTBD keywords from `problem-hypothesis.md`. Produces the 5-tier map + profiles + market verdict.
   - `community-review-miner` (Task B) — once the scanner returns significant tier-1/2 competitors, mine their 1–3★ reviews into unmet-need clusters with verbatim quotes. (If competitors are already obvious from stage 0, launch both at once.)
2. Rung note: agents use scraping MCP when `capabilities.scraping = available`; otherwise native search. Directory sites (G2/Capterra) often block plain fetches — collect the agents' "blocked sources" lists and, if material, offer the **handoff rung**: give the user exact URLs to open and paste raw content back for clustering.
3. Write `competitive-map.md` (frontmatter `status: draft` — it stays a DRAFT through gate C by design, until stage 2 calibrates it against real customer words and promotes it) and `review-mining.md` (**promote to `status: ready` once clustering is complete** — gate C requires it ready). Every entry carries its source URL; entries the agents flagged UNVERIFIED stay flagged or get dropped.
   **Normalize before recording any comparison** (gate C blocks otherwise): every price row carries currency, tax basis, billing period, plan edition, seat/usage basis, locale, `observed_at`, and list price kept apart from effective price — monthly vs annual-prepaid alone fakes a ~20% gap. Every notable capability carries a state (`announced | beta | documented | generally-available | observed | withdrawn`); a launch post is not a shipped feature and a withdrawn feature points the other way. Syndicated announcements and aggregator write-ups collapse to the **original** source — five reposts are one source, exactly as in the evidence ledger.
4. **Persist the trail immediately**: save each agent's raw report to `private/research-raw-<agent>.md` the moment it returns — grade-B claims need a checkable trail; chat output evaporates (dogfood finding).
5. **Market verdict** — the scanner's read is journaled only as a PROVISIONAL `other` row; the decision-log `market-verdict` row is written at gate C with the **user's call**, never before (dogfood finding: a premature verdict row pre-satisfies gate C's checkbox). Present the three-scenario read:
   - Many healthy competitors → money proven; the question becomes "which gap is ours".
   - Nobody doing it → red flag (usually the pain isn't worth solving); report what the dead-predecessor investigation found.
   - Competitors exist but are bad → record the open question (lazy, or invisible hard part: ops/compliance/sales-cycle?) to be resolved by stage-2 evidence.

## Gate C

Requires: 5-tier map complete with sources; profiles for significant competitors; clustered review mining; market verdict recorded. Update state; run gate-check. Feed forward: the map's "what do people use today / why did they leave it" gaps become mining targets and interview-kit questions in stage 2.
