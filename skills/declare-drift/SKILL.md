---
name: declare-drift
description: Record that a post-LOCK SaaS idea's product reality has drifted from its recorded truth - appends to the drift inbox and arms the reconcile boundary. Use when the user mentions having shipped, changed, removed, or repriced something since LOCK, without wanting a full reconcile right now. Also handles a founder's controlled MVP release declaration (--release) when V1 was deferred.
argument-hint: "[idea-slug] [what changed] | [idea-slug] --release"
---

Cheap, incremental drift declaration — the counterpart to the full `reconcile` skill. Load `method-rules` **and then the `method-rules-maintenance-rules` skill** (§6 governs this skill) — it is deliberately NOT in the default bundle, so post-LOCK skills load it themselves. Never nag: declaring drift is good news for the system, not a debt.

Idea slug = $0; free-text change description = rest of arguments (elicit if empty: what changed, roughly when, how they know — shipped code? config? pricing page?).

## `--release` mode (v1.5.0 — controlled MVP release declaration)

Reuses this skill's existing "something happened in the world, tell the pipeline" entry point
rather than inventing a new one — a controlled release is exactly that kind of event. Invoked as
`declare-drift <idea-slug> --release`.

1. Preconditions: the operating cycle has reached `LOCK` (same "pre-LOCK changes are pivots, not
   drift" boundary as the ordinary flow below — a controlled MVP release cannot happen before the
   MVP itself was locked and built), and `gates.V1.status === "deferred"` with
   `state.post_launch_validation` present. If V1 was never deferred, there is nothing to release
   into — say so and stop (this mode is not a generic "we shipped" announcement; that is the
   ordinary drift-declaration flow below).
2. Confirm with the founder, briefly, that this MVP release is the controlled release the deferral
   ceremony anticipated (not an unrelated ship). No AskUserQuestion ceremony required — this is a
   factual declaration, not a decision with alternatives, but do not infer it silently from other
   context either.
3. Via `state-write.js`, in one step: set `post_launch_validation.mvp_release_declared_at` to the
   current full ISO-8601 timestamp, and flip `post_launch_validation.status` to `"reactivated"`.
   Do **not** touch `gates.V1.status` here — it stays `"deferred"` until V1 is actually re-run for
   real evidence; a release declaration is the trigger, not the reopening itself.
4. Update `post-launch-validation-register.md`'s row `status` to `reactivated` (the file, not just
   the state index — state is rebuildable from artifacts, never the other way round).
5. Tell the founder plainly: real V1 evidence collection is now due (this is what `reopen_on` named),
   and it will be surfaced loudly and first by `session-start` and `status` until it is resolved.
   Point at `stage-2-validate` to actually run V1 for real when ready.

## Steps (ordinary drift declaration)

1. Read `ideas/<slug>/state.json`. If no cycle has reached LOCK, redirect: pre-LOCK changes are pivots — offer the active stage skill instead.
2. Ensure `drift-inbox.md` exists for the active cycle (`phase: maintenance`, `artifact_kind: drift-inbox`, `mutation_policy: append-only`; header: `| drift_id | ts | dimension | source_type | note |`).
3. Append one row per distinct change: `drift_id` = `D-<NNN>`, strictly increasing, next unused; `ts` = full ISO-8601 timestamp; `dimension` ∈ core-loop | cluster-added | cluster-removed | icp | price | promise | quality | other; `source_type` = founder-statement unless the user points at a source (then record it, but do NOT inspect sources now — that is reconcile's job). Rows are never edited, deleted, or marked — consumption is proven later by reconcile-manifest membership + `last_reconcile.consumed_through` (the drift-id high-water mark), and the boundary check is `max(drift_id) > consumed_through`.
4. Update state via state-write: set `maintenance.drift_declared_at` to the newest row's `ts`.
5. Tell the user plainly what is now blocked until the next reconcile (pack issuing/relabeling, post-LOCK validation runs, switch-mode — investigation and ordinary coding are NOT blocked), and offer to run `reconcile` now or later. Do not start reconcile without their yes.

Rules: rows are never edited or deleted (append-only; no marker rows of any kind — an appendable "consumed" marker would be forgeable). Declaring drift never modifies baselines, claims, gates, or packs — it only records and arms the boundary. If the user describes drift that plainly touches pack-predicate subjects (new buyer, new price model, changed promise/core loop), say now that the next reconcile will likely propose a new cycle, so they are not surprised.
