---
name: amend-blueprint
description: Record a mid-build discovery against a locked implementation blueprint - run the founder-answered scope test, then either write an immutable Blueprint Amendment Record (in-scope fix) or route to declare-drift (scope-level change). The locked blueprint is never edited; current truth = locked blueprint + amendment log.
argument-hint: "[idea-slug] [what was discovered]"
---

Amend a **locked** blueprint after a build-time discovery. Load `method-rules` and the
`method-rules-gate-contracts-bp` skill (BP's contract satellite); read `state.json`.
This exists because a mid-build discovery is **not drift**: nothing built departs from recorded truth
— the *spec* is defective or silent, still inside MVP scope, and the correction must land where a
build session will actually read it. Reconcile's machinery (source observations, claim registry,
baselines) answers a different question; its output is not in the build read order.

Idea slug = $0, discovery = $1 (ask if missing — the observation, not the proposed fix).

## Preconditions

1. `state.blueprint.status` is `locked`. If not, this is ordinary stage-6 drafting — say so, point at
   the `stage-6-blueprint` skill, and return.
2. The discovery is stated as an **observation** (failing test name, provider error payload, quoted
   third-party doc + URL). Method-rules §1 applies verbatim: no narrated cause you did not check;
   `[UNVERIFIED CAUSE]` otherwise.

## The scope test — the routing gate (founder-answered; `auto_continue` NEVER covers it)

Propose an answer with reasoning, then ask the founder (AskUserQuestion; prose fallback when it is
unavailable — the checkpoint may not degrade):

> Does this change any of: a core-loop step · the cut-list boundary (adds or removes user-visible
> capability) · an MSP commitment · a DoD item · the aha event · price/payer · any outward promise?

- **YES → this is not an amendment.** Stop; run `declare-drift` and route through reconcile
  (possibly a new cycle). No BAR is written.
- **NO → amend** (flow below).
- **NO, but it contradicts a number traced to evidence** (an R1 marginal-cost figure, an NFR latency
  source, an MSP-derived commitment) → **amend AND `declare-drift`**: the spec is corrected now, the
  claim is dispositioned at the next reconcile.
- Unknown or disputed defaults to **YES** (mirrors reconcile's strategic-classification default).

## Amend flow (one transaction)

1. Next id: list `blueprint/amendments/ba-*.md`, take the next unused zero-padded `NNN`. File
   `blueprint/amendments/ba-<NNN>-<slug>.md`, frontmatter per maintenance-rules §9 with
   `artifact_kind: blueprint-amendment`, `mutation_policy: immutable-snapshot`,
   `amendment_id: BA-<NNN>` (same three digits as the filename — the hook enforces the pairing),
   `cycle_id` = `state.blueprint.cycle_id`, `publication_status: locked` in its final render. Body:

   | field | rule |
   |---|---|
   | `trigger` | the observation itself, verbatim/quoted, with its ref |
   | `targets[]` | `<file>#<id>` join keys over EVERY id space — `fs-03#AC-03-2`, `data-schema#invoice.amount_cents`, `api-contract#E4012`, `ss-01#CAP-01-2`, `interaction-map#INV-1`, `interaction-map#JOB-1`, `data-schema#ST-report-1`, `ss-01#EV-1` |
   | `class` | `defect` (spec wrong/impossible) · `gap` (spec silent on an in-scope case) · `clarification` (wording only) |
   | `scope_test` | outcome + the founder's exact words + date |
   | `old` / `new` | verbatim current text and its exact replacement — applyable and diffable without touching the locked file |
   | `consequences[]` | every other blueprint doc the change touches; a field-type change that does not name `api-contract` is incomplete |
   | `test_impact` | test-plan cases added/changed; a behaviour change with no test impact is rejected |
   | `founder_approval` | date + exact wording (non-skippable, same class as F signing) |
   | `supersedes` | prior BA id when re-amending the same target |

2. Append one row to `blueprint/amendment-log.md` (`artifact_kind: blueprint-amendment-log`,
   append-only; create with frontmatter on first amendment):
   `| BA-<NNN> | date | targets | class | scope_test | one-line summary |`
   The log is **first in the build read order** — a build session reads it before the locked files.
3. Append a `blueprint-amendment` row to `decision-log.md` (BA id, targets, class, scope-test
   outcome).
4. Update state via state-write: `blueprint.amendments = {"last_id": "BA-<NNN>", "updated": date}`
   (closed key set — nothing else changes; gate BP stays `passed` and is never re-opened:
   amendments are post-gate work, exactly as validation runs are post-LOCK).
5. Run `node "${CLAUDE_SKILL_DIR}/../../scripts/validate-blueprint.js" <idea-dir> --with-amendments`
   — a dangling target, id collision, or contradiction fails on the spot; fix before closing.
6. **Only if the code lives in a SEPARATE repository**, refresh its handoff kit
   (`handoff-to-build`, or `node "${CLAUDE_SKILL_DIR}/../../scripts/build-handoff.js" <idea-dir>
   --to <build-repo>`): that repo holds a copy, and an amendment a build session cannot see has not
   landed where it matters. When the code is in this repo there is nothing to refresh — `spec` and
   the spec-awareness hook read the artifacts directly, so the amendment is live the moment it is
   written.

## Standing rules

- **Cold-start re-verify**: if any amendment of class `defect` or `gap` exists, re-run the level-2
  cold-start test ONCE before the pre-launch checklist (not per amendment); record
  `coldstart_reverified: <date>` as an appended log row.
- **Density signal**: ≥3 amendments against one FS, or any `scope_test: YES` occurrence, is a health
  signal — surface it in `status`/session-start wording: the blueprint was under-specified there, or
  scope is moving (method-rules §13 instinct: stop and look, don't keep patching).
- Locked files stay byte-identical forever; `guard-thresholds.js` names this skill as the legal
  route when an edit to a locked blueprint file is attempted.
