---
name: declare-drift
description: Record that a post-LOCK SaaS idea's product reality has drifted from its recorded truth - appends to the drift inbox and arms the reconcile boundary. Use when the user mentions having shipped, changed, removed, or repriced something since LOCK, without wanting a full reconcile right now.
argument-hint: "[idea-slug] [what changed]"
---

Cheap, incremental drift declaration — the counterpart to the full `reconcile` skill. Load `method-rules` **and then the `method-rules-maintenance-rules` skill** (§6 governs this skill) — it is deliberately NOT in the default bundle, so post-LOCK skills load it themselves. Never nag: declaring drift is good news for the system, not a debt.

Idea slug = $0; free-text change description = rest of arguments (elicit if empty: what changed, roughly when, how they know — shipped code? config? pricing page?).

## Steps

1. Read `ideas/<slug>/state.json`. If no cycle has reached LOCK, redirect: pre-LOCK changes are pivots — offer the active stage skill instead.
2. Ensure `drift-inbox.md` exists for the active cycle (`phase: maintenance`, `artifact_kind: drift-inbox`, `mutation_policy: append-only`; header: `| drift_id | ts | dimension | source_type | note |`).
3. Append one row per distinct change: `drift_id` = `D-<NNN>`, strictly increasing, next unused; `ts` = full ISO-8601 timestamp; `dimension` ∈ core-loop | cluster-added | cluster-removed | icp | price | promise | quality | other; `source_type` = founder-statement unless the user points at a source (then record it, but do NOT inspect sources now — that is reconcile's job). Rows are never edited, deleted, or marked — consumption is proven later by reconcile-manifest membership + `last_reconcile.consumed_through` (the drift-id high-water mark), and the boundary check is `max(drift_id) > consumed_through`.
4. Update state via state-write: set `maintenance.drift_declared_at` to the newest row's `ts`.
5. Tell the user plainly what is now blocked until the next reconcile (pack issuing/relabeling, post-LOCK validation runs, switch-mode — investigation and ordinary coding are NOT blocked), and offer to run `reconcile` now or later. Do not start reconcile without their yes.

Rules: rows are never edited or deleted (append-only; no marker rows of any kind — an appendable "consumed" marker would be forgeable). Declaring drift never modifies baselines, claims, gates, or packs — it only records and arms the boundary. If the user describes drift that plainly touches pack-predicate subjects (new buyer, new price model, changed promise/core loop), say now that the next reconcile will likely propose a new cycle, so they are not surprised.
