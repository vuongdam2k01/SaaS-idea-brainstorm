---
name: status
description: Show validation pipeline status for ideas in this workspace - stage, gates, waiting-on items, kill-criteria deadlines.
disable-model-invocation: true
argument-hint: "[idea-slug (optional)]"
---

Report the validation pipeline status. Never rely on a session-start summary — read the files now.

## Steps

1. Find ideas: `ideas/*/state.json` in the current workspace. If `$ARGUMENTS` names a slug, report only that idea; otherwise report all (and if none exist, say so and point to `new-idea`).
2. For each idea, read `state.json` and report, in the user's language:
   - **Position**: current stage and what the next concrete action is (name the exact task, e.g. "0.4 — score beachhead segments", not "continue stage 0").
   - **Gates**: passed / in progress / failed / accepted-open, with dates. For failed gates: which gate the work returned to.
   - **Thresholds**: signed or not; if signed, date.
   - **Kill criteria**: each with days remaining; anything overdue gets flagged first and loudly.
   - **Waiting on**: handoff items pending with the user (what, since when, blocking which gate) — these are usually the critical path.
   - **Capabilities**: last audit date and rung implications ("scraping unavailable → V1 mining runs at baseline; run setup-audit after connecting to upgrade").
   - **Budget**: spent vs cap, if a cap is set.
3. End with a one-line recommendation of the single highest-leverage next action across all ideas.
4. If any `state.json` is unparsable, report it as damaged and offer to repair from the artifacts (artifacts are ground truth; state is an index).
