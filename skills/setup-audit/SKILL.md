---
name: setup-audit
description: Detect which optional integrations are actually callable and record the capability profile with execution rungs. Use any time, and whenever a stage needs to pick between enhanced-auto, baseline-auto, or handoff execution. Integrations are never required.
argument-hint: "[idea-slug (optional, defaults to all)]"
---

Audit optional capabilities. The pipeline runs fully without any of them — the audit determines *which rung* each task runs at. Load `method-rules` first.

## Rules of evidence for capabilities

A capability is `available` ONLY after an **authenticated functional probe** — a real call that succeeded. "CLI installed" or "user says they have an account" is NOT available; record those as `status: unavailable|unknown` with rung `handoff` and a note. Every probe result is recorded with a timestamp.

## Probes (never let a failed probe error out the audit)

1. **Scraping** — ToolSearch for scraping/crawl MCP tools (e.g. firecrawl). If found: one trivial real call (scrape a stable public page). Success → `available`, rung `enhanced-auto`. Not found → tell the user which MCP server to install if they want it; status `unavailable`, mining runs `baseline-auto`.
2. **Secondary LLM (multi-model eval)** — two qualifying paths, checked in this order via Bash: (a) standard keys in the user's own environment (e.g. `OPENAI_API_KEY`, `GEMINI_API_KEY`); (b) a logged-in **Codex CLI** (`codex --version` and `codex login status` both succeed) — the common case for a founder on a ChatGPT plan who owns no API key. Neither check is itself the probe: installed-and-logged-in is `status: unknown`, rung `handoff`, exactly like an unauthenticated hosting CLI. Ask before the one minimal authenticated call that decides it (`codex exec` spends the user's own quota). Record provider + model — `codex-cli/<model>`. **A provider that is the session's own host never counts**: on Codex, `codex exec` is the model asking itself, so the cross-model agreement stage 3 measures would carry zero information while looking like agreement — record `unavailable` with a host-collision note. No qualifying second provider → single-model evaluation, honestly graded lower.
3. **Hosting** — CLI present AND authenticated (`vercel whoami` / `netlify status` / `railway whoami` succeed). Installed-but-unauthenticated → `status: unavailable`, rung `handoff` ("code + 5-minute deploy guide").
4. **Analytics** — API key the user provides + one successful authenticated API call. Otherwise rung `handoff` (user pastes numbers from their dashboard).
5. **Payments** — ask the user: existing Stripe payment link (grade-A capable, rung `handoff`) or API key (only then probe). No Stripe → V3 runs willingness-to-pay analysis, gate OPEN.
6. **Email** — sending API verified by a real send to the user's own address (with their approval). "I'll send manually from my mailbox" → rung `handoff` (that is a fine rung — often higher reply rates), NOT `available`.
7. **Ads budget** — `${user_config.ads_budget_cap_usd}` (non-sensitive, substitutable here). 0/unset → paid traffic off. Copy the value into `state.budget.cap_usd`.

Bundle user questions into ONE AskUserQuestion call.

## Recording & reporting

1. Write per-capability objects into `state.json.capabilities` per state-schema: `{status, rung, provider, verified_at, probe, note, required_in_phase, required_now, blocks}` — `rung` is one of exactly three values `enhanced-auto | baseline-auto | handoff`; never write `handoff-only` or `simulate`.
2. **Phase-relevance (v1.5.0)** — for every capability, compute its relevance from `scripts/lib/phase-relevance.js` rather than guessing: `node "${CLAUDE_SKILL_DIR}/../../scripts/lib/phase-relevance.js" <task-id>` per entry in `state.active[]` (or `require` it directly if scripting the audit). Set `required_in_phase` to `earliestPhaseFor(capability)` (the first phase that ever consumes it) and `required_now` to `isRequiredNow(capability, state.active)`. **A capability with `required_now: false` is never reported as more than `INFORMATIONAL`** — no matter how unavailable it is, it cannot be worded as blocking, urgent, or a gap the founder needs to act on right now; it is simply named as "becomes relevant at `<required_in_phase>`". This is the fix for a real reporting defect: setup-audit used to list every unavailable capability with the same weight regardless of stage, so a founder still in stage 0 saw "payments: unavailable" read as if V3 were blocked. Set `blocks` to the task ids (from `PHASE_CAPABILITIES`, the phases this capability is relevant to) that would run at a lower execution rung while the capability stays `unavailable`/`unknown` — empty once `available`, and empty for a not-yet-relevant capability (nothing is blocked by something that has not started).
3. Report a table: capability → status → rung → `required_now` → what it unlocks at the CURRENT stage → exact upgrade step. Capabilities with `required_now: false` go in a clearly separate "not needed yet" section, informational only. Do not push setup for stages far away; analysis mode needs at most scraping + secondary-LLM.
4. Append a `capability-audit` row to `decision-log.md` summarizing changes.
