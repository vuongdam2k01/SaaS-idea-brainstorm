---
name: method-rules-state-schema
description: Canonical state.json schema (v1.2) for the SaaS validation pipeline - exact shape, field rules, statuses, migration, cycles. Load before creating or updating any ideas/<slug>/state.json.
user-invocable: false
---

# state.json schema (v1.2.0)

Location: `ideas/<slug>/state.json` in the **user's working repository** (never inside the plugin). Create via new-idea; update after every meaningful step. Dates are `YYYY-MM-DD` (maintenance timestamps are full ISO-8601). Schema changes bump `schema_version`; skills reading an older version migrate it forward and journal the migration.

```json
{
  "schema_version": "1.2.0",
  "pipeline_version": "1.2.0",
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
    "V3":   { "status": "pending", "evidence_floor": "A",    "evidence_grade_observed": null, "passed_date": null, "notes": "" },
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
  "privacy": {
    "retention_duties": []
  },
  "artifacts": {},
  "cycles": [
    { "id": "C1", "status": "validation", "parent": null, "state": null }
  ],
  "active_cycle": "C1",
  "maintenance": {
    "drift_declared_at": null,
    "active_reconcile": null,
    "last_reconcile": null,
    "current_baseline": null,
    "blocking_claims": [],
    "reality_sources": []
  },
  "health_criteria": [],
  "validation_runs": []
}
```

## Field rules

- **`active[]`** replaces the old scalar `current_stage` (v1.0.0 states are migrated: `current_stage: N` → `active: ["<N>"]`). It lists the task/branch ids currently in progress, e.g. `["2.V1", "3.R1"]` — the pipeline is a DAG (stage 1 starts after 0.1; stage 3 runs parallel to stage 2). Gate ordering itself is enforced by the `method-rules-gate-contracts` skill `Requires`, not by this list.
- `mode`: `"analysis"` (default) | `"market-evidence"`. Switching is done via the `switch-mode` skill only (journaled, kit/capability preconditions checked).
- `gates.*.evidence_grade_observed`: the grade actually backing this gate, recorded when its verdict is written (`A`|`B`|`C`|`none`). Distinct from `evidence_floor`, which is the *requirement* — `scripts/pack-verdict.js` reads the observation, because reading the floor would make every pack look validated. V3's is the one the pack predicate consumes.
- `gates.*.status`: `pending` | `in_progress` | `passed` | `failed` | `open`. `open` is legal only where gate-contracts allows it (V2, V3, R2, and R1-with-Pre-feasibility-downgrade), analysis mode only.
- `thresholds`: reference defaults above; user may override during stage 0; `signed_date` set at gate F **together with a `threshold-snapshot` row in decision-log.md** (hook-independent integrity — gate-check compares every time). Post-signing edits require a `revisions` entry `{date, field, from, to, reason, user_approved: true}`.
- `capabilities.*.status`: `available` (authenticated functional probe succeeded) | `unavailable` | `unknown`. `rung`: `enhanced-auto` | `baseline-auto` | `handoff` — the same three-value vocabulary artifacts use (the `method-rules-artifact-schema` skill). "CLI installed but not authenticated" or "user willing to do it manually" is NEVER `available`; that is `status: unavailable|unknown` with `rung: handoff`. Legacy `handoff-only` values are normalized to `handoff` on next write.
- `budget.log[]`: `{date, item, usd}` per paid action, mirrored to decision-log; `cap_usd` copied from `${user_config.ads_budget_cap_usd}` at new-idea/setup-audit.
- `kill_criteria[]`: mirror kill-criteria.md rows **verbatim with stable IDs and DESIRED-STATE polarity** (`{id, desired_state, by_date, then, status}`) — never rewrite into trigger-polarity prose (dogfood defect: inverted conditions made the index recommend stopping on success). No invented dates: a criterion without a date in the artifact has none in state. `status`: `armed` | `triggered` | `cleared` | `retired` (`retired` only via the LOCK disposition ceremony, which also sets `disposition: {result: retire|carry|replace, date, health_id?}` — runtime state and ceremony result are separate; `cleared` never means "dispositioned"); anything armed past `by_date` is surfaced before other work.
- `waiting_on[]`: `{what, since, needed_for, resume_when, owner, expires_or_recheck_at}`. The last three are what turn "waiting" into something that can end: **`resume_when`** is the exact observable condition that makes work resumable ("transcripts land in private/", "Stripe key provided", "8 replies received"), **`owner`** is who supplies it (`founder` | `plugin` | a named third party), **`expires_or_recheck_at`** is the date to re-check or give up. An entry with none of these is indistinguishable from an abandoned one. **Legacy migration**: a pre-1.2 loose entry (a bare string, or an object without `resume_when`/`owner`) becomes unwritable until enriched — ASK the founder for the resume condition and the owner, or drop the entry as abandoned. Never invent either: a fabricated resume condition is worse than an honest "we do not know what we are waiting for".
- `privacy.retention_duties[]`: non-sensitive index mirroring `private/participant-data-manifest.md` — `{duty_id, participant_id, manifest_ref, delete_by, status: active|due|disposed, kind?}` — a **closed key set**, string values only (an allowlist, because no blacklist covers every way to spell a name), with `duty_id` stable (`D<n>`) so a participant with two duties cannot lose one. **No names, no contact details, no consent text** ever enter state; the manifest in `private/` holds those. Kept apart from `health_criteria` on purpose: product health and a privacy obligation are different semantics with different owners. Overdue entries are surfaced by session-start and by `status`, and block reuse/publication of that participant's material at gate checks. **There is deliberately no `extended` status**: an earlier version had one, every overdue scan excluded it, and so a duty whose extension later expired went silent forever. An extension is an `active` duty with a newly recorded `delete_by` — the deadline moves, the obligation stays visible. **Deletion is never automatic**: it requires explicit approval over the exact files, then a disposition row in the manifest and a `status: disposed` update here. Honest limit: if the founder never opens the plugin, a local tool cannot guarantee calendar-time deletion — the date is an obligation with a named human owner, not an enforced guarantee.
- **Durability**: prefer updating state via `node "${CLAUDE_SKILL_DIR}/../../scripts/state-write.js" <path>` (validates shape, keeps `.bak`, atomic rename — `${CLAUDE_PLUGIN_ROOT}` is NOT substituted in skill content, only `${CLAUDE_SKILL_DIR}` is) when Node is available; otherwise read-modify-write with a self-check re-read. On an agent runtime that doesn't substitute `${CLAUDE_SKILL_DIR}` in skill content (e.g. Codex), resolve the plugin root yourself — locate this file's own directory and go up two levels — before invoking the script. Artifacts are ground truth; state is an index that must be rebuildable from them + decision-log.
- **Migration**: on reading a state whose `schema_version` < 1.1.0 (e.g. it has `current_stage`), migrate it forward immediately (`current_stage: N` → `active: ["<N>"]`, capabilities strings → objects), bump versions, journal a `migration` row in decision-log, then proceed. Never write the old shape. **Security rule**: legacy capability strings — including `"available"` — migrate to `status: "unknown"` pending a fresh authenticated probe; old availability claims are never trusted automatically.

