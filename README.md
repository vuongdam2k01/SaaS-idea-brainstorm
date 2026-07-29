# saas-idea-brainstorm

**English** | [Tiếng Việt](README.vi.md)

A Claude Code and Codex CLI plugin that takes a raw SaaS idea and drives it to a locked MVP spec — framing, competitive scan, market validation, feasibility verification, positioning, scope lock — refusing to call anything validated that isn't.

The deliverable is an **MVP Pack**: a self-contained input contract for the build phase, labeled *Validated*, *Hypothesis*, or *Pre-feasibility Hypothesis* according to what was actually proven. It will often tell you your idea is unproven. A pipeline that always says "validated" is worth nothing.

Three rules make it work:

- **The model is never an evidence source.** Anything Claude writes is `[GUESS]`, grade D, until a real human or real data backs it. Ask it to "just fill in" some interview results and it will decline.
- **Thresholds are signed before tests run.** After the signing ceremony at gate F, changing one takes your explicit approval and a recorded revision.
- **A failed gate goes backwards.** Never forward on a broken assumption. Failing with a clear direction is a good outcome.

Repository: <https://github.com/vuongdam2k01/SaaS-idea-brainstorm> · MIT · v1.1.0

---

## Install

Two independent CLIs can run this plugin. Pick whichever you use.

**Claude Code**

```bash
/plugin marketplace add vuongdam2k01/SaaS-idea-brainstorm
```

```bash
/plugin install saas-idea-brainstorm@saas-idea-brainstorm
```

To try it from a clone instead, `/plugin marketplace add ./SaaS-idea-brainstorm` then install the same way, or skip installing entirely with `claude --plugin-dir /path/to/SaaS-idea-brainstorm`.

**Codex CLI**

```bash
npx codex-marketplace add vuongdam2k01/SaaS-idea-brainstorm
```

For local testing, add the cloned folder under `~/.codex/plugins/` and reference it from `~/.agents/plugins/marketplace.json`, then restart. Skills and hooks run unmodified across both CLIs; the four research/audit agents ship as `.codex/agents/*.toml` for Codex. Whether a given Codex build auto-discovers agents bundled inside an installed plugin isn't guaranteed by its docs — if a fan-out step in stage 1, 2, or 5 can't find them, copy `.codex/agents/*.toml` into your project's own `.codex/agents/` once. The Codex path hasn't had the dogfood mileage the Claude Code build has (5 review rounds, 2 dogfood runs — see [codex-review.md](plugin/codex-review.md)); platform differences worth knowing before you rely on it are in [plugin/codex-parity.md](plugin/codex-parity.md).

Start the CLI in the repo where you want your idea workspaces to live — artifacts are written to `ideas/<slug>/` relative to the working directory, never inside the plugin. Node.js on PATH is worth having: it powers three hooks and the state writer. Without it they fail open with a visible notice and nothing else breaks; no skill depends on them.

---

## Run it

```bash
/saas-idea-brainstorm:new-idea A tool that turns messy support transcripts into a weekly product-issue digest
```

That creates `ideas/support-digest/` — `state.json`, `idea-brief.md` holding your raw idea verbatim and immutable, an append-only `decision-log.md`, a `founder-charter.md`, and a self-protecting `private/` folder — asks you two setup questions (stop at every gate or auto-continue; audit integrations now or later), and starts stage 0 with you. It doesn't explain the pipeline first; the pipeline explains itself by working.

Then:

```bash
/saas-idea-brainstorm:status
```

```bash
/saas-idea-brainstorm:gate-check support-digest V1
```

A full run isn't one sitting. It's a series of sessions with real work in between — interviews, mining, a technical spike. The files are the memory; chat isn't.

