#!/usr/bin/env node
/**
 * Enforcement-coverage report (saas-idea-brainstorm plugin).
 *
 * Answers one question the plugin could not previously answer about itself:
 * **what fraction of its normative requirements is enforced by code, and what
 * fraction rests on a model reading a long document?**
 *
 * That number matters more than the next rule. Fixtures test code; most gate
 * predicates are enforced by "the gatekeeper reads and judges" — and the
 * gatekeeper is a model with the same context limits as the agent it audits.
 *
 * The requirement inventory below is maintained BY HAND on purpose: parsing
 * requirements out of prose would itself be a model judgement, and a made-up
 * number is worse than no number. Each entry names where the requirement is
 * written and what, if anything, mechanically enforces it.
 *
 * Usage: node scripts/coverage-report.js [--json]
 */
"use strict";

// tier: "code"      — a script rejects the violation deterministically
//       "hook"      — a hook rejects it at write time (code, but bypassable if hooks are off)
//       "agent"     — only the gatekeeper/coldstart agent can catch it (model judgement)
//       "prose"     — stated in a skill/contract; nothing checks it at all
const REQUIREMENTS = [
  // ---- artifact & state integrity
  { id: "frontmatter-keys", where: "method-rules-artifact-schema", tier: "hook", by: "validate-artifact.js REQUIRED" },
  { id: "frontmatter-enums", where: "method-rules-artifact-schema", tier: "hook", by: "validate-artifact.js ENUMS" },
  { id: "rung-three-values", where: "method-rules-artifact-schema", tier: "hook", by: "validate-artifact.js ENUMS.rung + LEGACY_RUNGS" },
  { id: "grade-no-modifiers", where: "method-rules §2", tier: "hook", by: "validate-artifact.js + validate-evidence-ledger.js" },
  { id: "real-calendar-dates", where: "method-rules-artifact-schema", tier: "hook", by: "validate-artifact.js validDate" },
  { id: "idea-matches-slug", where: "method-rules-artifact-schema", tier: "hook", by: "validate-artifact.js" },
  { id: "artifact-id-matches-filename", where: "method-rules-artifact-schema", tier: "hook", by: "validate-artifact.js" },
  { id: "stage-gate-map", where: "method-rules-gate-contracts", tier: "hook", by: "validate-artifact.js STAGE_GATES" },
  { id: "maintenance-kind-policy-pairing", where: "maintenance-rules §9", tier: "hook", by: "validate-artifact.js KIND_POLICY" },
  { id: "locked-artifact-immutable", where: "maintenance-rules §1", tier: "hook", by: "guard-thresholds.js" },
  { id: "journal-append-only", where: "method-rules §6", tier: "hook", by: "guard-thresholds.js byte-prefix" },
  { id: "threshold-revision-shape", where: "method-rules-state-schema", tier: "hook", by: "guard-thresholds.js" },
  { id: "state-shape-current-schema", where: "method-rules-state-schema", tier: "code", by: "state-write.js" },
  { id: "cycle-freeze", where: "method-rules-state-schema", tier: "code", by: "state-write.js FROZEN_KEYS" },
  { id: "kill-criteria-polarity", where: "method-rules-state-schema", tier: "code", by: "state-write.js validateKillCriteria" },
  { id: "waiting-on-can-end", where: "method-rules-state-schema", tier: "code", by: "state-write.js validateWaitingOn (root + fragment)" },
  { id: "privacy-index-closed-keys", where: "method-rules §7", tier: "code", by: "state-write.js ALLOWED_KEYS" },
  { id: "privacy-duty-cannot-vanish", where: "method-rules §7", tier: "code", by: "state-write.js transition check" },
  { id: "privacy-manifest-ref-confined", where: "method-rules-state-schema", tier: "code", by: "state-write.js isConfinedPrivatePath" },

  // ---- stage 6 / gate BP (v1.4.1 — the review's #2 finding was precisely that
  // this block was missing while the self-audit kept reporting the old ratio)
  { id: "bp-artifact-set-complete", where: "gate-contracts BP row", tier: "code", by: "validate-blueprint.js REQUIRED + feature-specs" },
  { id: "bp-marker-family-zero", where: "gate-contracts BP", tier: "code", by: "validate-blueprint.js MARKERS (--at-gate)" },
  { id: "bp-anchors-present", where: "stage-6-blueprint-templates", tier: "code", by: "validate-blueprint.js ANCHORS" },
  { id: "bp-edge-cases-answered", where: "gate-contracts BP", tier: "code", by: "validate-blueprint.js edge rows + N/A-with-reason" },
  { id: "bp-three-way-type-check", where: "gate-contracts BP", tier: "code", by: "validate-blueprint.js fieldTypes join" },
  { id: "bp-referential-integrity", where: "gate-contracts BP", tier: "code", by: "validate-blueprint.js symbol tables (fs/AC/SC/E/event/entity.field)" },
  { id: "bp-ac-covered-by-tests", where: "gate-contracts BP", tier: "code", by: "validate-blueprint.js coverage join" },
  { id: "bp-dod-msp-covered", where: "gate-contracts BP", tier: "code", by: "validate-blueprint.js (legacy pack => warning + Layer 2 by name)" },
  { id: "bp-event-dictionary-single-source", where: "gate-contracts BP", tier: "code", by: "validate-blueprint.js unknown-event + no-aha-event" },
  { id: "bp-first-run-flow", where: "gate-contracts BP", tier: "code", by: "validate-blueprint.js first-run section + aha reference" },
  { id: "bp-copy-dispositions", where: "gate-contracts BP (outward preflight)", tier: "code", by: "validate-blueprint.js copy table enum + do-not-publish" },
  { id: "bp-self-contained", where: "gate-contracts BP", tier: "code", by: "validate-blueprint.js path scan" },
  { id: "bp-pack-read-only", where: "gate-contracts BP", tier: "code", by: "validate-blueprint.js + artifact-manifest verify vs LOCK manifest" },
  { id: "bp-coldstart-report-persisted", where: "gate-contracts BP + gate-check L1 item 7", tier: "agent", by: "gate-check reads latest report + rehashes (mechanical steps, agent-executed)" },
  { id: "bp-state-block-shape", where: "method-rules-state-schema", tier: "code", by: "state-write.js blueprint validation (closed keys, pairing, abandonment)" },
  { id: "bp-amendment-ids-bound", where: "maintenance-rules §9", tier: "hook", by: "validate-artifact.js BA digits pairing" },
  { id: "bp-amendment-log-bijection", where: "amend-blueprint skill", tier: "code", by: "validate-blueprint.js --with-amendments" },
  { id: "bp-amendment-targets-resolve", where: "amend-blueprint skill", tier: "code", by: "validate-blueprint.js --with-amendments symbol join" },
  // ---- stage 6 interaction + subsystem layers (v1.5.0 — round-3 review)
  { id: "bp-touches-asymmetric-check", where: "gate-contracts BP interaction layer", tier: "code", by: "validate-blueprint.js touches-omission (error) / touches-unused (warning)" },
  { id: "bp-conflict-domain-writers-set", where: "gate-contracts BP interaction layer", tier: "code", by: "validate-blueprint.js writers-set-mismatch (set-equality vs computed writers)" },
  { id: "bp-domain-real-answers", where: "gate-contracts BP interaction layer", tier: "code", by: "validate-blueprint.js domain-cell-blank + domain-null-answer + scope token" },
  { id: "bp-transition-ownership", where: "gate-contracts BP interaction layer", tier: "code", by: "validate-blueprint.js st-no-trigger + st-unclaimed + st-invisible" },
  { id: "bp-invariants-traced-covered", where: "gate-contracts BP interaction layer", tier: "code", by: "validate-blueprint.js inv-untraced + inv-uncovered" },
  { id: "bp-jobs-for-async", where: "gate-contracts BP interaction layer", tier: "code", by: "validate-blueprint.js no-jobs + job-cell-blank + missing-async-state" },
  { id: "bp-ss-kind-anchors", where: "gate-contracts BP subsystem layer", tier: "code", by: "validate-blueprint.js SS_KIND_ANCHORS (+ parity test vs the contract table)" },
  { id: "bp-orphan-capability", where: "gate-contracts BP subsystem layer", tier: "code", by: "validate-blueprint.js orphan-cap" },
  { id: "bp-ev-threshold-restated", where: "gate-contracts BP subsystem layer", tier: "code", by: "validate-blueprint.js ev-threshold-invented (string-verify vs mvp-pack/eval)" },
  { id: "bp-ac-eval-binding", where: "gate-contracts BP subsystem layer", tier: "code", by: "validate-blueprint.js ac-no-ev + ev-uncited + ev-uncovered" },
  { id: "bp-budget-containment", where: "gate-contracts BP subsystem layer", tier: "code", by: "validate-blueprint.js budget-exceeds-nfr (CAP ≤ nfr by integer comparison)" },
  { id: "bp-determinism-strategy", where: "gate-contracts BP subsystem layer", tier: "code", by: "validate-blueprint.js no-determinism-strategy" },
  { id: "bp-conflict-answer-quality", where: "gate-contracts BP interaction layer", tier: "agent", by: "gatekeeper + level-2 coldstart 5b (a wrong merge rule passes every set check)" },
  { id: "bp-subsystem-content-quality", where: "gate-contracts BP subsystem layer", tier: "agent", by: "level-2 coldstart 5c (context assembly/pinning/lifecycle implementable is a reading)" },
  { id: "bp-refines-never-expands", where: "gate-contracts BP", tier: "agent", by: "gatekeeper item 21 (trace exists is code; trace actually supports the spec is a reading)" },
  { id: "bp-founder-decides-not-model", where: "gate-contracts BP decision discipline", tier: "agent", by: "gatekeeper item 21 + level-2 coldstart (delegation must be journaled)" },
  { id: "bp-deferred-non-product-only", where: "gate-contracts BP", tier: "agent", by: "validate-blueprint.js checks shape; whether a row is product-shaped is gatekeeper item 21" },
  { id: "bp-scope-test-honest", where: "amend-blueprint skill", tier: "agent", by: "gatekeeper item 21 (a scope test answered by the model is the laundering path)" },

  // ---- v1.6.0 diversity layers (two-sided, surfaces, compliance)
  { id: "market-shape-recorded-shape", where: "method-rules-state-schema", tier: "code", by: "state-write.js SHAPES + sides[] roles (constrained/paying required)" },
  { id: "sides-cycle-owned-frozen", where: "method-rules-state-schema", tier: "code", by: "state-write.js FROZEN_KEYS + fragment required keys" },
  { id: "secondary-side-own-file", where: "gate-contracts F row", tier: "code", by: "validate-beachhead.js --file (confined names; two tables in one file was a proven corruption path)" },
  { id: "secondary-floor-founder-set", where: "gate-contracts F row", tier: "agent", by: "gatekeeper item 22 (a plugin-invented floor is the violation)" },
  { id: "per-side-frames-never-merged", where: "gate-contracts V1 row", tier: "agent", by: "gatekeeper item 22 (denominator merging across sides)" },
  { id: "seeding-plan-executable", where: "gate-contracts V2 row", tier: "agent", by: "gatekeeper item 22 (cooperation-wish plans rejected)" },
  { id: "bp-surface-row-requirements", where: "gate-contracts BP surfaces", tier: "code", by: "validate-blueprint.js scSurface + missing-state (loading keyed off row surface)" },
  { id: "bp-api-lifecycle", where: "gate-contracts BP surfaces", tier: "code", by: "validate-blueprint.js api-lifecycle-missing/-empty" },
  { id: "bp-accessibility-never-na", where: "gate-contracts BP surfaces", tier: "code", by: "validate-blueprint.js accessibility-na (substitution, not cut)" },
  { id: "bp-compliance-always-present", where: "gate-contracts BP compliance", tier: "code", by: "validate-blueprint.js compliance-missing/-cell/-na-basis (REG-n rows or N/A-with-basis)" },
  { id: "bp-first-run-per-side", where: "gate-contracts BP", tier: "code", by: "validate-blueprint.js first-run-missing-side (keyed off state.sides)" },
  { id: "bp-ledger-kind-anchors", where: "gate-contracts BP kinds table", tier: "code", by: "validate-blueprint.js SS_KIND_ANCHORS.ledger + parity test" },
  { id: "bp-agentic-llm-anchors", where: "gate-contracts BP kinds", tier: "code", by: "validate-blueprint.js LLM_ACTION_ANCHORS (takes_actions: yes)" },

  // ---- v1.7.0 round-5 depth review (net: 4 reductions, 3 additions)
  { id: "bp-delegation-resolves-in-pack", where: "gate-contracts-bp decision discipline", tier: "code", by: "validate-blueprint.js delegation-no-dr + delegation-unregistered (DR register lives inside the blueprint; the pack's charter copy froze at LOCK)" },
  { id: "bp-concurrency-single-home", where: "gate-contracts-bp interaction layer", tier: "code", by: "validate-blueprint.js concurrency-not-cited" },
  { id: "bp-inv-not-a-second-dod", where: "gate-contracts-bp interaction layer", tier: "code", by: "validate-blueprint.js inv-duplicates-dod" },
  { id: "bp-determinism-inherited", where: "gate-contracts-bp subsystem layer", tier: "code", by: "validate-blueprint.js CAP determinism inheritance (removes ~40 duplicated cells)" },
  { id: "bp-profile-declared", where: "stage-6-blueprint-templates", tier: "code", by: "validate-blueprint.js ANCHORS bp:profile (a simple product provably skips optional layers)" },
  { id: "bp-quantitative-assumptions-listed", where: "gate-contracts-bp", tier: "agent", by: "level-2 coldstart + gatekeeper (a number nobody observed is how green checks and a wrong product coexist)" },
  { id: "requirement-moratorium", where: "method-rules §14", tier: "prose", by: "INTENTIONAL: a process rule for the humans and models extending this plugin — no mechanism can enforce 'cite an observed failure'" },

  // ---- v1.8.0 build handoff (awareness injection for the DOWNSTREAM repo; adds no founder judgement)
  { id: "handoff-requires-locked-bp", where: "handoff-to-build", tier: "code", by: "build-handoff.js state.blueprint locked+passed guard (--draft stamps every file instead)" },
  { id: "handoff-requires-clean-validator", where: "handoff-to-build", tier: "code", by: "build-handoff.js re-runs validate-blueprint.js --at-gate and refuses on error" },
  { id: "handoff-never-clobbers-instructions", where: "handoff-to-build", tier: "code", by: "build-handoff.js MARKER check on AGENTS.md/CLAUDE.md; settings.json is merged, never replaced" },
  { id: "handoff-excludes-private-and-ledger", where: "handoff-to-build", tier: "code", by: "build-handoff.js SKIP_NAMES + sources limited to mvp-pack/ and blueprint/ (E-nnn stays unresolvable by design)" },
  { id: "handoff-id-definition-site", where: "handoff-to-build", tier: "code", by: "build-handoff.js ID_KINDS.home — a citation never displaces the defining file" },
  { id: "handoff-drift-detectable", where: "handoff-to-build", tier: "code", by: "build-handoff.js --check (copy: both directions; in-place: stale index) + the generated SessionStart freshness hook" },
  { id: "handoff-refuses-same-repo", where: "handoff-to-build", tier: "code", by: "build-handoff.js target guard — a copy inside the guarded tree would be an unguarded twin (hooks scope to ideas/**)" },
  { id: "spec-awareness-on-first-read", where: "hooks.json PostToolUse", tier: "hook", by: "spec-awareness.js — path-scoped, once per session per workspace; a plugin cannot ship .claude/rules/, so the hook carries what a path-scoped rule would" },
  { id: "build-contract-at-session-start", where: "hooks.json SessionStart", tier: "hook", by: "session-start.js lockedSpecs branch (re-fires on compact, so it survives a context reset)" },
  { id: "id-resolves-to-definition-site", where: "spec / spec-gap", tier: "code", by: "lib/spec-index.js ID_KINDS.home — a citation never displaces the defining file; index built on demand, so it cannot go stale against an amendment" },
  { id: "one-id-vocabulary", where: "lib/spec-index.js", tier: "code", by: "shared module + a test asserting neither consumer declares its own ID_KINDS" },
  { id: "unresolved-id-is-a-finding", where: "spec", tier: "code", by: "spec-lookup.js exits 1 and refuses to characterise an unknown id as a free choice" },
  { id: "handoff-no-collidable-paths", where: "handoff-to-build", tier: "code", by: "build-handoff.js OUT namespaces + contract tests asserting nothing lands at .claude/rules/implementation.md or .claude/skills/spec/" },
  { id: "handoff-rules-self-limiting", where: "handoff-to-build", tier: "code", by: "build-handoff.js PRECEDENCE clause in every generated rule + parity tests (Claude Code picks arbitrarily between contradicting instructions)" },
  { id: "handoff-index-written-last", where: "handoff-to-build", tier: "code", by: "build-handoff.js write order + the 'refused run writes no index' test (a half-generated kit must not claim to be one)" },
  { id: "handoff-paraphrases-nothing", where: "handoff-to-build", tier: "prose", by: "INTENTIONAL: a design constraint on the templates — enforced by review, since 'this sentence restates a spec' is not mechanically decidable" },
  { id: "handoff-refreshed-after-amendment", where: "amend-blueprint step 6", tier: "prose", by: "the generated freshness hook reports staleness at the next build session, but nothing forces the regeneration" },

  // ---- evidence integrity
  { id: "ledger-required-columns", where: "method-rules-artifact-schema", tier: "code", by: "validate-evidence-ledger.js" },
  { id: "grade-d-never-in-ledger", where: "method-rules §2", tier: "code", by: "validate-evidence-ledger.js" },
  { id: "independence-from-root-sources", where: "method-rules-artifact-schema", tier: "code", by: "validate-evidence-ledger.js max_independent_count" },
  { id: "superseded-rows-not-counted", where: "method-rules-artifact-schema", tier: "code", by: "validate-evidence-ledger.js live roots" },
  { id: "supersession-is-a-chain", where: "method-rules-artifact-schema", tier: "code", by: "validate-evidence-ledger.js DFS" },
  { id: "relationship-targets-exist", where: "method-rules-artifact-schema", tier: "code", by: "validate-evidence-ledger.js" },
  { id: "semantic-duplicate-rows", where: "method-rules-artifact-schema", tier: "agent", by: "gatekeeper check 8 (different wording, same claim)" },
  { id: "quote-actually-at-the-url", where: "gatekeeper.md", tier: "agent", by: "gatekeeper spot-check" },
  { id: "fabrication-smell", where: "gatekeeper.md", tier: "agent", by: "gatekeeper check 5" },

  // ---- decision integrity
  { id: "artifact-set-pinned-at-verdict", where: "gate-contracts cross-gate", tier: "code", by: "artifact-manifest.js create+verify" },
  { id: "manifest-fails-closed-on-shape", where: "artifact-manifest.js", tier: "code", by: "verify() shape checks" },
  { id: "file-added-to-reviewed-dir", where: "artifact-manifest.js", tier: "code", by: "expanded_dirs re-walk" },
  { id: "pack-label-computed", where: "gate-contracts predicate", tier: "code", by: "pack-verdict.js" },
  { id: "prospective-label-marked", where: "gate-contracts LOCK", tier: "agent", by: "gate-check Layer 1 reads the label text" },
  { id: "threshold-snapshot-matches", where: "gate-contracts cross-gate", tier: "code", by: "verify-threshold-snapshot.js (exit 0 required at EVERY gate; hook is defence-in-depth)" },
  { id: "state-truncation-blocked", where: "method-rules-state-schema (D3)", tier: "hook", by: "guard-thresholds.js load-bearing-key drop guard + state-write.js mandatory" },
  { id: "prospect-cells-and-floor", where: "gate-contracts F", tier: "code", by: "validate-beachhead.js (cells, dedup, observed_at, floor; run #3 checks absorbed)" },
  { id: "r1-run-contract-preregistered", where: "gate-contracts R1", tier: "code", by: "validate-run-contract.js (exit 0 required BEFORE the scored run)" },
  { id: "sampling-frame-hash-verified", where: "gate-contracts V1", tier: "code", by: "artifact-manifest.js verify (invoked by gate-check)" },
  { id: "codex-agent-parity", where: "codex port parity contract", tier: "code", by: "sync-codex-agents.js --check" },

  // ---- gate predicates that only a reader can judge
  { id: "problem-has-no-solution", where: "gate-contracts F", tier: "agent", by: "gatekeeper" },
  { id: "refutation-condition-present", where: "gate-contracts F", tier: "agent", by: "gatekeeper" },
  { id: "intake-classification-complete", where: "gate-contracts F", tier: "agent", by: "gatekeeper" },
  { id: "zero-unresolved-blocking-questions", where: "gate-contracts F", tier: "agent", by: "gatekeeper" },
  { id: "20-prospects-tier-4-5", where: "gate-contracts F", tier: "agent", by: "gatekeeper judges whether each behaviour is really behavioural (the count itself is code: validate-beachhead.js)" },
  { id: "deadly-assumptions-have-test-cards", where: "gate-contracts F", tier: "agent", by: "gatekeeper" },
  { id: "5-tier-map-populated", where: "gate-contracts C", tier: "agent", by: "gatekeeper" },
  { id: "pricing-normalized", where: "gate-contracts C", tier: "agent", by: "gatekeeper" },
  { id: "capability-state-recorded", where: "gate-contracts C", tier: "agent", by: "gatekeeper" },
  { id: "v1-metric-on-neutral-frame", where: "gate-contracts V1", tier: "agent", by: "gatekeeper recomputes" },
  { id: "chatgpt-gap-recorded", where: "gate-contracts V2", tier: "agent", by: "gatekeeper" },
  { id: "rescued-not-counted-as-support", where: "gate-contracts V2", tier: "agent", by: "gatekeeper check 9" },
  { id: "valid-session-denominator", where: "gate-contracts V2", tier: "agent", by: "gatekeeper check 9" },
  { id: "invalid-vs-weakened", where: "gate-contracts V2/V3", tier: "agent", by: "gatekeeper check 10" },
  { id: "commitments-outside-network", where: "gate-contracts V3", tier: "agent", by: "gatekeeper" },
  { id: "r1-human-labeled-anchors", where: "gate-contracts R1 evidence rules", tier: "agent", by: "gatekeeper" },
  { id: "r2-outcomes-match-promise", where: "gate-contracts R2", tier: "agent", by: "gatekeeper" },
  { id: "alternatives-ledger-traced", where: "gate-contracts P", tier: "agent", by: "gatekeeper" },
  { id: "publication-disposition-safe", where: "method-rules §11", tier: "agent", by: "gatekeeper check 11" },
  { id: "one-variable-message-test", where: "gate-contracts P", tier: "agent", by: "gatekeeper" },
  { id: "core-loop-steps-traced", where: "gate-contracts LOCK", tier: "agent", by: "gatekeeper + coldstart" },
  { id: "msp-complete-or-na", where: "gate-contracts LOCK", tier: "agent", by: "coldstart-tester + gatekeeper" },
  { id: "no-invented-sla", where: "gate-contracts LOCK", tier: "agent", by: "coldstart-tester" },
  { id: "pack-self-contained", where: "gate-contracts LOCK", tier: "agent", by: "coldstart on a clean copy" },
  { id: "confidence-language-matches-grades", where: "artifact-schema EQR", tier: "agent", by: "gatekeeper" },
  { id: "no-cross-domain-recertification", where: "method-rules §12", tier: "agent", by: "gatekeeper check 14" },

  // ---- rules nothing checks at all
  // Dispositioned in v1.3.0. Five are INTENTIONAL prose — the
  // `by` field says why code cannot or should not hold them. Three are DEBT,
  // deferred deliberately; do not mistake them for decisions.
  { id: "two-identical-failures-stop", where: "method-rules §13", tier: "prose", by: "intentional — 'identical failure' is a semantic judgement; a code equality check would invite laundering the second failure into a variant" },
  { id: "outward-action-per-approval", where: "method-rules §7", tier: "prose", by: "intentional — the runtime permission layer is the enforcement point; duplicating it in-plugin would create a second, weaker authority" },
  { id: "budget-preflight", where: "method-rules §7", tier: "prose", by: "DEBT — state.budget is data; nothing blocks a spend. Candidate for a gate-check Layer 1 check" },
  { id: "charter-playback-at-each-gate", where: "method-rules §9", tier: "prose", by: "DEBT — gate-check could refuse a verdict without a journaled playback marker" },
  { id: "interpretation-never-promoted", where: "stage-0", tier: "prose", by: "intentional — whether a sentence is interpretation is itself interpretation; the intake classification table + gatekeeper are the honest layer for it" },
  { id: "instrumentation-check-before-run", where: "stage-2", tier: "prose", by: "DEBT — an experiment kit could carry a checkable instrumentation checklist artifact" },
  { id: "consent-before-material-enters", where: "method-rules §7", tier: "prose", by: "intentional — the manifest is required at V1; its truthfulness is unknowable to any file check (same limit as `self_authored`)" },
  { id: "deletion-never-automatic", where: "method-rules §7", tier: "prose", by: "intentional by design — nothing in the plugin deletes; adding enforcement would mean adding deletion code" },
];

