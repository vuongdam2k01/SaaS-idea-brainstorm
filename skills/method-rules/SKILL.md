---
name: method-rules
description: Core operating rules for the SaaS idea validation pipeline - evidence grading (A/B/C/D), GUESS labeling, traceability, pre-registered thresholds, gate discipline. Load whenever working on any artifact under ideas/<slug>/ or evaluating evidence for this pipeline.
user-invocable: false
---

# Method rules (non-negotiable, all stages)

## 1. The model is never an evidence source

You may draft, structure, brainstorm, and simulate freely — but anything you generate is a **hypothesis**, never evidence. Evidence comes only from real humans and real data: mined quotes with URLs, user-provided transcripts, real payments, real usage data, real files processed by a spike.

- Content you drafted without a source gets the label `[GUESS]` inline and `evidence_grade: D` treatment.
- Only the user, or a verifiable source, upgrades a `[GUESS]` — never you.
- If the user asks you to "just fill in" an evidence field (interview results, commitments, names of real people you did not find in a real source): refuse, explain the rule, and offer the legitimate alternatives (mining with sources, or a handoff kit the user executes).

## 2. Evidence grades — strictly A/B/C/D, no variants

| Grade | Meaning | Examples |
|---|---|---|
| **A** | Real money or real interactive commitment | Payment/pre-order, signed pilot, answered outreach interview |
| **B** | Real human words/behavior, non-interactive | Mined community posts, 1-3★ reviews, survey answers, panel tests, measured pilot outcomes |
| **C** | Anonymous measured behavior on real usage | Landing traffic, pricing-click, A/B results, spike metrics on real customer data |
| **D** | Model-generated | Simulated interviews, personas, self-consistency checks, **the ChatGPT-gap test's own prompting** (model output = D; only real customers' attempts are B/C) |

Modifiers like `A-`/`B+`/`C-` are forbidden — gate floors cannot compare them. Nuance goes into separate ledger fields (`interaction`, `judge_type`, notes), never into the grade. Grade D generates hypotheses and sharpens questions ONLY: it never enters the evidence ledger and never counts toward any gate.

## 3. Thresholds before tests

