---
name: status
description: Show validation pipeline status for ideas in this workspace - stage, gates, waiting-on items, kill-criteria deadlines.
disable-model-invocation: true
argument-hint: "[idea-slug (optional)]"
---

Report the validation pipeline status. Never rely on a session-start summary — read the files now.

## Steps

1. Find ideas: `ideas/*/state.json` in the current workspace. If `$ARGUMENTS` names a slug, report only that idea; otherwise report all (and if none exist, say so and point to `new-idea`). For each idea, also read the `cycles` index and every fragment `cycles/<id>/state.json` — report per cycle (a locked C1 plus an active C2 are two lines, not one).
2. For each idea, read `state.json` and report, in the user's language:
   - **Position**: current stage and what the next concrete action is (name the exact task, e.g. "0.4 — score beachhead segments", not "continue stage 0").
   - **Gates**: passed / in progress / failed / accepted-open, with dates. For failed gates: which gate the work returned to.
   - **Thresholds**: signed or not; if signed, date.
   - **Kill criteria**: each with days remaining; anything overdue gets flagged first and loudly.
   - **Participant-data retention duties** (`privacy.retention_duties`, only when non-empty): report BEFORE ordinary next actions — anything past `delete_by` and not `disposed`/`extended` is named with its manifest ref and the note that disposal needs the founder's explicit approval over the exact files. Never delete anything here; `status` only reports.
   - **Waiting on**: handoff items pending with the user — report each as `what` · `resume_when` (the exact condition that would unblock it) · `owner` · `expires_or_recheck_at`, and flag any entry that is past its re-check date or has no `resume_when` at all (an entry with no resume condition is indistinguishable from an abandoned one — offer to define it or drop it). These are usually the critical path.
   - **Post-LOCK maintenance** (only when a cycle is locked or `maintenance` is non-empty): last reconcile (id, date, intake authority) or "never reconciled"; current baseline head; **drift boundary status** — if any drift-inbox `drift_id` exceeds `last_reconcile.consumed_through` (the exact check; timestamps are only the hooks' approximation), flag loudly what is blocked (pack issuing/relabeling, validation runs, switch-mode) and recommend `reconcile`; unconsumed drift-inbox rows; armed `health_criteria` with days remaining (overdue = flag first, like kill criteria); signed validation runs whose confirmation window is open or expired unrun; `blocking_claims` (contradicted-retro) if any.
   - **Capabilities**: last audit date and rung implications ("scraping unavailable → V1 mining runs at baseline; run setup-audit after connecting to upgrade").
   - **Budget**: spent vs cap, if a cap is set.
3. End with a one-line recommendation of the single highest-leverage next action across all ideas.
4. If any `state.json` is unparsable, report it as damaged and offer to repair from the artifacts (artifacts are ground truth; state is an index).
