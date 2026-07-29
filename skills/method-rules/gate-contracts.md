# Gate contracts (normative, v1.1.0)

The single source of truth for what each gate requires — a **normative, LLM-interpreted contract with deterministic hook checks** (a standalone parser/evaluator is v1.2 scope). Gate-check enforces these BEFORE the gatekeeper runs. `requires` = gates that must be `passed` (or `open` where allowed) first — verdicts violating prerequisites are rejected.

| Gate | Requires | Required artifacts (acceptable statuses) | Metric / check | OPEN allowed? |
|---|---|---|---|---|
| **F** | — | idea-brief (ready), **founder-charter (present, seeded, ready for playback)**, problem-hypothesis (ready, no-solution + refutation condition), lean-canvas (ready, labeled), beachhead-icp (ready, **target 20 on-segment tier-4/5 pseudonymous prospects, hard minimum 15 to pass** — sub-tier entries quarantined and uncounted; 15–19 qualifying PASSES but Layer 2/3 must log a mandatory reach-risk finding; fewer than 15 qualifying is a Layer 1 formal FAIL, full stop — a founder acknowledging the shortfall does NOT pass it, that would be a will-override, which never satisfies a gate per the boundary below), assumption-map (ready, every deadly assumption has Test Card + threshold — a deferred threshold is legal ONLY with an explicit load-by date in its kill criterion), kill-criteria (draft → **locked by the F signing ceremony**), decision-log exists | Signing ceremony (gate-check Layer 0, first F check only) sets signed_date + locks kill-criteria + appends threshold-snapshot; Layer 1 then verifies it. Later gates only verify | No |
| **C** | F | competitive-map (**draft** — stays draft by design until stage-2 calibration), review-mining (**ready** — stage 1 promotes it after clustering completes) | 5 tiers populated w/ verified sources; market verdict recorded in decision-log | No |
| **V1** | C | evidence-ledger (ready), interview-kit (ready) | past-behavior % ≥ threshold on the **pre-registered neutral sampling frame** (see stage-2); honest denominator ≥ v1_min_sample | No |
| **V2** | V1 | solution-directions (ready), landing-kit (ready) | one direction wins + nameable value layer + behavioral signal ≥ floor | Yes (analysis mode) |
| **V3** | V2 (passed or open) | presell-kit (ready) | ≥ v3_min_commitments real-money commitments outside personal network (grade A only) | Yes (analysis mode) |
| **R1** | F (may start right after F; runs parallel to stage 2) | **PASS requires**: spike/ + data-manifest, `error-analysis/summary.md` (ready; `batch-NNN.md` worker files are frontmatter-exempt trace data), eval/ with results, promise-scope (ready). **OPEN requires instead**: feasibility-risk dossier (promise-scope risks section, ready) + `data-acquisition-plan.md` (ready) + `eval/README.md` stating why no evaluation was possible | PASS: eval ≥ r1_eval_pass_pct on real data + marginal cost < price. Subjective-quality PASS additionally requires a human-labeled anchor set (see evidence rules) | Yes — R1 open ⇒ pack verdict downgrades to **Pre-feasibility** |
| **R2** | R1 (passed or open), V3 (passed or open) | concierge-kit (ready with delivery log or dry-run) | outcomes match promise + ≥1 unprompted return | Yes (analysis mode) |
| **P** | **V1 + V3, R1, R2 all resolved** (passed or open — positioning consumes R2 proof and V3 pricing) | positioning (ready→**locked** on pass) | alternatives 100% ledger-traced; copy-test survived; pitch tested or explicitly UNTESTED | No (thesis label instead) |
| **LOCK** | V2, V3, R1, R2, P all resolved (passed/open per rules above) | mvp-pack complete & **self-contained** (see below), definition-of-done (**`ready`, dated/frozen — gate-check Layer 3 promotes it to `locked` on PASS, not stage 5**), **founder-charter (locked via gate-check Layer 0's non-skippable final playback ceremony, run BEFORE Layer 1 — zero `[INFERRED]` items, decision protocol completed)** | cold-start test passes; every core-loop step traced; cut list non-empty | No |

## Pack verdict predicate (exact, no ambiguity)

- **Validated MVP Pack** = V1,V2,V3,R1,R2,P,LOCK all `passed` AND V3 evidence grade A.
- **Hypothesis MVP Pack** = LOCK reached, R1 `passed`, and ≥1 of V2/V3/R2 `open`.
- **Pre-feasibility Hypothesis Pack** = LOCK reached with R1 `open` (feasibility itself unproven — the pack must say so on line 1).
- Anything else = pipeline not finished; no pack is issued.

## Self-contained pack requirement (checked at LOCK)

`mvp-pack/` must contain **copies**, not references. Contents depend on R1's verdict:
- **R1 passed** → `mvp-pack/eval/` = snapshot of the harness + results + threshold.
- **R1 open** (Pre-feasibility path) → `mvp-pack/eval/` = copies of `eval/README.md` (why no evaluation was possible), `data-acquisition-plan.md`, and the feasibility-risk dossier — a Pre-feasibility pack ships its risk file, not a nonexistent harness.
- Always: `mvp-pack/experiments/{landing,presell,concierge}/` snapshots of open-gate kits, and **`mvp-pack/founder-charter.md`** (locked, post-final-playback).
Cold-start test runs against a copy of `mvp-pack/` alone in a clean directory.

## Will-override boundary (evidence firewall for intent)

A `will-override` NEVER upgrades evidence, alters a metric, turns FAIL into PASS, or satisfies any part of the pack predicate. If the founder chooses to build despite a failed mandatory gate, the pipeline produces an explicit **Unvalidated Build Decision** exit artifact (journaled, charter-referenced) — gate states and the pack verdict remain truthful. Invariant changes require an `invariant-change` journal row with exact old/new wording + founder approval, even while the charter is still `draft`.

## Evidence rules for R1 quality claims

- **Deterministic metrics computed over representative real data = grade C** (schema validity, exact-match, latency, cost — code-checked).
- **Subjective quality judged by an LLM without human-labeled anchors = grade D, diagnostic only** — it never satisfies the PASS metric (one model grading another model's output is model-generated evidence; the "model is never an evidence source" rule applies).
- Subjective-quality PASS requires either a **human-labeled anchor set** (user labels a held-out sample; judge must reach ~75–90% agreement before its verdicts count as C) or an **external outcome measurement** (R2 real-usage results). Without either → R1 cannot PASS on subjective quality; accept OPEN and produce the Pre-feasibility pack.

## Artifact lifecycle ownership (draft → ready → locked)

Each artifact has one promoting owner: the stage skill that completes it promotes `draft → ready`; gate-check promotes `ready → locked` where the contract says so (kill-criteria at F sign-off, positioning at P, DoD + mvp-spec + **founder-charter (via gate-check's Layer 0 final playback ceremony, which runs and locks the charter BEFORE Layer 1 checks it)** at LOCK). Exception by design: competitive-map stays `draft` through gate C and is promoted to `ready` by stage 2 after customer-word calibration. No other transitions are legal; hooks escalate edits to `locked` files.

## Signing snapshot (hook-independent integrity)

When thresholds are signed (gate F) the gate-check appends to decision-log: `threshold-snapshot | {json of thresholds}`. Every later gate-check recomputes and compares current thresholds against the latest snapshot + approved revisions; mismatch = blocker finding regardless of whether hooks were active.
