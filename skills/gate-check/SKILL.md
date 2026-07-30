---
name: gate-check
description: Run the three-layer gate check for a SaaS validation idea - formal contract checks, adversarial gatekeeper review, user approval. Use when a stage's artifacts are complete and a gate verdict is needed, or when the user asks to check a gate.
argument-hint: "[idea-slug] [gate: F|C|V1|V2|V3|R1|R2|P|LOCK]"
---

Run a gate check. Load the `method-rules` skill first and read its [gate-contracts.md](../method-rules/gate-contracts.md) — the per-gate contract is the law here; do not improvise requirements.

Arguments: idea slug = $0, gate = $1 (if missing, read `state.json` and infer from active work).

## Layer 0 — pre-formal ceremonies (run BEFORE Layer 1, so Layer 1 can verify their output)

**Two invocation modes.** A *full gate check* runs Layer 0 → 1 → 2 → 3. A **ceremony-only
invocation** (`gate-check LOCK --ceremony=charter`, used by stage 5 before the pack exists) runs
just that one ceremony, records it, and **returns to the caller** — it never falls through into
Layer 1. This distinction is load-bearing: LOCK's formal contract requires a complete
`mvp-pack/`, but the charter must be locked *before* the pack is materialized (the pack ships a
copy of it). A Layer 0 that always continued into Layer 1 made the LOCK order impossible to
satisfy. Layer 1 therefore **verifies** ceremony output; it never triggers a ceremony.

**F signing ceremony (first F check only)**: if gate = F and `thresholds.signed_date` is null, sign BEFORE any verification (this is where the snapshot is created; every later gate only verifies it): present thresholds + kill criteria to the user for sign-off (AskUserQuestion; auto_continue does NOT cover signing — it is a commitment), then in one step: set `thresholds.signed_date`, promote `kill-criteria.md` to `status: locked`, and append the canonical `threshold-snapshot` row (full JSON of thresholds) to `decision-log.md`. Then proceed to Layer 1, which verifies what was just signed.

**LOCK charter finalization ceremony (ceremony-only mode; invoked by stage 5 before the pack is materialized)**: if `founder-charter.md` is not yet `status: locked`, finalize it — a non-skippable human ceremony (`auto_continue` never covers it, exactly like F signing). Present every remaining `[INFERRED]` item to the user one by one (AskUserQuestion): confirm (drop the tag, set confirmed date), revise (record the correction, supersedes the old item), or drop. Once zero `[INFERRED]` items remain, complete the decision protocol section, set `founder-charter.md` to `status: locked`, and append a `charter-finalized` note to the charter's own changelog. **Then return to stage 5**, which copies the locked charter into `mvp-pack/` and runs the cold-start test. Do NOT continue into Layer 1 from here — the pack does not exist yet.

If a *full* LOCK check finds the charter not locked, that is a formal FAIL with one instruction ("run stage 5's charter ceremony, then re-check"); gate-check never runs a partial pre-materialization subroutine inside a full check. Stage 5 is the single orchestration owner of the LOCK sequence: charter ceremony → materialize pack → cold-start test → full gate check.

(The LOCK kill-criterion disposition ceremony is NOT a Layer 0 ceremony — it runs inside Layer 3, strictly after the PASS decision, so a failed or abandoned LOCK check can never leave post-LOCK state behind. See Layer 3.)

**Cycle resolution (every gate check)**: resolve the operating cycle first (maintenance-rules §4). For a fragment cycle, ALL reads and writes — gates, thresholds + signing ceremony, kill criteria, artifact statuses — target `cycles/<id>/state.json` and the `cycles/<id>/` artifact layout; the root cycle's frozen state is never touched.

**Drift boundary (every gate check)**: if any drift-inbox `drift_id` exceeds `maintenance.last_reconcile.consumed_through` (maintenance-rules §6), refuse post-LOCK validation runs and any pack issuing/relabeling until `reconcile` completes — say so and offer to run it. Pre-LOCK gate work in a cycle that has not LOCKed is unaffected.

## Layer 1 — Formal checks (mechanical, against the gate contract)

1. Read `ideas/<slug>/state.json` and the gate's contract row. Verify:
   - **Prerequisite gates** hold (per `Requires`); reject out-of-order verdicts outright.
   - Required artifacts exist with **the statuses the contract accepts** (note: C accepts competitive-map as `draft` by design).
   - Thresholds signed BEFORE evidence dates; **verify the threshold snapshot**: compare current `state.thresholds` against the latest `threshold-snapshot` row in decision-log plus approved revisions — mismatch is a blocker even if hooks never fired.
   - Evidence meets the gate's floor; **grades are strictly A/B/C/D** (no A-/B+ variants); no grade-D items counted; claims trace to E-ids; metric computed on the pre-registered denominator.
2. **Pin the artifact set (all gates).** Before Layer 2, build the input manifest over the exact artifacts this contract requires:
   `node "${CLAUDE_SKILL_DIR}/../../scripts/artifact-manifest.js" create <idea-dir> --purpose gate-input --id <GATE>-<YYYYMMDD>-<NN> --out private/manifest-<gate>-<YYYYMMDD>-<NN>.json <each required artifact>`
   Immediately **before recording the verdict**, re-run `verify` on it. A mismatch is a blocker: the set changed under the review, so the verdict would authorize files the gatekeeper never saw. Journal `artifact_manifest_sha256` + the manifest path in the `gate-verdict` row. This is a content manifest, not a git commit — artifacts are routinely dirty or untracked mid-stage, so a commit id would not identify what was actually reviewed. Same helper and same bytes as reconcile's manifest (maintenance-rules §8); only the transaction differs.
