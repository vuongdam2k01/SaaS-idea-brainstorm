---
name: gate-check
description: Run the three-layer gate check for a SaaS validation idea - formal contract checks, adversarial gatekeeper review, user approval. Use when a stage's artifacts are complete and a gate verdict is needed, or when the user asks to check a gate.
argument-hint: "[idea-slug] [gate: F|C|V1|V2|V3|R1|R2|P|LOCK]"
---

Run a gate check. Load the `method-rules` skill first and read its [gate-contracts.md](../method-rules/gate-contracts.md) — the per-gate contract is the law here; do not improvise requirements.

Arguments: idea slug = $0, gate = $1 (if missing, read `state.json` and infer from active work).

## Layer 0 — pre-formal ceremonies (run BEFORE Layer 1, so Layer 1 can verify their output)

**F signing ceremony (first F check only)**: if gate = F and `thresholds.signed_date` is null, sign BEFORE any verification (this is where the snapshot is created; every later gate only verifies it): present thresholds + kill criteria to the user for sign-off (AskUserQuestion; auto_continue does NOT cover signing — it is a commitment), then in one step: set `thresholds.signed_date`, promote `kill-criteria.md` to `status: locked`, and append the canonical `threshold-snapshot` row (full JSON of thresholds) to `decision-log.md`. Then proceed to Layer 1, which verifies what was just signed.

**LOCK charter finalization ceremony (first LOCK check only)**: if gate = LOCK and `founder-charter.md` is not yet `status: locked`, finalize it BEFORE any verification — this is a non-skippable human ceremony (`auto_continue` never covers it, exactly like F signing). Present every remaining `[INFERRED]` item to the user one by one (AskUserQuestion): confirm (drop the tag, set confirmed date), revise (record the correction, supersedes the old item), or drop. Once zero `[INFERRED]` items remain, complete the decision protocol section, set `founder-charter.md` to `status: locked`, and append a `gate-verdict`-adjacent `charter-finalized` note to the charter's own changelog. Only then proceed to Layer 1, which verifies the charter is locked, then copy it into `mvp-pack/` and run the cold-start test.

## Layer 1 — Formal checks (mechanical, against the gate contract)

1. Read `ideas/<slug>/state.json` and the gate's contract row. Verify:
   - **Prerequisite gates** hold (per `Requires`); reject out-of-order verdicts outright.
   - Required artifacts exist with **the statuses the contract accepts** (note: C accepts competitive-map as `draft` by design).
   - Thresholds signed BEFORE evidence dates; **verify the threshold snapshot**: compare current `state.thresholds` against the latest `threshold-snapshot` row in decision-log plus approved revisions — mismatch is a blocker even if hooks never fired.
   - Evidence meets the gate's floor; **grades are strictly A/B/C/D** (no A-/B+ variants); no grade-D items counted; claims trace to E-ids; metric computed on the pre-registered denominator.
2. Formal failures → report, fix what is mechanical, and stop before layer 2 if the stage is simply unfinished.

## Layer 2 — Adversarial review

Spawn the `gatekeeper` agent with: idea directory, gate, contract row, thresholds. **Persist its full report verbatim** and reference that file from the journal row — an unpersisted verdict is unauditable (dogfood finding). Filename must be collision-safe (same-day re-attempts on the same gate are routine, e.g. FAIL then re-check): `private/gatekeeper-<gate>-YYYYMMDD-NN.md`, where `NN` is a two-digit attempt counter starting at `01` — before writing, list `private/gatekeeper-<gate>-YYYYMMDD-*.md` and use the next unused `NN` (never overwrite an existing file). Report its findings verbatim, ranked. Do not soften.

## Layer 3 — Decision

- **PASS**: if `auto_continue` false → present evidence summary AND **play back the founder-charter deltas since the last gate** ("here is what I learned about how you decide — correct?"): confirmed items lose their `[INFERRED]` tag, corrections are applied, the playback is logged in the charter changelog. Then ask approval (AskUserQuestion), set gate `passed` + date, update active work in state, **append a `gate-verdict` row to decision-log.md** (verdict, findings count, blockers, rationale), and invoke the next stage skill per the contract's flow. (auto_continue skips the approval but NOT the charter capture — unconfirmed items simply stay `[INFERRED]` until the next human checkpoint.)
- **FAIL**: set `failed`, journal the verdict + findings, and apply gate discipline — name the return path (V1→0.4/0.1; V2→2.5; V3→discovery; R1→narrow/HITL/2.5). A clear-direction fail is a good outcome. If the founder explicitly chooses to build anyway (a will-override against a mandatory gate), gate-check does NOT change the gate's status or the pack predicate — it only points to `unvalidated-build-decision.md` (artifact-schema.md) as the honest exit artifact; that file is written by the stage in progress, never by gate-check itself.
- **OPEN-ACCEPTED** (only where the contract allows): confirm with the user — this is an approval checkpoint, so it **includes the charter-delta playback** exactly like PASS; verify the corresponding kit is complete; set `open` + journal. R1 open ⇒ remind: final pack downgrades to **Pre-feasibility** per the pack predicate.
- Kill criteria: any `armed` past-date criterion is raised before proceeding, whatever the verdict. If the user confirms stop → write `post-mortem.md` (artifact-schema format), journal it, close respectfully.

(LOCK's final charter playback already happened in Layer 0, before this decision layer ran — see above. Layer 3 for LOCK is otherwise an ordinary PASS/FAIL decision over the already-verified formal checks.)