Every experiment gets its pass/fail threshold written into `state.json.thresholds` (or the artifact's Test Card) **before** the experiment runs. `thresholds.signed_date` is set only by gate-check's Layer 0 F-signing ceremony (never by stage 0 itself) — stage 0 drafts and proposes thresholds; signing is a distinct commitment step at the first F check. Changing a signed threshold afterward requires explicit user approval and a recorded revision. Kill criteria use the **state + date** form: "if not [measurable state X] by [date Y] → stop".

## 4. Traceability

Every claim in downstream artifacts (solution directions, positioning, MVP scope) must reference evidence ledger IDs (E1, E2, ...). A core-loop step or positioning claim that traces to nothing is a cut candidate, flagged explicitly.

## 5. Gate discipline

Gates: F (framing) → C (competitive) → V1 (problem) → V2 (solution) → V3 (money) → R1 (feasibility) ∥ R2 (value) → P (positioning) → LOCK (scope). Stage 3 (R1/R2) runs in parallel with stage 2 when feasibility is a deadly assumption (always true for AI-core products).

- A failed gate returns work to the **previous** gate with the new data. Never proceed on a failed assumption.
- In **analysis mode**, gates V2, V3, R2 — and R1 when representative real data is unobtainable — may be **accepted-as-open**: honestly recorded as untested assumptions with a ready-to-run kit (for R1: a feasibility-risk dossier + data-acquisition plan). An open gate is not a passed gate — the final pack is a *Hypothesis* MVP Pack, and **R1 open downgrades it further to *Pre-feasibility*** (see gate-contracts predicate); its language must say so.
- Gate checks are three-layered: formal checks (schema, thresholds) → **gatekeeper agent** (adversarial, fresh context) → user approval checkpoint (skippable only when `auto_continue: true` in state).

## 6. Files are the record

Chat is ephemeral; context gets compacted. Every working session ends with artifacts written to `ideas/<slug>/` and `state.json` updated. Never leave a conclusion only in conversation. Do not assume any session-start summary is present — always read `state.json` before acting.

Material decisions have one home: **`decision-log.md` (append-only)** — gate verdicts with gatekeeper findings, pivots (segment/problem/solution), mode switches, threshold revisions, spends, market verdicts. History is never rewritten; artifacts show current truth, the log shows how we got there. A stopped idea gets a **`post-mortem.md`** so the learning outlives the idea.

## 7. Outward-action policy & privacy

Every action that leaves the machine or spends money — deploying anything public, sending any outreach/email, publishing a payment link, any ad spend, delivering pilot output to a real contact — requires: (a) explicit per-action user approval (auto_continue never covers outward actions), (b) budget preflight against `state.budget` for paid actions, (c) a journaled row (spend/outreach) in decision-log.md afterward.

Privacy: real names, contact details, and payment identities live ONLY in `ideas/<slug>/private/` (self-protected by its own `.gitignore`). All public artifacts use pseudonymous ids (`P1`, `P2`, …) mapped in `private/contacts.md`. Real customer data used by a spike requires a `data-manifest.md` row first.

## 8. Capability degradation ladder

Every task runs at the best available rung: **enhanced-auto** (integration present) → **baseline-auto** (native tools) → **handoff** (prepare a complete kit; the user executes outside; results come back for analysis) → **simulate** (grade D, hypothesis only). Missing integrations never block the pipeline — they change the rung and the resulting evidence grade. Record which rung produced each artifact.

## 9. Founder-intent extraction (the charter)

The founder's will is revealed through exchanges, not stated once. It gets the same evidence discipline as everything else:

- **Signals**: every choice against the model's recommendation, every veto, every threshold override, every free-text constraint, every strong reaction is an intent signal — capture it into `founder-charter.md` at the moment it happens, citing the exchange (gate, date, decision-log row). Signals decay if left in conversation; the charter is their home.
- **Grades of will**: `stated` (founder's explicit words) > `confirmed` (model-inferred, then played back and confirmed) > `[INFERRED]` (model's hypothesis — never governs anything until confirmed). The model may propose what it thinks the founder wants; only the founder removes the `[INFERRED]` tag. Writing the charter from model preference instead of founder signals is the intent-equivalent of fabricating evidence.
- **Playback ritual**: at every gate approval, play back the charter deltas since the last gate ("here is what I learned about how you decide — correct?"). Extraction without confirmation is imposition.
- **Two layers**: *invariants* (non-negotiables, values, company-shape, ethical lines — changed only by explicit ceremony, journaled) vs *revisable preferences* (trade-off rules updated by evidence, with history).
- **Structured items**: every belief/preference statement in the charter — invariants, preference rules, anti-goals, taste notes, not just invariants — is a structured item: `| id | founder's exact words | model paraphrase | grade | source (gate/date/journal row) | confirmed date | supersedes |`. Without exact-quote + supersession fields, the model can slowly rewrite intent while believing it is summarizing it. Will-overrides use a related but distinct row shape (they index a `decision-log` event, not a standing belief — see the template).
- **Will vs evidence conflicts** are never silently resolved: when the founder decides against the evidence, record a `will-override` row in decision-log and mark the affected claims. **Boundary (gate-contracts)**: a will-override never upgrades evidence, alters a metric, flips FAIL to PASS, or satisfies the pack predicate — building against a failed mandatory gate produces an explicit *Unvalidated Build Decision* artifact, and gate states stay truthful. Invariant changes require an `invariant-change` journal row (exact old/new wording, founder approval) even while the charter is draft.

## Schemas & contracts

- State file: read [state-schema.md](state-schema.md) before creating or updating `state.json`.
- Artifact frontmatter and evidence ledger format: read [artifact-schema.md](artifact-schema.md) before writing any artifact.
- Gate requirements, prerequisites, and the exact pack-verdict predicate: read [gate-contracts.md](gate-contracts.md) before any gate work.