| Command | Arguments | What it does |
|---|---|---|
| `new-idea` | `[raw idea]` | Creates the workspace, starts framing. Vague is fine — clarifying it *is* the job |
| `status` | `[slug]` optional | Current task, gate states, signed thresholds, kill-criteria deadlines, what's waiting on you, budget, and the one highest-leverage next action |
| `gate-check` | `[slug] [gate]` | Formal contract checks → adversarial gatekeeper → your approval |
| `setup-audit` | `[slug]` optional | Probes which optional integrations actually work, records the capability profile |
| `switch-mode` | `[slug] [analysis\|market-evidence]` | Moves an idea between modes, with precondition checks and journaling |

All commands are namespaced `/saas-idea-brainstorm:`. Gates: `F`, `C`, `V1`, `V2`, `V3`, `R1`, `R2`, `P`, `LOCK` — omit it and it's inferred from state.

Six stage skills (`stage-0-framing` … `stage-5-scope-lock`) activate on their own as the idea progresses; you never call them. A seventh, `method-rules`, is the constitution: loaded by everything, invocable by nobody.

---

## The pipeline

```
Stage 0 Framing ──F──> Stage 1 Competitive ──C──> Stage 2 Validate (V1 → V2 → V3)
                                                        ∥ (parallel)
                                                  Stage 3 Verify (R1, R2)
                                    ──> Stage 4 Positioning ──P──> Stage 5 Scope Lock ──> MVP Pack
```

It's a DAG, not a queue. Stage 1 begins right after task 0.1. Stage 3 runs alongside stage 2 whenever feasibility is a deadly assumption — always true for AI-core products, because if the model can't hit the required quality, every hour spent validating that direction is wasted.

| Gate | The question | Needs first | Can stay open? |
|---|---|---|---|
| **F** | Falsifiable hypotheses, signed thresholds, kill criteria? | — | No |
| **C** | Do we know the real field — five tiers, including DIY and do-nothing? | F | No |
| **V1** | Is the problem real and painful, proven by past behavior on a pre-registered neutral sampling frame? | C | No |
| **V2** | Does one solution direction win, with a nameable value layer and a behavioral signal? | V1 | Yes (analysis mode) |
| **V3** | Will people pay — real money, outside your personal network? | V2 | Yes (analysis mode) |
| **R1** | Can we build it at the required quality, marginal cost under price? | F | Yes → pack drops to **Pre-feasibility** |
| **R2** | Does the delivered thing produce the promised outcome, with unprompted return? | R1, V3 | Yes (analysis mode) |
| **P** | Is positioning traced to customer words and survived a copy test? | V1, V3, R1, R2 resolved | No (labeled a thesis) |
| **LOCK** | Is the scope self-contained enough for a fresh session to build from? | V2, V3, R1, R2, P resolved | No |

Every gate check runs three layers. **Formal**: prerequisites hold, artifacts exist at acceptable statuses, thresholds were signed before the evidence dates and still match the signed snapshot, grades are strictly A/B/C/D, no grade-D item counted, claims trace to evidence ids, the metric used the pre-registered denominator. **Adversarial**: the `gatekeeper` agent reads everything with fresh eyes and tries to fail the gate — findings reported verbatim, ranked, unsoftened. **Decision**: you approve, and the verdict lands in `decision-log.md`.

The full contracts — required artifacts per gate, statuses, exact metrics — live in `skills/method-rules/gate-contracts.md`. That file is the law; skills are instructed not to improvise around it.

---

## Evidence

Four grades, no modifiers. `A-` and `B+` would make gate floors incomparable; nuance goes into separate ledger fields.

| Grade | Meaning | Examples |
|---|---|---|
| **A** | Real money or real interactive commitment | Payment, pre-order, signed pilot, answered outreach interview |
| **B** | Real human words or behavior, non-interactive | Mined community posts, 1–3★ reviews, survey answers, measured pilot outcomes |
| **C** | Anonymous measured behavior on real usage | Landing traffic, pricing clicks, A/B results, spike metrics on real customer data |
| **D** | Model-generated | Simulated interviews, personas, self-consistency checks |

