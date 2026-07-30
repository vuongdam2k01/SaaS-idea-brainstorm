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

// Watched (so removal/blanking is still caught) but never authorizable by a
// `revisions` entry — see the comment at the `uncovered` filter below.
const NON_REVISABLE = new Set(["signed_date"]);

// Canonical JSON: object keys sorted recursively, so `{a:1,b:2}` and `{b:2,a:1}`
// compare equal. Without this, a writer that merely reorders keys while making a
// legitimate revision gets blocked for a change it did not make.
function canon(v) {
  if (v === undefined) return "\u0000undefined";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
}

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

    // 1) Locked artifacts (any .md whose CURRENT frontmatter says status: locked,
    //    or publication_status: locked for phase: maintenance artifacts)
    if (/\.md$/i.test(norm) && exists) {
      const fm = (oldText.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [, ""])[1];
      const isCharter = /\/founder-charter\.md$/i.test(norm);
      if (isCharter && /^status:\s*locked\s*$/m.test(fm) && newText !== null) {
        // Charter is an append-superseding ledger (maintenance-rules §7): existing
        // items must stay byte-stable; legal changes only APPEND new item rows.
        // Byte-exact prefix, tolerating only a single trailing-newline difference.
        const oldBase = oldText.replace(/\r?\n$/, "");
        if (newText === oldText || newText.startsWith(oldText) || newText.startsWith(oldBase + "\n") || newText.startsWith(oldBase + "\r\n"))
          return process.exit(0); // pure append: allowed
        return ask(
          "founder-charter.md is a locked append-superseding ledger: existing items are byte-stable (no edit/delete/reorder); corrections APPEND a new stable-ID item with supersedes + exact founder words. This edit rewrites existing content. Approve only if the user explicitly requested a history correction."
        );
      }
      if (/^status:\s*locked\s*$/m.test(fm) || /^publication_status:\s*locked\s*$/m.test(fm)) {
        return ask(
          `${path.basename(fp)} is LOCKED (signed/published). Locked artifacts (kill criteria, DoD, positioning, MVP spec, published baselines/manifests) exist so decisions and history cannot be renegotiated silently — changes go into a same-kind successor (supersedes) or a new cycle, never in place. Approve only if the user explicitly requested this revision.`
        );
      }
    }

    // 2) Append-only streams (decision-log, drift-inbox, evidence-ledger,
    //    audit-trail): old content must be a BYTE-EXACT PREFIX of the new content
    //    (contains-check allowed prepend-tampering; whitespace-trimmed comparison
    //    allowed silent trailing-row edits — both review findings). Tolerance:
    //    exactly one missing/added trailing newline, nothing else.
    if (/\/(decision-log|drift-inbox|evidence-ledger|audit-trail)\.md$/i.test(norm) && exists && newText !== null) {
      const which = norm.match(/\/([^/]+\.md)$/)[1];
      const oldBase = oldText.replace(/\r?\n$/, ""); // tolerate ONE trailing newline difference
      if (oldBase && !(newText === oldText || newText.startsWith(oldText) || newText.startsWith(oldBase + "\n") || newText.startsWith(oldBase + "\r\n") || newText === oldBase)) {
        return ask(
          `${which} is append-only: new content must start with the existing rows byte-unchanged (no rewrites, no prepends, no row edits). Approve only if the user explicitly requested a history correction (and prefer an appended correction row instead).`
        );
      }
    }

    // 2.5) Historical artifacts of a LOCKED/STOPPED cycle: pipeline-phase .md files
    //      (draft/ready included) freeze as historical context at LOCK — current
    //      truth moves to baselines. Append-only streams, charter, post-mortem,
    //      README, private/, and maintenance-phase files are exempt (own rules).
    if (
      /\.md$/i.test(norm) && exists && newText !== null &&
      !/\/(decision-log|drift-inbox|evidence-ledger|audit-trail|founder-charter|post-mortem|README)\.md$/i.test(norm) &&
      !/\/private\//i.test(norm)
    ) {
      const fmH = (oldText.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [, ""])[1];
      const isMaint = /^phase:\s*maintenance\s*$/m.test(fmH);
      if (!isMaint && fmH) {
        try {
          const stRaw = fs.readFileSync(path.join(ideaDir.replace(/\//g, path.sep), "state.json"), "utf8");
          const st = JSON.parse(stRaw);
          const cycles = Array.isArray(st.cycles) ? st.cycles : [];
          const cm = norm.match(/\/cycles\/(C\d+)\//i);
          const owner = cm
            ? cycles.find((c) => c && c.id === cm[1])
            : cycles.find((c) => c && c.state === null);
          if (owner && ["locked", "stopped"].includes(owner.status)) {
            return ask(
              `${path.basename(fp)} belongs to cycle ${owner.id}, which is ${owner.status}: pipeline artifacts freeze as historical context at LOCK (maintenance-rules §1). Current truth changes go into a current-baseline via reconcile, or a new cycle's own artifacts — not edits to history. Approve only if the user explicitly requested this.`
            );
          }
        } catch { /* unreadable state: fail open */ }
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
          (k) => canon(ot[k]) !== canon(nt[k])
        );
        // Dogfood run #3 finding: `custom` used to be diffed and revised as ONE
        // opaque blob. With 14+ criteria inside it, revising a single threshold
        // required restating the entire object in one write — so a run that
        // legitimately wanted to rename one key wrote 7 approved revision rows
        // and changed nothing, leaving `a8_..._max_pct` carrying `_min`
        // semantics on disk. Address custom by LEAF: each changed key is its own
        // reviewable field, spelled `custom.<key>`.
        const oc = ot.custom || {};
        const nc = nt.custom || {};
        for (const k of new Set([...Object.keys(oc), ...Object.keys(nc)])) {
          if (canon(oc[k]) !== canon(nc[k])) changed.push("custom." + k);
        }
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
          // Resolve a field name (top-level, or `custom.<key>`) to its old/new value.
          const valOf = (field, thresholds) => {
            if (field.startsWith("custom.")) {
              const c = thresholds.custom || {};
              return c[field.slice(7)];
            }
            return thresholds[field];
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
                // from/to must correspond to the actual old and new values (schema
                // requirement). Compared canonically so key order in an object
                // value is not mistaken for a different value.
                canon(r.from) === canon(valOf(field, ot)) &&
                canon(r.to) === canon(valOf(field, nt))
            );
          // `signed_date` is watched like any other field (so blanking or
          // deleting it can never silently un-sign the thresholds) but it is
          // NEVER satisfiable by a revisions entry. Backdating it is the single
          // edit that makes late-collected evidence look pre-registered, and
          // gate-check's "thresholds signed BEFORE evidence dates" check would
          // then *reward* the tamper instead of catching it. A revision entry is
          // data the writer authors itself, so it cannot authorize the field that
          // establishes when pre-registration happened — that is a human decision.
          // (First signing is unaffected: this whole branch only runs when the
          // OLD state already carries a signed_date.)
          const uncovered = changed.filter((f) => NON_REVISABLE.has(f) || !covered(f));
          if (uncovered.length) {
            const sealed = uncovered.filter((f) => NON_REVISABLE.has(f));
            const revisable = uncovered.filter((f) => !NON_REVISABLE.has(f));
            // Dogfood run #3 finding: the old message said only "a matching
            // revisions entry is needed". It never stated the two conditions that
            // actually decide the outcome, so the writer read the hook's source to
            // find them — and a solo dev who does not read hook source simply gets
            // stuck. Print the exact rows to paste, and both conditions.
            const template = revisable.map((f) =>
              JSON.stringify({
                date: new Date().toISOString().slice(0, 10),
                field: f,
                from: valOf(f, ot) === undefined ? null : valOf(f, ot),
                to: valOf(f, nt) === undefined ? null : valOf(f, nt),
                reason: "<why this pre-registered threshold must change>",
                user_approved: true,
              })
            );
            return ask(
              `Thresholds were signed on ${ot.signed_date}; this edit changes [${changed.join(", ")}] but [${uncovered.join(", ")}] lack a complete matching revisions entry. Changing pre-registered thresholds after the fact is the exact failure mode this pipeline prevents.` +
                (revisable.length
                  ? `\n\nTo proceed legitimately, append these row(s) to thresholds.revisions IN THE SAME WRITE as the value change (a revision added in an earlier, separate write does not authorize a later edit — only rows appended by this same write are counted), then ask the founder to approve:\n` +
                    template.map((t) => "  " + t).join("\n") +
                    `\n\nOne row per changed field. Custom thresholds are addressed by leaf ("custom.<key>"), so revising one criterion does NOT require restating the whole custom object. \`from\`/\`to\` must be the real old/new VALUES, not a prose description of the change.`
                  : "") +
                (sealed.length
                  ? `\n\nNote: [${sealed.join(", ")}] can NEVER be changed by a revisions entry — the signing date is what makes "pre-registered" meaningful, so moving it requires your explicit approval here and a journaled reason, and re-signing means starting a new cycle rather than editing this one.`
                  : "")
            );
          }
        }
      }
    }

    process.exit(0);
  } catch (e) {
    // Fail open, but OBSERVABLY (dogfood run #2, FM-10). A silent catch made
    // "nothing to flag" and "crashed before flagging anything" identical: a sibling
    // hook threw a ReferenceError for an entire run, emitted nothing, exited 0, and
    // looked exactly like a healthy hook. stderr never blocks the write, and the
    // harness captures it, so a total outage stops being invisible.
    try {
      process.stderr.write(
        `[saas-idea-brainstorm] guard-thresholds.js failed open: ${e && e.name}: ${e && e.message}\n`
      );
    } catch {}
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
