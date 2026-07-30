# Plugin Spec — rebuild (2026-07-29)

> ✅ **BUILT (2026-07-29)** and **PASSED 3 ROUNDS OF ADVERSARIAL REVIEW WITH CODEX** (gpt-5.6-sol, xhigh — transcript: [codex-review.md](codex-review.md)). **ADDENDUM v1.1 — items below REPLACE corresponding content in this spec** (sections 4–5 not fully rewritten; addendum wins on conflict):
> 1. **15 skills** (v1.1 added `switch-mode` → 12; v1.2 added the post-LOCK three: `declare-drift`, `reconcile`, `run-validation`); `gate-check` + `setup-audit` are model-invocable (not user-only) — required for autonomous pipeline.
> 2. **Machine-readable gate contracts** at `skills/method-rules-gate-contracts/SKILL.md`: per-gate prerequisites (P demands V3+R1+R2 resolved), acceptable artifact states, OPEN rules, **3-tier pack predicate**: Validated / Hypothesis / **Pre-feasibility** (R1 open).
> 3. **State v1.1.0**: `active[]` DAG replaces `current_stage`; capabilities is object `{status, rung, provider, verified_at, probe}` — "CLI installed but not authed" never = available; migration rules from v1.0.
> 4. **userConfig only has `ads_budget_cap_usd`** (no sensitive keys — no adapter uses them; integrations = user-installed MCP/CLI, setup-audit verifies with authenticated functional probe).
> 5. **Evidence rules R1**: deterministic metric on real data = C; LLM-judge subjective no person anchor = D (diagnostic, doesn't count gate); PASS subjective needs anchor person labels (~75–90% agreement) or real R2 result.
> 6. **Outward-action policy**: all outreach/spending needs per-approval (auto_continue never covers) + budget preflight + journal.
> 7. **Privacy**: `private/.gitignore` auto-protects per idea; all public artifacts use P-ids; personal profile URLs only in `private/contacts.md`.
> 8. **Hook v2 + 24-case test suite** (includes Codex-proven bypasses as regression); hooks are defense-in-depth — gate-check self-verifies threshold-snapshot in decision-log independent of hook; hooks need Node (missing = non-blocking error, skills don't depend).
> 9. Zero-setup narrowed honestly: no representative real data → R1 OPEN → pack is Pre-feasibility.
> 10. **Dual distribution (2026-07-29)**: added a second install surface, Codex CLI's plugin marketplace, purely additive — `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `.codex/agents/*.toml` (agent bodies ported verbatim), `skills/*/agents/openai.yaml` sidecars for the 3 explicit-only skills. No Claude-reviewed file's behavior changed; two skill-body lines got a runtime-neutral fallback clause where they referenced `${CLAUDE_SKILL_DIR}` literally. Full gap analysis (unconfirmed subagent bundling, no AskUserQuestion/userConfig equivalent, hooks experimental on Codex): [codex-parity.md](codex-parity.md). Not yet dogfooded on Codex — beta.

> **Only governing document** for plugin operations, replaces 4-file direction role ([design-assessment](design-assessment.md), [stage-support-map](stage-support-map.md), [autonomy-design](autonomy-design.md), [capability-matrix](capability-matrix.md) — keep as detailed reference). Rewritten per user's finalized will:
> 1. Plugin spans **from clarifying raw idea to locking official MVP** — is **analysis and lock**, not build/sell tool.
> 2. Claude Code **autonomous** execution.
> 3. All outside integrations **optional**: present improves flow, absent doesn't break main.
> 4. All Claude Code mechanisms cited here **direct-verified against official docs 2026-07-29**.
> 5. **All plugin content in English** (skill/agent/hook instructions, template, artifact schema). Conversation per user language.
> 6. **Complete build ONCE** — no V1 lite; design discussion finished, build both modes. Distribute **via git per Anthropic marketplace standard** (section 6).

## 1. Mission and output

**Input**: one message with rough idea. **Output**: **MVP Pack** — locked MVP that cold-start test passes (new session reads pack and starts building, doesn't re-ask).

Two modes, one flow:
- **Analysis mode (DEFAULT)** — pure analysis, zero setup: run all stages via desk research + mining + local spike. Market-test gates (V2 smoke, V3 money, R2 concierge) **substituted with analysis + ready-to-run kit**, state recorded OPEN. Output: **Hypothesis MVP Pack** = MVP locked on analysis + grade B evidence, plus open assumptions list + ready-to-run experiment kits.
- **Market-evidence mode (OPT-IN)** — turn on for ideas surviving analysis mode when you want real market proof before building: run the ready-made kits (live landing, pre-order link, pilot). Output: **Validated MVP Pack**.

Evidence grades A/B/C/D apply to both modes (see [autonomy-design.md](autonomy-design.md#nguyên-tắc-thay-thế-phân-hạng-bằng-chứng-thay-vì-phân-vai-người-máy)); grade D never counts toward gates; every artifact records grades.

## 2. Main flow (Analysis mode) — what Claude auto-does per stage

| Stage | Claude's own work | Analysis substitution for "market" portion | Output |
|---|---|---|---|
| **0 Framing** | Elicit from raw idea (AskUserQuestion + dialogue) → 5-part problem hypothesis; Lean Canvas labeled `[assumption]`; market type + consequences; beachhead scoring; research 20 real names from public sources (with URL, no fabrication); assumption map D/F/V+U/E as Test Cards; kill criteria state+date via premortem | — (this stage is inherently analysis) | 6 Stage 0 artifacts; gate F machine form-check |
| **1 Competitive** | Fan-out agents scan 5 tiers per JTBD, verify URLs each entry; competitor profiles; mine 1–3 star reviews verbatim; market verdict 3 scenarios | — | competitive-map (DRAFT), review-mining, market verdict |
| **2 Validate** | **V1**: deep community mining — count *past behavior* (who built own sheet, who searched for tool, who tried AI and failed) on mined sample, evidence ledger each entry sourced; **2.5** 2–3 solution directions mapped to evidence clusters; **2.6** ChatGPT-gap test by value class; **2.7** build local mock | **V2 smoke**: draft landing copy (raw mined language) + complete page → **landing kit**; **V3 money**: willingness-to-pay analysis (real alt costs + budget signals mined) + **pre-sell kit** (script, commitment ladder, proposed price). V2/V3 gates record **OPEN** | evidence-ledger (grade B), winning direction, landing kit + pre-sell kit |
| **3 Verify** | **R1 full**: local spike (real input → output), error-analysis ~100 traces + stop-rule, failure taxonomy, code eval + binary judge (multi-model consensus if key — else single, note lower grade), unit economics, hard constraints → lock promise scope | **R2**: dry-run value — spike end-to-end on sample real data, compare output vs promise + **concierge kit**. R2 gate records **OPEN** (exception: AI-core + extension enabled → automated pilot runs real) | spike, eval harness, promise scope; concierge kit |
| **4 Positioning** | 5-component chain in order, alternatives **only from evidence ledger** (eliminate phantom), value+proof from dry-run, category like Big Fish Small Pond, copycat test (Claude plays competitor), pitch in mined vernacular | Pitch A/B in landing kit (run when extension enabled) | positioning **thesis** |
| **5 Scope Lock** | Core loop traced step-by-step; aha event named; cut list proposed; technical design contract complete (schema, ADR, buy-list, final-20% boundary, code-understanding line, tracking plan); DoD; run **coldstart-tester** | — | **Hypothesis MVP Pack** |

User checkpoint: review each gate (default) or auto-continue (all off, one-shot run). Min interaction = 1 idea message + 1 scope lock review.

## 3. MVP Pack contract (final output)

Self-contained directory, entry `mvp-spec.md`: (1) core loop traced step-by-step; (2) aha event; (3) cut list; (4) technical design contract; (5) DoD; (6) positioning thesis + promise scope; (7) pricing analysis + willingness-to-pay; (8) eval harness handoff (AI-core); (9) **carry-forward**: open assumptions (V2/V3/R2 if analysis mode) + ready kits + learning plan; (10) **Evidence Quality Report**: each block's grade + "if you run kit X/connect Y then block Z upgrades to grade W". Success criteria: 6 end-gate conditions + cold-start test passes.

## 4. Plugin architecture (verified mechanisms)

```
saas-validate/
├── .claude-plugin/plugin.json      # + userConfig: optional API key declaration (sensitive: true → secure storage,
│                                   #   Claude Code asks on enable; blank = baseline)
├── skills/
│   ├── new-idea/        # disable-model-invocation: true (user only /saas-validate:new-idea — no context waste)
│   ├── status/          # disable-model-invocation: true — where are we, which gate, what's waiting, kill deadline
│   ├── gate-check/      # disable-model-invocation: true — call gatekeeper, cross-ref contract + grade floor
│   ├── setup-audit/     # disable-model-invocation: true — probe integrations available → capabilities in state
│   ├── stage-0-framing/ … stage-5-scope-lock/
│   │                    # user-invocable: false (Claude auto-activates per state); body <500 lines;
│   │                    #   template + checklist as support files (load as needed)
│   └── method-rules/    # user-invocable: false — invariant rules: evidence grades, [assumption], trace, pre-set thresholds
├── agents/
│   ├── competitor-scanner.md  # heavy context, fan-out; tools: WebSearch/WebFetch + scraping MCP if available
│   ├── review-miner.md        # + community-miner for V1
│   ├── gatekeeper.md          # rebuttal at gate — system prompt: find reason to FAIL; clean context
│   └── coldstart-tester.md    # read MVP pack as new build session, list missing questions
├── hooks/hooks.json
│   ├── SessionStart (command) → read ideas/*/state.json, inject additionalContext: where we are + 3 principles
│   │                            + kill deadline/criteria overdue (date compare)
│   ├── PostToolUse matcher Write|Edit on ideas/** (command) → validate artifact frontmatter (schema, grade labels)
│   └── PreToolUse matcher Edit on *kill-criteria*/*thresholds* (prompt-type hook) → block/warn editing signed thresholds
└── (NEVER bundle .mcp.json forced — integrations are user's; setup-audit probes and guides on-time)
```

Mechanical constraints (verified): plugin doesn't contribute CLAUDE.md → standing rules via SessionStart additionalContext + method-rules skill; AskUserQuestion main loop only → no elicitation delegation to agent; skill body stays in context → each stage one skill; `allowed-tools` per skill is pre-approve mechanism (NOT plugin settings.json).

## 5. Capability model: optional truly

- **Zero setup = Analysis mode runs complete.** Use only: WebSearch/WebFetch, code execution, subagents, AskUserQuestion.
- Optional integrations (via `userConfig` on enable, or add later + re-run `/saas-validate:setup-audit`): **scraping MCP** (thicker V1 mining — upgrade grade), **multi-model LLM keys** (consensus eval R1), and when enabling Market-evidence mode: hosting, analytics, Stripe link (see [capability-matrix](capability-matrix.md)). 4-tier ladder per work: enhanced-auto → baseline-auto → handoff (user kit) → simulate-D.
- Every flow depending on integration must declare fallback in skill body — no dead branches.

## 6. Build scope and distribution (decision 2026-07-29)

**Complete build once** — full: all 6 stages (Analysis mode) + Market-evidence mode (flows auto-activate when integrations present, full fallback) + all skills/agents/hooks/userConfig/state schema in section 4. No V1 lite.

**Distribute via git** (verified in plugins-reference):
- Git repo has plugin + `.claude-plugin/marketplace.json` (self-hosted marketplace) → user: `claude plugin marketplace add <owner>/<repo>` then `claude plugin install saas-validate@<marketplace>`; or quick test without install: `claude --plugin-dir` / `--plugin-url`.
- Marketplace-installed copied to plugin cache (`~/.claude/plugins/cache`), not in-place → all internal paths use `${CLAUDE_PLUGIN_ROOT}`; persistent data (state sample, cache) use `${CLAUDE_PLUGIN_DATA}` (survives update).
- **Version**: set `version` in plugin.json (semantic) to control user update timing; unset = each commit SHA is new version.
- Consider `defaultEnabled` and `userConfig` to prompt for optional API key on enable (sensitive → secure storage).

**Pre-publish meta-eval** (run after build, before finalize): (a) one idea through raw → MVP pack full Analysis-mode flow, artifacts meet each gate standard; (b) gatekeeper catches deliberate form errors; (c) all integrations disabled → flow still complete (verify optional guarantee); (d) cold-start test passes on output pack.
