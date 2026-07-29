#!/usr/bin/env node
/**
 * PreToolUse hook on Write|Edit (saas-idea-brainstorm plugin) — v2.
 * Protects pre-registered commitments from silent edits. Fixes from adversarial review:
 * - SEMANTIC comparison: simulates the edit and diffs parsed thresholds (partial edits
 *   like old_string:"60" -> new_string:"70" are caught).
 * - Protects EVERY artifact with frontmatter `status: locked` (kill-criteria, DoD,
 *   positioning, mvp-spec, ...), not just kill-criteria.md.
 * - Protects decision-log.md append-only property (new content must contain the old).
 * - Sentinel check: only acts inside a real pipeline idea (sibling state.json with
 *   pipeline_version) so unrelated repos with an ideas/ folder are untouched.
 * Hooks are defense-in-depth only: gate-check independently verifies threshold
 * snapshots against decision-log, so a disabled hook does not disable integrity.
 * Fails open on internal errors.
 */
const fs = require("fs");
const path = require("path");

const THRESHOLD_FIELDS = [
  "signed_date",
  "v1_past_behavior_pct",
  "v1_min_sample",
  "v3_min_commitments",
  "r1_eval_pass_pct",
];

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  try {
    const evt = JSON.parse(input || "{}");
    const ti = evt.tool_input || {};
    const fp = ti.file_path || "";
    const norm = fp.replace(/\\/g, "/");
    const ideaDir = ideaDirOf(norm, fp);
    if (!ideaDir) return process.exit(0); // not a pipeline idea -> never interfere

    const exists = fs.existsSync(fp);
    const oldText = exists ? fs.readFileSync(fp, "utf8") : "";
    const newText = simulate(oldText, ti);

    // 1) Locked artifacts (any .md whose CURRENT frontmatter says status: locked)
    if (/\.md$/i.test(norm) && exists) {
      const fm = (oldText.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [, ""])[1];
      if (/^status:\s*locked\s*$/m.test(fm)) {
        return ask(
          `${path.basename(fp)} is LOCKED (signed). Locked artifacts (kill criteria, DoD, positioning, MVP spec) exist so decisions cannot be renegotiated silently. Approve only if the user explicitly requested this revision; record it in the artifact's changelog.`
        );
      }
    }

    // 2) decision-log.md must be append-only: old content must be an EXACT PREFIX
    //    of the new content (contains-check allowed prepend-tampering — review finding).
    if (/\/decision-log\.md$/i.test(norm) && exists && newText !== null) {
      const oldTrim = oldText.replace(/\s+$/, "");
      const newTrim = newText.replace(/\s+$/, "");
      if (oldTrim && !newTrim.startsWith(oldTrim)) {
        return ask(
          "decision-log.md is append-only: new content must start with the existing journal unchanged (no rewrites, no prepends). Approve only if the user explicitly requested a history correction (and prefer an appended correction row instead)."
        );
      }
    }

    // 3) state.json signed thresholds — semantic diff with STRICT revision validation
    if (/\/state\.json$/i.test(norm) && exists && newText !== null) {
      let oldState = null,
        newState = null;
      try {
        oldState = JSON.parse(oldText);
      } catch {
        return process.exit(0); // unparsable current state: allow repair
      }
      // Sentinel: an existing state.json without pipeline_version is not ours —
      // do not police unrelated projects (review finding: false positive).
      if (!oldState || !oldState.pipeline_version) return process.exit(0);
      try {
        newState = JSON.parse(newText);
      } catch {
        return ask(
          "This edit would make state.json unparsable JSON. Fix the edit instead of writing a broken state file."
        );
      }
      const signed = oldState.thresholds && oldState.thresholds.signed_date;
      if (signed) {
        const ot = oldState.thresholds || {};
        const nt = (newState && newState.thresholds) || {};
        const changed = THRESHOLD_FIELDS.filter(
          (k) => JSON.stringify(ot[k]) !== JSON.stringify(nt[k])
        );
        if (JSON.stringify(ot.custom || {}) !== JSON.stringify(nt.custom || {}))
          changed.push("custom");
        if (changed.length) {
          // A meaningless revisions entry ([{}]) must not authorize the edit
          // (review finding): every changed field needs a matching, complete,
          // user-approved revision entry.
          const oldRevCount = (Array.isArray(ot.revisions) && ot.revisions.length) || 0;
          const newRevs = Array.isArray(nt.revisions) ? nt.revisions.slice(oldRevCount) : [];
          const validDate = (s) => {
            const m = typeof s === "string" && s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!m) return false;
            const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
            return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
          };
          const covered = (field) =>
            newRevs.some(
              (r) =>
                r &&
                r.field === field &&
                r.user_approved === true &&
                typeof r.reason === "string" &&
                r.reason.trim() &&
                validDate(r.date) &&
                // from/to must correspond to the actual old and new values (schema requirement)
                JSON.stringify(r.from) === JSON.stringify(field === "custom" ? ot.custom || {} : ot[field]) &&
                JSON.stringify(r.to) === JSON.stringify(field === "custom" ? nt.custom || {} : nt[field])
            );
          const uncovered = changed.filter((f) => !covered(f));
          if (uncovered.length) {
            return ask(
              `Thresholds were signed on ${ot.signed_date}; this edit changes [${changed.join(", ")}] but fields [${uncovered.join(", ")}] lack a complete matching revisions entry ({field, date, reason, user_approved: true}). Changing pre-registered thresholds after the fact is the exact failure mode this pipeline prevents.`
            );
          }
        }
      }
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }

  function simulate(oldText, ti) {
    if (typeof ti.content === "string") return ti.content; // Write
    if (typeof ti.new_string === "string" && typeof ti.old_string === "string") {
      if (!oldText.includes(ti.old_string)) return oldText; // edit would fail anyway
      return ti.replace_all
        ? oldText.split(ti.old_string).join(ti.new_string)
        : oldText.replace(ti.old_string, ti.new_string);
    }
    return null; // unknown shape
  }

  function ideaDirOf(norm, fp) {
    const m = norm.match(/^(.*\/ideas\/[^/]+)\//i);
    if (!m) return null;
    const statePath = path.join(m[1].replace(/\//g, path.sep), "state.json");
    // sentinel: state.json must exist and mention pipeline_version, OR the edit target IS state.json being created
    if (/\/state\.json$/i.test(norm)) return m[1];
    try {
      if (!fs.existsSync(statePath)) return null;
      const raw = fs.readFileSync(statePath, "utf8");
      return raw.includes("pipeline_version") ? m[1] : null;
    } catch {
      return null;
    }
  }

  function ask(reason) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "ask",
          permissionDecisionReason: reason,
        },
      })
    );
    process.exit(0);
  }
});
