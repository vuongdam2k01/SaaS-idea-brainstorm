# Stage Support Map: what plugin does in each task

> ⚠️ DESIGN DIRECTION UPDATE (2026-07-29): decision to switch to **fully autonomous mode** — see [autonomy-design.md](autonomy-design.md). This file retained as reference for "collaborative mode" (humans do fieldwork) — still useful because the capability-per-task analysis doesn't change, only *how* evidence is gathered.

> Plugin purpose: support user from clarifying raw idea to locking official MVP. This document follows the **stage → task** axis, defining for each task: Claude role, user role, capabilities needed, output. Implementation mechanisms (which skill/hook/agent) see [design-assessment.md](design-assessment.md) — mechanisms serve this map, not vice versa.

Plugin's overall role across pipeline: **methodology guide** (know next step, which framework) + **structured secretary** (rough chat → standard artifact) + **researcher** (scan/read/analyze) + **disciplinarian** (gates, thresholds, traceability) — user is the **only evidence source and decision-maker**.

---

## STAGE 0 — FRAMING (Claude contribution level: ~70%)

Stage where plugin converts most: input is vague few-sentence idea, output is structured hypothesis set per standard.

| Task | Claude does | User does | Output |
|---|---|---|---|
| **0.1 Separate problem from solution** | Conduct reverse interview on 5 components (who/context/outcome/blocker/price); flag when statement still contains solution; propose disqualifying conditions | Tell rough idea, answer, confirm rewrite | `problem-hypothesis.md` (frontmatter: falsifiable yes/no) |
| **0.2 Lean Canvas** | **Draft all 9 boxes from what heard, default label `[assumption]`**; ask each box "do you have real evidence?" → box gets re-labeled | Edit, supply evidence if available → box gets re-labeled | `lean-canvas.md` boxes labeled |
| **0.3 Market Type** | Quick web scan + structured question (existing/resegmented/new/clone), suggest classification **with heuristic consequences** (validate how, revenue shape — new market may plateau years) | Choose, understand consequences | 1-line market type + strategic consequences in canvas |
| **0.4 Beachhead + 20 names** | Propose 4–8 segments; guide 4-axis scoring; **warn if "reach" scores lowest**; describe profile per Blank 5-tier EarlyVangelist; suggest WHERE to find names (community, channels) | **List 20 real names yourself** — Claude strictly never fabricates names (first evidence firewall) | Scoring table + ICP + 20-name list |
| **0.5 Assumption map** | **Unload assumptions covering all types** (D/F/V + Usability/Ethical) from canvas — Claude better than person because unbiased category; guide matrix layout; design cheapest disproof test as Test Card | Score criticality level, **lock pass/fail threshold** (Claude proposes, you decide) | `assumption-map.md` with Test Cards + thresholds |
| **0.6 Kill criteria** | Guide **premortem** (imagine failed → causes → criteria); force state + date format | **Sign** — commitment is yours, not machine's | `kill-criteria.md` with signature date, protected |

**Gate F** — Claude auto-checks form (no solution in problem? has disqualifying conditions? 20 real names? every critical assumption has test + threshold?); you final-confirm.

---

## STAGE 1 — COMPETITIVE (Claude contribution: ~90% — most auto stage)

Research is Claude's strength; user mostly reads and judges.

| Task | Claude does | User does | Output |
|---|---|---|---|
| **1.1 Scan 5 tiers** | Fan-out agents scan by **problem keyword** (JTBD) on directory + community; **verify each competitor found** (rule: every entry has URL accessed — both AI and search summarizer fabricate) | Supplement with competitors you know from experience | `competitive-map.md` labeled **DRAFT** (waiting for customer language fixes at Stage 2) |
| **1.2 Competitor profiles** | Fill per schema (positioning, ICP, pricing, channels, age, health signals) | Review | Individual profiles |
| **1.3 Mine 1–3 star reviews** | Read + cluster, **preserve verbatim + link each quote** | — | `review-mining.md` |
| **1.4 Market verdict** | Synthesize 3 scenarios (crowded-healthy / nobody-makes / exists-but-bad) with post-mortem investigation if needed; present | **Make verdict** — go or no-go is your decision | Verdict recorded |

