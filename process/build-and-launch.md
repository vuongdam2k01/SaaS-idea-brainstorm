# Build & Launch — after MVP scope is locked

Apply **after** the main pipeline ([pipeline.md](pipeline.md)) ends at Stage 5's final gate. The locked MVP scope is a contract — any scope change during build must re-check against the frozen cut list and Definition of Done.

---

## BUILD PHASE

1. **Build only features people paid for**; cut list is the boundary. Overbuilding is common founder mistake — ship minimum solving core problem; features always addable post-launch based on real feedback.
2. Follow technical design contract locked at 5.4: schema/domain model, condensed ADR (context for AI coding), code-understanding boundary (money/data/auth = 100% understand), event tracking plan with aha event.
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
- [ ] **Privacy policy, terms, data handling standards**. (Myth "~30% churn from GDPR" circulates without source — removed from workflow.) Real basis: Cisco Data Privacy Benchmark 2023 (3.1k+ orgs, 26 markets): **94%** won't buy if data isn't protected right. B2B adds: buyer often demands **DPA + subprocessor list** in procurement — pre-built helps close deals faster.

### User testing
- [ ] **UAT** after internal rounds (unit, integration, e2e), assess product in real-use scenarios — diverse tester mix, log all issues even unfixed.

### Mindset on launch timing
Not "launch when perfect" (never happens) but **launch when checklist complete, even if features missing**. Addable features post-launch work; broken payments/missing legal page/no onboarding/no error tracking can't fix gracefully with users inside. Equally: resist opposite extreme of endless checklist perfectionism — **~75% items done and no blockers = consider go-ahead** (benchmark number is illustrative, not sourced — honest scoring is key: 18/24 items done, nothing critical failing).

---

## SOFT LAUNCH → USER-READY

1. **Soft launch with 5–10 outsiders** (prioritize pre-order group), record sessions, complete gate R3 (adoption) here: rough self-serve, no guide sitting beside them, measure % reaching aha.
2. **Fix onboarding stumbles.**
3. **Build marketing first, don't wait for launch day**: establish marketing channel 4–6 weeks pre-launch, execute concentrated on launch day, then optimize 30 days.
4. **Write learning plan upfront**: channels, expected visitor/signup/paid numbers, good/bad thresholds.
5. **Price from research, not gut**: prices from research (talk to prospects, benchmark competitors, test beforehand) have better revenue goal odds than gut-set prices.
6. **Measure PMF post-launch**: Sean Ellis test ("how disappointed if product gone?" — 40% "very disappointed" bar) runs on users who've **used core ≥2x in last 2 weeks**. Post-launch tool only — don't nest into pre-launch; use problem interview + commitment money instead.

**▶ READY condition**: ≥N outsiders complete core loop with no explanation + pre-launch checklist done + learning plan has numbers.