Grade D never enters the ledger and never counts at a gate. One consequence worth stating plainly: an LLM judging another model's subjective output is grade D. For R1 to pass on subjective quality you need a human-labeled anchor set — the judge reaching roughly 75–90% agreement before its verdicts count as C — or a real-usage outcome from R2.

The final label is a predicate, not a vibe:

- **Validated MVP Pack** — every gate passed, V3 evidence grade A.
- **Hypothesis MVP Pack** — LOCK reached, R1 passed, at least one of V2/V3/R2 accepted-open.
- **Pre-feasibility Hypothesis Pack** — LOCK reached with R1 open. Feasibility itself unproven, said on line 1 of the pack.

An open gate is not a passed gate. It's an untested assumption, recorded honestly, shipped with a ready-to-run kit so you can close it later.

---

## Two modes

**Analysis (default)** needs no setup. The pipeline reaches scope lock with native tools and honest labeling of what stayed untested: V2, V3, R2 — and R1 when representative data is unobtainable — can be accepted-open with kits attached.

**Market-evidence (opt-in)** executes those kits for real: landing pages deployed, pre-sell links published, outreach sent, concierge delivery performed. This is what produces grade A and C evidence and turns open gates into passed ones.

```bash
/saas-idea-brainstorm:switch-mode support-digest market-evidence
```

Switching checks that the relevant kits exist and capabilities are fresh, shows the plan and expected cost, reopens affected gates, and journals the switch. Evidence already collected keeps its grade — real data doesn't expire when the mode changes.

Anything that leaves your machine or spends money — deploying, sending, publishing a payment link, ad spend, delivering pilot output — takes per-action approval, a budget preflight, and a journaled row afterward. `auto_continue` never covers outward actions.

### Integrations are optional

Each task runs at the best available rung: **enhanced-auto** (a verified integration does it) → **baseline-auto** (native tools) → **handoff** (you get a complete kit, execute it outside, bring results back) → **simulate** (grade D, hypothesis only). Missing integrations change the rung and the achievable grade — they never block the pipeline. The rung used is recorded on every artifact.

`setup-audit` probes for scraping MCP servers, a secondary LLM key, hosting CLIs, analytics, Stripe, and email sending. A capability counts as available only after an authenticated call actually succeeds — "the CLI is installed" or "I have an account" is recorded as `handoff-only` or `unknown`. Same evidence discipline as the idea itself.

One plugin setting: `ads_budget_cap_usd` (default `0`, disabling paid traffic) is a planning cap enforced by the pipeline's own budget preflight, not by ad platforms. It's copied into `state.budget.cap_usd` at `new-idea` and each audit.

---

## What ends up in your repo

```
ideas/support-digest/
├── state.json                    # index: mode, active tasks, gates, thresholds, kill criteria, capabilities, budget
├── idea-brief.md                 # raw idea verbatim + refined articulation + evolution log
├── founder-charter.md            # your intent, captured as it reveals itself; ships inside the pack
├── decision-log.md               # append-only: verdicts, pivots, revisions, spends
├── problem-hypothesis.md · lean-canvas.md · beachhead-icp.md
├── assumption-map.md             # deadly assumptions with Test Cards and thresholds
├── kill-criteria.md              # locked at the F signing ceremony
├── competitive-map.md · review-mining.md
├── evidence-ledger.md            # single source of truth for all evidence
├── solution-directions.md · interview-kit.md · landing-kit.md · presell-kit.md
├── spike/ · error-analysis/ · eval/ · promise-scope.md · concierge-kit.md
├── positioning.md                # locked at gate P
├── mvp-pack/                     # the deliverable — copies, not references
│   ├── mvp-spec.md · tech-design.md · definition-of-done.md
│   ├── carry-forward.md · evidence-quality-report.md
│   └── eval/ · experiments/{landing,presell,concierge}/
└── private/                      # its own .gitignore: *  and  !.gitignore
    ├── contacts.md               # P1, P2, … → real identities
    └── …                         # transcripts, snapshots, payment identities
```

