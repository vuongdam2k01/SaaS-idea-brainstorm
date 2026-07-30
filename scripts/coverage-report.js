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