function main(argv) {
  const jsonOut = argv.includes("--json");
  const tiers = { code: [], hook: [], agent: [], prose: [] };
  for (const r of REQUIREMENTS) tiers[r.tier].push(r);
  const total = REQUIREMENTS.length;
  const deterministic = tiers.code.length + tiers.hook.length;
  const pct = (n) => `${((n / total) * 100).toFixed(0)}%`;

  const summary = {
    total,
    deterministic,
    deterministic_pct: Number(((deterministic / total) * 100).toFixed(1)),
    by_tier: Object.fromEntries(Object.entries(tiers).map(([k, v]) => [k, v.length])),
  };

  if (jsonOut) {
    process.stdout.write(JSON.stringify({ summary, requirements: REQUIREMENTS }, null, 2) + "\n");
    return 0;
  }

  process.stdout.write(`Enforcement coverage — ${total} normative requirements inventoried\n\n`);
  process.stdout.write(`  code   ${String(tiers.code.length).padStart(3)}  ${pct(tiers.code.length)}  a script rejects it\n`);
  process.stdout.write(`  hook   ${String(tiers.hook.length).padStart(3)}  ${pct(tiers.hook.length)}  a hook rejects it at write time\n`);
  process.stdout.write(`  agent  ${String(tiers.agent.length).padStart(3)}  ${pct(tiers.agent.length)}  only a model reading the artifacts can catch it\n`);
  process.stdout.write(`  prose  ${String(tiers.prose.length).padStart(3)}  ${pct(tiers.prose.length)}  nothing checks it\n\n`);
  process.stdout.write(`  DETERMINISTIC (code+hook): ${deterministic}/${total} = ${pct(deterministic)}\n`);
  process.stdout.write(`  MODEL-DEPENDENT (agent+prose): ${total - deterministic}/${total} = ${pct(total - deterministic)}\n\n`);
  process.stdout.write("Unchecked by anything (tier `prose`):\n");
  for (const r of tiers.prose) process.stdout.write(`  - ${r.id}  (${r.where})\n`);
  process.stdout.write(
    "\nReading: the model-dependent share is the pipeline's real exposure. Every one of those\n" +
      "requirements is enforced by an agent reading a long contract — so context budget is not a\n" +
      "tidiness concern, it is the enforcement substrate.\n"
  );
  return 0;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { REQUIREMENTS };
