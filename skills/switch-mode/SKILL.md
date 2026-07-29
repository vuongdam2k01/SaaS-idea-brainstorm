---
name: switch-mode
description: Switch a SaaS validation idea between analysis mode and market-evidence mode, with precondition checks and journaling.
disable-model-invocation: true
argument-hint: "[idea-slug] [analysis|market-evidence]"
---

Switch pipeline mode for an idea. Load `method-rules` first. Mode is a user decision — never switch silently.

## To `market-evidence`

1. Preconditions: read state; verify the relevant experiment kits exist (`landing-kit`, `presell-kit`, `concierge-kit` — whichever gates are open) and run `setup-audit` if capabilities are stale (>7 days) or unknown.
2. Present the plan (AskUserQuestion): which open gates will be re-run with real experiments, which rungs are available (auto vs handoff), expected costs (budget cap status), and the outward-action policy (every deploy/send/spend still gets per-action approval).
3. On approval: set `mode`, reset the re-run gates from `open` to `pending` with a note (`reopened for market evidence`), update `active[]`, append a `mode-switch` row to decision-log.md, and invoke the relevant stage skill.

## To `analysis`

1. Confirm intent; any live experiments (deployed landing, active payment link) get an explicit teardown-or-keep decision, journaled.
2. Set `mode`, mark interrupted gates per their real evidence status (evidence already collected at a grade keeps its grade — real data does not expire when the mode changes), journal.

Never delete collected evidence on a mode switch — the ledger only grows.
