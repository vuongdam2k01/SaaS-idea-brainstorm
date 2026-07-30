# Stage 5 — Scope Lock

> **Manual-mode rendering.** The normative producer of these artifact shapes is the plugin skill
> `stage-5-*-templates` (skills win on any disagreement). Load-bearing table
> headers here are fixture-checked against the validators by `tests/pipeline-contract-tests.js`.


> Entrance condition: passed V3 (have payer) + R2 (value delivered) + Positioning done.

## 5.1. Core loop from observation (≤5–7 steps, from concierge log 3.9)

| Step | User does / System does / User gets | Trace back to (E# or concierge log entry) |
|---|---|---|
| 1 | | |

> Step can't trace back = suspect cut candidate.

## 5.2. Aha moment = named measurable event

- Event: … (example format: "user exports first report within 10 min of signup")
- Observation source (R2): …

## 5.3. Cut list — what DOESN'T get built v1

> Rule: keep only features **paying customers** need for core loop. Cut list is as important as build list — barriers scope creep, especially with AI where "add a bit more" feels free but costs total time.

| Feature cut | Who suggested | Why cutting |
|---|---|---|
| | | |

## 5.4. Technical design contract

### Domain model / schema (hardest to fix post-launch — only thing worth pre-thinking)
- Main entities, relationships, states: …

### Condensed ADR (each big decision one paragraph — choses what, vs what, why)
| Decision | Choose | Instead of | Why |
|---|---|---|---|
| Stack | | | |

### Buy-not-build
- [ ] Auth: … · [ ] Payments: … · [ ] Email: … · [ ] Analytics: … · [ ] Storage: …

### Final-20% boundary (listed upfront, budgeted in plan)
- [ ] Error handling · [ ] Edge cases · [ ] Basic security (authz, injection, rate limit) · [ ] Payment failure · [ ] Backup · [ ] Staging

### Code-understanding boundary
- Zones must 100% understand: money, user data, auth/permission. Zones looser: …

### Event tracking plan (names set upfront — cabling post-launch = data lost forever)
| Event | Event name | Notes |
|---|---|---|
| Aha (from 5.2) | | required |

## 5.5. Definition of Done — FREEZE before build

- [ ] Core loop end-to-end
- [ ] Collect real money + handle failure
- [ ] User A can't see user B data
- [ ] Aha event fires
- [ ] Backup runs
- [ ] Pricing / terms / privacy pages
- [ ] Dogfood done
- Freeze date: `<yyyy-mm-dd>`

---

## ▶ FINAL GATE — SCOPE LOCKED when

- [ ] Each core loop step traces to evidence
- [ ] Cut list exists and non-empty
- [ ] Aha is named measurable event
- [ ] Schema drawable
- [ ] DoD frozen
- [ ] Scope small enough you **feel slightly worried it's too little** (sign of right sizing)

→ Move to build with this scope as contract: [build-and-launch.md](../../process/build-and-launch.md)
