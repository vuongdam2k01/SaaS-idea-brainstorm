# Stage 3 — Verify (runs PARALLEL to Stage 2)

> Start when assumption map (0.5) surfaces critical Feasibility assumption — don't wait for Validation finish.
> Two chains use different evidence: "demo runs" ≠ "need exists"; "people say it hurts" ≠ "AI works well enough".

---

## Gate R1 — Make it at required quality (error-analysis-first)

### 3.1. Dirty spike/PoC

- Scope: core only — real-input → process → real-output. No UI, no auth.
- Real data source (ask from who in V1/V2 interviews): …
- Code/notebook link: …

### 3.2. Error analysis by hand (open coding — cannot delegate)

> Benchmark (Hamel/Shreya): read ~100 traces; stop when ~20 straight show no new error type. Errors are allowed to shift criteria during reading (criteria drift). Bug = fix immediately; recurring/expensive error = write eval.

| # | Input | Output | Error noted | Error type (taxonomy) | Fix now or write eval? |
|---|---|---|---|---|---|
| 1 | | | | | |

**"What's correct" criteria (formed after reading, often shift):**

### 3.3. Eval built from actual errors

> Only write eval for errors FOUND, never for imagined ones. Test set from failure taxonomy; synthetic data (if needed) structured by dimensions, not random prompt.

- Test dataset: ___ cases · source: …
- Code eval (deterministic: schema, format, latency, forbidden words): …
- LLM-as-judge (subjective only; **binary pass/fail**, one evaluator per criterion; judge is prompt — craft like product prompt): …
- Judge–expert agreement on held-out labeled set: ___% (need ~75–90% to trust)
- **Current eval result:** ___%

### 3.4. Three defining questions

1. **Quality now vs customer's accept threshold** (from V1/V2 — 90% OK for suggest, zero for replace with consequences): customer threshold = ___ · currently = ___
2. **Error type when wrong:** easy-to-spot or looks-right-wrong? → need human-in-loop in design?: …
3. **Marginal cost per use** (tokens, compute) = ___ · vs price from V3 = ___ → margin: …

### 3.5. Hard constraints

- Data needed but can't access: …
- Latency limits: …
- Integration boundaries: …

### ▶ GATE R1
- [ ] Eval passes threshold on real data
- [ ] Marginal cost < price with viable margin
- [ ] Failure cases have design solution
- **LOCK on exit — promise scope:** product PROMISES ___ · DOESN'T PROMISE ___
- Fail → 3 exits: narrow problem / add human-in-loop / back to 2.5 change direction

---

## Gate R2 — Value actually reaches user (concierge / Wizard-of-Oz)

### 3.6. Concierge log (3–5 customers pre-committed V3)

| Customer | Date | Their real work | Result delivered |
|---|---|---|---|
| | | | |

### 3.7. Measure results, not sentiment

| Customer | Real hours saved | Output actually used after? (report sent, decision made, customer's-customer shown — or sits unused?) |
|---|---|---|
| | | |

### 3.8. Proto-retention

| Customer | Self-returned for 2nd use without prompting? | Date |
|---|---|---|
| | | |

### 3.9. Manual operations log (= true MVP spec)

| # | Manual step you did | Can automate? | Part of core loop? |
|---|---|---|---|
| 1 | | | |

### ▶ GATE R2
- [ ] Measured result matches problem hypothesis promise
- [ ] Someone self-returned
- **LOCK on exit:** core loop true (from observation) + aha event defined (observation-based, not guessed)