**Real-world capability note**: G2/Capterra/app store block bots hard — need scraping MCP or accept you pasting raw reviews for Claude to cluster. This is a technical constraint to test early when building the plugin.

---

## STAGE 2 — VALIDATE (Claude contribution: prep ~80%, fieldwork 0%, analysis ~80%)

User is the center — all evidence happens outside. Plugin role: **amplify before – document after**: best possible prep before you leave, thorough analysis of what you bring back.

### Gate V1 — Problem

| Task | Claude does | User does | Output |
|---|---|---|---|
| **2.1 Interview kit** | Compose **personalized interview kit**: 4 required + competitor-map fixes + problem-specific; check each per Mom Test rule (past/present, no pitch) | Review kit | `interview-kit.md` (handoff artifact) |
| *(support)* **Practice** | **Role-play as interviewee** to help you practice — label clearly: practice, NOT evidence | Practice interviewing | — |
| **2.2 Conduct 10–15 interviews** | **Do nothing — 100% your work** | Go fieldwork, record/notes | Transcripts/notes |
| **2.3 Synthesize + evidence ledger** | Claude's strongest V1 task: receive transcript → cluster patterns, count frequency, **extract verbatim**, map each finding to assumption A#, update assumption-map status, mark which competitors customer actually mentioned, ledger per schema (who/when/verbatim/assumption), flag commitments from each call | Paste transcripts, answer clarifications | `evidence-ledger.md` updated |
| **2.4 Hunt tier-one signals** | Auto-flag in transcripts: *self-made-solution still maintained*, *tried-AI-direct and failed* | — | Flags in ledger |

**Gate V1**: gatekeeper agent counts past behavior in ledger, vs pre-set threshold — number is non-negotiable with main loop.

### Gate V2 — Solution

| Task | Claude does | User does |
|---|---|---|
| **2.5 Draft 2–3 directions** | Co-brainstorm; **verify traceability: each direction ties to evidence cluster E#** — direction can't trace = Claude points out | Choose for testing | |
| **2.6 ChatGPT test** | Run most yourself: simulate "customer would prompt how?", gap, name value tier each direction adds | Confirm conclusion |
| **2.7 Mock/prototype** | **Build fast** (HTML interactive / clickable) — code already available, cost ~0 | **Bring mock to people you interviewed**, capture behavior response; bring back | |
| **2.8 Landing page** | Write copy **from customer verbatim in ledger** + build page | Run traffic, report numbers (measure payment-intent, not signup) |

**Gate V2**: compare behavior across directions; lock winning direction + value tier.

### Gate V3 — Money

| Task | Claude does | User does |
|---|---|---|
| **2.9 Pre-sell** | Draft pitch script, propose price neo **real customer alternatives** (from ledger), design commitment ladder (card → deposit → prepay → pilot contract) | **Go sell — 100% you**; report results back, Claude logs commitments |
| **2.10 Rejection log** | Cluster refusal reasons, suggest price/positioning tweaks | Report each refusal |

**Gate V3**: count real money commitments outside personal network vs N pre-set.

---

## STAGE 3 — VERIFY (Claude contribution: R1 ~85%, R2 ~40%)

Technical stage — Claude does most; you supply real data + judge quality.

