# Changelog

## v1.14.0 — 2026-08-03 · subtraction pass: the moratorium gets a number, four restatements become one

The founder's observed complaint (2026-08-03), not a hypothetical: the plugin escalates minor issues
into heavyweight, uniformly-applied machinery, and its own growth-control rule (method-rules §14, the
requirement moratorium adopted v1.7.0) had never actually been invoked on its "(b) removes an existing
requirement of at least equal weight" clause across seven releases (v1.8.0–v1.13.0) — every one of them
cited only clause (a), and `coverage-report.js` itself listed `requirement-moratorium` as tier `prose`:
"nothing checks it". This release does not add process; it acts on what the moratorium already claims
to require, and cites two genuine over-restatements found in a full read of the six `method-rules-*`
skills as the "(b)" subtraction.

- **The "designed vs exercised" ratio is now a tracked number, not just a phrase.** `scripts/
  coverage-history.json` (new) records one snapshot per release — `{version, date, total,
  deterministic}` — and `scripts/coverage-report.js` gains a `growth_since_last_snapshot` field
  (`--json`) and a printed `GROWTH since vX.Y.Z` line comparing the current requirement count to the
  last snapshot, plus a `--snapshot` subcommand that appends the current count for the version in
  `plugin.json` (refuses to duplicate an already-recorded version). This does **not** mechanically
  verify that a new requirement's cited observed failure is honest — that stays a human/model
  judgement, and `requirement-moratorium` stays tier `prose` for exactly that reason. What it does is
  make the count itself impossible to lose track of without reading CHANGELOG.md by hand, which is how
  this session found the seven-release gap in the first place. New requirement
  `requirement-count-growth-tracked` (tier `code`) is the one addition in this release; it is the
  moratorium's own enforcement, so it pays for itself.
- **Four restatements of the will-override / V1-deferral distinction collapse to one.** The full
  explanation ("a will-override presupposes a gate that was formally checked and FAILED; V1-deferral is
  for a gate never attempted at all...") was written out in full in `method-rules-gate-contracts`
  (twice, in its own two sections), `method-rules-state-schema`, and `method-rules-artifact-schema`.
  Three of the four now cross-reference `method-rules-gate-contracts`'s "Will-override boundary"
  section, the one place that keeps the full text; no unique content (e.g. artifact-schema's "Owner:"
  line) was cut. Same treatment for the `simulate`/`handoff-only` rung-removal rationale, restated in
  full in both `method-rules` §8 and `method-rules-artifact-schema`'s rung section — `method-rules` §8
  now states the fact and points to the canonical rationale instead of repeating it. ~450 words removed,
  zero rules changed.
- **Explicitly out of scope for this release, and why:** an Explore-agent audit of all six
  `method-rules-*` skills, run this session, found the six-way file split load-bearing (skills
  cross-reference each other by exact name; each file's core content is genuinely distinct reference
  material) — merging them was considered and rejected, not skipped. Retuning the gatekeeper's 25-item
  checklist to apply less scrutiny at low-stakes gates (F/C) was also considered and rejected for this
  release: method-rules §14 itself requires an observed failure or an equal-weight removal before a
  requirement changes, and "gate F doesn't need the full checklist" is a design argument, not an
  observation — exactly the thing §14 exists to refuse. It needs real dogfood-run evidence of where the
  checklist spends effort without catching anything, which the pipeline does not yet have (`ideas/` is
  currently empty; the three prior dogfood runs never reached this deep into the pipeline).

- **Codex cross-review (`codex exec review --uncommitted`) caught a real data-loss bug before it
  shipped**: `loadHistory()`'s first draft swallowed every read error — a missing file AND a corrupt
  one — into an empty array, which meant a malformed `coverage-history.json` (a bad merge, an
  interrupted write) would make `--snapshot` believe no prior history existed and overwrite the file
  with a single entry, destroying every earlier release's snapshot. Fixed: only `ENOENT` is treated as
  "no history yet"; any other read/parse error now aborts loudly instead of being silently absorbed.

Tests: **+20** contract-test assertions covering the mechanisms above (grand total reported by the
suite at release time), 0 failures.

The full working record (design rounds, adversarial review transcripts, dogfood run reports, the
multi-session conflict inventory and its resolution log) was development residue and has been removed
from the working tree — it remains recoverable in git history at commit `fd7732b` and earlier
(`git show fd7732b:plugin/conflicts-inventory.md`, etc.).

## v1.13.0 — 2026-08-02 · status stops lying by omission; stale state stops going unnoticed

Patch 3 of the 3-patch series (see v1.11.0, v1.12.0) — the last one. The founder's other two
observed pains from actually running the pipeline: **`waiting_on` and gate state going stale or
inconsistent with reality** (a kill criterion left `status: "triggered"` long after a decision-log
row had plainly resolved it; entries sitting in `waiting_on` that no longer matched what the
artifacts showed), and **`status` conflating four different things into one number** — "work done",
"gates formally passed", "evidence strength", and "ready to build" — so a founder reading the output
could not tell which of those it was actually reporting, and it sometimes did not match what the
artifacts on disk showed at all.

- **`scripts/detect-stale-criteria.js`** (new) — any `kill_criteria`/`health_criteria` entry still
  `status: "triggered"` that a later `decision-log.md` row plainly resolves (names the criterion id,
  or is a `criterion-disposition` row) is a finding with a proposed patch (`cleared` or `retired`,
  per what the resolving row implies). Reads only `state.json` + `decision-log.md` — **never session
  memory** (method-rules §1, stated as a comment in the script itself). Wired into `status` (kill
  -criteria reporting) and `gate-check` Layer 0 (before any ceremony); findings are surfaced for
  confirmation and a patch is applied — if at all — only via `state-write.js` on the user's explicit
  confirmation, never automatically (same posture this plugin already uses for privacy-duty
  disposal).
- **`scripts/reconcile-pre-lock.js`** (new) — the pre-LOCK-scoped, lighter counterpart to the
  existing post-LOCK-only `reconcile` skill (it is not a duplicate: no locked baseline, no claim
  register, no two-phase publish exists before LOCK, so this only checks `waiting_on[]` entries that
  look satisfiable, a real pending founder decision with no `waiting_on` entry, and — new since
  Patch 2 — a `post_launch_validation` register item that leaked into `waiting_on` before the MVP
  release was declared). Refuses to run once any cycle has reached LOCK (the mirror of `reconcile`'s
  own "no cycle has reached LOCK yet" guard). Deterministic divergences get a proposed patch;
  judgment calls that require reading artifact prose are surfaced as open questions only. New
  decision-log `type: "pre-lock-reconcile"` (`method-rules-artifact-schema`). Wired into `status` and
  `gate-check` Layer 0 as the first mechanical step.
- **`status` reports four separate metrics instead of one conflated "Gates" line**: work completion %
  (artifact status counts for the active stage, deterministic arithmetic), formal gate compliance
  (counts by status including `pass_with_deviation`/`deferred`), evidence confidence (ledger grade
  histogram + `V3.evidence_grade_observed`, reported together rather than averaged into a false
  precision), and build readiness (LOCK/BP/blueprint synthesis, folded in rather than duplicated).
  The old ambiguous "accepted-open" line is replaced with six explicit per-gate fields —
  `analysis_complete`, `gate_passed`, `risk_accepted`, `validation_deferred`, `revisit_phase`,
  `blocks_current_phase` — computed from fields Patches 1–2 already added, no further schema change.
  **`scripts/status-metrics.js`** (new) computes the two purely-arithmetic metrics so `status` stays
  a thin reporting layer; **`scripts/validate-evidence-ledger.js`** gains a `--summary` flag (grade
  histogram) rather than a second validator.
- **`method-rules` gains §15 "Auto-continue & execution policy"**: `auto_continue` proceeds within a
  stage and across non-blocked stage transitions, and stops only for a named non-skippable ceremony
  (F-signing / LOCK-charter / the FAIL override sub-ceremony / V1-deferral — cross-referenced by
  name), any outward action (§7), an unrecoverable tool failure, a safety/legal constraint, or a
  kill/health-criterion trigger — and never suppresses *surfacing* a non-blocking finding, only the
  confirmation gate on something already blocking. `gate-check`'s scattered "auto_continue never
  covers it" asides are consolidated into a single cross-reference to §15. Drive-by fix: method-rules
  had two sections both numbered "## 12." (a numbering bug, not two legal ids) — the duplicate
  `Language` section is renumbered `## 16.` so the new policy section can be `## 15.` in sequence.
- `hooks/scripts/session-start.js` lines are now tagged `[BLOCKING]` / `[ACTION_REQUIRED_LATER]` /
  `[INFORMATIONAL]` (labeling only — this hook has never blocked anything, since SessionStart output
  carries no `permissionDecision`; every emitted line is `[INFORMATIONAL]` or
  `[ACTION_REQUIRED_LATER]`, never `[BLOCKING]`, and the header comment now says so explicitly).
  `hooks/scripts/guard-thresholds.js` gains a comment (mirrored in §15) identifying its `ask()` calls
  as the one place in the hook layer that gates a tool call itself before it runs — everything else
  informs or corrects after the fact.
- `scripts/coverage-report.js` gains 7 entries for the mechanisms above.

Tests: **440** contract tests, 198 hook tests, 0 failures.

## v1.12.0 — 2026-08-02 · V1 gets a deferred/hypothesis track instead of an endless pre-build loop

Patch 2 of the 3-patch series (see v1.11.0). The founder's actual intended flow on some ideas is
passive research → analysis → spike → positioning → scope lock → blueprint → **build MVP** →
controlled release → **then** real human validation — but V1 (problem-evidence) was, by design, the
one validation gate with no accepted-open path (unlike V2/V3/R2). With no honest way to record "defer
this to post-launch", the pipeline's only two options were: force another pre-build research round the
founder had already decided not to run, or let a pack that never collected real problem evidence read
as if it had. Neither is acceptable, and the second is the more dangerous failure — a silently
mislabeled pack undermines the entire point of graded evidence.

- **`gates.V1.status` gains `deferred`** (`schema_version` 1.4.0 → 1.5.0), **legal only for V1** —
  parallel to how `open` is gate-specific, and enforced in code (`state-write.js` rejects `deferred`
  on any other gate), not just prose. Requires `{deferred_reopen_on, deferred_date, register_ref}`;
  `deferred_reopen_on` is the founder's own wording, never auto-generated (offered three example
  categories as prompts: new contradictory evidence / founder explicitly reopens / a hard
  safety-or-legal conflict). Set only by `gate-check`'s new Layer-0 **`--ceremony=defer`** invocation
  — structurally parallel to the F-signing and LOCK-charter ceremonies, never `auto_continue`-skippable,
  ceremony-only (returns to the caller, never falls into Layer 1).
