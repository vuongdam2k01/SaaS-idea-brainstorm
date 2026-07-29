# Two-way review memo: Claude (builder) ⇄ Codex CLI (independent reviewer)

> Reviewer configuration: `codex exec` · model **gpt-5.6-sol** (strongest available — CLI update 0.132.0 → 0.146.0 to unlock) · reasoning effort **xhigh** · read-only sandbox · bidirectional exchange via `codex exec resume` (preserve session context).

## Round 1 — Comprehensive review (completed 2026-07-29)

Codex auto-runs `claude plugin validate --strict`, `node --check`, **runs real code hooks to prove bypass**, and cross-references official Anthropic docs. Result: **26 findings** — 6 blockers, 16 major, 3 minor, 4 design questions. Scores: Correctness 4/10 · Coherence 3/10 · Pipeline logic 3/10 · Prompt-engineering 6/10 · Resilience 3/10 · Completeness 3/10.

### Blockers Codex found (summary)
1. `disable-model-invocation: true` on gate-check/setup-audit prevents model calling them — pipeline auto-breaks at gate F.
2. Deadlock gate C: stage 1 requires competitive-map in `draft` but gate check demands `ready`.
3. State scalar `current_stage` can't represent parallel DAG (stage 3 ∥ stage 2); doesn't enforce prerequisites; LOCK missing V2+R1+R2 conditions.
4. Promise "zero setup still reaches scope lock" false for R1 (no real data = can't achieve and not permitted to OPEN).
5. MVP pack not self-contained (eval/ and kits live outside, reference `../`) — its own cold-start test will fail.
6. Privacy: plugin's .gitignore doesn't protect user repos; template has real names + dollar amounts in public artifacts.

### Major findings worth noting
- #7 userConfig keys dead (no adapter uses them; sensitive values can't read from skill context).
- #9 **guard-thresholds bypassed in practice** (Codex ran code proof: edit `"60"→"70"` passes).
- #12 Evidence grade variants A-/B+/C- conflict schema; ChatGPT-gap self-scores C while being model output (= D).
- #13 V1 metric has structural selection bias (search behavior then count behavior).
- #14 Validated/Hypothesis predicates vague. #17 Hook misfires on unrelated repos with ideas/. #19 DoD hardcodes one product shape. #22 Meta-eval unreproducible.

## Claude's response (disposition of 26 findings)

**Accepted + fixed: 22** — detail in Round 2 prompt (see Codex session transcript). Major changes:
- NEW: `skills/method-rules/gate-contracts.md` (machine-readable gate contract + 3-tier pack predicate: Validated / Hypothesis / **Pre-feasibility**), `skills/switch-mode/`, `scripts/state-write.js`, `tests/hook-tests.js` (16 tests), `LICENSE`.
- State schema v1.1.0: `active[]` DAG replaces `current_stage`; capabilities becomes object `{status, rung, provider, verified_at, probe}`.
- 3 hook scripts rewritten v2: semantic diff prevents partial-edit bypass, protects all `locked` artifacts + decision-log append-only, sentinel prevents wrong-repo mismatch, walk-up finds ideas/, local date, per-idea isolation.
- Privacy: `private/.gitignore` auto-protects + pseudonym P-ids in all public artifacts.
- Neutral sampling frame pre-registered for V1 (eliminate selection bias); strict grades A/B/C/D; outward-action policy (all outreach needs per-approval + journal).
- Integrity independent of hook: threshold-snapshot in decision-log, gate-check cross-references each time.

**Rebutted: 2**
- #10 (Node dependency): fixed by honest declaration instead of binary bundle — bundling executables in plugin is supply-chain anti-pattern; hooks only defense-in-depth, gate-check verifies integrity without hook dependency.
- #16 (full event-sourcing + hash chain): pragmatic version (state-write.js atomic + .bak + append-only guard + rebuild-from-artifacts rule); reject hash chain because threat model is self-deception and file corruption, not adversarial tampering.

**Accepted partially / deferred: 2** — #21 (batched via subagent, no concrete token cap yet), #23 (allowed-tools deferred post-dogfood — pre-approve wrong scope worse than re-prompt).

**Answered 4 design questions**: R1 now OPEN with Pre-feasibility downgrade · A-/B+ were typos, removed · auto-lock kept (user explicit opt-in + outward never auto) · Validated predicate now precise.

**Verification post-fix**: `node tests/hook-tests.js` → 16/16 pass (includes Codex's proven bypasses as regression cases) · `claude plugin validate --strict` → passes.

## Round 2 — Re-audit (completed)

Codex re-reads each file, **re-runs hook code in-memory**, and delivers honest disposition on all 26 findings: 8 Fixed, 11 Partial, 2 Not-fixed, **3 Claude rebuttals granted** (no bundle Node; no hash-chain; defer allowed-tools), 1 new regression from fix (write race when subagent parallel-writes shared file). Scores jump: Correctness 4→6 · Coherence 3→4 · Pipeline 3→5 · Prompt-eng 6→7 · Resilience 3→6 · Completeness 3→5.

**3 new blockers (all substantive):** B1 — lifecycle gate unclosed (new-idea still writes v1.0 shape; review-mining draft vs contract demands ready; P missing prerequisites V3/R1/R2); B2 — R1-OPEN contradicts gate-contracts vs method-rules/gatekeeper/template/README, condition requires infeasible artifact; B3 — LLM-judge subjective scored grade C violates core rule "model output = D". **3 new hook bypasses Codex proves by running code:** prepend bypasses append-only; `revisions: [{}]` nonsense still authorizes; sentinel false-positive on unrelated repo.

## Round 3 response from Claude (2026-07-29)

Fix all B1/B2/B3 + 10 major: gate-contracts add lifecycle ownership + separate R1 PASS/OPEN requirements + evidence rules for LLM-judge + P prerequisites correct; R1-OPEN consistent across all files; hook v2.1 (exact-prefix, per-field revision validation, sentinel pipeline_version); validate-artifact tightened (real calendar date, idea==slug, version allowlist, stage/gate map); write race → batch files immutable + merge; privacy propagation complete (no personal URLs in public artifacts); DoD template conditional; sampling frame has pre-registered stopping rule; spec addendum v1.1 removes stale. **Test suite: 24/24 pass** (3 new bypasses now regression cases). Deferred have arguments: E2E fixtures (real dogfood is E2E first) + JSON contract engine (v1.2).

## Round 3 — Verification + 3 final blockers (completed)

Codex confirms: B3 Fixed, 3 bypasses "Fixed as claimed", write-race fixed, sampling frame "mostly fixed", DoD Fixed, stale docs handled via addendum. Three remaining **narrow cross-file issues**: (1) F signing loops (snapshot requested but nobody creates); (2) R1-OPEN can't reach LOCK (pack needs harness that doesn't exist); (3) error-analysis path diverges between contract/schema/template after write-race fix. Granted both deferred with conditions: dogfood must finish before publish; relabel "machine-checkable" → "normative LLM-interpreted". Scores: 7/6/7/8/7/6.

**Claude's Round 4 fixes**: Layer 0 "F signing ceremony" in gate-check (sign → set signed_date + lock kill-criteria + append snapshot → then verify); self-contained pack branches by R1 passed/open (Pre-feasibility ships risk register + data-acquisition-plan instead of missing harness); error-analysis/summary.md canonical everywhere + batch files exempt frontmatter (validator exempts); guard revisions require from/to match actual values + real calendar date; sentinel parse-property; state-write validates shape v1.1 fully; who/source columns end → Pid/E-id. **Test suite: 28/28 pass.**

## Round 4 — CONVERGENCE CONCLUSION (2026-07-29)

> **"Remaining items are acceptable for a v1.1 release pending successful dogfood. I found no remaining code/spec release blocker."**

Codex verifies all 3 blockers "fixed" by reading files + running new hook branches. Final scores:

| Dimension | V1 → V4 |
|---|---|
| Correctness | 4 → **9** |
| Internal coherence | 3 → **8** |
| Pipeline logic | 3 → **9** |
| Prompt-engineering | 6 → **8** |
| Real-world resilience | 3 → **8** |
| Completeness | 3 → **8** |

## Round 5 — Charter mechanism + Dogfood audit (completed 2026-07-29)

Scope: the founder-charter (intent extraction) addition and Dogfood run #1. Codex independently re-validated (strict pass, all 8 dogfood artifacts pass validator, session-start correct, private/ ignored) and delivered:

**Charter findings**: 1 blocker (final playback conflicted with auto_continue — model could silently resolve `[INFERRED]` items) + 5 majors (charter absent from F/LOCK/pack/lifecycle contracts; will-override lacked an evidence-firewall boundary; charter items need structured schema with exact quotes + supersession; OPEN approvals skipped playback; invariants unprotected while draft).

**Dogfood audit findings**: caught a REAL defect Claude introduced (state kill-criteria mirrored with INVERTED polarity — stop-conditions recorded as desired states), a REAL wrong citation (HN 32180171 → 32178328), an overstated competitor claim (Better Proposals is not anti-AI), and a methodological violation: **N=37 mining ran before F signing → quarantined as exploratory; V1 must re-run the frame after real signing**. Also: gatekeeper raw report unpersisted (anti-sycophancy plausible but not auditable), journal needs supersedes semantics, 6 overstatements in dogfood-report enumerated.

**Verdict R5**: *"Dogfood #1 is a successful adversarial failure-path test, not the release-qualifying E2E. Publication blocked pending charter/contract fixes and a complete real-founder Run #2."* Scores: 7/6/7/8/7/6.

**Claude's response (all 6 pre-Run#2 fixes applied)**: charter finalization = non-skippable human ceremony (auto_continue never covers it); charter added to F/LOCK/pack/lifecycle contracts; will-override boundary codified (never upgrades evidence/flips verdicts; failed-gate build → explicit Unvalidated Build Decision artifact); charter structured-item schema; OPEN approvals include playback; gatekeeper reports now persisted to private/gatekeeper-<gate>-<date>.md; kill-criteria state mirror = stable IDs + desired-state polarity verbatim; F contract reconciled (20 on-segment tier-4/5 prospects; deferred thresholds legal only with load-by date); dogfood corrected honestly (quarantine, citation, competitor claim, R5-corrections header in dogfood-report + journal row). Round 6 verification dispatched.

Codex's final assessment (key points): plugin is now "credible v1.1 release candidate, no longer ambitious prompt collection"; strongest design: explicit boundary between evidence – assumption – gate acceptance; most important success: outcome Pre-feasibility honestly instead of claiming certainty with no data. Remaining uncertainty is operational, not architectural: **one successful dogfood run from raw idea to LOCK is the publish condition** — aligns with pre-registered meta-eval in spec.

3 final polish items Codex noted (non-blocking release): README 2 tiers, active 0.0 vs 0.1, label "machine-checkable" — all fixed immediately after verdict.

## Round 6 — Verification of 6 pre-Run#2 fixes, by running code (completed 2026-07-29)

**Verdict R6**: *"Not cleared for Run #2 yet. The requested language is mostly present, but several fixes are declarative rather than operational, including one impossible LOCK ordering and one broken `desired_state` consumer."* This round was qualitatively different from 1-5: Codex traced execution order by hand and ran/inspected code rather than just reading prose, catching defects text-review alone would have missed.

**Real defects found** (not stylistic — all confirmed by tracing code or file contents):
1. **Blocker — impossible LOCK ordering**: the charter-finalization ceremony lived in gate-check's Layer 3 (decision), but the LOCK contract already required the charter `locked` as a Layer 1 prerequisite — no conforming agent could satisfy this order.
2. **Fail — broken `desired_state` consumer**: `session-start.js` still rendered the retired `k.state` field (renders `"undefined"` for every overdue kill criterion under the v1.1 schema); the regression fixture used the same retired field and only asserted the banner existed, not its content — so the bug had a passing test.
3. **Partial**: `founder-charter.md` template declared a universal 7-column structured-item schema, then gave 3-4 column tables for Invariants/Preference-rules/Will-overrides that couldn't satisfy it; `invariant-change` was missing from the decision-log type enum; `Unvalidated Build Decision` (named in the will-override boundary) had no filename, schema, template, or gate-check exit branch anywhere.
4. **Partial**: F contract itself was correctly tightened, but `method-rules.md` still said `signed_date` is set "when stage 0 completes" — stale wording that directly contradicts the gate-check-owned F ceremony and could recreate the premature-signing defect; K3's threshold-load-by date was buried in prose one month ahead of its own structured `by_date`, so an overdue scan would miss the earlier deadline.
5. **Partial — major collision risk**: `private/gatekeeper-<gate>-YYYYMMDD.md` is not unique across same-day re-attempts (routine: FAIL then re-check same day) — silently overwrites, orphaning old journal references.
6. **Dogfood audit, real findings**: decision-log append-only discipline held up; N=37 quarantine + citation fix + `A5`/`baseline-auto` corrections held. But: competitive-map.md's prose profile still called Better Proposals anti-AI despite the corrected table row (self-contradiction survived the earlier "fix"); beachhead-icp.md has only 13/20 qualifying tier-4/5 prospects, below the new 15-qualifying reach-risk floor Codex itself had required in round 5; `state.json.signed_date` is already non-null, so this exact workspace cannot simply "re-run F" — the Layer 0 signing ceremony only fires when `signed_date` is null; dogfood-report.md's body still repeated the superseded "V1 data ready 80%" claim even though its own R5 header disclaimed it.

**Claude's Round 7 fixes (all applied, real changes not just wording)**:
- Restructured gate-check's Layer 0 to cover both F signing AND LOCK charter finalization (runs BEFORE Layer 1 for both gates); removed the now-redundant Layer 3 charter line; stage-5-scope-lock/SKILL.md 5.6 explicitly invokes the Layer 0 LOCK ceremony before pack materialization; gate-contracts.md's LOCK row and lifecycle-ownership line updated to match the real order.
- `session-start.js` fixed to render `k.desired_state` + `k.then`; `hook-tests.js` fixture updated to the real `{id, desired_state, by_date, then, status}` shape with a content assertion (not just banner presence); `state-write.js` gained a new check rejecting kill_criteria entries using the retired `state` field or missing `id`/`desired_state`/valid `status` — so this exact regression is now caught at three independent layers (renderer, test, writer).
- founder-charter.md template rewritten so Invariants/Preference-rules/Anti-goals/Taste-notes all genuinely use the declared 7-column schema; Will-overrides kept as an intentionally different shape (indexes decision-log rows, not a standing belief) with that distinction stated explicitly in both the template and method-rules.md rule 9, instead of silently contradicting the "every section" claim.
- artifact-schema.md: added `invariant-change` to the decision-log type enum; added a full `unvalidated-build-decision.md` artifact (frontmatter, template, ownership note that gate-check never writes it) and a gate-check FAIL-branch pointer to it.
- method-rules.md rule 3 corrected: `signed_date` is set ONLY by gate-check's Layer 0, never by stage 0.
- gate-check Layer 2 filename pattern changed to `gatekeeper-<gate>-YYYYMMDD-NN.md` with explicit list-then-increment, no-clobber instructions.
- Dogfood workspace: competitive-map.md profile prose corrected to match its table; beachhead-icp.md's quarantine note now states the 13/20 reach-risk finding explicitly against the new floor (declined to fabricate more prospects — left as an honest open finding for the real founder); dogfood-report.md's stale "80% ready" claim removed and replaced with the signed_date-reset-or-fresh-workspace decision and the reach-risk finding; kill-criteria.md's K3 split into K3 (threshold-load deadline) + K4 (spike deadline) so both surface independently in overdue scans, budget criterion promoted to a proper stable-id `KB` row; state.json mirrored to match exactly; decision-log.md got an append-only R6-CORRECTIONS row.
- `node tests/hook-tests.js` → **29/29 pass** (28 prior + 1 new content-check); `claude plugin validate . --strict` → pass; `state-write.js` re-validated against the corrected `proposal-draft/state.json` → accepts.

Round 7 dispatched to verify all of the above, with explicit instructions to trace the LOCK ordering by hand rather than pattern-matching on the words "Layer 0."
