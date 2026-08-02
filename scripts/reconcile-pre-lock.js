#!/usr/bin/env node
/**
 * Pre-LOCK reconciliation (saas-idea-brainstorm plugin, v1.13.0).
 *
 * A distinct, LIGHTER counterpart to the `reconcile` skill — NOT a duplicate,
 * and not a substitute for it. `reconcile` (skills/reconcile/SKILL.md) is the
 * heavyweight, transactional, POST-LOCK mechanism: reality intake, a
 * three-tier comparison against a locked baseline, claim-status transitions,
 * a two-phase hash-finalized publish. None of that exists yet before LOCK —
 * there is no locked baseline to compare against, no claim register, no
 * manifest to finalize. `reconcile` itself says so: "If no cycle has reached
 * LOCK, stop: pre-LOCK corrections are pivots (stage skills + decision-log),
 * not reconciliation." This script is the mirror-image guard: it refuses to
 * run once any cycle in the idea HAS reached LOCK (or stopped) — that is
 * `reconcile`'s job, not this one's.
 *
 * What this script actually checks, reading only state.json + tracked
 * artifacts (never session/conversation memory — method-rules §1, the exact
 * same constraint as detect-stale-criteria.js):
 *
 *   (a) waiting_on[] entries whose `resume_when` condition LOOKS satisfiable
 *       against current artifacts (a named file now exists) but the entry has
 *       not been cleared. Whether the condition is REALLY satisfied requires
 *       reading the artifact's prose meaning, which is a judgment call this
 *       script cannot make — so these are always surfaced as QUESTIONS, never
 *       proposed patches.
 *   (b) a real pending founder decision implied by state that has NO
 *       corresponding waiting_on entry (e.g. a FAILed gate with no recorded
 *       pivot/override and nothing tracking it as "waiting on the founder").
 *       Also a judgment call — surfaced as a QUESTION.
 *   (c) a `post_launch_validation` register item that has LEAKED into
 *       waiting_on[] before the MVP release was declared. This one IS
 *       schema-checkable (does a waiting_on entry's text reference the
 *       register while post_launch_validation.status is still pre-MVP,
 *       i.e. "pending"/"active" rather than "reactivated"/"closed") — a
 *       deterministic divergence, and it gets a proposed patch.
 *
 * Deterministic divergences ((c)) get a proposed patch. Non-deterministic
 * judgment calls ((a), (b)) are surfaced as open questions for the user only.
 * Nothing here writes state.json — a proposed patch is applied, if at all,
 * only via scripts/state-write.js on the user's explicit confirmation
 * ("deletion/patch is never automatic" posture, same as detect-stale-criteria.js
 * and the plugin's privacy duties).
 *
 * Usage:
 *   node scripts/reconcile-pre-lock.js <idea-dir> [--json]
 * Exit codes:
 *   0 = clean (no divergences, no open questions)
 *   1 = divergences and/or open questions present
 *   2 = unusable input, OR a cycle has already reached LOCK (wrong tool — use `reconcile`)
 */
"use strict";
const fs = require("fs");
const path = require("path");

function isPreMvp(status) {
  return status === "pending" || status === "active";
}

/** True if any cycle (root C1 inline, or any fragment index entry) is locked/stopped. */
function anyCycleLocked(state) {
  const cycles = Array.isArray(state.cycles) ? state.cycles : [];
  return cycles.some((c) => c && (c.status === "locked" || c.status === "stopped"));
}

function textOf(entry) {
  return [entry && entry.what, entry && entry.needed_for, entry && entry.resume_when]
    .filter((v) => typeof v === "string")
    .join(" \n ");
}

