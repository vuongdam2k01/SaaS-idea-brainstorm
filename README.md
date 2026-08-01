# saas-idea-brainstorm

**English** | [Tiếng Việt](README.vi.md)

A Claude Code and Codex CLI plugin that takes a raw SaaS idea and drives it all the way to **build-ready** — framing, competitive scan, market validation, feasibility verification, positioning, scope lock, and a full **implementation blueprint** — refusing to call anything validated that isn't. The pipeline doesn't end at LOCK: declared drift, on-demand reconciliation against product reality, and signed validation runs keep the locked idea honest while you build ([After LOCK](#after-lock-maintenance)).

The deliverable is two-layered. First the **MVP Pack** — a self-contained scope contract, labeled *Validated*, *Hypothesis*, or *Pre-feasibility Hypothesis* according to what was actually proven (it will often tell you your idea is unproven; a pipeline that always says "validated" is worth nothing). Then the **Implementation Blueprint** (stage 6, gate BP) — feature specs with error states and edge cases answered, field-level data schema, an **interaction map** (who wins when two features write one record, jobs for long-running work, global invariants), **subsystem specs** for the non-CRUD core (an LLM engine, a 3D renderer — capabilities, eval-bound acceptance, budgets, pinning), UX spec, API and integration contracts, NFRs, test plan, build plan — so that when code starts, there is no product decision left to invent.

Three rules make it work:

- **The model is never an evidence source.** Anything Claude writes is `[GUESS]`, grade D, until a real human or real data backs it. Ask it to "just fill in" some interview results and it will decline.
- **Thresholds are signed before tests run.** After the signing ceremony at gate F, changing one takes your explicit approval and a recorded revision.
- **A failed gate goes backwards.** Never forward on a broken assumption. Failing with a clear direction is a good outcome.

Repository: <https://github.com/vuongdam2k01/SaaS-idea-brainstorm> · MIT

---

## Install

**Claude Code**

```bash
/plugin marketplace add vuongdam2k01/SaaS-idea-brainstorm
```

```bash
/plugin install saas-idea-brainstorm@saas-idea-brainstorm
```

**Codex CLI**

```bash
npx codex-marketplace add vuongdam2k01/SaaS-idea-brainstorm
```

Every normative document (state schema, artifact schema, gate contracts, maintenance rules, and each stage's templates) ships as its own **loadable skill**, not as a file next to a skill. That is deliberate: a marketplace install lives in `~/.claude/plugins/cache/...`, outside the session's allowed directories, so anything a skill can only reach by reading a sibling path off disk is unreadable exactly when a real user installs it the documented way. No `--add-dir`, no permission widening, nothing to configure.

Skills and hooks run unmodified on both CLIs; the five research/audit agents ship as `.codex/agents/*.toml` for Codex. The agent bodies are kept byte-identical across both platforms by `scripts/sync-codex-agents.js --check`.

Start the CLI in the repo where you want your idea workspaces to live — artifacts are written to `ideas/<slug>/` relative to the working directory, never inside the plugin. Node.js on PATH powers three hooks and the state writer; without it they fail open with a visible notice and nothing else breaks.

---

## Run it

```bash
/saas-idea-brainstorm:new-idea A tool that turns messy support transcripts into a weekly product-issue digest
```

That creates `ideas/support-digest/` — `state.json`, `idea-brief.md` holding your raw idea verbatim and immutable, an append-only `decision-log.md`, a `founder-charter.md`, and a self-protecting `private/` folder — asks you two setup questions (stop at every gate or auto-continue; audit integrations now or later), and starts stage 0 with you.

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
| `declare-drift` | `[slug] [what changed]` | Post-LOCK: records "we shipped/changed/dropped/repriced X" as one append-only drift-inbox row — cheap, any time, no ceremony |
| `reconcile` | `[slug]` | Post-LOCK: resolves product reality from registered sources, consumes the drift inbox, publishes a new hashed current-baseline, signs validation-run specs |
| `run-validation` | `[slug] [run_id]` | Executes and adjudicates a signed validation run — the only path that moves a claim from `guess` to `supported` |
| `amend-blueprint` | `[slug] [what was discovered]` | Post-BP: records a mid-build spec defect/gap against the locked blueprint — founder-answered scope test, immutable `ba-NNN` amendment + append-only log; locked files never change |
| `spec` | `[id ...]` | Resolves any locked-spec id — `fs-03`, `AC-03-2`, `INV-1`, `ST-order-2`, `CAP-01-1`, `EV-2`, `DR-1`, `DOD-4` — to the file, section and text that **defines** it. Built from the artifacts on every call |
| `spec-gap` | `[what the code needs]` | Build-time triage when the spec seems silent, wrong, or self-contradicting: is it really absent, product or technical, in scope — then routes a real gap to `amend-blueprint` |
| `handoff-to-build` | `[slug] [separate build-repo path]` | Only for a build repo **separate** from the workspace: ships a hashed read-only copy plus `AGENTS.md`/`CLAUDE.md`, path-scoped rules and an id index, for a repo that may not have this plugin. Same repo? Nothing to run — the hooks and `spec` already cover it |

All commands are namespaced `/saas-idea-brainstorm:`. Gates: `F`, `C`, `V1`, `V2`, `V3`, `R1`, `R2`, `P`, `LOCK`, `BP` — omit it and it's inferred from state.

Seven stage skills (`stage-0-framing` … `stage-6-blueprint`) activate on their own as the idea progresses; you never call them. `method-rules` is the constitution — loaded by everything, invocable by nobody — with five normative satellites (`method-rules-{state-schema, artifact-schema, gate-contracts, gate-contracts-bp, maintenance-rules}`). Two of them stay outside the default bundle and are loaded only by the skills that need them: the maintenance rules by the post-LOCK skills, and gate BP's contract by stage-6 work, `amend-blueprint`, and a BP gate check. Context is the enforcement substrate, so no skill carries a contract it will never read.

---

## The pipeline

```
Stage 0 Framing ──F──> Stage 1 Competitive ──C──> Stage 2 Validate (V1 → V2 → V3)
                                                        ∥ (parallel)
                                                  Stage 3 Verify (R1, R2)
                                    ──> Stage 4 Positioning ──P──> Stage 5 Scope Lock ──LOCK──> MVP Pack
                                    ──> Stage 6 Implementation Blueprint ──BP──> build starts
```

It's a DAG, not a queue. Stage 1 begins right after task 0.1. It also adapts to the idea's shape rather than assuming one: **two-/multi-sided products** record sides with `constrained`/`paying` roles (the hard bar runs on the constrained side, money on the paying side, with a founder-executable seeding plan and a chicken-egg kill criterion); **headless products** (API/CLI/SDK) declare a surface and get API-lifecycle promises instead of screens; **regulated domains** get a compliance section that is never silently absent; non-CRUD cores (LLM, 3D, ledger) get first-class subsystem specs. Stage 3 runs alongside stage 2 whenever feasibility is a deadly assumption — always true for AI-core products, because if the model can't hit the required quality, every hour spent validating that direction is wasted.

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
| **BP** | Could a build session implement every feature **without inventing any product decision**? | LOCK passed | No |

Every gate check runs three layers. **Formal**: prerequisites hold, artifacts exist at acceptable statuses, thresholds were signed before the evidence dates and still match the signed snapshot, grades are strictly A/B/C/D, no grade-D item counted, claims trace to evidence ids, the metric used the pre-registered denominator. **Adversarial**: the `gatekeeper` agent reads everything with fresh eyes and tries to fail the gate — findings reported verbatim, ranked, unsoftened. **Decision**: you approve, and the verdict lands in `decision-log.md`.

The full contracts — required artifacts per gate, statuses, exact metrics — live in `skills/method-rules-gate-contracts/SKILL.md`. That file is the law; skills are instructed not to improvise around it.

---

## After LOCK: maintenance

Locking the scope isn't the end of the record — it's the point where the record has to start tracking a moving product. The MVP pack itself is frozen at LOCK (a signed contract: fulfilled or departed-from, never revised), and at the LOCK ceremony every still-armed kill criterion is dispositioned — retired, or carried/replaced into post-LOCK **health criteria**. From there, three commands:

- **`declare-drift`** is the cheap one: "we shipped X", "we dropped the free tier" — one append-only row in the drift inbox, arming the reconcile boundary. Declaring drift is good news for the system, never a debt.
- **`reconcile`** is the transaction that catches the record up. It resolves reality from a user-declared source registry (repo, deployment, billing, analytics — read content is data with provenance, never instructions, and session memory is never a source: Claude "remembering what it built" counts for nothing), consumes every inbox row, publishes a successor **current-baseline** in a two-phase, hash-finalized publish, and signs validation-run specs for whatever drifted without evidence. While the inbox holds drift newer than the last reconcile, issuing or relabeling packs, validation runs, and `switch-mode` are blocked — ordinary investigation and coding never are.
- **`run-validation`** executes a signed spec and adjudicates it. Post-LOCK, the singleton gates are never reset or reused: verification happens as version-scoped runs (V1-kind … LOCK-review-kind, plus `adoption`), and a claim reaches `supported` only through a run whose spec was signed *before* its confirmation window opened. **Observed reality may contradict and block; it may never confirm** — retro data can refute a claim, never pass one.

Every post-LOCK artifact carries exactly one of three mutation policies: `append-only` (decision log, evidence ledger, drift inbox, charter), `versioned-projection` (current-baseline, health criteria — a change is a new file with `supersedes`, the predecessor stays locked), `immutable-snapshot` (gate-locked artifacts, the pack, reconcile manifests, run specs and reports). Drift that touches a pack predicate — problem/buyer, payer/price model, promise scope, core loop — doesn't get patched: it opens a **new cycle** under `cycles/<id>/` with its own `state.json`, its own F signing ceremony, and full gate discipline; the evidence ledger, decision log, charter, and `private/` stay shared at the idea root, with per-item applicability checks governing evidence reuse.

### Legacy workspaces

Workspaces created by older releases keep working, under one standing rule: **read-compatible, migrate-on-write, no retroactive fails.** Retired vocabulary on an existing artifact — old rung values, the evidence ledger's old column names, the old prospect-table shape — draws a warning or a migration instruction on its next touch, never a hard error, and never fails a gate the workspace had already passed. Writing is stricter than reading: `state-write.js` accepts only the current schema, so a legacy state sits on disk untouched until first written, is migrated then, and the old shape is never written back — a downgrade write would bypass the locked-cycle freeze. An idea operating in its root cycle, or one that never reaches LOCK, never meets the maintenance machinery at all.

---

## Evidence

Four grades, no modifiers — `A-` and `B+` would make gate floors incomparable.

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

Each task runs at the best available rung — there are exactly three: **enhanced-auto** (a verified integration does it) → **baseline-auto** (native tools) → **handoff** (you get a complete kit, execute it outside, bring results back). Missing integrations change the rung and the achievable grade — they never block the pipeline. The rung used is recorded on every artifact. There is deliberately no "simulate" rung: simulated material is grade D / `[GUESS]`, which never counts toward a gate, so when evidence cannot be obtained the honest outcome is a handoff or an accepted-open gate — never a simulated completion.

`setup-audit` probes for scraping MCP servers, a secondary LLM key, hosting CLIs, analytics, Stripe, and email sending. A capability counts as available only after an authenticated call actually succeeds — "the CLI is installed" or "I have an account" is recorded as `unavailable`/`unknown` with rung `handoff`. Same evidence discipline as the idea itself.

One plugin setting: `ads_budget_cap_usd` (default `0`, disabling paid traffic) is a planning cap enforced by the pipeline's own budget preflight, not by ad platforms. It's copied into `state.budget.cap_usd` at `new-idea` and each audit.

---

## What ends up in your repo

```
ideas/support-digest/
├── state.json                    # index: mode, active tasks, gates, thresholds, kill criteria, capabilities, budget
├── idea-brief.md                 # raw idea verbatim + refined articulation + evolution log
├── founder-charter.md            # your intent, captured as it reveals itself; ships inside the pack
├── decision-log.md               # append-only: verdicts, pivots, revisions, spends
├── audit-trail.md                # append-only: redacted gatekeeper findings, so a clone keeps the reasoning
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
│   ├── carry-forward.md · evidence-quality-report.md · audit-trail.md
│   └── eval/ · experiments/{landing,presell,concierge}/
├── blueprint/                    # stage 6 (gate BP): the implementation layer — the pack stays read-only
│   ├── blueprint-overview.md · feature-specs/fs-NN-*.md
│   ├── data-schema.md · ux-spec.md · api-contract.md · integration-specs.md
│   ├── nfr-spec.md · test-plan.md · build-plan.md
│   ├── interaction-map.md · subsystem-specs/ss-NN-*.md   # only when the product needs them
│   ├── coldstart-l2-<date>-NN.md                         # persisted level-2 runs, hash-verified
│   ├── amendment-log.md · amendments/ba-NNN-*.md         # build-time truth: locked blueprint + amendments
│   └── deferred-register.md                              # append-only, non-product items only
├── drift-inbox.md · health-criteria-vN.md · current-baseline-vN.md    # post-LOCK: append-only inbox + versioned projections
├── reconcile/<r-id>/ · validation-runs/                               # hashed reconcile transactions · signed run specs + reports
├── cycles/C2/                    # a new cycle mirrors this layout with its own state.json and gates
└── private/                      # its own .gitignore: *  and  !.gitignore
    ├── contacts.md               # P1, P2, … → real identities
    └── …                         # transcripts, snapshots, payment identities
```

### Where the code gets written

Passing BP proves a fresh session *could* implement from the spec set. Something still has to make that session **aware the set exists** instead of inferring the product from the file tree. In the repo that holds `ideas/<slug>/` — the usual case, since you brainstorm and build in the same project — the plugin does that itself, with nothing generated and nothing to keep in sync:

| already running | what it does |
|---|---|
| `session-start.js` | injects the standing build contract every session, and again after a compaction, whenever a blueprint is locked: the two layers, amendment-log-first, and the line between product decisions (already made) and technical ones (yours) |
| `spec-awareness.js` (PostToolUse on `Read`) | the first time a session opens a spec file, injects the anchor mechanism, the id vocabulary, "read-only", and where a defect goes — once per session, path-scoped so it never fires on ordinary reads |
| `guard-thresholds.js` (PreToolUse) | blocks an edit to a locked artifact and names `amend-blueprint` |
| `/saas-idea-brainstorm:spec <id>` | resolves `fs-03`, `AC-03-2`, `INV-1`, `ST-order-2`, `CAP-01-1`, `EV-2`, `DR-1`, `DOD-4` … to the file, section and text that **defines** it — built from the artifacts on every call, so an amendment is live the moment it is written |
| `/saas-idea-brainstorm:spec-gap` | triages a suspected gap — is it really absent, is it product or technical, is it in scope — and routes a real one to `amend-blueprint` |

**Only when the code lives in a separate repository** is anything generated. `handoff-to-build` ships that repo a hashed read-only `docs/product/` copy plus `AGENTS.md` (the open standard — Codex, Cursor, Copilot, Zed…), `CLAUDE.md` importing it, path-scoped `.claude/rules/product-spec/`, `/product-spec` + `/product-spec-gap`, and a SessionStart hook that verifies the copy against its source. It exists because that repo may not have this plugin at all, and there files are the only carrier. It must be regenerated after every amendment — `--check` reports staleness in either direction and is cheap enough for CI — which is the standing cost of the two-repo shape, and a good reason to prefer one repo when there is a choice. Targeting the workspace repo itself is refused: a copy inside the tree the guard hooks protect would be a freely editable twin of a frozen file.

Neither path prescribes how to build — no architecture, no stack, no workflow beyond what the locked specs decide — and neither paraphrases a spec, so neither can drift from the artifacts.
Pipeline artifacts carry frontmatter that a hook validates — `artifact`, `idea`, `stage`, `gate`, `status` (draft/ready/locked), `evidence_grade`, `rung`, `pipeline_version`, `updated`. Post-LOCK maintenance artifacts declare `phase: maintenance` and validate under their own key set instead (`artifact_kind`, `mutation_policy`, `publication_status`, `cycle_id`, `as_of`, …); the pairing of kind and mutation policy is enforced. The journals are exempt by design and carry none: `decision-log.md`, `audit-trail.md`, `post-mortem.md`, the per-idea `README.md`, everything under `private/`, and `error-analysis/batch-NNN.md` worker traces. The evidence ledger is one table where each row traces to a real human, with retrieval provenance so a later failed spot-check can distinguish "the source changed" from "this was fabricated":

```markdown
| id | date | source | root_source_id | type | url_or_ref | retrieved | via | verbatim_or_observation | assumption | grade | bearing | scope_limits | relationship | supersedes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E1 | 2026-07-29 | reddit u/… | RS-thread-1f2a | community | https://… | 2026-07-29 | miner-run-3 | "exact quote" | A3 | B | supports | 1 user, US, 2025 | — | — |
```

Artifacts are ground truth. `state.json` is only an index and can be rebuilt from them plus the decision log — if it's ever damaged, `status` offers to do exactly that.

### Privacy

Real names, contacts, and payment identities live only in `ideas/<slug>/private/`, created per idea with its own `.gitignore` (`*` plus `!.gitignore`) so protection doesn't depend on your repo's root config. Public artifacts use `P1`, `P2`, … mapped in `private/contacts.md`. Real customer data used by a spike needs a `data-manifest.md` row first. Still review a workspace before making it public.

---

## Agents and hooks

Five subagents run with fresh context so they can't inherit the main conversation's optimism:

- **competitor-scanner** maps five tiers — direct, indirect, DIY/spreadsheet, general AI tools, do-nothing — with a source URL per claim.
- **community-review-miner** pulls verbatim quotes with URLs against a pre-registered neutral sampling frame. Counting the people who show *no* workaround behavior is what makes the percentage mean anything. It never fabricates a quote.
- **gatekeeper** is paid to fail your gate. A gate that survives it deserves to pass.
- **coldstart-tester** plays a build session that has only the MVP pack and no history, and lists every question it would still have to ask. Empty list, pack passes.
- **blueprint-coldstart-tester** holds stage 6's harder bar: reading only pack + blueprint, it lists every *product decision* it would still have to invent — error copy, field limits, webhook retries, permission boundaries. Empty list, blueprint passes.

Four Node hooks, all fail-open: `session-start.js` injects pipeline state for ideas in the workspace, plus the standing build contract once a blueprint is locked; `spec-awareness.js` fires on the first spec file a session reads and injects the anchor mechanism, the id vocabulary and the routing for a defect (path-scoped, once per session); `guard-thresholds.js` catches semantic threshold edits — a partial edit changing `60` to `70` included — escalates on `locked` artifacts and enforces append-only on the decision log; `validate-artifact.js` checks frontmatter and blocks with a repair instruction. All four sentinel-check for a sibling `state.json` containing `pipeline_version`, so an unrelated repo with an `ideas/` folder is untouched.

Integrity doesn't depend on hooks running: `gate-check` recomputes the threshold snapshot against `decision-log.md` every time.

### The founder charter

Your intent shows up in choices, not in a one-time statement, so it gets the same discipline as evidence. Every decision against the model's recommendation, every veto, every threshold override is captured the moment it happens. Will is graded: `stated` (your words) > `confirmed` (inferred, played back, confirmed) > `[INFERRED]` (governs nothing). Only you remove the `[INFERRED]` tag — writing the charter from model preference instead of your signals is the intent-equivalent of fabricating evidence. At each gate approval the deltas since the last one are played back for correction. When you knowingly decide against the evidence, that's journaled as a `will-override` with the affected claims marked; you're allowed to bet against the market, the build phase just needs to know which bets are deliberate.

The charter ships inside the MVP pack as the interpretive authority for everything the spec doesn't answer.

---

## Without the plugin

The methodology also exists as plain documents. Create `ideas/<your-idea>/`, copy everything from `templates/` into it, and work through [process/pipeline.md](process/pipeline.md) starting from `0-framing.md`; gate states are tracked inside the template files. Same two conventions: thresholds before tests, evidence traces to real humans.

`process/` is written in Vietnamese; the plugin itself (`skills/`, `agents/`, `hooks/`) is English throughout, and it replies in whatever language you use.

---

## Layout and development

| Path | Contents |
|---|---|
| `.claude-plugin/` · `.codex-plugin/` · `.agents/` | Plugin manifest, one per platform, plus the marketplace descriptors both CLIs install from |
| `skills/` | The skills — commands (`new-idea`, `status`, `gate-check`, `setup-audit`, `switch-mode`; post-LOCK `declare-drift`, `reconcile`, `run-validation`; post-BP `amend-blueprint`, `spec`, `spec-gap`, `handoff-to-build`), 7 stages plus their template skills, and `method-rules` with its five normative satellites. **Normative source**: if any other doc disagrees with a skill, the skill wins |
| `agents/` · `.codex/agents/` · `hooks/` · `scripts/` | The five subagents, once as Claude Code markdown and once as Codex TOML (`sync-codex-agents.js --check` keeps them identical); `hooks.json` (same file, both platforms) plus four hook scripts; the validators (`validate-evidence-ledger`, `validate-beachhead`, `verify-threshold-snapshot`, `validate-run-contract`, `pack-verdict`, `artifact-manifest`), the atomic state writer, `spec-lookup.js` and its shared `lib/spec-index.js` (id resolution, one vocabulary), `build-handoff.js` (the separate-repo generator), `coverage-report.js`, and `preflight.js` |
| `tests/` | `hook-tests.js` + `pipeline-contract-tests.js` — the regression suites (first case: `node --check` on every shipped `.js`) |
| `evals/` | **Dev-only.** Seeded-defect fixtures + graders measuring the gatekeeper's catch rate on interpretation-layer failures (`run-gatekeeper-eval.js`). Fixture generator writes to the OS temp dir, never into a repo |
| `process/` | The methodology (Vietnamese): pipeline, foundations, build-and-launch, research-verification. Explanatory — skills win on conflict |
| `CHANGELOG.md` | The release record |
| `templates/` · `ideas/` | Manual-use templates (rendering of the template skills), plus `templates/handoff/` — the only templates written for the repo the code lives in rather than for a pipeline artifact; idea workspaces |

```bash
node scripts/preflight.js
```

One command, four checks: syntax-sweep every shipped `.js`, both test suites, and Codex agent parity. Run it after any bulk edit and before any commit. The suites cover the mechanisms the gates lean on — frontmatter and state validation, the threshold guard against partial and semantic edits, the evidence-ledger and blueprint validators, the handoff generator, and the parity between each hand-kept vocabulary and its second declaration.

---

## When something goes wrong

**A repair was demanded over frontmatter.** One of the nine keys is missing or a value is outside its enum; the message names the key. The check runs *after* the write (`PostToolUse`), so the file is already on disk — the hook asks for it to be fixed rather than preventing it, and the fix is immediate.

**An edit to a signed threshold was blocked.** Working as intended. Signed thresholds move only through an approved revision recorded in `state.thresholds.revisions` and mirrored to the decision log — ask for the revision explicitly, with a reason.

**`state.json` won't parse.** Run `status`; it reports the damage and offers to rebuild from the artifacts. `state-write.js` also keeps a `.bak`.

**The gatekeeper keeps failing your gate.** Read the findings as data. The usual causes are real: evidence that traces to nothing, a metric computed on a convenient denominator instead of the pre-registered one, a grade-D item being counted, confidence language outrunning the grades. Fixing the artifact is the work — softening the gate isn't on offer.

**A pack action, validation run, or mode switch was refused over undeclared drift.** The drift inbox holds rows newer than the last reconcile — the boundary is an exact sequence comparison, not a clock. Run `reconcile` to consume the inbox, then retry. Investigation and coding were never blocked.

**No real data, so R1 can't pass.** Accept it open. You get a feasibility-risk dossier and a data-acquisition plan, and the pack is labeled Pre-feasibility — honest, still useful, upgradeable the moment data arrives.

**A hook complains about `node`.** It's not on PATH. Hooks fail open; you lose the session summary and two guard checks, nothing else. `gate-check` verifies threshold integrity on its own regardless.

**On Codex, a fan-out step can't find the research agents.** Copy `.codex/agents/*.toml` into your project's own `.codex/agents/` once.

---

## Where the method comes from

Assembled and source-verified against primary sources rather than summaries: Steve Blank's Customer Development (earlyvangelist as a five-level hierarchy — only levels 4–5 qualify), Strategyzer's desirability/feasibility/viability assumption mapping, *The Mom Test*, Ash Maurya's Running Lean (10–15 interviews), April Dunford's positioning component order and her caveat that pre-product positioning is a thesis expected to be partly wrong, the JOLT Effect on "no decision" losses, and the LLM evaluation practice of Hamel Husain and Shreya Shankar (error-analysis first, ~100 traces with a stop rule — not "100 golden cases").

`process/research-verification.md` records, claim by claim, which numbers were verified against a primary source and which were removed for lacking one. The plugin holds itself to the standard it holds you to: a figure nobody can trace does not get to sit in the method.

MIT — see [LICENSE](LICENSE).