## Post-LOCK fields (v1.2.0 — normative details in the `method-rules-maintenance-rules` skill)

- **`cycles[]`**: root cycle index. `{id, status: framing|validation|locked|stopped, parent, state}`. The FIRST cycle (C1) is stored **inline**: `state: null` means the top-level `gates`/`thresholds`/`kill_criteria`/`active`/`mode`/`waiting_on`/`artifacts` ARE C1's. Later cycles live in fragment files `cycles/<id>/state.json` owning their full operating set: `cycle_id, parent, status, mode, active, gates, thresholds (own signing ceremony), kill_criteria (cycle-scoped), waiting_on, artifacts, validation_runs, updated` — and their pipeline artifacts under `cycles/<id>/` (mirror layout; evidence-ledger/decision-log/charter/private stay idea-root and shared). `active_cycle` names the cycle current work belongs to; every skill resolves the operating cycle first (maintenance-rules §4 "Cycle resolution"). state-write verifies fragment↔root-index correspondence on every fragment write.
- **Freeze rule**: once a cycle's status is `locked` or `stopped`, its ENTIRE owned subtree is frozen — gates, thresholds, cycle kill criteria, active, mode, waiting_on, artifact index — AND its `cycles[]` index entry itself (id/status/parent/state; no removal): mutating the entry first was a proven two-step unfreeze bypass. `state-write.js` rejects both, and rejects any write whose `schema_version` is not current (a 1.1-shaped rewrite of a 1.2 state was a proven downgrade bypass). Singleton gates are NEVER reset or reused post-LOCK; a new cycle gets its own gates object.
- **`maintenance`**: `drift_declared_at` (full ISO-8601 timestamp, set by declare-drift), `active_reconcile` (reconcile_id while a reconcile is in flight), `last_reconcile` (index data only: `{id, completed_at, consumed_through, manifest, intake_authority, drift_dimensions}` — `consumed_through` is the highest drift_id consumed, the AUTHORITATIVE boundary marker; full history lives in manifests + journal), `current_baseline` (head pointer, idea-relative path — updated LAST in the reconcile transaction), `blocking_claims` (claim_ids currently in `contradicted-retro`), `reality_sources` (user-declared locators — see maintenance-rules §5).
- **`health_criteria[]`**: post-LOCK health criteria (state+date form, like kill criteria) written by the LOCK disposition ceremony (`retire|carry|replace`); root-level because they govern the idea, not one cycle. Overdue armed entries are surfaced like kill criteria.
- **`validation_runs[]`**: index only — `{run_id, cycle_id, gate_kind, verdict, report}`; full run specs live in `validation-runs/<run_id>.md`.
- **Hard boundary**: blocked while any inbox drift_id exceeds `last_reconcile.consumed_through` (the exact check skills use); hooks approximate with epoch-parsed timestamp comparison where ties and unparsable values count as PENDING. Blocked: pack issuing/relabeling, post-LOCK validation runs, switch-mode. Investigation and ordinary coding are not.
- **Migration 1.1.0 → 1.2.0**: add the new blocks with defaults/nulls above (`cycles` = inline C1 whose `status` reflects current progress; `active_cycle: "C1"`; `privacy: {retention_duties: []}` — and if interactive contact already happened, populate it from `private/participant-data-manifest.md` rather than leaving it empty, since an empty index reads as "no obligations"); normalize any `handoff-only` capability rung to `handoff`; never fabricate a lock manifest, reconcile history, health criteria, or a retention deadline nobody agreed to. Journal a `migration` row. The `privacy` key stays optional on read: its absence means "no interactive contact recorded yet", never "duties were cleared".