- **`scripts/pack-verdict.js` gains a 4th verdict tier**, checked before the pre-existing three:
  `gates.V1.status === "deferred"` → `FOUNDER-AUTHORIZED HYPOTHESIS TRACK`, regardless of how
  V2/V3/R1/R2 resolve — never `VALIDATED`, never plain `HYPOTHESIS`. `deferred` is its own bucket,
  never folded into the `resolved()` helper's true/false, so it can never be silently treated as
  either a `passed` or an `open` gate. The pre-existing three-tier logic is unchanged for any state
  that never sets `deferred` (fixtures assert this explicitly).
- **Kept structurally distinct from `will-override`, on purpose.** A will-override is for a gate that
  was formally checked and FAILED; V1-deferral is for a gate **never attempted at all**, by explicit
  founder choice, with named reopen conditions. Different decision-log `type` (`founder-decision`,
  reusing Patch 1's primitive — not `will-override`), different artifact
  (`post-launch-validation-register.md`, not `unvalidated-build-decision.md`), different
  `pack-verdict.js` code path. `method-rules-gate-contracts` documents this explicitly in a new "V1
  deferred track" subsection and in the will-override boundary section, so the distinction survives
  future edits.
- **`post-launch-validation-register.md`** (new artifact, idea root) tracks what was deferred, why,
  and the exact reopen condition. **`declare-drift --release`** (reusing the existing "something
  happened in the world" entry point) is how the founder later declares the controlled MVP release:
  it sets the new top-level `post_launch_validation.mvp_release_declared_at` and flips
  `post_launch_validation.status` to `reactivated` — surfaced loudly and first by both
  `session-start.js` and `status` from that point on, the same way an overdue kill criterion is.
- **Capability phase-relevance**: `scripts/lib/phase-relevance.js` (new, mirrors `lib/spec-index.js`'s
  sharing pattern) gives `setup-audit` a static phase→capability map so `capabilities.<cap>` gains
  `required_in_phase`/`required_now`/`blocks[]` and a not-yet-needed capability is never reported as
  more than `INFORMATIONAL`. `agents/gatekeeper.md` gains a matching checklist item: faulting an idea
  for a `required_now: false` capability gap is a finding against the review, not the idea.
- `scripts/coverage-report.js` gains 8 entries for the mechanisms above.

Tests: **437** contract tests, 198 hook tests, 0 failures.

## v1.11.0 — 2026-08-02 · gate reviews converge; research agents stop re-scanning the same page

Patch 1 of a 3-patch series answering 21 requirements the founder wrote up from actually running the
pipeline (per the moratorium, method-rules §14: every rule here cites an observed failure, not a design
argument). Two pains, both real: **gatekeeper review rounds that never converged** — round 2 (and 3)
would fail a gate over a *different* wording/editorial nitpick than round 1 raised, so a founder fixing
everything asked for still never reached a verdict; and **research agents re-scanning identical URLs**
across runs, with no pre-registered stop on how much fetching a task was allowed to spend.

- **Gatekeeper severity taxonomy replaced**: `blocker`/`major`/`minor` (a vibe) →
  `MATERIAL_BLOCKER`/`AUTO_FIXABLE_NON_BLOCKER`/`DEFERRED_RISK` (a checklist). A `MATERIAL_BLOCKER`
  needs all six fields (finding id, exact file+section, exact missing/contradictory content, downstream
  consequence, minimum patch, contract clause) or it is automatically demoted — no more failing a gate
  on a claim too vague to act on.
- **Review-scope freeze** (`skills/gate-check/SKILL.md`, new — kept under its own name, never merged
  with the pre-existing "Contract changes are not retroactive" rule in `method-rules-gate-contracts`:
  that one is cross-pipeline-version immutability of a *passed* gate; this one is within-one-gate-check
  consistency between round 1 and round 2 of the *same* attempt). Round 2 may only re-litigate round 1's
  `MATERIAL_BLOCKER` fingerprints plus genuine regressions — it can never introduce a new blocking
  category the first round never saw. If round 2 comes back with zero `MATERIAL_BLOCKER`, the recorded
  outcome is the new gate status `pass_with_deviation` (with a `deviations[]`/`attempt_count` paper
  trail, founder-confirmed via the new `founder-decision` decision-log type), not a third round.
- **`scripts/finding-fingerprint.js`** (new) — a stable sha256 identity per finding
  (gate/file/section/issue_type/claim_id), so "is this the same finding as last round" is a hash
  comparison, not a human's memory. `--check-regression` compares a finding's file against the Layer-1
  manifest from its last disposition, so reopening a `fixed`/`accepted`/`deferred` finding requires a
  cited diff — restating the original concern is now recorded as `duplicate`, not a fresh blocker.
- **`scripts/lib/url-canon.js`** + **`source-registry.md`** (new tracked artifact, idea root) +
  **`scripts/validate-source-registry.js`** — every URL a research agent fetches gets one row, keyed on
  its canonical form (tracking params stripped, host/scheme lowercased, query order normalized).
  `competitor-scanner` and `community-review-miner` now consult it before fetching and carry a
  `research_budget` (`max_rounds`/`max_new_sources`, new state.json top-level key, sibling to the
  money-only `budget` — never a repurposing of it) with explicit stop conditions, mirroring the
  error-analysis saturation rule (`stage-3-verify`) that already bounds trace review the same way. The
  registry check is wired into gate-check Layer 1 **advisory, non-blocking** — a brand-new mechanism
  earns blocking status after it has run clean on real use, not the day it ships.
- **Folded in, not restated**: multi-LLM/secondary-model output (a Codex cross-check, an autonomous
  cross-model agreement score) stays diagnostic-only — it may justify reopening a gate, never satisfies
  one, per the pre-existing "model is never an evidence source" (rule 1) and "no cross-domain
  recertification" (§12) rules. `agents/gatekeeper.md` item 24 applies those rules to a second model's
  output; it is not a new rule.
- `schema_version` 1.3.0 → 1.4.0: `gates.*.status` gains `pass_with_deviation`; new top-level
  `research_budget`. `audit-trail.md`'s row schema gains a `fingerprint` column and its `status` enum
  gains `accepted|deferred|duplicate|regressed` (versioned table, old rows untouched, per the file's own
  append-only convention). `scripts/coverage-report.js` gains 13 entries for the mechanisms above.

Tests: **364** contract tests, 198 hook tests, 0 failures.

## v1.10.1 — 2026-08-01 · the secondary-LLM probe recognises a provider that was already there

`setup-audit` probe 2 looked for `OPENAI_API_KEY` / `GEMINI_API_KEY` and nothing else. A founder on a
ChatGPT plan owns no API key, so `multi_llm` stayed `unknown` forever — and with it the one line that
consumes it, `stage-3-verify` §3 ("autonomously, measure cross-model agreement and grade accordingly"),
was unreachable in practice. A logged-in **Codex CLI** is that second provider, already installed on
the machine.

- Probe 2 now takes either path: env keys, or `codex --version` + `codex login status`. Provider is
  recorded as `codex-cli/<model>`.
- **Neither check is the probe.** Installed-and-logged-in is `status: unknown`, rung `handoff` — the
  same treatment an unauthenticated `vercel` gets. Only a real `codex exec` (asked for first, since it
  spends the founder's own quota) makes it `available`.
- **Host collision is refused.** Running on Codex, `codex exec` is the model asking itself; the
  agreement measured would carry zero information while looking like agreement. Recorded
  `unavailable` with a note.

Deliberately *not* included: Codex as a research-stage tool. The six existing integrations all raise a
rung because they touch the real world — a page, a payment, a human. A model touches nothing, and its
output is `[GUESS]`/grade D however well it authenticates. Nor does this unlock an R1 PASS on
subjective quality: without human-labeled anchors that stays grade D and diagnostic-only, per
`stage-3-verify` §2. `pipeline_version` moves to 1.10.1 with the manifests — the contract test holds
them equal, and a patch is not an exception to it.

## v1.10.0 — 2026-08-01 · spec awareness becomes native; the generator shrinks to the case that needs it

The founder's scenario: install the plugin once, globally; use it in whatever project; run the
pipeline there; then implement in that same project. Against that, `--in-place` was the wrong
shape and is **removed**.

The reasoning that produced it stopped one question short. A plugin genuinely cannot ship
`.claude/rules/` — plugin components are skills, agents, hooks, MCP and LSP servers, and rules are
project or user scope. That much was checked. What was not checked: whether a **hook** could do
the same job. It can — `PostToolUse` carries `hookSpecificOutput.additionalContext`, and its `if`
field takes permission-rule syntax, so a hook can fire only when a session reads a path under
`ideas/**`. Everything the generated kit installed into a mono-repo, the plugin can therefore do
itself, with nothing written into the project.

- **`spec-awareness.js`** (new PostToolUse hook, path-scoped to `ideas/**`) — the first time a
  session opens a spec file, it injects what a path-scoped rule would have: the anchor mechanism,
  the id vocabulary, "these files are read-only", and where a defect routes. **Once per session per
  workspace** — repeating it on every read spends context to say what the session already knows.
- **`session-start.js`** now carries the standing build contract whenever a blueprint is locked:
  the two layers, amendment-log-first, and the line between product decisions (already made) and
  technical ones (the implementer's). It re-fires on `compact`, so it survives a context reset.
- **`/saas-idea-brainstorm:spec`** and **`/saas-idea-brainstorm:spec-gap`** are now plugin skills.
  Plugin skills are namespaced, so they cannot collide with anything else the repo installs.
- **`scripts/spec-lookup.js`** resolves an id to its **defining** file, section and text, building
  the index from the artifacts on every call. No cached JSON, so **staleness stops existing**: an
  amendment written a minute ago is already live. `--list`, `--grep`, `--files`, and `--idea` when
  a workspace holds more than one spec.
- **`scripts/lib/spec-index.js`** — the id vocabulary, the definition-site rules and the artifact
  purposes now live in one module that both `spec-lookup.js` and `build-handoff.js` read. A test
  asserts neither consumer keeps its own copy.

**What that deletes**, which is the point: the generated rules, the generated skills, the cached
index, the regeneration after every amendment, the `--check` staleness machinery for the same-repo
case, the namespace-collision management, `--force`, and `--codex`. None of it was ever a real
problem — all of it was a consequence of choosing files over hooks.

**`build-handoff.js` survives, narrowed to the case that genuinely needs files:** a build
repository *separate* from the idea workspace, which may not have this plugin installed at all.
Targeting the workspace repo is now refused outright, with the native path named in the refusal.
Everything else about the copy-mode kit is unchanged — hashed read-only copy, `AGENTS.md` /
`CLAUDE.md`, path-scoped rules under a deletable namespace, self-limiting scope clauses, drift
detection in both directions.

Tests: **313** contract tests, 198 hook tests, 0 failures. Coverage report: **146** requirements,
**64%** deterministically enforced.

## v1.9.0 — 2026-08-01 · the handoff, corrected for one repo and for other plugins

Two observations from the founder, hours after v1.8.0 shipped. Both were right, and both changed
the design rather than adding a flag.

- **One repo, not two.** The normal workflow is brainstorm *and* implement in the same repository.
  v1.8.0 only knew how to copy the artifacts into a build repo — and doing that in a mono-repo
  produces a **second, unguarded copy of the spec inside the same tree**: `validate-artifact.js`
  and `guard-thresholds.js` both scope to paths under `ideas/`, so the copy would be freely
  editable while the original is frozen. Precisely the divergence the method exists to prevent,
  shipped by the tool meant to protect against it.

  New **`--in-place`** mode copies nothing; every generated artifact points at `ideas/<slug>/`
  directly. It also **hashes nothing** (a hash of the source against itself proves nothing and
  goes stale on every legitimate amendment — `--check` reports a stale *index* instead) and
  **registers no hook** (the plugin's own SessionStart already briefs the session and its
  PreToolUse already blocks edits to locked artifacts). It does not touch `CLAUDE.md` or
  `AGENTS.md`; the contract goes into an always-loaded `.claude/rules/product-spec/contract.md`.
  `--codex` maintains one begin/end-marked block inside `AGENTS.md` for Codex, leaving everything
  outside the markers untouched.

- **A build repo carries other plugins.** Three changes follow, none cosmetic:
  1. **Namespaced layout.** Everything now lands in `.claude/product-spec/` and
     `.claude/rules/product-spec/`, with skills `/product-spec` and `/product-spec-gap`. Project
     skills are *not* namespaced the way plugin skills are (`plugin:skill` cannot collide;
     `.claude/skills/spec/` can, and shadows a bundled skill of the same name) — and
     `.claude/rules/implementation.md` is exactly the filename two tools collide on. Uninstalling
     is deleting two folders.
  2. **Every generated rule carries a scope clause** disclaiming architecture, stack, code style,
     formatting, commit conventions, branching, review and release process, because Claude Code
     picks *arbitrarily* between contradicting instructions. What it does still assert: a product
     decision recorded in the spec is not overridden by another instruction — it is amended, or it
     stands.
  3. **Nothing this generator did not write is overwritten**, in either mode, and a refused run
     writes no index at all.

- **Two defects found by running it.** The index was written *before* the files it describes, so a
  crash mid-generation left a kit that `--check` called up to date — it is now written last.
  And `--check` ran the blueprint validator first, so a mid-edit blueprint hid staleness behind an
  unrelated failure — the validator now gates generation only, never inspection.

- Tests: **303** contract tests (was 264), incl. in-place vs copy behaviour, the collidable-path
  assertions, the scope clause, `--codex` block replacement, and settings merge. Coverage report:
  **141** requirements, **63%** deterministically enforced.

## v1.8.0 — 2026-08-01 · build handoff: making the artifacts legible to the next agent

**Observed failure this release cites** (method-rules §14 requires one): the pipeline's output is
consumed by a *different* agent in a *different* repository — the coding session that implements the
product. That session arrives with no knowledge that the artifacts exist, that they are frozen, that
`AC-03-2` is an id rather than prose, or that a spec defect has a process. It does what any agent
does in an unfamiliar tree: infers a structure and fills the rest with plausible invention. **That is
the exact failure stage 6 was built to prevent, reintroduced one directory downstream.** The level-2
cold-start bar proves a fresh session *could* implement the set; it does not make a session in
another repo aware the set is there.

- **New skill `handoff-to-build`** and **`scripts/build-handoff.js`** — generate, into the build
  repository, the files the coding tools load *unprompted*: `AGENTS.md` (the open standard read by
  Codex, Cursor, Copilot, Zed and ~20 others), `CLAUDE.md` importing it (Claude Code reads
  `CLAUDE.md`, not `AGENTS.md`), three **path-scoped `.claude/rules/`** (id vocabulary and anchors on
  `docs/product/**`; the product-vs-technical decision boundary on source paths; acceptance criteria
  as test oracle on test paths), the **`/spec`** and **`/spec-gap`** skills, a **SessionStart hook**
  that states the contract before the first prompt, and a read-only `docs/product/` copy.
- **`spec-index.json`** — every id (`fs-NN`, `AC-NN-n`, `ST-*`, `INV-n`, `JOB-n`, `CAP-NN-n`, `EV-n`,
  `DR-n`, `DOD-n`, `MSP-n`, `SC-n`, `DF-n`, `BA-nnn`) mapped to its **definition site**, not to
  whichever file cites it first, plus a SHA-256 per copied file. `spec-lookup.js` resolves an id to
  file + anchor + text deterministically, and calls an unresolvable id **a finding, not a licence to
  decide**.
- **Staleness is louder than absence.** `--check` fails in both directions — the source workspace
  moved ahead, or someone edited a frozen file in the build repo — and the SessionStart hook makes
  the same check every build session. Nothing is ever repaired silently. `amend-blueprint` gained a
  step 6: refresh the kit, because an amendment a build session cannot see has not landed.
- **Boundaries the generator will not cross.** It copies no `private/` material and does not export
  the evidence ledger (`E-nnn` stays deliberately unresolvable from the build repo — provenance, not
  a build input). It refuses to overwrite an `AGENTS.md`/`CLAUDE.md` it did not write, and it
  *merges* `.claude/settings.json` rather than replacing it. It refuses to run before gate BP passes
  unless `--draft` is given, and re-runs `validate-blueprint.js --at-gate` first.
- **It paraphrases nothing.** Every generated file routes, indexes and explains process; not one
  restates a product fact. That is what makes the kit incapable of drifting from the artifacts — and
  it is why the kit adds **zero founder judgements**, which is how a release lands under the §14
  moratorium: it consumes what is already locked.
- **Awareness only.** No architecture, no stack, no methodology, no workflow beyond what the locked
  specs themselves decide. Every engineering choice the spec does not fix stays with whoever builds.
- Tests: **264** contract tests (was 214) incl. 51 covering the handoff; 198 hook tests. Coverage
  report: **137** requirements, **62%** deterministically enforced.

## v1.7.0 — 2026-07-31 · depth review: subtraction, not addition (round 5)

Round 5 inverted the question — not "what is missing" but "is this too heavy, where is the
confidence unearned, and should we stop?" The review measured the surface (≈400 product judgements
and ~19,000 words of contract for a 5-step idea) and named a realistic abandonment point around
feature spec #4–5. **Net effect of this release: one contract split out, four requirement
reductions, three small additions, one blocker fixed.**

- **Blocker — `CH-nn` delegations dangled.** Stage 6 recorded delegated decisions against the live
  `founder-charter.md`, but the pack's charter copy **freezes at LOCK**, so a build-phase charter
  item is invisible to the build session and the level-2 tester — the exact readers the record was
  written for. Delegations now live in `blueprint-overview.md`'s **decision register** (`DR-n` with
  the founder's exact words, date and delegated scope); a charter id is legal only as provenance and
  only if it resolves in `mvp-pack/founder-charter.md`. Validator enforces both.
- **Contract split (context subtraction).** Gate BP's 2,264 words moved to
  `method-rules-gate-contracts-bp`, loaded only by stage 6, `amend-blueprint`, and a BP gate check —
  the same reasoning that put maintenance-rules outside the default bundle (method-rules §10).
  `method-rules-gate-contracts` drops from 5,452 → 3,269 words for the other nine gates.
- **Four reductions.** Copy dispositions narrowed to **pack-class claims** (outcome/benefit/
  quantity/guarantee/security/price/pitch), not every UI string — labels and error copy belong to
  their FS. Determinism strategy is **declared once per CAP and inherited** by test cases (~40
  duplicated cells removed). `INV-n` may no longer duplicate a DoD item — one rule, one home, so
  nothing can drift between two authorities. FS concurrency cells **cite** the conflict domain
  instead of restating it (the duplicated-authority class the review hunted).
- **Three additions, paid for by the reductions.** A `bp:profile` table declaring which optional
  layers apply and why (a simple CRUD product provably needs 9 files and skips the subsystem layer).
  Quantitative-assumption rows in the carry-forward table (attempts per success, per-user volume,
  retention) each marked with an E-id or `[GUESS]` — the gap where green checks and a wrong product
  coexist. And an honest-boundary statement in the BP contract **and in the validator's own footer**:
  what a green run does not mean.
- **§14 Requirement moratorium.** Standing rule: a new requirement may be added only if it names an
  **observed failure** or removes an existing requirement of equal weight. Rules born from
  hypothetical shapes dilute attention on the rules that were paid for in real dogfood runs. The
  honest next action is a run, not another design round — and the review's sharpest point stands:
  **all three dogfood runs died at or before gate F, while stage 6 is only reachable after nine
  gates succeed.** The designed-to-exercised ratio is now the live risk.
- **Ship audit (same release, observed failure).** The reductions landed in the templates and the
  validator while `stage-6-blueprint/SKILL.md` — the narrative a session actually follows — still
  taught the OLD rule in three places: a disposition per UI string, a determinism cell per case, and
  no mention of the two overview sections the validator now requires. Fixed, and **pinned**: a new
  contract-test block asserts the stage-6 narrative, its templates and the validator cannot drift
  apart again (the anchors the validator requires must be emitted by the templates and named by the
  skill; the narrowed claim rule and the inherited determinism rule must be stated the same way in
  all three). Assertions tolerate line wrapping — a test that fails on reflow teaches people to
  distrust it.
- Suites: 198 hook + 214 contract tests green (15 new: delegation resolution ×3, concurrency
  citation, INV-vs-DoD, determinism inheritance ×2, BP-split wiring ×2, narrative-consistency ×9).
  Coverage: 129 requirements, 61% deterministic.

## v1.6.0 — 2026-07-31 · idea-diversity layers (round-4 review)

The founder's fourth attack: ideas are enormously diverse and four biases remained — single-segment
validation, screen-shaped blueprints, no compliance home, and a frozen subsystem vocabulary. Round 4
converged all 11 design questions; the review corrected three of my proposals with better rules and
found one real blocker (a second side's table would silently corrupt the F count).

- **Two-sided/multi-sided products** (schema 1.3.0): `state.market_shape` + `state.sides[]` with
  **roles, not a winner** — `constrained` (carries the full F/V1 bar; counting the abundant side is
  trivially satisfiable) and `paying` (carries V3); often one side, then nothing changes. Each other
  side gets its **own** `beachhead-icp-<side>.md` (`validate-beachhead.js --file`, confined names —
  two tables in one file was a proven corruption path) with a **founder-set, sealed floor**
  (`thresholds.custom.f_secondary_min` — the plugin never invents this number). Per-side sampling
  frames, denominators never merged; V2 requires matchmaking mechanism + single-player value or a
  **founder-executable seeding plan** ("partner with an aggregator" is a wish, not a plan) + an
  armed chicken-egg kill criterion generated at 0.6 — which is why classification (new **0.3b**)
  lands strictly before the F signing. V3: money from the paying side; Mom-Test commitments
  (signed listings, committed supply) from the rest. Blueprint: per-side first-run flows and the
  aha's side recorded. `sides` is cycle-owned and freezes with the cycle.
- **Headless surfaces**: `ux-spec` declares `surface: ui|headless-api|cli|sdk|mixed`, overridable
  **per SC row** (`mixed` as a union of requirements would manufacture junk N/A cells); headless
  rows drop the `loading` requirement (error/empty/async tokens stay); `api-contract` requires an
  **api-lifecycle** section for any non-ui surface (versioning, deprecation window, breaking-change
  policy, key rotation — promises made the instant a customer integrates); the **accessibility
  anchor is never N/A** — per-surface substitution (headless → stable error codes, documented
  limits, deprecation policy).
- **Regulated domains**: 0.3b founder-confirmed classification → deadly assumption with
  `load_before_event = first outside user touches real regulated data` (a **blocking pre-launch
  item** in build-and-launch, not an unpassable validation gate — the v1.3.0 F lesson) + a
  compliance kill criterion; `nfr-spec` requires `bp:compliance` ALWAYS — `REG-n` rows with source
  refs, or `N/A — <basis>` ("no regulation applies" is itself a claim; null reasons rejected);
  model-drafted obligations are `[GUESS]` and never satisfy the section; at LOCK the MSP's
  explicitly-unsupported field states the regulated boundary.
- **Subsystem vocabulary growth**: `ledger` kind shipped now (internal balances/credits — inside
  tech-design's money-100%-understand zone; anchors ledger-model, idempotency, reconciliation,
  **failure-semantics** — the charge-succeeded-generation-failed rule that actually gets invented
  mid-build); **agentic-llm conditional anchors** (`takes_actions: yes` ⇒ action-authorization +
  run-limits); `integration-sync` and `search` documented as queued candidates (an unexercised kind
  ships dead anchors). Coverage: 122 requirements registered; suites 198 hook + 197 contract, all
  green (new seeded defects: headless-without-lifecycle, baseless compliance N/A, N/A'd
  accessibility, --file traversal).

## v1.5.0 — 2026-07-31 · interaction + subsystem layers (round-3 review)

The founder's third attack landed: the blueprint's vocabulary was CRUD-biased, and cross-feature
semantics had no mandatory home — an LLM core or a 3D engine got smeared across edge-case rows while
"LLM regenerates the scene during a hand-edit" was specified nowhere. Round 3 with the Opus reviewer
converged all nine design questions plus five additional findings; everything shipped.

- **Interaction layer** (`interaction-map.md`): the required unit is the **conflict domain**, not the
  pair — one row per entity with ≥2 writers, whose `writers` cell must **set-equal the validator's
  computed writer set** (a forgotten writer is the real failure mode); real answers required
  (who-wins/merge/lock/loser-sees/undo — `none` rejected), scope token with a cut-list join when
  multi-user is out of scope; pairwise table demoted to exceptions. Per-FS **`touches`** declarations
  with a deliberately asymmetric cross-check (omission = error, over-declaring = warning). **State
  machines became tables** (`ST-n` from/to/trigger/guard): every transition owned (fs must claim it
  in touches; `system:` triggers need a user-visible consequence or `invisible <reason>`). Global
  **invariants `INV-n`** trace pack-side and join the test plan. **Jobs are the third class**: async
  capability ⇒ JOB rows (durable/cancellable/second-submit/disconnect/result-lifetime/notification)
  + `queued|running|cancelled|partial` states on the using FS — a four-minute generation is a durable
  object, not a loading spinner; undo-across-a-generation-boundary is decided here.
- **Subsystem layer** (`subsystem-specs/ss-NN-*.md`): first-class home for the non-CRUD core, one per
  ADR-named engine, closed `kind` enum (`llm|graphics|realtime|pipeline|generic`) with
  kind-conditional required anchors (declared once in gate-contracts, mirrored in the validator,
  parity-tested — third instance of the pattern). Capabilities are ids (`CAP-NN-n`) with budgets;
  FS cite them on a separate `uses` line (never the trace line — that would launder a missing pack
  trace); **orphan capability = scope addition** (the orphan-field analogue). **Stochastic
  acceptance binds to evals**: `EV-n` thresholds string-verified against `mvp-pack/eval/` (restated,
  never invented), every llm-backed FS has ≥1 AC citing an EV, every EV cited + test-covered.
  Budgets checked by **containment** (CAP ≤ nfr — catches the 90s generation under a 5s screen
  promise) and llm cost budgets show per-user caps with arithmetic against R1's marginal cost.
- **Round-3 extra findings**: generated-artifact lifecycle section (quota/eviction/export/deletion —
  the concrete MSP answer for a 200 MB scene); **determinism strategy** cell on every llm/async test
  case (blank = error — a stochastic core with no strategy makes CI flaky by construction) + `eval`
  test kind; **model/document-version pinning** with a saved-output change policy (the
  highest-regret unanswered decision); data-schema gained state-machine + non-relational-store
  sections (a scene graph forced into `entity.field` is how the schema lies).
- **Wiring**: BAR targets span the new id spaces (ss/CAP/EV/ST/INV/JOB); level-2 cold-start walks
  conflict pairs + async jobs + subsystem implementability; stage-6 decomposition asks the non-CRUD
  question; amendments/coldstart/refines-never-expands unchanged by design (subsystem specs trace to
  ADRs). Coverage inventory: 109 requirements, 59% deterministic (was 95 @ 55%). Suites: 194 hook +
  189 contract, green; the fixture's Vietnamese-bodied blueprint now exercises both layers, with 7
  new seeded-defect tests (writer-set mismatch, trigger-less transition, orphan CAP, invented EV
  threshold, missing async state, blank determinism, touches omission).

## v1.4.1 — 2026-07-31 · stage 6 hardened by adversarial cross-model review

Two-round exchange with an Opus reviewer over the fresh v1.4.0 stage (12 findings: 3 blocker,
7 major, 2 minor; round 2 converged five contested design points). Everything below came out of
that exchange.

- **Blueprint Amendment mechanism** (blocker #1 — the founder's "mid-build discovery" case): a locked
  blueprint is *amended, never edited*. New `amend-blueprint` skill: founder-answered **scope test**
  routes pack-predicate changes to declare-drift and in-scope spec defects/gaps to an immutable
  `blueprint/amendments/ba-NNN` record + append-only `amendment-log.md` — which is now **first in the
  build read order**. Gate BP is never re-opened; locked bytes never change; `guard-thresholds.js`
  names the legal route instead of a dead end. Three new maintenance kinds
  (`blueprint-amendment`, `blueprint-amendment-log`, `deferred-register`) with reserved-path
  dispatch (suffix-anchored so fragment cycles cannot escape) and arithmetic id binding
  (`ba-007-*.md` ⇔ `amendment_id: BA-007`). `state.blueprint` gains `amendments` + an `abandoned`
  status; a cycle switch on a non-locked blueprint is rejected (no silent orphaning), and reconcile
  must say what happens to an in-flight blueprint when proposing a new cycle.
- **`scripts/validate-blueprint.js`** (blocker #2 — nine mutually-referential docs had zero
  deterministic checks): join keys added to the templates (`AC-NN-n`, `entity.field`, `SC-n`,
  `E-nnn`, event names, `DOD-n`/`MSP-n`, `DF-n`) plus language-stable `<!-- bp:… -->` /
  `<!-- pack:… -->` anchors, then a validator that checks set/status, the marker family
  (`[GUESS]`-family, `[OPEN]`, `[TBD]`, `[INFERRED]`, bare `___`, `<placeholders>`), cell
  completeness, referential integrity both directions, the **three-way FS↔schema↔API type check**
  (the archetypal mid-build logic conflict), traceability, DOD/MSP/AC test coverage,
  self-containment, pack-hash verification, and amendment integrity. Legacy packs degrade to named
  warnings — Layer 2 reads more, never less; blueprint-side checks are errors unconditionally.
  Registered in `coverage-report.js` (22 new requirements with honest tiers).
- **Cold-start runs are persisted evidence** (blocker #3): both levels now write
  `coldstart-l{1,2}-YYYYMMDD-NN.md` (tracked, never overwritten, FAIL runs too) with the per-file
  sha table of the exact copied set (hashed by `artifact-manifest.js` — one hashing implementation),
  and gate-check Layer 1 re-hashes the current set against the **latest** report mechanically. The
  L1 verdict travels via `audit-trail.md`'s LOCK section.
- **Guidance-loop fixes**: UBD entry is ONE sentence in all three contract files (LOCK failed + pack
  on disk + UBD & will-override; a UBD against an earlier gate is a stop — no pack, no stage 6);
  normative decision resolution order **pack trace → charter (cited by item id) → founder**, with a
  journaled `[DELEGATED — charter item, scope]` disposition, `auto_continue` never covering product
  decisions, and a prose fallback when AskUserQuestion is absent; `blueprint-overview.md` is the
  normative multi-session **resume ledger** with a 6.0 resume branch; the deferred register moved
  out of lockable `build-plan.md` into its own append-only `deferred-register.md` (`DF-n` rows,
  closures by reference); outward-claim preflight extended to BP over the new ux-spec copy
  inventory; **first-run flow (signup → aha)** and a consolidated **event dictionary** are now
  required artifact sections; `[GUESSED]` vocabulary defect fixed; guard-thresholds no longer
  freezes stage-6 drafting under the locked cycle's historical rule.
- **Stale files the review named**: maintenance-rules' "complete matrix" now assigns the blueprint
  class; method-rules §10 carries the sixth fact (amended, never edited); build-and-launch routes
  spec defects to amend-blueprint and puts the amendment log first on build day one;
  `artifact_kind` gained a hook↔skill parity fixture (THRESHOLD_FIELDS precedent).
- **Tests**: validator fixture tests (a valid Vietnamese-bodied blueprint passes; seeded
  type-conflict/uncovered-AC/marker/unknown-event/do-not-publish/dangling-amendment defects fail),
  artifact_kind parity, BAR id binding, abandonment transitions, coldstart-report exemption —
  suites now at 194 hook + 174 contract, all green. Coverage inventory: 95 requirements,
  55% deterministic (was 73 @ 48% — stage 6 added 22 requirements, 18 of them code/hook-enforced).

## v1.4.0 — 2026-07-31 · stage 6: implementation blueprint (gate BP)

The founder's finding that motivated it: the MVP Pack is a scope contract, and its cold-start bar —
"nothing *already decided* left to ask" — deliberately excused every product-level how-exactly
question (UI flow, field validation, error copy, webhook retries) as "build-session decision". Those
questions then got invented mid-build. Stage 6 closes that gap **after** LOCK, so validation
discipline is untouched and specs are never written for an unproven idea.

- **New stage 6** (`stage-6-blueprint` + templates + `templates/6-blueprint.md`): guided, post-LOCK,
  pre-build production of `blueprint/` — blueprint-overview, per-feature specs (acceptance criteria,
  field-level validation, error/empty/loading states, answered edge-case checklist,
  instrumentation), field-level data-schema, ux-spec, api-contract, integration-specs, nfr-spec,
  test-plan, build-plan. The model drafts, the founder decides; every invented detail is `[GUESS]`
  until a pack trace or founder confirmation lifts it.
- **New gate BP** (gate-contracts): coverage predicates over the pack (every core-loop step → spec;
  every tech-design entity → field-level schema; every DoD/MSP item → executable scenario; every
  tracking event → instrumentation), **refines-never-expands** (an untraceable spec is a scope
  addition → drop or declare-drift; the pack stays read-only), zero unresolved product decisions,
  no OPEN verdict. Entry: LOCK passed, or the recorded unvalidated-build-decision path.
- **Level-2 cold-start test**: new `blueprint-coldstart-tester` agent — reading only pack +
  blueprint in a clean copy, list every *product decision* a build session would still have to
  invent. Level 1 (`coldstart-tester`) keeps guarding LOCK; the two bars are cross-referenced.
- **State**: optional root `state.blueprint` block (`{cycle_id, status, gate, updated}`) — root-level
  because a LOCKed cycle's `gates` subtree is frozen (same placement reasoning as `maintenance`).
  `state-write.js` validates it when present: closed key set, locked⇔passed pairing, anti-erasure
  (never dropped; a locked record is frozen; supersession only via a new cycle's blueprint).
- **Hooks**: `validate-artifact.js` accepts stage 6 / gate BP (+ stage↔gate pairing), and its
  pipeline-version allowlists finally include 1.3.0/1.4.0 — template-stamped `1.3.0` artifacts had
  been silently blockable (latent since v1.3.0). `session-start.js` surfaces an in-progress
  blueprint so a fresh session resumes stage 6 instead of drifting into build.
- **Handoffs rewired**: stage 5's LOCK PASS now hands off to stage 6 ("build does not start here");
  `build-and-launch.md` applies after BP with **pack + blueprint as the two-layer contract**;
  gatekeeper gained the BP attack item (scope additions, model-resolved decisions, invented SLAs);
  `status` reports the blueprint phase; pipeline.md/READMEs document stage 6 and the BP row.
- **Tests**: 13 new hook tests (gate BP frontmatter, blueprint block acceptance/rejection/freeze),
  10 new contract tests (end-to-end BP wiring across contract files). Version literals swept to
  1.4.0 (enforced by the existing one-version test).

## v1.3.0 — 2026-07-30 · conflict resolution + consolidation

One pass resolving every conflict catalogued after two Claude Code sessions (and a Codex reviewer)
worked the repo in parallel.

- **Gate F passable again**: `validate-beachhead.js` is the single prospect validator. It absorbed
  the parallel `validate-prospect-tracker.js` (deleted) — resolved-entity dedup ("one business under
  two names"), "is a competitor" rejected as tier evidence, listicle-only basis rejected,
  `observed_at` dating, duplicate-Pid — on top of the existing behaviour/E-id/reach cells.
- **Legacy path** (LEGACY_RUNGS precedent): pre-1.2.0 workspaces with the old table shape get a
  `legacy-shape` warning and no mechanical count instead of a retroactive hard fail.
- **Prospect table has one canonical 9-column shape**, emitted identically by the stage-0 template
  skill and the manual template, fixture-checked from every producer (the mechanism that had already
  caught ledger-template drift twice, now covering the table that diverged).
- **Process safety**: `node --check` on every shipped `.js` is the first test case (a bulk edit once
  silently broke three scripts behind fail-open hooks); `scripts/preflight.js` runs syntax sweep +
  both suites + Codex agent parity in one command.
- **Single sources declared**: `skills/` is normative (process/ and templates/ subordinate, stated
  in-file); the version is declared once in `plugin.json` and a contract test keeps every
  `pipeline_version` literal in skills equal to it.
- **State protection**: `state-write.js` upgraded from "prefer" to MUST (observed compliance of the
  soft rule was 0/21 with one real truncation); `guard-thresholds.js` now deterministically blocks
  any direct edit that drops a load-bearing `state.json` key.
- **Contract clarifications**: reachable ≠ contacted written into gate F (contact/funnel belongs to
  V1; a criterion demanding it at F is an invented gate predicate); `audit-trail.md`'s exemption
  from pack-internal id resolution declared explicitly; `signing-blocked` added to the decision-log
  `type` enum (+ enum contract test).
- **Vocabulary parity fixture**: `THRESHOLD_FIELDS` and the sealed-field set must stay identical
  between the hook and `verify-threshold-snapshot.js` — drift is a test failure.
- **Eval fixtures write to the OS temp dir** by default, never into a repo (a generated fixture is a
  real `ideas/<slug>/state.json` tree the session-start sentinel would otherwise pick up).
- **Coverage inventory updated**: 73 requirements, 48% deterministic (code+hook); the 8 unenforced
  prose rules are individually dispositioned in `coverage-report.js` (5 intentional with reasons,
  3 marked DEBT).
- Dogfood workspaces moved out of `ideas/` (the "state never inside the plugin" rule now holds
  without exceptions), later archived out of the repo entirely.

## v1.2.0 — 2026-07-30 · post-LOCK maintenance layer + evidence-ledger integrity overhaul

Ten adversarial design/implementation review rounds with Codex (gpt-5.6-sol, xhigh).

- **Post-LOCK life**: new skills `declare-drift` (incremental drift inbox), `reconcile` (on-demand
  reconciliation against declared or observed product reality, two-phase hash-final), and
  `run-validation` (execute/adjudicate signed validation runs). Maintenance rules: mutation policies
  (append-only / versioned-projection / immutable-snapshot), claim-domain authority, a closed
  claim-transition table (retro evidence may refute, never confirm), reality intake with source
  registry and an execution/secrets boundary.
- **State schema 1.2.0**: cycles index + fragments, `maintenance` block, `health_criteria`,
  `validation_runs`; `state-write.js` enforces downgrade rejection, locked-cycle subtree freeze,
  root↔fragment correspondence, kill-criterion disposition validation.
- **Evidence-ledger overhaul**: `root_source_id` independence ceiling (syndicated reposts are ONE
  source; independence is computed, never self-declared), `bearing` / `epistemic_status` /
  `publication_disposition` separated (three things had all been called "status"), superseded rows
  excluded from every denominator.
- **New deterministic helpers**: `validate-evidence-ledger.js`, `artifact-manifest.js` (gate-input
  manifests — the verdict is pinned to a hashed artifact set), `pack-verdict.js` (the pack label is
  computed, never hand-written), sampling-frame snapshots hashed before collection.
- **Gate-check**: LOCK kill-criterion disposition ceremony (post-PASS only), ceremony-only charter
  mode, cycle resolution + drift boundary.
- **Hooks**: phase-conditional artifact validation, locked-cycle historical artifact guard,
  byte-exact append-only enforcement extended to drift-inbox / evidence-ledger / charter.
- `rung` enum reduced to exactly three values (`enhanced-auto | baseline-auto | handoff`) —
  `simulate` removed: simulation is epistemic provenance (grade D / `[GUESS]`), not an execution
  capability.

## v1.1.0 — 2026-07-29 · initial release

First public version (the "v1.0" numbering belongs to the pre-release design drafts: scalar
`current_stage` state, no DAG, no capability probes — replaced before first commit by the
`active[]` DAG, the `{status, rung, provider, verified_at, probe}` capability object, and the
15-skill layout). Shipped: the 6-stage pipeline (framing → competitive → validate V1-V3 → verify
R1-R2 → positioning → scope lock) with 9 gates, A/B/C/D evidence grading, `[GUESS]` labeling,
pre-registered thresholds with a signing ceremony, kill criteria, the four research/audit agents
(competitor-scanner, community-review-miner, gatekeeper, coldstart-tester) with Codex TOML parity,
three hooks (session-start, guard-thresholds, validate-artifact), atomic `state-write.js`, manual
no-plugin mode (`templates/` + `process/`), and 29 hook regression tests.
