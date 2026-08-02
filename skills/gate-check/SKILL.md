---
name: gate-check
description: Run the three-layer gate check for a SaaS validation idea - formal contract checks, adversarial gatekeeper review, user approval. Use when a stage's artifacts are complete and a gate verdict is needed, or when the user asks to check a gate.
argument-hint: "[idea-slug] [gate: F|C|V1|V2|V3|R1|R2|P|LOCK|BP]"
---

Run a gate check. Load the `method-rules` skill first, then load the `method-rules-gate-contracts` skill (Skill tool) — the per-gate contract is the law here; do not improvise requirements. **If and only if gate == BP**, also load the `method-rules-gate-contracts-bp` skill: BP's contract is a satellite so that the other nine gates never carry it in working context (v1.7.0, the maintenance-rules §10 precedent).

Arguments: idea slug = $0, gate = $1 (if missing, read `state.json` and infer from active work).

## Layer 0 — pre-formal ceremonies (run BEFORE Layer 1, so Layer 1 can verify their output)

**Mechanical first step, before any ceremony (v1.13.0).** Two lightweight detectors run before
anything else in Layer 0 — both read only `state.json` and tracked artifacts, never session memory
(method-rules §1):

1. **Pre-LOCK reconcile** — `node "${CLAUDE_SKILL_DIR}/../../scripts/reconcile-pre-lock.js" <idea-dir> --json`, and **only while no cycle in this idea has reached LOCK** (the mirror-image guard to the `reconcile` skill's own "if no cycle has reached LOCK, stop" rule — this script refuses to run once one has, and says so). It surfaces deterministic divergences (a proposed patch each) and non-deterministic open questions (never a proposed patch — reading artifact prose is a judgment call). Present both to the user; apply a proposed patch, if the user confirms it, via `state-write.js` only — never automatically. Findings append to `decision-log.md` under `type: "pre-lock-reconcile"` (`detail: divergences=<n>; patched=<list>; open_questions=<list>` — see `method-rules-artifact-schema`).
2. **Stale-criterion detection** — `node "${CLAUDE_SKILL_DIR}/../../scripts/detect-stale-criteria.js" <idea-dir> --json`. Any `kill_criteria`/`health_criteria` entry still `status: "triggered"` that a later `decision-log.md` row plainly resolves is a finding with a proposed status patch (`cleared` or `retired`, per the resolving row). Same posture: surface for confirmation, apply only via `state-write.js` on explicit confirmation, never auto-applied — the "deletion/patch is never automatic" rule this plugin already applies to privacy duties.

**Two invocation modes.** A *full gate check* runs Layer 0 → 1 → 2 → 3. A **ceremony-only
invocation** (`gate-check LOCK --ceremony=charter`, used by stage 5 before the pack exists; also
`gate-check V1 --ceremony=defer`, v1.5.0, used when the founder wants to skip pre-MVP human
validation on named reopen conditions) runs just that one ceremony, records it, and **returns to
the caller** — it never falls through into Layer 1. This distinction is load-bearing: LOCK's
formal contract requires a complete `mvp-pack/`, but the charter must be locked *before* the pack
is materialized (the pack ships a copy of it); V1's deferral **substitutes for** the whole V1
check rather than being one of its verdicts, so it cannot be produced by Layer 1/2/3 either. A
Layer 0 that always continued into Layer 1 made the LOCK order impossible to satisfy, and would
make V1-deferral indistinguishable from a Layer 3 verdict it structurally is not. Layer 1
therefore **verifies** ceremony output; it never triggers a ceremony.

**F signing ceremony (first F check only)**: if gate = F and `thresholds.signed_date` is null, sign BEFORE any verification (this is where the snapshot is created; every later gate only verifies it).

*Readiness preflight (mechanical, before presenting anything).* Signing pre-registers the test; it does not assert F passes, so a preflight failure is never a reason to skip the ceremony — it is content the user must see. Check and report: every deadly assumption in `assumption-map.md` has a threshold **or** a deferred threshold with an explicit load-by date in a kill criterion; every threshold a kill criterion references exists as a field in `state.thresholds` rather than only in prose (a threshold outside signed state is unsigned and silently editable); no threshold definition is still marked `PROPOSED` while a kill criterion treats it as settled.

*Deferred thresholds bind to an event, not just a date.* A `null` threshold must name the event it must be loaded before (`load_before_event`), and that event is **blocked** while it is null — a date alone is not enough. Dogfood run #3: `a2_marginal_cost_usd_avg_max` was deferred to a load-by date of 2026-10-15 while the measurement that produces the number was scheduled for 2026-09-10, so the threshold would have been written after its own evidence existed. The gatekeeper caught it; the preflight should have.

*Contract-authorization check (mechanical, blocking).* Stage 0 generates kill criteria freely, and that is correct — a founder may pre-commit to any stop condition they like. What a generated criterion may **not** do is add a **gate predicate**: a condition the gate then enforces as if the contract required it. Before signing, compare every criterion that mentions a gate against that gate's row in the `method-rules-gate-contracts` skill. A criterion may set a deadline, an action, and a threshold on the founder's own behaviour; it may not tighten, add to, or reinterpret what the contract requires for the gate to pass. Any criterion that does is a **blocker**: report it with the contract row it exceeds and the exact wording, and do not sign until it is rewritten or explicitly demoted to a founder stop condition.

> Run #3: at task 0.6 the run wrote kill criterion K2 requiring prospects at `funnel status ≥ contacted`. The F contract requires a **tier-evidenced list** of 15 and says nothing about contact — "contacted" belongs to V1. The run then enforced its own invention at gate F and told the founder to spend one to two weeks of field work that the contract never asked for. It caught itself only because the founder pushed back. Nothing in the pipeline compared the generated criterion against the contract, which is what this check is for.

*Presentation.* Present the thresholds, the preflight findings, and the kill criteria for sign-off with AskUserQuestion — signing is a commitment, one of the named non-skippable ceremonies `auto_continue` never covers (method-rules §15). **If AskUserQuestion is unavailable** (non-interactive/headless runs, where it is simply absent rather than failing), present the same content in prose and ask for an explicit signing decision in the reply. The mechanism may degrade; the checkpoint may not — never sign on the user's behalf and never skip the ceremony because the picker is missing.

*Three outcomes, one of which is not "signed".*
- **Signed** — in one step: set `thresholds.signed_date`, promote `kill-criteria.md` to `status: locked`, and append the canonical `threshold-snapshot` row (full JSON of thresholds) to `decision-log.md`. Then proceed to Layer 1, which verifies what was just signed. (`signed_date` is sealed from that moment: it is watched by `guard-thresholds.js` and can never be moved by a `revisions` entry, only by explicit user approval — backdating it is what would make late evidence look pre-registered.)
- **Declined** — the user chooses not to sign what they were shown.
- **Blocked** — the user asks for the preflight defects to be fixed first, or accepts a recommendation to that effect.

For **declined or blocked**: leave `thresholds.signed_date` **null**, do not lock `kill-criteria.md`, append a `signing-blocked` row (`detail: outcome=declined|blocked; unmet=<preflight items>`) plus the matching `audit-trail.md` section (empty findings table — the attempt happened and produced no signature), and **stop the gate check** — return to stage 0 with the named repairs, exactly like a Layer 1 formal failure at an unfinished stage. Because `signed_date` stays null the ceremony re-fires on the next F attempt, which is the point: an unsigned F is a visible, recoverable state, whereas signing a set of thresholds nobody was willing to commit to is not. Do **not** proceed to Layer 2 — a gatekeeper reading an unsigned threshold set is auditing a commitment that was never made. (Run #2 dogfood finding: facing exactly this situation the run withheld signature on its own judgement, never showed the founder the thresholds, still ran Layers 1–2, and journalled the result as "Layers 0/1/2 all run" — substituting the model's judgement for a founder-reserved decision. The contract had no branch for it, so this is that branch.)

**LOCK charter finalization ceremony (ceremony-only mode; invoked by stage 5 before the pack is materialized)**: if `founder-charter.md` is not yet `status: locked`, finalize it — a non-skippable human ceremony, one of the named ceremonies `auto_continue` never covers (method-rules §15), exactly like F signing. Present every remaining `[INFERRED]` item to the user one by one (AskUserQuestion): confirm (drop the tag, set confirmed date), revise (record the correction, supersedes the old item), or drop. Once zero `[INFERRED]` items remain, complete the decision protocol section, set `founder-charter.md` to `status: locked`, and append a `charter-finalized` note to the charter's own changelog. **Then return to stage 5**, which copies the locked charter into `mvp-pack/` and runs the cold-start test. Do NOT continue into Layer 1 from here — the pack does not exist yet.

If a *full* LOCK check finds the charter not locked, that is a formal FAIL with one instruction ("run stage 5's charter ceremony, then re-check"); gate-check never runs a partial pre-materialization subroutine inside a full check. Stage 5 is the single orchestration owner of the LOCK sequence: charter ceremony → materialize pack → cold-start test → full gate check.

**V1 deferral ceremony (v1.5.0; ceremony-only mode, invoked as `gate-check V1 --ceremony=defer`)**:
the founder's intended flow is passive research → analysis → spike → positioning → scope lock →
blueprint → **build MVP** → controlled release → **then** real human validation — and until
v1.5.0 the pipeline had no honest way to record that choice: V1 is the one validation gate with no
accepted-open path (gate-contracts "OPEN allowed? No", unchanged by this ceremony), so a founder
who wanted to defer it was forced either into repeated pre-build research rounds they had already
decided not to run, or into silently treating an unvalidated pack as validated. This ceremony is
the honest third option, structurally distinct from an `open` gate and from a `will-override`
(the "will-override boundary" section of `method-rules-gate-contracts` — a will-override is for a
gate that was **attempted and failed**; this ceremony is for a gate **never attempted at all**, by
explicit founder choice, with named reopen conditions). Same non-skippable class as F-signing and
the LOCK charter ceremony (method-rules §15 names all four ceremonies).

*Mechanical preflight (before presenting anything).* Read `state.json`. Refuse to present the
ceremony — report the reason, do nothing else — if: `gates.C.status` is not `passed` or
`pass_with_deviation` (V1's own prerequisite gate is not yet resolved, so there is nothing to defer
into); `gates.V1.status` is already `passed` or `pass_with_deviation` (a resolved gate cannot be
deferred — that is not what this ceremony is for); or `gates.V1.status` is already `deferred`
(re-running this ceremony on an already-deferred V1 is not how reopening works — reopening means
one of the founder's own named conditions firing, followed by a REAL V1 run, never a second
deferral).

*Presentation.* Present, in order: (1) V1's current evidence state — whatever is in
`evidence-ledger.md`/`sampling-frame-v1.md` so far, even if empty or partial, so the founder is
deferring with full knowledge of what exists; (2) the three example reopen-condition categories as
**prompts, not defaults** — new contradictory evidence surfaces post-launch, the founder explicitly
decides to reopen it, or a hard safety/legal conflict emerges — and ask the founder to state the
exact condition(s) in their own words; **never auto-generate this field** (same discipline as the
founder-charter's `stated` grade — a model-drafted reopen condition the founder merely confirmed is
`[INFERRED]`, not `stated`, and this ceremony requires the stronger grade); (3) a preview of the
resulting pack label — run `node "${CLAUDE_SKILL_DIR}/../../scripts/pack-verdict.js" <idea-dir>/state.json --assuming-lock-pass --json`
against a scratch copy of state with `gates.V1.status` set to `deferred`, and show the founder the
literal string `FOUNDER-AUTHORIZED HYPOTHESIS TRACK` — never `Validated`, never plain `Hypothesis` —
so nobody defers V1 under the impression the pack will still read as fully validated. Use
AskUserQuestion for the decision; **if AskUserQuestion is unavailable**, present the same content in
prose and require an explicit reply, exactly like the F-signing degradation rule — the mechanism may
degrade, the checkpoint may not.

*Three outcomes.*
- **Deferred** — in one step via `state-write.js`: set `gates.V1.status: "deferred"` +
  `deferred_reopen_on` (the founder's own wording, verbatim) + `deferred_date` (today) +
  `register_ref: "post-launch-validation-register.md"`; initialize the top-level
  `post_launch_validation` key if not already present (`{register_ref: "post-launch-validation-register.md", status: "pending", mvp_release_declared_at: null, reopen_on: <same wording>}`).
  Then create or append a row to `post-launch-validation-register.md` (`method-rules-artifact-schema`
  template) for this deferred item. Then append a `founder-decision` row to `decision-log.md`
  (`detail: authority=founder; exact_wording=<the founder's own words>; reopen_on=<the same
  condition>`) — the reusable primitive Patch 1 introduced, not a fourth row shape. **Never** append
  a `will-override` row and **never** write `unvalidated-build-decision.md` — those belong only to a
  gate that was formally FAILed, which V1 was not. Return to the caller; do not fall into Layer 1.
- **Declined** — the founder reviews the preview and chooses to keep pursuing real V1 evidence
  instead. No state changes. Point back at stage 2's mining/interview steps, or a full
  `gate-check V1` when evidence is ready.
- **Blocked** — the mechanical preflight above failed; report the exact unmet precondition and stop.

(The LOCK kill-criterion disposition ceremony is NOT a Layer 0 ceremony — it runs inside Layer 3, strictly after the PASS decision, so a failed or abandoned LOCK check can never leave post-LOCK state behind. See Layer 3.)

**Cycle resolution (every gate check)**: resolve the operating cycle first (maintenance-rules §4). For a fragment cycle, ALL reads and writes — gates, thresholds + signing ceremony, kill criteria, artifact statuses — target `cycles/<id>/state.json` and the `cycles/<id>/` artifact layout; the root cycle's frozen state is never touched.

**Drift boundary (every gate check — self-contained, no other file needed)**: read `drift-inbox.md` (if it exists) and `maintenance.last_reconcile.consumed_through` in state. If any inbox `drift_id` exceeds `consumed_through`, drift is declared but unreconciled → **refuse** post-LOCK validation runs, any pack issuing/relabeling, and the BP gate check until `reconcile` completes; say so and offer to run it. Ordinary investigation, coding, blueprint *drafting*, and pre-LOCK gate work in a cycle that has not LOCKed are never blocked. (Stated in full here on purpose: this is the one maintenance rule every gate check needs, and requiring the 291-line maintenance-rules for it would put the whole file back in the default bundle — see method-rules §10.)

## Layer 1 — Formal checks (mechanical, against the gate contract)

1. Read `ideas/<slug>/state.json` and the gate's contract row. Verify:
   - **Prerequisite gates** hold (per `Requires`); reject out-of-order verdicts outright.
   - Required artifacts exist with **the statuses the contract accepts** (note: C accepts competitive-map as `draft` by design).
   - Thresholds signed BEFORE evidence dates. **Verify the threshold snapshot with the script, not by reading** — run it at every gate and treat a non-zero exit as a blocker:
     `node "${CLAUDE_SKILL_DIR}/../../scripts/verify-threshold-snapshot.js" <idea-dir> --json`
     It replays snapshot + approved revisions and compares the result to `state.thresholds`, so a silent edit, a revision chain that does not reconstruct, a signature with no snapshot (or a snapshot with no signature), a revision dated before the signing, and any movement of `signed_date` itself all fail deterministically — **even if hooks never fired**. This used to be prose here, and dogfood run #2 showed why that was not enough: it is the pipeline's headline guarantee and it had never executed once (F failed before the signing ceremony, so `signed_date` stayed null and there was nothing to compare). Read its `warnings` too: a `self_authored` warning is not a failure but it is the honest boundary — the script proves the chain reconstructs, **never** that the founder approved it, since `user_approved: true` is data the writer authors. Confirm each revision against a decision-log row or the founder before relying on it.
   - Evidence meets the gate's floor; **grades are strictly A/B/C/D** (no A-/B+ variants); no grade-D items counted; claims trace to E-ids; metric computed on the pre-registered denominator.
2. **Pin the artifact set (all gates).** Before Layer 2, build the input manifest over the exact artifacts this contract requires:
   `node "${CLAUDE_SKILL_DIR}/../../scripts/artifact-manifest.js" create <idea-dir> --purpose gate-input --id <GATE>-<YYYYMMDD>-<NN> --out private/manifest-<gate>-<YYYYMMDD>-<NN>.json <each required artifact>`
   Immediately **before recording the verdict**, re-run `verify` on it. A mismatch is a blocker: the set changed under the review, so the verdict would authorize files the gatekeeper never saw. Journal `artifact_manifest_sha256` + the manifest path in the `gate-verdict` row. This is a content manifest, not a git commit — artifacts are routinely dirty or untracked mid-stage, so a commit id would not identify what was actually reviewed. Same helper and same bytes as reconcile's manifest (maintenance-rules §8); only the transaction differs.
3. **Validate the prospect count at F** (and any later gate that counts prospects):
   `node "${CLAUDE_SKILL_DIR}/../../scripts/validate-beachhead.js" <idea-dir> --json`
   Errors are blockers — it computes the qualifying count itself rather than trusting the table's own tally, and refuses rows whose tier is an estimate, whose behaviour cell is empty, whose `E-id` does not resolve in the ledger, or whose reach channel is a forum handle. Read `possibly-prescriptive` warnings and hand them to Layer 2 by name: they are the rows where advice may have been recorded as past behaviour, which is how run #2 produced six tier-4 prospects of whom five were advice-givers.
4. **Validate the ledger's structure at V1, P and LOCK** (the gates that compute or consume a metric):
   `node "${CLAUDE_SKILL_DIR}/../../scripts/validate-evidence-ledger.js" <idea-dir>/evidence-ledger.md --json`
   Errors are blockers. Its `max_independent_count` is a **ceiling on any denominator**: rows sharing a `root_source_id` are one source however many times the same complaint was reposted. Superseded rows never count. The validator checks structure and arithmetic only — semantically duplicated rows with different wording remain a Layer 2 judgement.
5. **Outward-claim preflight (V2 before anything deploys; again at P, LOCK, and BP over the ux-spec copy inventory)**: every outward claim carries a `publication_disposition` (method-rules §11) consistent with its evidence. Any `do-not-publish` item still present in a kit that is about to run, or pack language stronger than its grades, is a blocker.
6. **Pack-label honesty (LOCK)**: the label in `mvp-spec.md` and `evidence-quality-report.md` must be the string `scripts/pack-verdict.js` computes, and while `gates.LOCK` is not `passed` it must still carry `(PROSPECTIVE — LOCK not yet passed)`. A final-looking label on an unpassed LOCK is a blocker: that is exactly the state a prospective VALIDATED stamp leaves behind when its gate later fails.
7. **Cold-start report verification (LOCK and BP)**: the cold-start bar is satisfied by a
   **persisted report**, never a remembered run (method-rules §1 — session transcripts are not
   evidence). At LOCK: the latest `coldstart-l1-YYYYMMDD-NN.md` at the idea root; at BP: the latest
   `blueprint/coldstart-l2-YYYYMMDD-NN.md`. Check mechanically: the report exists, its verdict line
   is `VERDICT: PASS`, and its inlined per-file sha256 table matches a fresh
   `artifact-manifest.js create` over the current set (pack alone at LOCK; pack + blueprint at BP,
   excluding the reports themselves). A missing report, a latest-NN FAIL, or a moved hash is a
   blocker — the stage re-runs its cold-start sequence.
8. **Source-registry advisory check (v1.4.0, any gate reading `evidence-ledger.md`)**: `node "${CLAUDE_SKILL_DIR}/../../scripts/validate-source-registry.js" <idea-dir> --json`. **Advisory, non-blocking for now** — a non-zero exit is handed to Layer 2 by name, never treated as a Layer 1 blocker; it earns blocking status only after it has run clean across real dogfood use (method-rules §14 discipline: don't tighten a brand-new check into a gate the day it ships). Answers the founder's other observed pain here — research agents re-scanning identical URLs across rounds — by surfacing rescans with no `last_rescan_justification`, not by stopping the gate.
9. Formal failures → report, fix what is mechanical, and stop before layer 2 if the stage is simply unfinished — **but still run the gatekeeper in `advisory` mode** and persist its report the same way. The verdict remains the Layer 1 FAIL; the point is that the founder gets the adversarial findings on the FIRST attempt, when the artifacts are weakest, instead of after another full cycle. Mark the report `mode: advisory` and journal it as advisory so it is never mistaken for a gate verdict. (Run #3: the first F check stopped before Layer 2; the second one, nineteen minutes of work later, found twenty-one findings — twelve of them blockers — several of which had been present all along.)

## Layer 2 — Adversarial review

**Round counter (v1.4.0, read BEFORE spawning the agent).** List `private/gatekeeper-<gate>-*.md` for this idea/cycle and count how many exist already — that count **is** the round number about to run (0 existing → this is round 1; 1 existing → round 2; etc.). This reads the same attempt-numbering convention Layer 2 already writes (the per-day `NN` suffix below), just rolled up across dates: a gate re-checked the next day is still round 2, not a fresh round 1. Round ≥ 2 triggers two things spawning must respect:

- **Review-scope freeze (v1.4.0 — distinct from "Contract changes are not retroactive").** The `method-rules-gate-contracts` skill's "Contract changes are not retroactive" rule is about **cross-pipeline-version** immutability: a requirement added after a gate passed does not reopen it. This rule is a different thing entirely — **within one gate-check's own attempts**, round 2 may only re-litigate round 1's `MATERIAL_BLOCKER` fingerprints (agents/gatekeeper.md item 23) plus genuine regressions; it may not introduce a new blocking category the round-1 snapshot never contained. This exists because "the gatekeeper found something new to fail on" every round is how a review loop never converges — the founder's actual observed pain (repeated review rounds over wording/editorial nitpicks with no end in sight), not a hypothetical. Hand the round-1 audit-trail section (fingerprints + severities) to the round-2 gatekeeper as input so it can enforce this itself (agents/gatekeeper.md reads it under "Input").
- **Deviation eligibility.** If round 2 (or later) comes back with zero `MATERIAL_BLOCKER` findings — everything remaining is `AUTO_FIXABLE_NON_BLOCKER`/`DEFERRED_RISK` — Layer 3 records `PASS_WITH_DEVIATION` instead of spawning a third round. See Layer 3.

Spawn the `gatekeeper` agent with: idea directory, gate, contract row, thresholds (and, at round ≥ 2, the round-1 audit-trail section per the freeze above). **Wait for it inline — never spawn it in the background and return.** The agent is deliberately read-only (`agents/gatekeeper.md`: fresh eyes, unattached, and unable to mutate what it is auditing), so its report exists only in the reply it hands back: if this skill ends while the agent is still running, the report is destroyed and Layer 2 did not happen. Persist it as the **first** action after it returns, before summarizing or journalling anything.

**Persist its full report verbatim** and reference that file from the journal row — an unpersisted verdict is unauditable (dogfood finding). Filename must be collision-safe (same-day re-attempts on the same gate are routine, e.g. FAIL then re-check): `private/gatekeeper-<gate>-YYYYMMDD-NN.md`, where `NN` is a two-digit attempt counter starting at `01` — before writing, list `private/gatekeeper-<gate>-YYYYMMDD-*.md` and use the next unused `NN` (never overwrite an existing file). Report its findings verbatim, ranked. Do not soften.

If no persisted report exists for this attempt, **Layer 2 is incomplete and the gate has no verdict** — say so and re-run it rather than proceeding on a remembered summary (rule 1: session transcripts are never an evidence source, and that includes your own recollection of what the gatekeeper said). Run #2 dogfood: the gatekeeper was spawned async three times and died with the turn each time, and the report only survived once the founder quoted this rule back; the same pattern also destroyed a completed stage-1 scan. **Any long-running agent whose output is load-bearing is awaited, and anything it discovers incrementally is written to `private/` as it goes, not held until the end.**

**Then append the redacted section to `audit-trail.md`** (artifact-schema) — second action, right after persisting the verbatim report. `private/` does not survive a clone, so this tracked file is the only place a later reader learns *why* an artifact is contested: one section per gate attempt, the manifest `path@sha256`, and every finding with its severity, its `fingerprint`, where it lands, and its remediation `status`. **Compute the fingerprint yourself** from the four components the gatekeeper reports per finding (gate, file, section, issue_type, claim_id): `node "${CLAUDE_SKILL_DIR}/../../scripts/finding-fingerprint.js" compute <gate> <file> <section> <issue_type> <claim_id>` — the agent reports the components (it has no script-execution tool by design), gate-check computes and stores the hash. Redact identities to `P<id>`; never soften wording or drop a finding. A gate attempt with a persisted private report but no audit-trail section is half-recorded: the verdict is auditable on this machine only.

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

- **PASS**: if `auto_continue` false → present evidence summary AND **play back the founder-charter deltas since the last gate** ("here is what I learned about how you decide — correct?"): confirmed items lose their `[INFERRED]` tag, corrections are applied, the playback is logged in the charter changelog. Then ask approval (AskUserQuestion), set gate `passed` + date, update active work in state, **and at LOCK finalize the pack label**: re-run `scripts/pack-verdict.js` WITHOUT `--assuming-lock-pass`, confirm it returns the same verdict the pack claims, then strip the `(PROSPECTIVE …)` marker from `mvp-spec.md` and `evidence-quality-report.md`. If the recomputed verdict differs, do not strip anything — report the mismatch as a blocker. On FAIL the marker stays, which is what keeps a failed LOCK from leaving a validated-looking pack behind. **Append a `gate-verdict` row to decision-log.md** (verdict, findings count, blockers, rationale), and invoke the next stage skill per the contract's flow. (auto_continue skips the approval but NOT the charter capture — unconfirmed items simply stay `[INFERRED]` until the next human checkpoint.)
- **PASS_WITH_DEVIATION** (v1.4.0 — only reachable at round ≥ 2, per the deviation-eligibility rule in Layer 2). The gatekeeper's round-2-or-later verdict is FAIL, but every remaining finding is `AUTO_FIXABLE_NON_BLOCKER`/`DEFERRED_RISK` (zero `MATERIAL_BLOCKER`): present the deviations to the founder exactly like a PASS checkpoint (same charter-delta playback; a commitment about what is being knowingly carried forward, so it stops auto_continue the same way the F-signing-class ceremonies do — method-rules §15). On confirm, in one step: set `gates.<gate>.status: pass_with_deviation` + `deviations[]` (one entry per surviving finding: `finding_fingerprint`, `category`, `description`, `carry_forward`, `revisit_phase`) + `attempt_count` (the round number from Layer 2) via `state-write.js`; append a `gate-verdict` row to `decision-log.md` exactly as PASS does; **and** append a `founder-decision` row (`detail: authority=founder; exact_wording=<founder's own words approving the deviations>; reopen_on=<condition>`) — this is the reusable ceremony primitive (artifact-schema), not a duplicate of `gate-verdict`. This is a **pass**, not a softer FAIL: downstream gates and the pack predicate treat it the same position a plain `passed` gate would.
- **FAIL**: set `failed`, journal the verdict + findings, and apply gate discipline — name the return path (V1→0.4/0.1; V2→2.5; V3→discovery; R1→narrow/HITL/2.5). A clear-direction fail is a good outcome.
  - **Override sub-ceremony (only if the founder explicitly says they will build anyway).** Never triggered by the FAIL itself. Record the FAIL normally first, then present a **second, non-skippable checkpoint** — one of the named ceremonies `auto_continue` never covers (method-rules §15): capture the founder's exact wording and the exact build scope they intend. Then, in one step, append the `will-override` row AND write `unvalidated-build-decision.md` (the `method-rules-artifact-schema` skill). Gate-check owns this file because it is the only component holding all of its required inputs at once — the formal FAIL, the persisted gatekeeper report, the failed metric vs threshold, the founder's explicit decision, and the authority to append `will-override`. It is not authoring the override; it is recording a founder-authored decision at the only point where that decision is formally established.
  - The gate stays `failed` and the pack predicate is unchanged, whatever the founder decides.
- **OPEN-ACCEPTED** (only where the contract allows): confirm with the user — this is an approval checkpoint, so it **includes the charter-delta playback** exactly like PASS; verify the corresponding kit is complete; set `open` + journal. R1 open ⇒ remind: final pack downgrades to **Pre-feasibility** per the pack predicate.
- Kill criteria: any `armed` past-date criterion is raised before proceeding, whatever the verdict. If the user confirms stop → write `post-mortem.md` (artifact-schema format), journal it, close respectfully.

(LOCK's final charter playback already happened in the ceremony-only invocation stage 5 made before materializing the pack — Layer 1 of the full check only verifies that the charter is `locked`.)

**LOCK PASS post-decision sequence (in this order, only after the PASS decision is recorded):**
1. **Kill-criterion disposition ceremony** — every still-`armed` kill criterion is dispositioned with the user: `retire` (its discovery question is settled) | `carry` (move into root `health_criteria` as a post-LOCK health criterion, state+date form, provenance to the original id) | `replace` (write a new health criterion; original gets a pointer). One `criterion-disposition` journal row each. The original criterion's runtime `status` becomes `retired` + `disposition: {result, date, health_id?}` (state-schema). `carry`/`replace` results go into `health-criteria-v1.md` (`phase: maintenance`), which this ceremony publishes as `publication_status: locked` (the one non-reconcile publication authority; later health versions come from reconcile with supersedes lineage). Running this strictly after PASS means a failed LOCK leaves no retired criteria and no published health file.
2. **Freeze**: record the cycle `locked` in the `cycles` index, then write the state (the cycle's owned subtree freezes per state-schema; state-write enforces from then on).

## Gate BP specifics (the one post-LOCK gate — stage 6, implementation blueprint)

BP runs through the same three layers with these deltas; the contract row and coverage predicates
are in the **`method-rules-gate-contracts-bp` skill**, which is the law here too (load it for this
gate only).

- **State location**: the verdict lands in root `state.blueprint.gate`, never in the frozen cycle
  `gates` object. Entry verification is the contract's one sentence: `gates.LOCK` `passed` — or
  `failed` AND a complete `mvp-pack/` on disk AND `unvalidated-build-decision.md` + its
  `will-override` row (a UBD against any earlier gate is a stop: no pack, no stage 6).
- **No Layer 0 ceremony**: thresholds were signed at F and the charter locked before LOCK; BP has
  nothing to sign. The drift boundary check runs as on every gate.
- **Layer 1**, in order:
  1. Run `node "${CLAUDE_SKILL_DIR}/../../scripts/validate-blueprint.js" <idea-dir> --at-gate --json`
     — exit 0 required; hand its warnings to Layer 2 **by name** (a legacy pack without join ids
     gets more reading, never less).
  2. **Pack immutability by arithmetic**: re-run `artifact-manifest.js verify` against the LOCK
     verdict's own manifest (from its `gate-verdict` row) — any pack file whose hash moved since
     LOCK is a blocker naming the file. A pre-manifest legacy verdict downgrades this to a Layer-2
     reading, reported by name.
  3. **Cold-start report verification** per Layer 1 item 7: latest `blueprint/coldstart-l2-*.md`,
     `VERDICT: PASS`, hash table matches the current set. A full BP check before that report exists
     is a guaranteed pointless FAIL, same as LOCK's rule.
  4. Verify the remaining contract predicates by reading: refines-never-expands (an untraceable spec
     is a scope addition = blocker), event dictionary + first-run flow present and consistent,
     integration failure paths, milestone order, outward-claim preflight over the copy inventory,
     zero unresolved markers, deferred register non-product with owner + date per row.
  5. Pin the manifest over the blueprint files **plus `mvp-pack/`** (excluding coldstart reports) —
     the pack is part of the reviewed input even though it cannot change.
- **Layer 2**: gatekeeper as usual (its item 21 covers the blueprint-specific attacks); persist +
  audit-trail section identically.
- **Layer 3 PASS** (charter playback as usual): in one step promote every required pipeline artifact
  `ready → locked` (deferred-register and any amendment-log are maintenance files outside promotion)
  and write `blueprint.status: locked` + `gate.status: passed` + `passed_date` via state-write (it
  enforces the pairing). Journal the `gate-verdict` row. Then point the founder at
  `process/build-and-launch.md` — build starts here, with pack + blueprint as the two-layer contract,
  and say explicitly: **from now on a spec defect/gap goes through `amend-blueprint`** (current truth
  = locked blueprint + amendment log, log first in the read order); scope-level change still goes
  through `declare-drift`. **FAIL**: name the exact documents/predicates; stage 6 fixes and re-runs
  its 6.9 sequence (changed blueprint ⇒ cold-start re-run + fresh manifest). The pack label and all
  validation gate states are untouched either way.
