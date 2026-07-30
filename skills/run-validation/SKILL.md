---
name: run-validation
description: Execute and adjudicate a signed post-LOCK validation run for a SaaS idea - gather evidence inside the confirmation window, compute the verdict against the pre-signed spec, write the immutable run report, and update claim statuses. Use when a signed validation-run spec's window is open or has closed and needs a verdict.
argument-hint: "[idea-slug] [run_id]"
---

Execute a validation run whose spec was signed by `reconcile`. Load `method-rules` and read the `method-rules-maintenance-rules` skill §3–§4 — the claim-transition table is the law: **`supported` is reachable ONLY through this skill's signed-window verdict.**

Idea slug = $0, run_id = $1 (if missing, list signed specs in `validation-runs/` whose window is open or expired-unadjudicated, and ask).

## Preconditions (refuse with reasons if any fails)

1. `validation-runs/<run_id>-spec.md` exists, `publication_status: locked`, and its `run-signed` journal row's date is BEFORE `confirmation_window.opens_at`. A spec signed at-or-after opens_at can never produce PASS — offer to re-register a fresh window via reconcile instead.
2. No report exists yet for this run_id (reports are immutable — a re-run is a NEW run spec, never an overwrite).
3. Drift boundary: if any inbox `drift_id` exceeds `maintenance.last_reconcile.consumed_through`, STOP — reconcile first (declared drift may have invalidated this run's `applies_to`).
4. The run's `applies_to` (product/version/environment) is still identifiable against the current baseline; if drift changed the subject, the run is void — journal that and route back to reconcile.

## Execution

1. Gather evidence strictly INSIDE `confirmation_window` (`opens_at` ≤ evidence date < `closes_at`), at the rungs available (evidence grading and outward-action policy apply unchanged — outreach/deploys still need per-action approval). Evidence collected outside the window is recorded but marked window-external: it never counts toward the verdict.
2. Enter qualifying evidence in the ledger (E-ids, grades — the run's gate_kind carries its evidence floor from gate-contracts).
3. Compute the verdict EXACTLY per the spec's pre-registered threshold, sampling frame, and stopping rule — no post-hoc adjustments; a threshold change mid-run voids the run (journal + back to reconcile).

## Adjudication

1. Write `validation-runs/<run_id>-report.md` (kind `validation-run-report`, `publication_status: locked` in its final render, immutable): spec reference + spec sha256, evidence E-ids, computed metric vs threshold, verdict `PASS | FAIL | VOID`, window actually used.
2. Journal a `run-verdict` row (run_id, verdict, report ref).
3. Apply claim transitions per maintenance-rules §3: PASS → `supported`; FAIL → `refuted` scoped to the run's `applies_to`; VOID → claim unchanged. Update the affected claims in the NEXT baseline via reconcile if the claim register lives there (a run report never edits a locked baseline — if the verdict changes current truth materially, say so and offer reconcile).
4. Update state via state-write: `validation_runs[]` index entry gets the verdict + report path; remove resolved claim ids from `maintenance.blocking_claims`.
5. Close with: verdict, what the claim's new status unlocks or blocks, and whether a reconcile is now warranted.