Every markdown artifact carries frontmatter that a hook validates — `artifact`, `idea`, `stage`, `gate`, `status` (draft/ready/locked), `evidence_grade`, `rung`, `pipeline_version`, `updated`. The evidence ledger is one table where each row traces to a real human, with retrieval provenance so a later failed spot-check can distinguish "the source changed" from "this was fabricated":

```markdown
| id | date | source | type | url_or_ref | retrieved | via | verbatim_or_observation | assumption | grade | status |
|----|------|--------|------|-----------|-----------|-----|-------------------------|------------|-------|--------|
| E1 | 2026-07-29 | reddit u/… | community | https://… | 2026-07-29 | miner-run-3 | "exact quote" | A3 | B | confirms |
```

Artifacts are ground truth. `state.json` is only an index and can be rebuilt from them plus the decision log — if it's ever damaged, `status` offers to do exactly that.

### Privacy

Real names, contacts, and payment identities live only in `ideas/<slug>/private/`, created per idea with its own `.gitignore` (`*` plus `!.gitignore`) so protection doesn't depend on your repo's root config. Public artifacts use `P1`, `P2`, … mapped in `private/contacts.md`. Real customer data used by a spike needs a `data-manifest.md` row first. Still review a workspace before making it public.

---

## Agents and hooks

Four subagents run with fresh context so they can't inherit the main conversation's optimism:

- **competitor-scanner** maps five tiers — direct, indirect, DIY/spreadsheet, general AI tools, do-nothing — with a source URL per claim.
- **community-review-miner** pulls verbatim quotes with URLs against a pre-registered neutral sampling frame. Counting the people who show *no* workaround behavior is what makes the percentage mean anything. It never fabricates a quote.
- **gatekeeper** is paid to fail your gate. A gate that survives it deserves to pass.
- **coldstart-tester** plays a build session that has only the MVP pack and no history, and lists every question it would still have to ask. Empty list, pack passes.

