# Codex parity — what's identical, what's ported, what's a manual step

> Added 2026-07-29. This plugin was designed and adversarially reviewed for Claude Code (see [codex-review.md](codex-review.md), [plugin-spec.md](plugin-spec.md)). This file documents the second install surface — OpenAI Codex CLI's plugin marketplace (launched 2026-03-27) — added without touching any of the reviewed Claude Code files. Mechanism claims below are sourced from `developers.openai.com/codex/*` (redirects to `learn.chatgpt.com/docs/*`) as of 2026-07-29; Codex's plugin/hook system is young and evolving, re-verify against current docs before relying on a claim here.

## What ships unmodified and just works

- **`skills/*/SKILL.md`** — Codex reads the same file format (`name` + `description` frontmatter, markdown body). The Claude-only frontmatter fields (`disable-model-invocation`, `user-invocable`, `argument-hint`, `allowed-tools`) are simply extra keys Codex ignores; they don't break parsing.
- **`hooks/hooks.json`** — same event names (`SessionStart`, `PreToolUse`, `PostToolUse`) and the same `matcher: "Write|Edit"` syntax; Codex's docs confirm `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_PLUGIN_DATA}` are read as compatibility aliases for its own `${PLUGIN_ROOT}` / `${PLUGIN_DATA}`, so the three hook commands run as-is. **Caveat**: as of this writing, Codex hooks are an experimental feature — disabled by default and not available on Windows. A Codex user on Windows, or one who hasn't opted in, gets no PreToolUse/PostToolUse enforcement; `gate-check`'s own threshold-snapshot cross-reference in `decision-log.md` is the hook-independent backstop (this was already the design rationale in the Round 2 Codex review — hooks are defense-in-depth, not the only defense).
- **`scripts/state-write.js`**, **`process/*`**, **`templates/*`** — plain files, platform-agnostic.

## What's ported (new files, added for Codex — the Claude-side originals are untouched)

| Claude Code mechanism | Codex mechanism | File(s) |
|---|---|---|
| `.claude-plugin/plugin.json` | `.codex-plugin/plugin.json` | new |
| `.claude-plugin/marketplace.json` | `.agents/plugins/marketplace.json` | new |
| `agents/*.md` (YAML frontmatter subagent) | `.codex/agents/*.toml` | `competitor-scanner.toml`, `community-review-miner.toml`, `gatekeeper.toml`, `coldstart-tester.toml` — same `name`, `description`, and body verbatim as `developer_instructions`; `sandbox_mode = "read-only"` matches the original tool restriction (research/audit agents don't write files). **Generated, not hand-maintained**: `node scripts/sync-codex-agents.js` regenerates the TOML from `agents/*.md`, and `--check` fails when they diverge (a contract fixture runs it). Two hand-kept copies of one prompt drift the moment either side gains a check — which is exactly what happened when the gatekeeper grew its independence/usability/claim/privacy/manifest checks and the Codex copy silently kept the old seven. |
| `disable-model-invocation: true` (new-idea, switch-mode, status) | `policy.allow_implicit_invocation: false` in a sidecar | `skills/<name>/agents/openai.yaml` |

## Known gaps — no Codex equivalent, documented instead of faked

1. **Subagent auto-discovery on install is unconfirmed.** Codex's plugin manifest (`.codex-plugin/plugin.json`) has a documented `skills` field but no documented field for bundling custom agents — unlike Claude's plugin cache, which always carries `agents/`. If a marketplace-installed copy of this plugin doesn't pick up `.codex/agents/*.toml` automatically, copy that directory into your own project's `.codex/agents/` (or `~/.codex/agents/` for personal use) once after installing. Verify this on your Codex CLI version before depending on the fan-out steps in `stage-1-competitive`, `stage-2-validate`, and `stage-5-scope-lock` (gate-check's gatekeeper pass, coldstart-tester).
2. **No `AskUserQuestion` tool.** Skill bodies say things like "ask (AskUserQuestion)" — on Codex this is just a direct question in the conversation. Functionally equivalent (the user still gets asked, still answers in one turn); there's no structured multi-choice UI to fall back on.
3. **No config-on-enable prompt.** Claude's `plugin.json` declares `userConfig.ads_budget_cap_usd` (prompted at enable time). Codex's manifest schema, as documented, has no equivalent field — `.codex-plugin/plugin.json` omits `userConfig` entirely. A Codex user sets the budget cap by editing `state.json` (`budget.cap_usd`) directly; `new-idea`'s setup questions still ask for it in conversation and write it to state the same way.
4. **PreToolUse/PostToolUse only cover local function tools.** Codex's docs say hosted tools (e.g. its web search) never trigger hooks — same limitation Claude has for non-file tools, so no behavior change, just noting it's the same shape of gap on both sides.

## Verification status

None of this has been dogfooded on a real Codex CLI install yet (unlike the Claude Code build, which passed 5 rounds of adversarial review plus two dogfood runs — see codex-review.md). Treat the Codex install path as **beta**: the manifests validate as well-formed JSON/TOML and mirror documented schemas, but "installs and the pipeline runs end-to-end on Codex" is an open item, not a verified claim. If you try it, gap #1 above is the first thing to confirm.
