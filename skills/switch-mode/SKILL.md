---
name: switch-mode
description: Switch a SaaS validation idea between analysis mode and market-evidence mode, with precondition checks and journaling.
disable-model-invocation: true
argument-hint: "[idea-slug] [analysis|market-evidence]"
---

Switch pipeline mode for an idea. Load `method-rules` first. Mode is a user decision — never switch silently.

**Preconditions (both directions)**:
- **Cycle resolution first** (maintenance-rules §4): resolve the operating cycle; all reads/writes below target that cycle's state (root for the inline cycle, `cycles/<id>/state.json` otherwise).
- **Locked cycle**: if the operating cycle's status is `locked` or `stopped`, switch-mode is CATEGORICALLY unavailable — a locked cycle's gates are never reset (state-write rejects it). Post-LOCK re-testing happens through validation runs (`reconcile` signs them) or a new cycle. Say so and stop.
- **Drift boundary**: if any drift-inbox `drift_id` exceeds `maintenance.last_reconcile.consumed_through` (see maintenance-rules §6), switch-mode is BLOCKED: declared-but-unreconciled drift means the gates' subjects may no longer describe the product. Tell the user and offer to run `reconcile` first.

## To `market-evidence`

1. Preconditions: read state; verify the relevant experiment kits exist (`landing-kit`, `presell-kit`, `concierge-kit` — whichever gates are open) and run `setup-audit` if capabilities are stale (>7 days) or unknown.
2. Present the plan (AskUserQuestion): which open gates will be re-run with real experiments, which rungs are available (auto vs handoff), expected costs (budget cap status), and the outward-action policy (every deploy/send/spend still gets per-action approval).
3. On approval: set `mode`, reset the re-run gates from `open` to `pending` with a note (`reopened for market evidence`), update `active[]`, append a `mode-switch` row to decision-log.md, and invoke the relevant stage skill.

## To `analysis`

1. Confirm intent; any live experiments (deployed landing, active payment link) get an explicit teardown-or-keep decision, journaled.
2. Set `mode`, mark interrupted gates per their real evidence status (evidence already collected at a grade keeps its grade — real data does not expire when the mode changes), journal.

Never delete collected evidence on a mode switch — the ledger only grows.