/** (a) — best-effort textual signal only; never a claim of certainty. */
function checkResumeConditionsLookSatisfiable(state, ideaDir) {
  const questions = [];
  const waiting = Array.isArray(state.waiting_on) ? state.waiting_on : [];
  for (const w of waiting) {
    if (!w || typeof w.resume_when !== "string") continue;
    // A resume_when that names a plausible idea-relative path or filename —
    // check whether something matching now exists. This is a SIGNAL, not a
    // verdict: file existence does not mean the file's content actually
    // satisfies the condition, which is exactly why this is a question.
    const pathLike = w.resume_when.match(/`?([A-Za-z0-9_.\-\/]+\.(?:md|json|txt|csv))`?/);
    if (pathLike) {
      const candidate = path.join(ideaDir, pathLike[1]);
      if (fs.existsSync(candidate)) {
        questions.push({
          kind: "resume_when-maybe-satisfied",
          what: w.what,
          resume_when: w.resume_when,
          owner: w.owner,
          evidence: `${pathLike[1]} now exists in the idea directory`,
          question: `waiting_on entry "${w.what}" names resume_when "${w.resume_when}" — ${pathLike[1]} now exists. Is this condition actually satisfied? If so, clear the entry.`,
        });
        continue;
      }
    }
    // A directory-scoped condition ("transcripts land in private/") —
    // non-empty directory is a weaker but still worth-surfacing signal.
    const dirLike = w.resume_when.match(/\b([A-Za-z0-9_\-]+\/)\b/);
    if (dirLike) {
      const candidate = path.join(ideaDir, dirLike[1]);
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
          const entries = fs.readdirSync(candidate).filter((n) => !n.startsWith("."));
          if (entries.length) {
            questions.push({
              kind: "resume_when-maybe-satisfied",
              what: w.what,
              resume_when: w.resume_when,
              owner: w.owner,
              evidence: `${dirLike[1]} is non-empty (${entries.length} entr${entries.length === 1 ? "y" : "ies"})`,
              question: `waiting_on entry "${w.what}" names resume_when "${w.resume_when}" — ${dirLike[1]} now has content. Is this condition actually satisfied? If so, clear the entry.`,
            });
          }
        }
      } catch {
        /* unreadable directory: no signal, not an error */
      }
    }
  }
  return questions;
}

/** (b) — a FAILed gate with no recorded pivot/override and nothing tracking it in waiting_on. */
function checkMissingWaitingOnForPendingDecisions(state) {
  const questions = [];
  const gates = state.gates && typeof state.gates === "object" ? state.gates : {};
  const waiting = Array.isArray(state.waiting_on) ? state.waiting_on : [];
  for (const [name, g] of Object.entries(gates)) {
    if (!g || g.status !== "failed") continue;
    const tracked = waiting.some((w) => textOf(w).toLowerCase().includes(name.toLowerCase()));
    if (!tracked) {
      questions.push({
        kind: "untracked-pending-decision",
        gate: name,
        question: `gate ${name} is "failed" with no waiting_on entry mentioning it — is there a pending founder decision (pivot, or a will-override) that should be tracked as waiting_on, or was it already resolved without updating the gate status?`,
      });
    }
  }
  // A reactivated post-launch-validation register with no waiting_on entry
  // naming the real V1 re-run — the founder decision "run V1 for real now" is
  // implied by the state but nothing tracks it as an open item.
  const plv = state.post_launch_validation;
  if (plv && plv.status === "reactivated") {
    const tracked = waiting.some((w) => /v1|post.launch/i.test(textOf(w)));
    if (!tracked) {
      questions.push({
        kind: "untracked-pending-decision",
        gate: "V1",
        question:
          "post_launch_validation.status is \"reactivated\" (controlled MVP release declared) — real V1 evidence collection is due, but no waiting_on entry tracks it. Should one be added?",
      });
    }
  }
  return questions;
}