| Task | Claude does | User does | Output |
|---|---|---|---|
| **3.1 Spike/PoC** | **Build 100%** — core only input→process→output | **Ask real data** from people interviewed (relationship task — you only) | Working spike |
| **3.2 Error analysis** | Original principle "cannot delegate" → practical: **work TOGETHER, not FOR you**. Claude runs spike batch, builds annotation table, suggests taxonomy on clustering; saturation trail (~20 traces with no new error type) | **You're the arbiter "what's correct"** — read output, note errors; criteria form from this reading itself | Annotation table + failure taxonomy |
| **3.3 Eval suite** | Write code eval (deterministic) + judge prompt (binary, 1 metric/evaluator); measure agreement | Label held-out set for judge–person agreement (~75–90%) | Eval harness |
| **3.4 Three defining questions** | Calculate marginal cost/use, vs price V3; analyze error type (easy-to-spot vs looks-right-wrong) | Lock acceptance threshold (from V1/V2) | Decision table |
| **3.5 Hard constraints** | List from spike (data unavailable, latency, integration limits) | Confirm | Constraints list |
| **3.6–3.9 Concierge (R2)** | Prep session checklist; **log manual operations** from your account (= true MVP spec); time saved; track proto-retention | **Serve real customers** (± use spike); report back each session | `concierge-log.md`, `manual-ops.md` |

**Gate R1/R2**: mostly machine-checkable (eval numbers, margin, self-repeat rate) — gatekeeper only audits qualitative fit-to-promise.

---

## STAGE 4 — POSITIONING (Claude contribution: ~75%)

| Task | Claude does | User does |
|---|---|---|
| **4.1 Best customers** | Extract from pre-sell log (who understood fast, committed fast) | Confirm |
| **4.2 Alternatives from customer words** | **Only pull from evidence ledger** (not competitive map Stage 1); self-check: does mined customer actually mention this? Eliminate phantom competitors — each alternative trace-back to E# | Confirm |
| **4.3 Five-component chain** | Guide in order: alternatives → attributes → value+proof (proof from R2 concierge) → ICP → category (suggest Big Fish Small Pond); optional trends | Decide each |
| **4.4 Copycat test** | **Play devil's advocate**: role-play competitor copying in 1 month, what's left different? | Answer hard questions |
| **4.5 Pitch** | Write in customer verbatim from ledger | **Bring to real customers**, report reaction |

Labeled throughout: this is **positioning thesis** — expect it wrong in part, refine post-launch.

---

## STAGE 5 — SCOPE LOCK (Claude contribution: ~85%, you approve)

| Task | Claude does | User does | Output |
|---|---|---|---|
| **5.1 Core loop** | Write from concierge log; **self-verify each step traces to E#/log** — untraced step = self-flag "cut candidate" | Review |
| **5.2 Aha event** | Propose from R2 observation, name measurable event | Lock |
| **5.3 Cut list** | Propose cutting everything not-traced-to-paying-customer need in core loop | **Review each cut line** (painful decision — yours) |
| **5.4 Technical design contract** | **Your strength**: schema, ADR, buy-list, final-20% boundary, code-understanding line, tracking plan | Review major decisions |
| **5.5 DoD** | Draft from template | **Freeze + sign date** |

**Final gate**: (1) machine-check traces + cut list + aha + schema + DoD; (2) **coldstart-tester agent** plays new build session reading MVP pack, lists unanswered questions — non-empty = fail; (3) gatekeeper rebuttal; (4) you sign scope lock.

---

## Summary table: support shape across pipeline

| Stage | Claude contribution | Claude's main role | Work only you do |
|---|---|---|---|
| 0 Framing | ~70% | Elicit, structure, hypothesis | Real names, kill criteria signature, 20-name list |
| 1 Competitive | ~90% | Research + source verification | Market verdict decision |
| 2 Validate | ~50% (80-0-80 shape) | Kit prep + transcript analysis | **Interviews, sales, asking for money** |
| 3 Verify | R1 ~85% / R2 ~40% | Spike build, eval harness, log | Real data, quality arbiter, concierge service |
| 4 Positioning | ~75% | Extract from evidence, copycat test | Pitch test with real customers |
| 5 Scope lock | ~85% | Write all artifacts + self-verify traces | Cut decisions, DoD sign, scope approval |

Three repeating patterns — design plugin around these:
1. **Prep → handoff → receive → analyze** (all fieldwork): Claude both ends, you middle.
2. **Draft with `[assumption]` label → you upgrade label with evidence**: Claude drafts freely labeled; only you promote label.
3. **Machine form-check → gatekeeper rebuttal → your decision**: three gates, each does different job.
