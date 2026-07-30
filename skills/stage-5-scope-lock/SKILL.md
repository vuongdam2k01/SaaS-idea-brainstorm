---
name: stage-5-scope-lock
description: Stage 5 of the SaaS validation pipeline - lock the MVP scope and produce the final MVP Pack. Use when an idea in ideas/<slug>/ has V3 and R2 outcomes (passed or accepted-open) and locked positioning - core loop with traceability, aha event, cut list, technical design contract, definition of done, cold-start test.
user-invocable: false
---

Stage 5: lock the MVP scope. Entry condition: V3 + R2 passed or accepted-open, positioning locked. Output: the **MVP Pack** — not a report; the input contract for the build phase. Its quality bar is the **cold-start test**: a brand-new build session reading only the pack can start building without asking anything already decided. Load `method-rules`; read `state.json`. Templates: [templates.md](templates.md). All pack files live in `ideas/<slug>/mvp-pack/`.

## 5.1 Core loop from observation → `mvp-spec.md`

From the manual-ops log (R2) — or the value dry-run in analysis mode — write the loop in ≤5–7 steps: *user does A → system does B → user gets C*. **Traceability check per step**: each step points to ledger ids or concierge-log entries. An untraceable step is a cut candidate, flagged.

## 5.2 Aha moment as a named event

Not "user sees value" — a named, measurable event ("user exports first report within 10 minutes of signup"), taken from R2 observation (or dry-run + flagged as assumed).

## 5.3 Cut list

Explicit list of what v1 will NOT do. Cut rule: keep only features **paying (or committed) customers** need for the core loop. The cut list matters as much as the build list — it is the scope-creep fence, especially since building with AI makes "one more thing" nearly free in effort but expensive in total time.

## 5.4 Technical design contract → `tech-design.md`

- **Domain model/schema**: entities, relations, states — the most expensive thing to change later (real-user data migrations); the only thing worth deep thought up front. UI is cheap to change; schema is not.
- **Condensed ADRs**: one paragraph per major decision (chose X over Y because Z) — stack, buy-vs-build, architecture. Doubles as context for AI-assisted coding sessions.
- **Buy-don't-build list**: auth, payments, email, analytics, storage.
- **The "final 20%" list, up front**: error handling, edge cases, basic security (authz, injection, rate limits), failed payments, backup, dev/prod separation — planned, not "discovered" at the end.
- **Comprehension boundary**: code that must be 100% understood — money, user data, auth/authz. Elsewhere can be looser.
- **Event tracking plan**: named events from day one, MUST include the aha event (5.2) — instrumenting after launch loses the most valuable data.
- For AI-core: the **eval harness from R1 ships in the pack** and becomes CI on build day one.

## 5.4b Minimum service promise → the MSP section of `mvp-spec.md`

Scope is only half of what a build session needs; the other half is **what we promise the people who
already paid**. V3 collected real money, so someone has expectations before a line of product code
exists. Derive the promise from what is already decided — `promise-scope.md` (R1: what the product
promises and refuses to promise), the DoD's data/payment modules, and the concierge experience — into:
eligibility, supported use cases, **explicit non-support**, beta disclosure, data collected + purpose
+ retention + deletion path, export/correction/recovery expectation, support intake and who answers,
behaviour when it breaks, and exit/sunset handling for their data.

Two rules: **invent nothing** (no SLA numbers, uptime figures, or response times the founder has not
agreed to — an unanswered field is `N/A because ___`, never a plausible-sounding guess), and
**"minimum" never means minimum safety** — drop anything that does not protect value, learning,
safety, or an honest promise, but never security, privacy, data integrity, accessibility, or a way to
report a problem. Every field answered-or-N/A is a LOCK requirement; the cold-start tester will ask
about any gap, because a build session cannot infer a service boundary from a feature list.

## 5.5 Definition of Done → `definition-of-done.md`, frozen

Freeze NOW, before building (near the end you will negotiate with yourself). Structure: **universal invariants** (core loop end-to-end; tracking fires the aha event; backup runs and restore tested; dogfooded) + **conditional modules selected by product profile** — paid product → real payment collected + failed payment handled + pricing page; multi-tenant → user A cannot see user B's data; collects personal data → privacy/terms pages + deletion path; single-tenant pilot / internal tool / free wedge → the irrelevant modules are explicitly marked N/A with a reason, not silently required. Date it and set `status: ready` (frozen content, NOT locked yet — per artifact-schema.md's single-owner rule, gate-check alone promotes `ready → locked`, and it does so at LOCK Layer 3 on PASS, not here).

