# Stage 0 — Framing

> **Manual-mode rendering.** The normative producer of these artifact shapes is the plugin skill
> `stage-0-*-templates` (skills win on any disagreement — conflicts-inventory C2). Load-bearing table
> headers here are fixture-checked against the validators by `tests/pipeline-contract-tests.js`.


> Idea: `<name>` · Start date: `<yyyy-mm-dd>`
> Process reference: [pipeline.md — Stage 0](../../process/pipeline.md)

## 0.1. Problem hypothesis (CONTAINS NO SOLUTION)

- **Who:**
- **Context / situation:**
- **Trying to achieve what outcome:**
- **Blocked by what:**
- **Currently paying with what** (hours / money / risk / emotion):
- **Trigger & frequency** (when problem emerges, how often):
- **Disqualifying condition** — "what would I observe to know I'm wrong?":

## 0.2. Lean Canvas — every cell starts `[GUESS]`; only graded evidence (E-id) lifts the tag

| Box | Content | Status | What lifted the tag (E-id / user confirmation) |
|---|---|---|---|
| Problem | | `[GUESS]` | |
| Customer segment | | `[GUESS]` | |
| Unique value | | `[GUESS]` | |
| Solution | | `[GUESS]` | |
| Channels | | `[GUESS]` | |
| Revenue | | `[GUESS]` | |
| Costs | | `[GUESS]` | |
| Key metrics | | `[GUESS]` | |
| Unfair advantage | | `[GUESS]` | |

> Market/behavioral/feasibility cells are lifted ONLY by a ledger id; intent cells (what the
> founder wants) are lifted by explicit user confirmation. The founder confirming their own
> guess about the market does not make it evidence (the `method-rules-artifact-schema` skill).

## 0.3. Market Type

- **Type:** existing / resegmented / brand new
- **Strategic consequences** (how to validate, shape, launch):

## 0.4. Beachhead + ICP + 20 names

### Segment scoring table (1–5 each axis)

| Segment | Pain | Purchase power | Reach accessibility | Decision speed | Total |
|---|---|---|---|---|---|
| | | | | | |

> Constraint: "reach accessibility" cannot be the lowest score of chosen segment.

- **Beachhead chosen:**
- **EarlyVangelist profile** — Blank's 5-tier: (1) has problem / (2) knows they have it / (3) actively seeking solution + timeline / (4) already self-patched / (5) committed or quick to fund. **Only tiers 4–5 are true earlyvangelist** — describe that profile here:

### List of 20 real prospects — **pseudonymous here; identities live only in `private/contacts.md`**

> Privacy rule (method-rules §7): real names, profile URLs and contact details NEVER appear in
> a public artifact. This table uses `P<n>` ids only. Never invent a prospect: fewer than 20
> findable prospects is itself a finding about reach.

| Pid | Segment descriptor (NO real names) | Tier | Behaviour that establishes the tier (verbatim or observation) | Evidence (E-id) | Resolved entity (canonical name/domain — dedup key, pseudonymous) | Observed at (YYYY-MM-DD) | Reach channel (type + whether a reply is plausible) | Funnel status |
|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | not-contacted |

> A tier is an evidence claim: tier 4 means this person **built or imposed** an interim solution — a
> past act, held in the Behaviour cell with its `E-id`. "Is a competitor" and listicle mentions do not
> establish a tier; a public forum handle is not a reach channel; Resolved entity dedups one business
> under two names. With the plugin, `scripts/validate-beachhead.js` checks all of this at gate F.

## 0.5. Assumption Map

| # | "We believe that…" | Type (D/V/F/A) | Critical? | Uncertainty level | Cheapest test to DISPROVE | Pass/fail threshold (set first) | Status |
|---|---|---|---|---|---|---|---|
| A1 | | | | | | | untested |

> D = Desirability · V = Viability · F = Feasibility · A = Adoption. Core standard is D/F/V; consider adding Usability and Ethical (Torres). Don't argue category — goal is to generate across all types.
> Each test written as Test Card: *We believe that / To verify we will / And measure / We are right if…* — after running, write Learning Card (learned what → do what).
> AI-in-core products: assumption "model hits sufficient accuracy on real customer data" is critical Feasibility — rank alongside need assumptions, triggers Stage 3 Verify parallel immediately.

## 0.6. Kill criteria (write first, anchor to market signals)

> Format **state + date** (Annie Duke, *Quit*): "if haven't achieved [measurable state] by [date] → stop". Generate via premortem: imagine failed, work backward.

- [ ] Example: reach target-people-count by ___ date with payment-conversion < ___% → stop
- [ ] Example: retention dies after 2 revision rounds → stop
- Signature date: `<yyyy-mm-dd>`

---

## ▶ Stage advancement gate

- [ ] Problem hypothesis contains no solution + has disqualifying condition
- [ ] Canvas boxes labeled for status
- [ ] Market type + strategic consequences
- [ ] List of 20 real names
- [ ] Assumption map with tests + thresholds for critical items
- [ ] Kill criteria signed
