# Foundations, references & changelog

## What this process rests on

**Backbone is Customer Development** (Steve Blank) — recursive, iterative nature: each step is a loop not a pipeline; failure at any stage means go back to prior stage, not push forward with wrong assumptions. Specifically, Customer Validation has a loop back to Customer Discovery — this is the critical checkpoint to know if you have a product customers want to buy and a way to sell it.

Foundational principle distilled by indie-hacker community: **"Validate, then build. Your first validation proof is a credit card, not praise."**

## Source synthesis

| Source | Contribution to process |
|---|---|
| Customer Development — Steve Blank | Backbone 4-step loop; Market Type (0.3); EarlyVangelist 5-tier (0.4); "failed Validation → back to Discovery" rule; premature scaling → Death Spiral |
| Assumption Mapping — Strategyzer (+ Teresa Torres note) | "We believe that…" format; importance × evidence matrix; test Desirability first (0.5) |
| Positioning — April Dunford | Stage 4: 5-component mandatory order (+ relevant trends optional); phantom competitors; 40–60% "no decision" (JOLT Effect); positioning thesis for pre-product |
| The Mom Test — Rob Fitzpatrick | Interview principles: past/present questions, no pitch (2.1) |
| Indie hacker validation playbook | 4-week sprint (interview → landing → pre-sell → scope); benchmark numbers; kill criteria set upfront |
| AI product eval practice — Hamel Husain, Arize | Error-analysis-first (R1): real data spike → open coding → eval from actual errors; golden dataset small & high-quality; LLM-as-judge for subjective cases |
| SaaS pre-launch checklist from practice | Full readiness check: dev/prod split, 5-min monitoring, backup restoration test, production smoke test, webhook billing + dunning, legal pages |

## Reference 4-week indie sprint (indie hacker synthesis — NOTE: no single-author playbook; community distilled)

- **Week 1 — interviews:** find niche in 3 communities, run 10–20 problem interviews, confirm pain repeats.
- **Week 2 — landing:** one clear value prop, one email box, traffic pulls right ICP; benchmark = 20+ real signups — if not, idea or positioning needs rework.
- **Week 3 — pre-sell:** pitch beta discount with real payment link — few people paying before product exists = only valuable validation.
- **Week 4 — scope MVP:** build only what people who paid need.

## Reference benchmarks

| Experiment | Benchmark | Source credibility |
|---|---|---|
| Problem interview | **10–15 interviews** (Running Lean — Ash Maurya); subjects tier 4–5 EarlyVangelist | Has source |
| V1 threshold (example) | ≥60% sample show *proactive seek/DIY solution* past behavior | Self-set (valid if pre-registered) |
| Landing smoke test | Measure **payment-intent conversion** (signup→paid usually 5–15%; deposit/pre-order = strong signal); "20+ signup" just heuristic | Heuristic + some conversion sourced |
| Validate leveling frame | 2/20/200 (Rob Walling): 2h screen → 20h landing+interviews → 200h MVP manual | Has source |
| Pre-sell V3 | ≥N real money commitments outside personal network (N = 3–10 by price, pre-set); anchor case: Drip — 11 of 17 at $99/mo before code | N is heuristic; Drip case sourced |
| Concierge R2 | 3–5 customers already committed money | Heuristic |
| Error analysis (AI) | Read **~100 traces**; stop when ~20 straight traces show no new error type; MVES: 30 min reading 20–50 outputs per big change | Sourced (Hamel/Shreya FAQ) |
| LLM-as-judge | Binary pass/fail; 1 evaluator per criterion; judge–expert agreement ~75–90% needed | Has source |
| "No decision" B2B | **40–60%** of purchase processes end undecided (The JOLT Effect — 2M+ sales calls); older Dunford cited 20–30% (CSO Insights) | Has source |
| Sean Ellis PMF test | 40% "very disappointed" — use **post-launch only**, with users who've used core ≥2x/2 weeks | Has source |
| Dunning/billing | Stripe webhook retry max 72h; Smart Retries default 8x/2 weeks; ~25% subscription churn from payment failure | Sourced (Stripe docs) |
| Marketing pre-launch | Build channel 4–6 weeks before launch day | Community heuristic |

## Changelog — adjustments from prior draft (vs reality, 07/2026)

1. **Added EarlyVangelist as interview filter** — 4 Blank criteria concretize "who to talk to" instead of vague.
2. **Market Type into framing** — drives validate strategy and launch.
3. **Positioning becomes own stage with mandatory order** (Dunford) vs side gate; add phantom competitor warning: map must update from customer words.
4. **Fixed eval process**: not "write eval then build" but *spike on real data → error-analysis → eval from actual errors* — real debate in AI eng community; error-analysis-first wins on logic for solo dev (LLM has near-infinite error surface, can't pre-guess).
5. **Split pre-launch readiness into own checklist** (dev/prod, 5-min monitoring, backup restore test, production smoke test, webhook + dunning, legal pages) from Definition of Done — was too vague rolled together.
6. **Evidence benchmarks got reference markers**: 10–20 interviews → 10–15 (Running Lean); "40% no decision" → 40–60% (JOLT); "~100 golden case" → ~100 traces in error-analysis + saturation stop-rule; "20+ signup" marked heuristic, pivot to payment-intent + 2/20/200 frame; kill criteria normalized state+date (Annie Duke); positioning pre-product = thesis; webhook 48h → 72h (Stripe docs); **removed 2 un-sourced numbers**: "30% churn from GDPR" (replaced Cisco 94%), "18/24" (kept as illustrative example).
