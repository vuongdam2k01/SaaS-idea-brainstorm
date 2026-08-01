# Build & Launch — after MVP scope is locked

**First, make the contract legible where the code will live.** The pack and blueprint are read by a *different* agent in a *different* repository, which arrives knowing none of it. The `handoff-to-build` skill (`scripts/build-handoff.js`) generates, into the build repo, the files those tools load unprompted — `AGENTS.md` for Codex and the other AGENTS.md readers, `CLAUDE.md` importing it for Claude Code, path-scoped `.claude/rules/` for the id vocabulary and the product-vs-technical boundary, `/spec` and `/spec-gap` skills, a SessionStart hook that states the contract and verifies hashes, and a read-only `docs/product/` copy with `spec-index.json` mapping every id to its definition site. It injects awareness only — it prescribes no architecture, stack or workflow — and it paraphrases nothing, so it cannot drift from the artifacts. Regenerate it after every amendment; `--check` reports staleness in either direction and is cheap enough for the build repo's CI.

Apply **after** the main pipeline ([pipeline.md](pipeline.md)) passes Stage 5's LOCK gate **and Stage 6's BP gate** — build starts from the two-layer contract: the MVP Pack bounds scope, the implementation blueprint (`blueprint/`) binds implementation (feature specs, field-level schema, UX, interface contracts, NFRs, test plan, build plan). **Read order on build day one: `blueprint/amendment-log.md` if it exists (current truth = locked blueprint + amendments), then the pack, then the blueprint.** Two different discoveries route two different ways during build: **the spec is defective or silent on an in-scope case** (an edge case only code exposes, a provider behaving differently than documented, a logic conflict between two specs) → `amend-blueprint` (founder-answered scope test, immutable `ba-NNN` amendment, append-only log; the locked files never change); **reality departs from the locked scope** (features changed/added/removed, price or buyer shifted) → declare it (`declare-drift`) and reconcile on demand (`reconcile`) — the pack itself is never edited; current truth lives in versioned baselines (see the method-rules maintenance rules).

---

## BUILD PHASE

1. **Build only the locked core loop; the cut list is the boundary.** For a Validated pack, "people paid for it" is what LOCK already proved. For a Hypothesis/Pre-feasibility pack (V3 or R1 accepted-open), the locked scope IS buildable as-is — its unpaid slices are labeled hypotheses whose learning routes through validation runs, not a reason to add features. Overbuilding is the common founder mistake — ship the minimum that closes the core loop; features are addable post-launch based on real feedback.
2. **The blueprint is the implementation authority**: feature specs (acceptance criteria, states, edge cases), field-level data-schema, api-contract, integration specs, test plan — with the 5.4 technical design contract as its parent (schema/domain model, condensed ADR as context for AI coding, code-understanding boundary: money/data/auth = 100% understand, event tracking plan with aha event). If code and blueprint disagree, that is either a spec defect (→ `amend-blueprint`) or unbuilt scope — never a silent divergence.
3. **Split Dev/Prod environment from day one** — historical pattern with public post-mortem: Resend (02/2024) ran migration from local pointing wrong to production, dropped all tables, 12-hour outage; GitLab (01/2017) deleted data directory on primary and all 5 backup/replication mechanisms failed on demand. Lesson from both: **no role from local machine can write to production database** — migrations run through CI only; disaster-recovery drill is routine, not one-time.
4. **Stay connected with interview/pre-order group** — they're beta testers; build in public to gather audience.

---

## PRE-LAUNCH READINESS (checklist before real users)

Items that **cannot be missing**:

### Technical & operations
- [ ] **Monitoring not optional**: minimum = error tracking (Sentry free tier covers MVP scale), uptime monitoring, APM — all alert one real person within 5 min of issue.
- [ ] **Backup tested for restoration**, not just "enabled".
- [ ] **Smoke test on production itself**: staging lies — different config, different data, different third-party services; only production tells truth about readiness. Run smoke test post-final deploy, with real credentials, on real infrastructure — failure here blocks launch.

### Payments
- [ ] **Full billing webhook test including failure paths**: Stripe retry with exponential backoff maximum **3 days (72 hours)** in live mode then stops; disabled endpoint stops retry → need **separate webhook failure-rate alert**, don't rely on retry. Verify webhook signature + idempotency mandatory. Safety net: manual resend available up to 15 days (Dashboard) / 30 days (CLI).
- [ ] **Configure dunning / Smart Retries** upfront — Stripe default: 8 attempts over 2 weeks. Empirical: ~25% subscription churn purely from payment failure (Stripe); involuntary churn averages ~22% of total churn (Churnkey).

### Legal & trust
- [ ] **Regulated-domain gate (blocking when flagged at 0.3b)**: the regulated-domain Test Card's `load_before_event` is exactly here — **before the first outside user touches real regulated data**, the compliance obligations in the blueprint's `bp:compliance` section are verified against a real source or professional advice (model-drafted obligations are `[GUESS]` and do not count), and the MSP's explicitly-unsupported field states the regulated boundary.

- [ ] **Privacy policy, terms, data handling standards**. (Myth "~30% churn from GDPR" circulates without source — removed from workflow.) Real basis: Cisco Data Privacy Benchmark 2023 (3.1k+ orgs, 26 markets): **94%** won't buy if data isn't protected right. B2B adds: buyer often demands **DPA + subprocessor list** in procurement — pre-built helps close deals faster.

### User testing
- [ ] **UAT** after internal rounds (unit, integration, e2e), assess product in real-use scenarios — diverse tester mix, log all issues even unfixed.

### Mindset on launch timing
Not "launch when perfect" (never happens) but **launch when checklist complete, even if features missing**. Addable features post-launch work; broken payments/missing legal page/no onboarding/no error tracking can't fix gracefully with users inside. Equally: resist opposite extreme of endless checklist perfectionism — **~75% items done and no blockers = consider go-ahead** (benchmark number is illustrative, not sourced — honest scoring is key: 18/24 items done, nothing critical failing).

---

## SOFT LAUNCH → USER-READY

1. **Soft launch with 5–10 outsiders** (prioritize pre-order group), record sessions, and run the **adoption validation run** here (a version-scoped run of kind `adoption` per method-rules maintenance-rules §4 — not a singleton gate; sign its spec — sample, threshold, stopping rule, window — BEFORE the soft launch opens): rough self-serve, no guide sitting beside them, measure % reaching aha.
2. **Fix onboarding stumbles.**
3. **Build marketing first, don't wait for launch day**: establish marketing channel 4–6 weeks pre-launch, execute concentrated on launch day, then optimize 30 days.
4. **Write learning plan upfront**: channels, expected visitor/signup/paid numbers, good/bad thresholds.
5. **Price from research, not gut**: prices from research (talk to prospects, benchmark competitors, test beforehand) have better revenue goal odds than gut-set prices.
6. **Measure PMF post-launch**: Sean Ellis test ("how disappointed if product gone?" — 40% "very disappointed" bar) runs on users who've **used core ≥2x in last 2 weeks**. Post-launch tool only — don't nest into pre-launch; use problem interview + commitment money instead.

**▶ READY condition**: ≥N outsiders complete core loop with no explanation + pre-launch checklist done + learning plan has numbers.