Three Node hooks, all fail-open: `session-start.js` injects pipeline state for ideas in the workspace (walks up to the workspace root, local calendar dates, one corrupt state can't suppress the others); `guard-thresholds.js` catches semantic threshold edits — a partial edit changing `60` to `70` included — escalates on `locked` artifacts and enforces append-only on the decision log; `validate-artifact.js` checks frontmatter and blocks with a repair instruction. All three sentinel-check for a sibling `state.json` containing `pipeline_version`, so an unrelated repo with an `ideas/` folder is untouched.

Integrity doesn't depend on hooks running: `gate-check` recomputes the threshold snapshot against `decision-log.md` every time.

### The founder charter

Your intent shows up in choices, not in a one-time statement, so it gets the same discipline as evidence. Every decision against the model's recommendation, every veto, every threshold override is captured the moment it happens. Will is graded: `stated` (your words) > `confirmed` (inferred, played back, confirmed) > `[INFERRED]` (governs nothing). Only you remove the `[INFERRED]` tag — writing the charter from model preference instead of your signals is the intent-equivalent of fabricating evidence. At each gate approval the deltas since the last one are played back for correction. When you knowingly decide against the evidence, that's journaled as a `will-override` with the affected claims marked; you're allowed to bet against the market, the build phase just needs to know which bets are deliberate.

The charter ships inside the MVP pack as the interpretive authority for everything the spec doesn't answer.

---

## Without the plugin

The methodology also exists as plain documents. Create `ideas/<your-idea>/`, copy everything from `templates/` into it, and work through [process/pipeline.md](process/pipeline.md) starting from `0-framing.md`; gate states are tracked inside the template files. Same two conventions: thresholds before tests, evidence traces to real humans.

`process/` and `plugin/` are written in Vietnamese (`plugin/codex-parity.md` is the one exception); the plugin itself (`skills/`, `agents/`, `.codex/agents/`, `hooks/`) is English throughout, and it replies in whatever language you use.

---

## Layout and development

| Path | Contents |
|---|---|
| `.claude-plugin/` · `.codex-plugin/` | Plugin manifest, one per platform |
| `.agents/` | Codex's self-hosted marketplace registry |
| `skills/` | 12 skills — 5 commands, 6 stages, and `method-rules` with `state-schema.md`, `artifact-schema.md`, `gate-contracts.md`; three of the command skills carry a Codex `agents/openai.yaml` sidecar to keep them explicit-invocation-only there too |
| `agents/` · `.codex/agents/` · `hooks/` · `scripts/` | The four subagents, once as Claude Code markdown and once as Codex TOML; `hooks.json` (same file, both platforms) plus three Node scripts; the atomic state writer |
| `tests/` | `hook-tests.js` — hook regression suite |
| `process/` | The methodology (Vietnamese): pipeline, foundations, build-and-launch, research-verification |
| `plugin/` | Design documents (Vietnamese except `codex-parity.md`): spec, capability matrix, autonomy design, review record, dogfood report, Codex platform notes |
| `templates/` · `ideas/` | Manual-use templates; idea workspaces |

```bash
node tests/hook-tests.js
```

The suite covers every adversarial-review finding, including a proven partial-edit threshold bypass kept as a permanent regression test; each hook runs through its real stdin/stdout contract against temporary idea directories. `claude plugin validate . --strict` checks the manifest, and `claude --plugin-dir .` gives you an edit-and-rerun loop without reinstalling.

---

## When something goes wrong

**A write was blocked over frontmatter.** One of the nine keys is missing or a value is outside its enum; the message names the key.

**An edit to a signed threshold was blocked.** Working as intended. Signed thresholds move only through an approved revision recorded in `state.thresholds.revisions` and mirrored to the decision log — ask for the revision explicitly, with a reason.

**`state.json` won't parse.** Run `status`; it reports the damage and offers to rebuild from the artifacts. `state-write.js` also keeps a `.bak`.

**The gatekeeper keeps failing your gate.** Read the findings as data. The usual causes are real: evidence that traces to nothing, a metric computed on a convenient denominator instead of the pre-registered one, a grade-D item being counted, confidence language outrunning the grades. Fixing the artifact is the work — softening the gate isn't on offer.

**No real data, so R1 can't pass.** Accept it open. You get a feasibility-risk dossier and a data-acquisition plan, and the pack is labeled Pre-feasibility — honest, still useful, upgradeable the moment data arrives.

**A hook complains about `node`.** It's not on PATH. Hooks fail open; you lose the session summary and two guard checks, nothing else. `gate-check` verifies threshold integrity on its own regardless.

---

## Where the method comes from

Assembled and source-verified against primary sources rather than summaries: Steve Blank's Customer Development (earlyvangelist as a five-level hierarchy — only levels 4–5 qualify), Strategyzer's desirability/feasibility/viability assumption mapping, *The Mom Test*, Ash Maurya's Running Lean (10–15 interviews), April Dunford's positioning component order and her caveat that pre-product positioning is a thesis expected to be partly wrong, the JOLT Effect on "no decision" losses, and the LLM evaluation practice of Hamel Husain and Shreya Shankar (error-analysis first, ~100 traces with a stop rule — not "100 golden cases").

The audit trail is in the repo. `process/research-verification.md` records six research branches and the corrections applied, including two fabricated statistics that were found and removed. `plugin/codex-review.md` records four rounds of two-way adversarial review against an external model, roughly forty findings processed, every proven bypass turned into a permanent regression test. `plugin/dogfood-report.md` records the first real run — in which the gatekeeper correctly failed a gate.

MIT — see [LICENSE](LICENSE).
