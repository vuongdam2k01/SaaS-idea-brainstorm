# state.json schema (v1.1.0)

Location: `ideas/<slug>/state.json` in the **user's working repository** (never inside the plugin). Create via new-idea; update after every meaningful step. Dates are `YYYY-MM-DD`. Schema changes bump `schema_version`; skills reading an older version migrate it forward and journal the migration.

```json
{
  "schema_version": "1.1.0",
  "pipeline_version": "1.1.0",
  "idea": "<slug>",
  "title": "Short human title",
  "created": "YYYY-MM-DD",
  "updated": "YYYY-MM-DD",
  "mode": "analysis",
  "auto_continue": false,
  "active": ["0.0"],
  "gates": {
    "F":    { "status": "pending", "evidence_floor": "none", "passed_date": null, "notes": "" },
    "C":    { "status": "pending", "evidence_floor": "B",    "passed_date": null, "notes": "" },
    "V1":   { "status": "pending", "evidence_floor": "B",    "passed_date": null, "notes": "" },
    "V2":   { "status": "pending", "evidence_floor": "C",    "passed_date": null, "notes": "" },
    "V3":   { "status": "pending", "evidence_floor": "A",    "passed_date": null, "notes": "" },
    "R1":   { "status": "pending", "evidence_floor": "C",    "passed_date": null, "notes": "" },
    "R2":   { "status": "pending", "evidence_floor": "B",    "passed_date": null, "notes": "" },
    "P":    { "status": "pending", "evidence_floor": "B",    "passed_date": null, "notes": "" },
    "LOCK": { "status": "pending", "evidence_floor": "n/a",  "passed_date": null, "notes": "" }
  },
  "thresholds": {
    "signed_date": null,
    "v1_past_behavior_pct": 60,
    "v1_min_sample": 12,
    "v3_min_commitments": 5,
    "r1_eval_pass_pct": null,
    "custom": {},
    "revisions": []
  },
  "kill_criteria": [
    { "id": "K1", "desired_state": "verbatim desired outcome from kill-criteria.md", "by_date": "YYYY-MM-DD", "then": "single pre-committed action", "status": "armed" }
  ],
  "budget": { "cap_usd": 0, "spent_usd": 0, "log": [] },
  "capabilities": {
    "last_audit": null,
    "scraping":  { "status": "unknown", "rung": null, "provider": null, "verified_at": null, "probe": null, "note": "" },
    "multi_llm": { "status": "unknown", "rung": null, "provider": null, "verified_at": null, "probe": null, "note": "" },
    "hosting":   { "status": "unknown", "rung": null, "provider": null, "verified_at": null, "probe": null, "note": "" },
    "analytics": { "status": "unknown", "rung": null, "provider": null, "verified_at": null, "probe": null, "note": "" },
    "payments":  { "status": "unknown", "rung": null, "provider": null, "verified_at": null, "probe": null, "note": "" },
    "email":     { "status": "unknown", "rung": null, "provider": null, "verified_at": null, "probe": null, "note": "" },
    "ads":       { "status": "unknown", "rung": null, "provider": null, "verified_at": null, "probe": null, "note": "" }
  },
  "waiting_on": [],
  "artifacts": {}
}
```

## Field rules

- **`active[]`** replaces the old scalar `current_stage` (v1.0.0 states are migrated: `current_stage: N` → `active: ["<N>"]`). It lists the task/branch ids currently in progress, e.g. `["2.V1", "3.R1"]` — the pipeline is a DAG (stage 1 starts after 0.1; stage 3 runs parallel to stage 2). Gate ordering itself is enforced by [gate-contracts.md](gate-contracts.md) `Requires`, not by this list.
- `mode`: `"analysis"` (default) | `"market-evidence"`. Switching is done via the `switch-mode` skill only (journaled, kit/capability preconditions checked).
- `gates.*.status`: `pending` | `in_progress` | `passed` | `failed` | `open`. `open` is legal only where gate-contracts allows it (V2, V3, R2, and R1-with-Pre-feasibility-downgrade), analysis mode only.
- `thresholds`: reference defaults above; user may override during stage 0; `signed_date` set at gate F **together with a `threshold-snapshot` row in decision-log.md** (hook-independent integrity — gate-check compares every time). Post-signing edits require a `revisions` entry `{date, field, from, to, reason, user_approved: true}`.
- `capabilities.*.status`: `available` (authenticated functional probe succeeded) | `unavailable` | `unknown`. `rung`: `enhanced-auto` | `baseline-auto` | `handoff-only`. "CLI installed but not authenticated" or "user willing to do it manually" is NEVER `available`.
- `budget.log[]`: `{date, item, usd}` per paid action, mirrored to decision-log; `cap_usd` copied from `${user_config.ads_budget_cap_usd}` at new-idea/setup-audit.
- `kill_criteria[]`: mirror kill-criteria.md rows **verbatim with stable IDs and DESIRED-STATE polarity** (`{id, desired_state, by_date, then, status}`) — never rewrite into trigger-polarity prose (dogfood defect: inverted conditions made the index recommend stopping on success). No invented dates: a criterion without a date in the artifact has none in state. `status`: `armed` | `triggered` | `cleared`; anything armed past `by_date` is surfaced before other work.
- `waiting_on[]`: `{what, since, needed_for}`.
- **Durability**: prefer updating state via `node "${CLAUDE_SKILL_DIR}/../../scripts/state-write.js" <path>` (validates shape, keeps `.bak`, atomic rename — `${CLAUDE_PLUGIN_ROOT}` is NOT substituted in skill content, only `${CLAUDE_SKILL_DIR}` is) when Node is available; otherwise read-modify-write with a self-check re-read. On an agent runtime that doesn't substitute `${CLAUDE_SKILL_DIR}` in skill content (e.g. Codex), resolve the plugin root yourself — locate this file's own directory and go up two levels — before invoking the script. Artifacts are ground truth; state is an index that must be rebuildable from them + decision-log.
- **Migration**: on reading a state whose `schema_version` < 1.1.0 (e.g. it has `current_stage`), migrate it forward immediately (`current_stage: N` → `active: ["<N>"]`, capabilities strings → objects), bump versions, journal a `migration` row in decision-log, then proceed. Never write the old shape. **Security rule**: legacy capability strings — including `"available"` — migrate to `status: "unknown"` pending a fresh authenticated probe; old availability claims are never trusted automatically.
