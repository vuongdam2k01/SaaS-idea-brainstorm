---
name: method-rules
description: Core operating rules for the SaaS idea validation pipeline - evidence grading (A/B/C/D), GUESS labeling, traceability, pre-registered thresholds, gate discipline. Load whenever working on any artifact under ideas/<slug>/ or evaluating evidence for this pipeline.
user-invocable: false
---

# Method rules (non-negotiable, all stages)

## 1. The model is never an evidence source

You may draft, structure, brainstorm, and simulate freely — but anything you generate is a **hypothesis**, never evidence. Evidence comes only from real humans and real data: mined quotes with URLs, user-provided transcripts, real payments, real usage data, real files processed by a spike.

- Content you drafted without a source gets the label `[GUESS]` inline and `evidence_grade: D` treatment.
- Only the user, or a verifiable source, upgrades a `[GUESS]` — never you. Domain rule: user confirmation lifts `[GUESS]` only on **intent** claims; market/behavioral/feasibility claims need graded evidence (the founder confirming their own market guess is not evidence).
- **Session transcripts are never a reality or evidence source**: what you remember building, saying, or reading in a session is unverifiable — implemented reality enters only through source observations (maintenance-rules §5), and evidence only through the ledger.
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

**Participant-data lifecycle** — where the material lives is only half of it; what may be done with it, for how long, is the other half. Any interactive contact (interview, mock session, pilot delivery) gets a row in `private/participant-data-manifest.md` **before** their material enters any artifact: consent basis (what they were actually told), what was recorded, allowed use, retention deadline, withdrawal state. The non-sensitive index `{participant_id, delete_by, status}` is mirrored into `state.json.privacy.retention_duties` so a due date is something the system can surface — session-start and `status` raise overdue duties, and gate checks block reuse or publication of overdue material. **Withdrawal** means: stop using it, and exclude that session from every denominator (excluded sessions are always listed, never silently dropped). **Deletion is never automatic** — it needs explicit approval over the exact files, then a disposition row. And state the limit honestly: a local plugin cannot guarantee calendar-time deletion if nobody opens it; the deadline is an obligation with a named human owner, not an enforced guarantee. Never claim data was deleted without a disposition record.

## 8. Capability degradation ladder

Every task runs at the best available rung — there are exactly **three**: **enhanced-auto** (integration present) → **baseline-auto** (native tools) → **handoff** (prepare a complete kit; the user executes outside; results come back for analysis). Missing integrations never block the pipeline — they change the rung and the resulting evidence grade. Record which rung produced each artifact.

**There is no `simulate` rung** (removed in v1.2.0). Simulation is not an execution capability, it is epistemic provenance: it maps onto grade D / `[GUESS]`, which never enters the ledger and never satisfies a gate (rule 2). A rung named `simulate` invited the reasoning "simulation completed the task". When evidence cannot be obtained, the honest outcomes are a **handoff** or an **accepted-open gate** — never a simulated completion. `handoff-only` is likewise gone: it duplicated `handoff` and the capability's own `status: unavailable|unknown`.

## 9. Founder-intent extraction (the charter)

The founder's will is revealed through exchanges, not stated once. It gets the same evidence discipline as everything else:

- **Signals**: every choice against the model's recommendation, every veto, every threshold override, every free-text constraint, every strong reaction is an intent signal — capture it into `founder-charter.md` at the moment it happens, citing the exchange (gate, date, decision-log row). Signals decay if left in conversation; the charter is their home.
- **Grades of will**: `stated` (founder's explicit words) > `confirmed` (model-inferred, then played back and confirmed) > `[INFERRED]` (model's hypothesis — never governs anything until confirmed). The model may propose what it thinks the founder wants; only the founder removes the `[INFERRED]` tag. Writing the charter from model preference instead of founder signals is the intent-equivalent of fabricating evidence.
- **Playback ritual**: at every gate approval, play back the charter deltas since the last gate ("here is what I learned about how you decide — correct?"). Extraction without confirmation is imposition.
- **Two layers**: *invariants* (non-negotiables, values, company-shape, ethical lines — changed only by explicit ceremony, journaled) vs *revisable preferences* (trade-off rules updated by evidence, with history).
- **Structured items**: every belief/preference statement in the charter — invariants, preference rules, anti-goals, taste notes, not just invariants — is a structured item: `| id | founder's exact words | model paraphrase | grade | source (gate/date/journal row) | confirmed date | supersedes |`. Without exact-quote + supersession fields, the model can slowly rewrite intent while believing it is summarizing it. Will-overrides use a related but distinct row shape (they index a `decision-log` event, not a standing belief — see the template).
- **Will vs evidence conflicts** are never silently resolved: when the founder decides against the evidence, record a `will-override` row in decision-log and mark the affected claims. **Boundary (gate-contracts)**: a will-override never upgrades evidence, alters a metric, flips FAIL to PASS, or satisfies the pack predicate — building against a failed mandatory gate produces an explicit *Unvalidated Build Decision* artifact, and gate states stay truthful. Invariant changes require an `invariant-change` journal row (exact old/new wording, founder approval) even while the charter is draft.

