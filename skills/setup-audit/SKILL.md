---
name: setup-audit
description: Detect which optional integrations are actually callable and record the capability profile with execution rungs. Use any time, and whenever a stage needs to pick between enhanced-auto, baseline-auto, or handoff execution. Integrations are never required.
argument-hint: "[idea-slug (optional, defaults to all)]"
---

Audit optional capabilities. The pipeline runs fully without any of them — the audit determines *which rung* each task runs at. Load `method-rules` first.

## Rules of evidence for capabilities

A capability is `available` ONLY after an **authenticated functional probe** — a real call that succeeded. "CLI installed" or "user says they have an account" is NOT available; record those as rung `handoff-only` or status `unknown` with a note. Every probe result is recorded with a timestamp.

## Probes (never let a failed probe error out the audit)

1. **Scraping** — ToolSearch for scraping/crawl MCP tools (e.g. firecrawl). If found: one trivial real call (scrape a stable public page). Success → `available`, rung `enhanced-auto`. Not found → tell the user which MCP server to install if they want it; status `unavailable`, mining runs `baseline-auto`.
2. **Secondary LLM (multi-model eval)** — check the user's own environment for standard keys (e.g. `OPENAI_API_KEY`, `GEMINI_API_KEY`) via Bash; if present, ask the user before making one minimal authenticated call to verify. Record provider + model. No key → single-model evaluation, honestly graded lower.
3. **Hosting** — CLI present AND authenticated (`vercel whoami` / `netlify status` / `railway whoami` succeed). Installed-but-unauthenticated → `handoff-only` ("code + 5-minute deploy guide").
4. **Analytics** — API key the user provides + one successful authenticated API call. Otherwise `handoff-only` (user pastes numbers from their dashboard).
5. **Payments** — ask the user: existing Stripe payment link (grade-A capable, `handoff-only` setup) or API key (only then probe). No Stripe → V3 runs willingness-to-pay analysis, gate OPEN.
6. **Email** — sending API verified by a real send to the user's own address (with their approval). "I'll send manually from my mailbox" → rung `handoff-only` (that is a fine rung — often higher reply rates), NOT `available`.
7. **Ads budget** — `${user_config.ads_budget_cap_usd}` (non-sensitive, substitutable here). 0/unset → paid traffic off. Copy the value into `state.budget.cap_usd`.

Bundle user questions into ONE AskUserQuestion call.

## Recording & reporting

1. Write per-capability objects into `state.json.capabilities` per state-schema v1.1: `{status, rung, provider, verified_at, probe, note}`.
2. Report a table: capability → status → rung → what it unlocks at the CURRENT stage → exact upgrade step. Do not push setup for stages far away; analysis mode needs at most scraping + secondary-LLM.
3. Append a `capability-audit` row to `decision-log.md` summarizing changes.