/** (c) — deterministic: post_launch_validation items must never appear inside waiting_on pre-MVP. */
function checkNoPostLaunchLeakIntoWaitingOn(state) {
  const divergences = [];
  const plv = state.post_launch_validation;
  if (!plv || !isPreMvp(plv.status)) return divergences; // nothing to leak, or already past MVP release
  const waiting = Array.isArray(state.waiting_on) ? state.waiting_on : [];
  const registerName = (plv.register_ref || "post-launch-validation-register.md").toLowerCase();
  for (let i = 0; i < waiting.length; i++) {
    const w = waiting[i];
    const text = textOf(w).toLowerCase();
    const mentionsRegister = text.includes(registerName) || text.includes("post-launch-validation-register") || text.includes("post-launch validation register");
    const mentionsReopenWording = plv.reopen_on && typeof plv.reopen_on === "string" && plv.reopen_on.length > 8 && text.includes(plv.reopen_on.toLowerCase());
    if (mentionsRegister || mentionsReopenWording) {
      divergences.push({
        kind: "post-launch-validation-leaked-into-waiting-on",
        index: i,
        what: w && w.what,
        resume_when: w && w.resume_when,
        matched_on: mentionsRegister ? "register filename/reference" : "reopen_on wording",
        proposed_patch: `remove waiting_on[${i}] ("${w && w.what}") — items deferred to post-launch validation belong only in ${plv.register_ref || "post-launch-validation-register.md"} until MVP-release reactivation (post_launch_validation.status is currently "${plv.status}")`,
      });
    }
  }
  return divergences;
}

function reconcilePreLock(state, ideaDir) {
  const openQuestions = [
    ...checkResumeConditionsLookSatisfiable(state, ideaDir),
    ...checkMissingWaitingOnForPendingDecisions(state),
  ];
  const divergences = checkNoPostLaunchLeakIntoWaitingOn(state);
  return { divergences, open_questions: openQuestions };
}

function main(argv) {
  const args = argv.slice(2);
  const jsonOut = args.includes("--json");
  const ideaDir = args.find((a) => !a.startsWith("--"));
  if (!ideaDir) {
    process.stderr.write("usage: reconcile-pre-lock.js <idea-dir> [--json]\n");
    return 2;
  }
  const statePath = path.join(ideaDir, "state.json");
  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (e) {
    process.stderr.write(`cannot read/parse ${statePath}: ${e.message}\n`);
    return 2;
  }

  if (anyCycleLocked(state)) {
    const msg =
      "a cycle in this idea has already reached LOCK/stopped — this is the wrong tool. " +
      "Use the `reconcile` skill (post-LOCK, transactional) instead; reconcile-pre-lock.js is " +
      "scoped to ideas where no cycle has ever reached LOCK.";
    if (jsonOut) process.stdout.write(JSON.stringify({ error: "cycle-already-locked", detail: msg }, null, 2) + "\n");
    else process.stderr.write(msg + "\n");
    return 2;
  }

  const result = reconcilePreLock(state, ideaDir);
  const total = result.divergences.length + result.open_questions.length;

  if (jsonOut) {
    process.stdout.write(JSON.stringify({ divergences: result.divergences.length, open_questions: result.open_questions.length, ...result }, null, 2) + "\n");
  } else {
    if (!total) {
      process.stdout.write("pre-LOCK reconcile: no divergences, no open questions\n");
    } else {
      if (result.divergences.length) {
        process.stdout.write(`${result.divergences.length} deterministic divergence(s):\n`);
        for (const d of result.divergences) process.stdout.write(`  DIVERGENCE (${d.kind}): ${d.proposed_patch}\n`);
      }
      if (result.open_questions.length) {
        process.stdout.write(`${result.open_questions.length} open question(s) for the founder (judgment calls — never auto-applied):\n`);
        for (const q of result.open_questions) process.stdout.write(`  QUESTION (${q.kind}): ${q.question}\n`);
      }
    }
  }
  return total ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = {
  reconcilePreLock,
  anyCycleLocked,
  checkResumeConditionsLookSatisfiable,
  checkMissingWaitingOnForPendingDecisions,
  checkNoPostLaunchLeakIntoWaitingOn,
};
