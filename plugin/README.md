# plugin/ — design docs index (read this first)

Fourteen documents accumulated across design rounds, reviews and dogfood runs — three of them used to
say "CURRENT DIRECTION is some other file", which meant no file was current (conflicts-inventory C4).
This index is the fix: it says which files are **live** (kept true as the plugin changes) and which
are **history** (frozen records of a moment — internally dated claims, superseded numbers and all;
they are deliberately not rewritten).

**The design's single normative source is `skills/`** (see the note at the top of
`process/pipeline.md`). Everything in this directory is explanation, review record, or working state
around that source. Version numbers inside historical docs refer to the version they were written
against — the only current version number lives in `.claude-plugin/plugin.json` (C5).

## Live (kept current)

| File | What it is |
|---|---|
| [failure-modes.md](failure-modes.md) | Registry of observed failure shapes + what deterministically blocks each. **Updated at the end of every dogfood run** (rule in its header) |
| [outstanding-work.md](outstanding-work.md) | The open debt list — what is deferred and why |
| [conflicts-inventory.md](conflicts-inventory.md) | The 2026-07-30 multi-session conflict catalogue **plus its resolution log** — where every C/V/D/P/X item ended up |
| [codex-parity.md](codex-parity.md) | What is shared vs Claude-specific for the Codex port; `sync-codex-agents.js --check` enforces the agent-body half |

## History (frozen records — do not update, do not treat as current design)

| File | Moment it records |
|---|---|
| [plugin-spec.md](plugin-spec.md) | The build spec as of the 2026-07-29 rebuild, with its v1.1 addendum |
| [codex-review.md](codex-review.md) | Adversarial review transcript rounds with Codex |
| [dogfood-report.md](dogfood-report.md) | Dogfood run #1 report (+ R5 corrections). Run registry: `dogfood/README.md` |
| [mechanics-run.md](mechanics-run.md) | Run #2 mechanics log |
| [solo-dev-comparison.md](solo-dev-comparison.md) | Comparison against the hermes solo-dev agent team |
| [design-assessment.md](design-assessment.md) | Early design assessment |
| [autonomy-design.md](autonomy-design.md) | Superseded autonomous-funnel design (now opt-in only) |
| [stage-support-map.md](stage-support-map.md) | Superseded; retained as reference for collaborative mode |
| [capability-matrix.md](capability-matrix.md) | Superseded by plugin-spec |
| [maintenance-design.md](maintenance-design.md) | Post-LOCK maintenance layer design, implemented in v1.2.0 |