3. **Validate the ledger's structure at V1, P and LOCK** (the gates that compute or consume a metric):
   `node "${CLAUDE_SKILL_DIR}/../../scripts/validate-evidence-ledger.js" <idea-dir>/evidence-ledger.md --json`
   Errors are blockers. Its `max_independent_count` is a **ceiling on any denominator**: rows sharing a `root_source_id` are one source however many times the same complaint was reposted. Superseded rows never count. The validator checks structure and arithmetic only — semantically duplicated rows with different wording remain a Layer 2 judgement.
4. **Outward-claim preflight (V2 before anything deploys; again at P and LOCK)**: every outward claim carries a `publication_disposition` (method-rules §11) consistent with its evidence. Any `do-not-publish` item still present in a kit that is about to run, or pack language stronger than its grades, is a blocker.
5. Formal failures → report, fix what is mechanical, and stop before layer 2 if the stage is simply unfinished.

## Layer 2 — Adversarial review

Spawn the `gatekeeper` agent with: idea directory, gate, contract row, thresholds. **Persist its full report verbatim** and reference that file from the journal row — an unpersisted verdict is unauditable (dogfood finding). Filename must be collision-safe (same-day re-attempts on the same gate are routine, e.g. FAIL then re-check): `private/gatekeeper-<gate>-YYYYMMDD-NN.md`, where `NN` is a two-digit attempt counter starting at `01` — before writing, list `private/gatekeeper-<gate>-YYYYMMDD-*.md` and use the next unused `NN` (never overwrite an existing file). Report its findings verbatim, ranked. Do not soften.

## Layer 3 — Decision

**Present options, not a verdict to rubber-stamp.** Before asking for anything, lay out the genuinely
available choices — normally 2–4, and always including *collect more evidence* and *do nothing /
maintain current state* when they are viable. For each: the exact action and scope, what evidence
supports it, cost and reversibility, what it does NOT authorize, and its stop/review condition.
Recommend one, with the two strongest reasons and the largest remaining uncertainty. Never pad the
list with obviously unacceptable options to steer the answer, and never average disagreeing findings
into a single score — the founder should be able to see why a reasonable person might choose
differently.

**Partial approval is a first-class outcome.** The founder may approve a narrower scope than proposed
(one segment, one channel, a lower spend, a shorter window). Record what was approved in its exact
scope rather than rounding it up to a full PASS: the `gate-verdict` row carries the approved scope
verbatim and the parts explicitly not approved. A gate whose scope was narrowed is passed *for that
scope only*, and downstream artifacts inherit the narrowing.

- **PASS**: if `auto_continue` false → present evidence summary AND **play back the founder-charter deltas since the last gate** ("here is what I learned about how you decide — correct?"): confirmed items lose their `[INFERRED]` tag, corrections are applied, the playback is logged in the charter changelog. Then ask approval (AskUserQuestion), set gate `passed` + date, update active work in state, **append a `gate-verdict` row to decision-log.md** (verdict, findings count, blockers, rationale), and invoke the next stage skill per the contract's flow. (auto_continue skips the approval but NOT the charter capture — unconfirmed items simply stay `[INFERRED]` until the next human checkpoint.)
- **FAIL**: set `failed`, journal the verdict + findings, and apply gate discipline — name the return path (V1→0.4/0.1; V2→2.5; V3→discovery; R1→narrow/HITL/2.5). A clear-direction fail is a good outcome.
  - **Override sub-ceremony (only if the founder explicitly says they will build anyway).** Never triggered by the FAIL itself. Record the FAIL normally first, then present a **second, non-skippable checkpoint** (`auto_continue` never covers it): capture the founder's exact wording and the exact build scope they intend. Then, in one step, append the `will-override` row AND write `unvalidated-build-decision.md` (artifact-schema.md). Gate-check owns this file because it is the only component holding all of its required inputs at once — the formal FAIL, the persisted gatekeeper report, the failed metric vs threshold, the founder's explicit decision, and the authority to append `will-override`. It is not authoring the override; it is recording a founder-authored decision at the only point where that decision is formally established.
  - The gate stays `failed` and the pack predicate is unchanged, whatever the founder decides.
- **OPEN-ACCEPTED** (only where the contract allows): confirm with the user — this is an approval checkpoint, so it **includes the charter-delta playback** exactly like PASS; verify the corresponding kit is complete; set `open` + journal. R1 open ⇒ remind: final pack downgrades to **Pre-feasibility** per the pack predicate.
- Kill criteria: any `armed` past-date criterion is raised before proceeding, whatever the verdict. If the user confirms stop → write `post-mortem.md` (artifact-schema format), journal it, close respectfully.

(LOCK's final charter playback already happened in the ceremony-only invocation stage 5 made before materializing the pack — Layer 1 of the full check only verifies that the charter is `locked`.)

**LOCK PASS post-decision sequence (in this order, only after the PASS decision is recorded):**
1. **Kill-criterion disposition ceremony** — every still-`armed` kill criterion is dispositioned with the user: `retire` (its discovery question is settled) | `carry` (move into root `health_criteria` as a post-LOCK health criterion, state+date form, provenance to the original id) | `replace` (write a new health criterion; original gets a pointer). One `criterion-disposition` journal row each. The original criterion's runtime `status` becomes `retired` + `disposition: {result, date, health_id?}` (state-schema). `carry`/`replace` results go into `health-criteria-v1.md` (`phase: maintenance`), which this ceremony publishes as `publication_status: locked` (the one non-reconcile publication authority; later health versions come from reconcile with supersedes lineage). Running this strictly after PASS means a failed LOCK leaves no retired criteria and no published health file.
2. **Freeze**: record the cycle `locked` in the `cycles` index, then write the state (the cycle's owned subtree freezes per state-schema; state-write enforces from then on).
