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
- **A cause is a claim too — do not narrate one you did not check** (dogfood finding, run #2). Stating *why* something happened — a lost agent run, a truncated file, a failed write, a missing report — is an evidence claim about this workspace, and the same rule applies: check it, or say you did not. Three run-#2 examples, all with the right action and the wrong story: "the transcript is 0 bytes, nothing recoverable" (six sidechain transcripts totalling ~1.7 MB existed, one holding a completed tier scan); "the gatekeeper could not persist its own report, its toolset is read-only" (true that it is read-only, but the persistence step belongs to gate-check, so the real cause was spawning it async and returning first); "that was my last edit failing to complete" (the user had truncated the file deliberately). Before asserting a cause, read the thing you are blaming. If you cannot, write `[UNVERIFIED CAUSE]` and name what would settle it. **Accepting blame is not a neutral default** — a wrong cause sends the next session to fix the wrong thing, and inside an append-only journal it cannot be taken back.

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

**Promotion is a checked operation — qualifiers travel with the claim or the claim does not travel** (dogfood finding, run #2). Claims move: raw trail → artifact → summary → journal → pack. Nobody lies at any hop; each hop drops a qualifier while the sentence survives, and the end of the chain reads as established fact. Rules for every promotion:

- **The caveat moves with the number.** If the raw source says the measure is confounded, the artifact says so too, in the same place a reader would act on it. Run #2: `private/scan-raw` carried *"HN points measure launch-marketing skill and title luck as much as demand"*; the artifact promoted the multiple and left the caveat behind, and the founder made a market-type call on the stripped version. A caveat sitting only where nobody uses it is **decorative** — worse than absent, because it buys credibility for a claim it never actually restrains.
- **Derived numbers carry their arithmetic inline.** Any ratio/multiple/percentage shows its inputs and the comparison sets next to it, so recomputation is possible without reopening the raw trail. A round number with no visible derivation is a defect regardless of whether it happens to be right.
- **Never restate an artifact more confidently than the artifact.** When summarizing in chat, the artifact is the ceiling. Run #2 said "6 plausibly tier 4" in conversation while `beachhead-icp.md` said "**0 confirmed**" — and the *artifact* was the honest one. Nothing downstream can catch this: the gatekeeper reads files, not conversations. If you cannot support a sentence by pointing at a file, do not say it.
- **A fact and the inference riding on it are two claims.** Promote them separately and grade them separately: `simonw/runbook.md has 0 stars` (checkable) is not `an author with unusual distribution built this and it drew nothing` (refuted by `created_at` — it was an import). Killing the inference must not silently kill the fact, and keeping the fact must not resurrect the inference.

## 5. Gate discipline

Gates: F (framing) → C (competitive) → V1 (problem) → V2 (solution) → V3 (money) → R1 (feasibility) ∥ R2 (value) → P (positioning) → LOCK (scope) → BP (implementation blueprint — post-LOCK, pre-build). Stage 3 (R1/R2) runs in parallel with stage 2 when feasibility is a deadly assumption (always true for AI-core products). BP is the one post-LOCK gate: stage 6 refines the locked pack into a build-ready spec set — it **refines, never expands**, and never changes any validation gate's state or the pack label (its contract and state placement are in the `method-rules-gate-contracts` and `method-rules-state-schema` skills).

- A failed gate returns work to the **previous** gate with the new data. Never proceed on a failed assumption.
- In **analysis mode**, gates V2, V3, R2 — and R1 when representative real data is unobtainable — may be **accepted-as-open**: honestly recorded as untested assumptions with a ready-to-run kit (for R1: a feasibility-risk dossier + data-acquisition plan). An open gate is not a passed gate — the final pack is a *Hypothesis* MVP Pack, and **R1 open downgrades it further to *Pre-feasibility*** (see gate-contracts predicate); its language must say so.
- Gate checks are three-layered: formal checks (schema, thresholds) → **gatekeeper agent** (adversarial, fresh context) → user approval checkpoint (skippable only when `auto_continue: true` in state).

## 6. Files are the record

Chat is ephemeral; context gets compacted. Every working session ends with artifacts written to `ideas/<slug>/` and `state.json` updated. Never leave a conclusion only in conversation. Do not assume any session-start summary is present — always read `state.json` before acting.

Material decisions have one home: **`decision-log.md` (append-only)** — gate verdicts with gatekeeper findings, pivots (segment/problem/solution), mode switches, threshold revisions, spends, market verdicts. History is never rewritten; artifacts show current truth, the log shows how we got there. A stopped idea gets a **`post-mortem.md`** so the learning outlives the idea.

Append-only cuts both ways: it protects real history and it **freezes mistakes**. A journal row that asserts a cause must either say what was inspected to establish it, or carry `[UNVERIFIED CAUSE]` (rule 1) — a confident wrong cause in this file is permanent and only correctable by a further row, which every later reader must then notice. Correct a bad row by **appending** a correction that names the row it supersedes and states the corrected reading; never edit it in place (the hook enforces this, and asking for an in-place exception should be rare enough to feel wrong).

## 7. Outward-action policy & privacy

Every action that leaves the machine or spends money — deploying anything public, sending any outreach/email, publishing a payment link, any ad spend, delivering pilot output to a real contact — requires: (a) explicit per-action user approval (auto_continue never covers outward actions), (b) budget preflight against `state.budget` for paid actions, (c) a journaled row (spend/outreach) in decision-log.md afterward.

Privacy: real names, contact details, and payment identities live ONLY in `ideas/<slug>/private/` (self-protected by its own `.gitignore`). All public artifacts use pseudonymous ids (`P1`, `P2`, …) mapped in `private/contacts.md`. **A pseudonym also has to survive the rest of the artifact**: a distinctive price, a verbatim quote, or a unique feature description re-identifies the entity as reliably as its name. Keep identifying evidence strings in `private/`; public artifacts carry a generalised description plus the pseudonym. (Run #3's own gatekeeper: *"Pseudonymity is nominal"* — the public file paired each pseudonym with the exact evidence string used to establish it.) Real customer data used by a spike requires a `data-manifest.md` row first.

**Participant-data lifecycle** — where the material lives is only half of it; what may be done with it, for how long, is the other half. Any interactive contact (interview, mock session, pilot delivery) gets a row in `private/participant-data-manifest.md` **before** their material enters any artifact: consent basis (what they were actually told), what was recorded, allowed use, retention deadline, withdrawal state. The non-sensitive index `{duty_id, participant_id, delete_by, status, kind}` — a closed key set, nothing else — is mirrored into `state.json.privacy.retention_duties` so a due date is something the system can surface — session-start and `status` raise overdue duties, and gate checks block reuse or publication of overdue material. **Withdrawal** means: stop using it, and exclude that session from every denominator (excluded sessions are always listed, never silently dropped). **Deletion is never automatic** — it needs explicit approval over the exact files, then a disposition row. And state the limit honestly: a local plugin cannot guarantee calendar-time deletion if nobody opens it; the deadline is an obligation with a named human owner, not an enforced guarantee. Never claim data was deleted without a disposition record.

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

## 10. Post-LOCK maintenance — load on demand, not by default

The validation pipeline ends at LOCK; the idea does not. Between LOCK and the first line of product
code sits **stage 6 (implementation blueprint, gate BP)** — pipeline-phase work with its own skill;
it coexists with maintenance rules (the pack stays read-only, drift boundary applies) without needing
them loaded. Beyond that, the normative law is
the `method-rules-maintenance-rules` skill — **291 lines that pipeline-phase work never needs**.
Loading it on every stage spent 40% of this bundle on rules that do not apply, and the bundle is the
enforcement substrate: 56% of this plugin's requirements are enforced by an agent *reading* these
files, so what is in context IS what is enforced (`node scripts/coverage-report.js`).

**Load `method-rules-maintenance-rules` skill only when one of these is true** — otherwise these five lines are all
you need:

1. you are running `declare-drift`, `reconcile`, or `run-validation` (each loads it itself);
2. the artifact you are touching declares `phase: maintenance`;
3. a cycle other than the one you are working in is `locked` and you need its rules.

The six facts pipeline work must know without opening it: gate-locked artifacts and the MVP pack are
**never edited** (current truth lives in versioned `current-baseline-vN` projections) · authority is
claim-specific (charter → intent, observations → implemented reality, graded evidence → empirical
claims) · **observed reality may contradict, never confirm** · singleton gates are never reset
post-LOCK — scoped validation runs and new cycles carry all post-LOCK verification · drift declared
but not yet reconciled **blocks** pack issuing/relabeling, validation runs, and `switch-mode`
(gate-check enforces this boundary inline — see its Drift boundary step, which needs no other reading)
· **a locked blueprint is amended, never edited**: build-time spec defects/gaps go through the
`amend-blueprint` skill (immutable `ba-NNN` record + append-only amendment log, founder-answered scope
test), and pack-level changes still route to declare-drift — current implementation truth = locked
blueprint + amendment log.

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
Every gate is satisfied only by evidence meeting its own predicate in the `method-rules-gate-contracts` skill. Transferred
evidence enters as a normal ledger row, cited where it is reused, with its original scope intact —
and if it contradicts a gate that already passed, it is grounds to reopen, not grounds to re-bless.
(Post-LOCK, the same rule appears as claim-status discipline in maintenance-rules §3.)

## 13. Two identical failures, then stop

When the same blocker or failure recurs **twice with no new evidence between attempts**, stop
retrying: record the blocker, the exact evidence condition that would unblock it, and who can supply
it — then return control to the founder. Applies to unreachable sources, failed probes, mining that
yields nothing new, and gate re-checks that fail the same way. Repeating a loop is not diligence, and
a third attempt with identical inputs is not new information.

## 12. Language

Answer, and write every artifact, in the **founder's language** — detect it from their first message and record it as `state.language`. Do not answer a Vietnamese founder in English and wait to be asked; a founder who cannot read the reply cannot correct it, and the whole method depends on them correcting you.

- **Artifact bodies, headings, and journal rows follow `state.language`.** Template headings are translated, not left in English beside a translated body.
- **JSON carries full UTF-8, diacritics intact.** Never strip accents when writing `state.json` — run #3 produced `.md` files in correct Vietnamese beside a `state.json` reading `"Blocker duy nhat ... chua xac minh tier"`, which is harder to read and impossible to grep against the artifacts it indexes.
- Keep the pipeline's **fixed vocabulary** (gate ids, `[GUESS]`, grades A/B/C/D, artifact filenames, frontmatter keys) untranslated — those are identifiers.

## Schemas & contracts

- State file: **load the `method-rules-state-schema` skill (Skill tool)** before creating or updating `state.json`.
- Artifact frontmatter and evidence ledger format: **load the `method-rules-artifact-schema` skill (Skill tool)** before writing any artifact.
- Gate requirements, prerequisites, and the exact pack-verdict predicate: **load the `method-rules-gate-contracts` skill (Skill tool)** before any gate work.
- Post-LOCK rules (mutation policies, claim transitions, reality intake, reconcile transaction, maintenance frontmatter): **load the `method-rules-maintenance-rules` skill (Skill tool)** before any post-LOCK work.
