# Dogfood workspaces (dev-only, gitignored)

Internal validation-pipeline runs against the plugin itself. These are **not user ideas**, which is
why they live here and not under `ideas/`: the hooks' sentinel is "a `state.json` with
`pipeline_version` beside it under `ideas/`", and a dogfood workspace inside `ideas/` reads as a real
idea to anyone who opens this repo with the plugin installed (conflicts-inventory C1).

Ground rules:

- **One workspace per run, never reused across signing ceremonies.** `proposal-draft/` (run #1) has a
  non-null `signed_date`, so the F signing ceremony can never legally run in it again — "re-run F" in
  that workspace is unreproducible by design (conflicts-inventory C7). A new run gets a new directory.
- Workspaces are frozen history once their run's report is written (`plugin/dogfood-report.md`,
  registry rows in `plugin/failure-modes.md`).
- `dogfood/proposal-draft/` doubles as the only real-data fixture proving
  `scripts/verify-threshold-snapshot.js` works on a genuine signed chain (signed 2026-07-29) and that
  `scripts/validate-beachhead.js` takes the legacy path on a pre-1.2.0 workspace. Do not edit it.

| Run | Workspace | Idea | Notes |
|---|---|---|---|
| #1 | `proposal-draft/` | Proposal drafts from discovery-call notes (solo consultants) | F FAILED by gatekeeper; 3 mechanical defects found and fixed in-run |
| #2 | (external repo) | dev-tools idea | See `plugin/dogfood-report.md` + `plugin/failure-modes.md` |
| #3 | (external repo, `SaaS-idea-brainstorm-test-sayitalive`) | VN wedding invitations | First run from a real marketplace install |
