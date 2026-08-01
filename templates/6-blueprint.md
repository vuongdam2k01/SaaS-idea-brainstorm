# Stage 6 — Implementation Blueprint

> **Manual-mode rendering.** The normative producer of these artifact shapes is the plugin skill
> `stage-6-blueprint-templates` (skills win on any disagreement).

> Entrance condition: gate LOCK passed (MVP Pack issued) — or an explicit unvalidated-build
> decision. The pack answers *what/why/boundary*; this stage answers *exactly how*, at the product
> level, **before** the first line of product code. Bar: a fresh build session reading only
> pack + blueprint can implement every feature **without inventing any product decision**.

## 6.1. Decomposition — feature-spec work list

| FS id | feature | pack trace (core-loop step / DoD module / MSP field) |
|---|---|---|
| | | |

> No trace = scope addition = not written (the cut list binds the blueprint too). Founder approves
> the breakdown before spec writing starts.

## 6.2. Per feature (fs-NN-*.md)

- User story in **customer verbatim** where V1 evidence exists; invented wording = `[GUESS]` until the founder confirms.
- Main flow + acceptance criteria (given/when/then, binary).
- Fields & validation: type, rules, limits, default, user-visible copy on invalid.
- **Error / empty / loading states** — per screen, each with its copy.
- Edge cases answered, never blank: empty/duplicate/oversized input · permission boundary (cross-tenant!) · dependency failure · retry/idempotency · concurrency · timezone/locale/currency.
- Instrumentation: which tracking events fire, with payloads.

## 6.3. Data schema — field level

Per entity: fields (type, constraints, default, which FS it serves), **state machines as ST-n tables
(every transition owned)**, non-relational stores indexed to their owning subsystem, indexes,
migrations + seed (incl. document-schema versioning), and a mechanism for every promised
retention/deletion duty.

## 6.3b. Subsystems + interaction map (the non-CRUD layer)

One `ss-NN` spec per engine/model/pipeline in the ADRs (LLM core, 3D engine…): capabilities `CAP-n`
with budgets traced to R1, degradation ladder, eval bindings `EV-n` (llm), pinning + saved-output
change policy, generated-artifact lifecycle. `interaction-map.md`: conflict-domain rows per
multi-writer entity (writers cell = computed set), invariants `INV-n`, JOB rows for async work
(queued/running/cancelled/partial, second submit, disconnect, result lifetime, undo across the
generation boundary).

## 6.4. UX spec

Screen inventory · flows (happy + every error path) · **first-run flow signup → aha event**
(required — screens alone don't compose into it) · per-screen states · navigation map ·
accessibility floor (never cuttable — substituted, not N/A, on a headless surface) · **outward claim
inventory**: pack-class claims only (outcome/benefit/quantity/guarantee/security/price/pitch), each
with a `publication_disposition`. Labels, hints and error copy are not claims — they live in their FS.

## 6.5. API contract & integration specs

Endpoints with shapes/auth/errors mapped to UI states. Per buy-don't-build provider: scope, config,
webhook contract (signature, idempotency, retry), failure path, sandbox plan, cost basis.

## 6.6. NFRs

Performance/capacity numbers **traced or founder-confirmed, never invented** · authz matrix ·
security concretization of the final-20% list · operational duties from the minimum service promise.

## 6.7. Test plan

Every DoD item + MSP commitment → scenario; every FS acceptance criterion → case by reference.
Mandatory: cross-tenant isolation, payment failure, backup restore. AI-core: pack eval harness = CI.

## 6.8. Build plan + deferred register

Milestones with **core loop end-to-end first**; environment as checkable spec (dev/prod split, no
local write to prod, migrations via CI, error tracking before first user). Deferrals live in their
own append-only `deferred-register.md` (`DF-<n>` rows, non-product items only, each with owner +
date; closures are new rows referencing the open id) — never inside the locked build plan.

An **event dictionary** in `blueprint-overview.md` is the single source for event payloads (aha
event first); feature specs reference it, never redefine it.

---

## ▶ GATE BP — BLUEPRINT LOCKED when

- [ ] Every core-loop step has a feature spec; every spec traces into the pack
- [ ] Every FS: acceptance criteria (AC ids) + error/empty/loading + edge-case checklist answered
- [ ] Schema field-level and consistent with tech-design entities both directions; FS ↔ schema ↔ API types agree
- [ ] Event dictionary complete (aha first); first-run flow signup → aha designed
- [ ] Every DoD item + MSP commitment + INV-n + EV-n maps to a test scenario; llm/async cases carry a determinism strategy; outward copy has publication dispositions
- [ ] Every multi-writer entity has a conflict-domain row (writers = computed set); FS concurrency cells CITE it rather than restating; every async capability has JOB rows + the four async states; no orphan CAP
- [ ] Blueprint profile declared (which optional layers apply); delegated decisions in the DR register; quantitative assumptions listed with E-id or [GUESS]
- [ ] Zero unresolved markers of any kind — `[GUESS]`, `[OPEN]`, `[TBD]`, `[INFERRED]`, bare `___`, unsubstituted `<…>` (deferred register holds non-product items only)
- [ ] `scripts/validate-blueprint.js` exits 0
- [ ] **Level-2 cold-start test passes** on a clean copy of pack + blueprint, report persisted with the hashes of the exact set tested

→ Build starts with **pack + blueprint as the two-layer contract**: [build-and-launch.md](../process/build-and-launch.md)