## 5.6 Self-containment, carry-forward & Evidence Quality Report

**Stage 5 owns the LOCK sequence** and runs it in exactly this order: charter ceremony → materialize pack → cold-start test → full gate check. Nothing else may reorder it.

**Before materializing anything**, if `founder-charter.md` is not yet `status: locked`, invoke gate-check in **ceremony-only mode** — `gate-check LOCK --ceremony=charter` (see [gate-check/SKILL.md](../gate-check/SKILL.md)) — the non-skippable final playback that confirms/drops every remaining `[INFERRED]` item and locks the charter. It returns here without running any formal check: LOCK's formal contract requires a complete pack, and the pack does not exist yet. Only a locked charter may be copied into the pack.

- **Materialize the pack**: copy (not reference) into `mvp-pack/`. Per gate-contracts: R1 passed → `mvp-pack/eval/` = harness + results + threshold; **R1 open → `mvp-pack/eval/` = eval/README.md + data-acquisition-plan.md + feasibility-risk dossier** (a Pre-feasibility pack ships its risk file, not a nonexistent harness). Always: open-gate kits → `mvp-pack/experiments/{landing,presell,concierge}/`, and **`founder-charter.md` → `mvp-pack/founder-charter.md`**. Copy the charter only AFTER gate-check's Layer 0 final playback ceremony has locked it (see Gate LOCK below) — the shipped charter contains no unconfirmed will. After this step, `mvp-pack/` must stand alone — no `../` references anywhere in it.
- `carry-forward.md`: every open assumption (V2/V3/R2/R1 accepted-open, untested pitch, dry-run substitutions) with its kit **path inside the pack** and a learning plan (channel, expectation, good/bad thresholds).
- `evidence-quality-report.md` per artifact-schema: per decision block — gate, grade distribution, rung, upgrade path. Verdict computed by the **exact predicate in gate-contracts.md**: Validated / Hypothesis / **Pre-feasibility Hypothesis** (R1 open). The pack's confidence language must match its grades.
- **The pack label is computed, not written.** Derive it by evaluating the predicate against `state.gates` and V3's actual evidence grade, then write that result into `mvp-spec.md`'s title line and the Evidence Quality Report — both must be the same string. A hand-authored label is how a Hypothesis pack ends up reading as Validated; if the text and the gate state disagree, the gate state is right. State the inputs you evaluated (each gate's status + V3's grade) next to the verdict so the derivation is checkable.

## Gate LOCK (final)

Invoke `gate-check` for LOCK as a **full check**, only now that the pack exists. Layer 1 verifies the charter is already `locked` (finalized in 5.6 via the ceremony-only invocation); if it is not, the full check FAILs with one instruction — run 5.6's ceremony first — rather than starting a ceremony mid-check. Then:

1. Formal (per gate-contracts): prerequisites V2, V3, R1, R2, P all resolved; every core-loop step traced; cut list non-empty; aha is a named event; schema drawable; DoD `ready`, dated, content-complete (locked only after this check passes — see step 4); pack self-contained (no `../` references); scope small enough that it feels **slightly embarrassing** (the correct size signal).
2. **Cold-start test done properly**: copy `mvp-pack/` alone to a temporary clean directory, then spawn `coldstart-tester` (Agent tool) pointed at the copy — this catches broken references the in-place check would miss. Any in-scope open question = fix and re-run.
3. Spawn `gatekeeper` for the final adversarial pass (including confidence-language vs grades).
4. User signs the lock (checkpoint; auto_continue may skip → record "auto-locked"; journal either way in decision-log). Set `gates.LOCK = passed`, `mvp-spec.md` → `status: locked`, and **`definition-of-done.md` `ready → locked`** (gate-check is DoD's sole lock-promoting owner, per artifact-schema.md — this is where that promotion happens). **The pipeline ends here: the MVP Pack is the contract for the build phase.** Point the user to the pack and to the build-phase reference bundled with this plugin at `${CLAUDE_SKILL_DIR}/../../process/build-and-launch.md` (Claude Code resolves this path; on other runtimes it's `process/build-and-launch.md` at the plugin root).