## 10. Post-LOCK maintenance (drift, reconcile, cycles)

The pipeline ends at LOCK; the idea does not. After LOCK, [maintenance-rules.md](maintenance-rules.md) is normative:

- Every artifact has one **mutation policy** (`append-only` | `versioned-projection` | `immutable-snapshot`); gate-locked artifacts and the MVP pack are never edited — current truth lives in versioned `current-baseline-vN` projections with a head pointer in state.
- **Authority is claim-specific** (charter → intent; source observations → implemented reality; graded evidence → empirical claims; the cycle's LOCK contract → build obligations). No document class globally outranks another.
- Drift is declared any time (`declare-drift`), reconciled on demand (`reconcile`) — maintenance is event-driven, not scheduled. While declared drift is newer than the last completed reconcile, pack issuing/relabeling, post-LOCK validation runs, and switch-mode are **blocked**.
- **Observed reality may contradict, never confirm**: post-hoc data can set `contradicted-retro` (or refute a universal claim with a verified counterexample) but a claim reaches `supported` only through a validation run whose spec was signed before its confirmation window opened.
- Singleton gates are never reset post-LOCK; scoped **validation runs** (and, for pack-predicate-level drift, a **new cycle**) carry all post-LOCK verification.

## 11. Outward claim preflight (every word that leaves the machine)

Anything the pipeline sends outward — landing copy, pre-sell pitch, outreach message, pricing page, ad
headline, pitch tested on a real person — is inventoried claim by claim before it goes, with one
`publication_disposition` each:

| Disposition | Meaning |
|---|---|
| `publish-as-fact` | directly supported within its stated scope; the support is cited |
| `publish-with-qualification` | true only with an explicit condition, which must appear in the copy itself |
| `test-as-proposition` | an unproven proposition, framed as an offer/intent — legitimate to test |
| `do-not-publish` | conflicts with evidence, or would state something we cannot support |

**Testing propositions is the point of V2 — it is not the thing being restricted.** A landing page
necessarily proposes something not yet proven; that is `test-as-proposition`, framed as what the
product will do, not as an established result. What is forbidden is the fabricated *support*:
invented customer results or testimonials, quantitative outcomes with no measurement behind them,
guarantees, security/compliance/legal assurances, roadmap items written in the present tense, and
internal test numbers presented as universal outcomes. A qualification may not be weakened into a
"may" or a footnote — if the evidence is not there, the claim goes or the unknown is stated plainly.

Derived from, and never writing back to, the claim's `epistemic_status` (maintenance-rules §3):
`supported` → fact or qualified, only inside its `applies_to`; `guess` → proposition or blocked;
`contradicted-retro` → blocked pending disposition; `refuted` → blocked except as explicitly
historical reporting; `retired` → blocked as a current proposition. Choosing to test something as a
proposition does not make it better supported.

Enforced at **V2** (before anything deploys outward) and again at **P/LOCK** (the pack must not
carry stronger language than its grades support). Truthfulness is semantic, so this is a gate
predicate and a template obligation, never a hook check.

## 12. Cross-domain evidence never recertifies

Evidence gathered for one gate may **inform or reopen** another; it can never **pass** it. A landing
conversion (V2 evidence) does not establish willingness to pay (V3); an eval score (R1) does not
establish delivered value (R2); a usability observation does not establish problem prevalence (V1).
Every gate is satisfied only by evidence meeting its own predicate in gate-contracts.md. Transferred
evidence enters as a normal ledger row, cited where it is reused, with its original scope intact —
and if it contradicts a gate that already passed, it is grounds to reopen, not grounds to re-bless.
(Post-LOCK, the same rule appears as claim-status discipline in maintenance-rules §3.)

## 13. Two identical failures, then stop

When the same blocker or failure recurs **twice with no new evidence between attempts**, stop
retrying: record the blocker, the exact evidence condition that would unblock it, and who can supply
it — then return control to the founder. Applies to unreachable sources, failed probes, mining that
yields nothing new, and gate re-checks that fail the same way. Repeating a loop is not diligence, and
a third attempt with identical inputs is not new information.

## Schemas & contracts

- State file: read [state-schema.md](state-schema.md) before creating or updating `state.json`.
- Artifact frontmatter and evidence ledger format: read [artifact-schema.md](artifact-schema.md) before writing any artifact.
- Gate requirements, prerequisites, and the exact pack-verdict predicate: read [gate-contracts.md](gate-contracts.md) before any gate work.
- Post-LOCK rules (mutation policies, claim transitions, reality intake, reconcile transaction, maintenance frontmatter): read [maintenance-rules.md](maintenance-rules.md) before any post-LOCK work.
