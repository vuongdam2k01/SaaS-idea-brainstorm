---
name: stage-4-positioning
description: Stage 4 of the SaaS validation pipeline - positioning per April Dunford's component order. Use when an idea in ideas/<slug>/ has V1 evidence (customer words) and needs its positioning thesis - competitive alternatives from evidence, unique attributes, value and proof, target segment, market category, copy test, pitch.
user-invocable: false
---

Stage 4: positioning. Startable after V1 (customer words exist); finalized after V3 + R1 (paying commitment + promise scope). The component order is **mandatory, never reversed** — each depends on the previous; get #1 wrong and everything downstream is wrong. Load `method-rules`; read `state.json`. Template: the `stage-4-positioning-templates` skill.

**Pre-product caveat (Dunford)**: what you produce here is a **positioning thesis** — an educated guess, expected to be partly wrong and revised once real customers arrive (Dunford: ~20 product launches, never guessed everything right). Don't tighten too early — tightening in the wrong spot can close off a good market. The artifact says "thesis" prominently.

## The chain (in order)

1. **Best customers** — from the pre-sell/commitment log: who understood fast and committed fast. Position from this group, never from the average.
2. **Competitive alternatives — from the ledger only.** What would these customers do if the product didn't exist? Usually "nothing", spreadsheets, an intern — sourced from evidence ids, NOT from the stage-1 research map. Cross-check the map's "customers actually mention it?" column and **eliminate phantom competitors** (theoretically competing, never actually considered — positioning against them dilutes everything). This is the most common failure point; be strict.
3. **Unique attributes** — what the product does that those real alternatives cannot (consistent with the R1 promise scope).
4. **Value & proof** — each attribute translated to customer value, with proof from real results (R2 log: measured hours saved, outputs used downstream). Run the "so what?" test on each value claim.
5. **Target segment** — characteristics of those who care most (feeds back to the ICP; note if the paying segment differs from the complaining segment).
6. **Market category** — pick the category that already exists in the customer's head so the value is obvious. Dunford's three styles: Head-to-Head / **Big Fish Small Pond (default for startups)** / Create a New Game (~10% of cases; category creation demands educating a whole market — beyond a solo team). Optional "plus one": **relevant trends** — a trend answers "why now", used WITH a category, never instead of one.
7. **Copy test** — play the competitor: they clone your feature in a month (AI-era speed); what differentiation survives? Empty answer → shift to what's hard to copy: narrower niche, data, relationships, distribution, deep workflow.
8. **Pitch** — one sentence in the customers' own verbatim language: "Unlike [real alternative], this [differentiator] for [ICP] because [proof]." Test by rung: *handoff* — user tries it on real contacts, reports reactions; *market-evidence* — A/B headline variants on the landing (statistically stronger than asking a few people), **varying exactly one thing per variant** (the audience lead OR the problem framing OR the outcome OR the mechanism OR the proof) — change two and the result attributes to nothing; every variant stays inside the claim envelope from the preflight (method-rules §11); *analysis floor* — recorded untested, flagged in carry-forward.

## Gate P

Requires: alternatives sourced from customer evidence; differentiation survives the copy test; pitch tested or explicitly recorded untested. Update state; run gate-check. **Locks: the positioning thesis** — governs copy, price anchoring, and feature ordering in stage 5. Write `positioning.md` with `status: locked` on pass.
