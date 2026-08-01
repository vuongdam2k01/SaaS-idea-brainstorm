#!/usr/bin/env node
/**
 * PostToolUse hook (saas-idea-brainstorm plugin) — spec awareness on first contact.
 *
 * The problem: a coding session in a repo that also holds an idea workspace opens
 * `ideas/<slug>/blueprint/feature-specs/fs-03-…md`, sees a markdown file, and treats it
 * as documentation — prose to skim, `AC-03-2` as decoration, an empty cell as an opening.
 * It is none of those. It is a frozen contract addressed by id.
 *
 * A plugin cannot ship `.claude/rules/` (rules are project/user scope; plugin components
 * are skills, agents, hooks, MCP and LSP servers), but PostToolUse can inject context —
 * which reaches the same place a path-scoped rule would, without writing a single file
 * into the user's project. That is why this exists as a hook rather than as something
 * generated: nothing to install, nothing to regenerate, nothing to collide with another
 * plugin, nothing to go stale.
 *
 * Emitted ONCE per session per idea. Repeating it on every read would spend context to
 * say what the session already knows; compaction is covered separately, because
 * SessionStart re-fires on `compact` and carries the standing contract.
 *
 * Fails open, observably: a broken hook must never block a read.
 */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  try {
    const evt = JSON.parse(input || "{}");
    const fp = String((evt.tool_input && evt.tool_input.file_path) || "");
    if (!fp) return process.exit(0);
    const norm = fp.replace(/\\/g, "/");

    // Only the spec set. Not the ledger, not the journals, not private/.
    const m = norm.match(/\/ideas\/([^/]+)\/(mvp-pack|blueprint)\//i);
    if (!m) return process.exit(0);
    const slug = m[1];
    const ideaDir = norm.slice(0, norm.indexOf("/ideas/" + slug + "/") + ("/ideas/" + slug).length + 1);

    // Sentinel: only OUR workspaces. An unrelated repo with an ideas/ folder is untouched.
    let state = null;
    try {
      const raw = fs.readFileSync(path.join(ideaDir, "state.json"), "utf8");
      if (!raw.includes("pipeline_version")) return process.exit(0);
      state = JSON.parse(raw);
    } catch { return process.exit(0); }

    if (seenThisSession(evt.session_id, ideaDir)) return process.exit(0);

    const bp = (state && state.blueprint) || null;
    const locked = !!(bp && bp.status === "locked");
    const amendments = bp && bp.amendments && bp.amendments.last_id;

    const lines = [];
    lines.push(
      "The file just read is part of the locked specification for idea \"" + slug + "\" — a contract " +
      "produced by the saas-idea-brainstorm validation pipeline, not documentation about the product. " +
      (locked
        ? "It passed gate BP, which means a fresh session reading only the pack and the blueprint can " +
          "implement every feature without inventing a product decision."
        : "The blueprint has NOT passed gate BP yet, so parts of it are still being written and are not " +
          "yet binding.")
    );
    if (amendments)
      lines.push(
        "Amendments exist through " + amendments + ". Current truth = locked blueprint + " +
        "ideas/" + slug + "/blueprint/amendment-log.md, and the log is read FIRST — a locked file may " +
        "already have been superseded on the point being read."
      );
    lines.push(
      "How these files are addressed: sections are delimited by HTML anchor comments (<!-- bp:acceptance -->, " +
      "<!-- bp:edge-cases -->, <!-- pack:core-loop --> …), which are stable regardless of the language the " +
      "prose is written in; a section runs from its anchor to the next one. Ids are not decoration — " +
      "fs-NN is a feature spec, AC-NN-n an acceptance criterion (binary given/when/then, and the test oracle), " +
      "ST-<entity>-n an owned state transition, INV-n a cross-feature invariant, JOB-n async semantics, " +
      "CAP-NN-n a subsystem capability, EV-n its eval threshold, DR-n a decision the founder delegated to " +
      "build time, DOD-n a definition-of-done item, E-nnn an evidence-ledger citation."
    );
    lines.push(
      "Resolve an id with /saas-idea-brainstorm:spec <id> rather than inferring it from context — it " +
      "returns the file, the section and the text that DEFINES the id, not the places that merely cite it."
    );
    lines.push(
      "These files are read-only. A blank cell is not permission to choose: the validator rejects unresolved " +
      "markers, so blanks either inherit a value declared elsewhere or are a genuine spec gap. If the spec is " +
      "wrong, silent or self-contradicting on something in scope, that is /saas-idea-brainstorm:spec-gap, " +
      "then amend-blueprint — never an edit here. A PreToolUse hook blocks the edit regardless, but the point " +
      "is the routing, not the block."
    );

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: lines.join("\n") },
    }));
    process.exit(0);
  } catch (e) {
    try { process.stderr.write("[saas-idea-brainstorm] spec-awareness.js failed open: " + (e && e.message) + "\n"); } catch {}
    process.exit(0);
  }
});

/**
 * One injection per session per idea. The marker lives in the OS temp dir keyed by a hash
 * of session id + slug: no state in the user's repo, and nothing to clean up.
 */
function seenThisSession(sessionId, ideaDir) {
  try {
    // Keyed on the ABSOLUTE workspace path, not the slug: two checkouts of the same idea
    // — a worktree, a second clone, a test fixture — are different specs to a build
    // session, and each deserves its own first-contact briefing.
    const key = crypto.createHash("sha1")
      .update(String(sessionId || "no-session") + "|" + ideaDir).digest("hex").slice(0, 16);
    const marker = path.join(os.tmpdir(), "saas-spec-awareness-" + key);
    if (fs.existsSync(marker)) return true;
    fs.writeFileSync(marker, ideaDir);
    return false;
  } catch {
    // If the marker cannot be written, prefer injecting again over going silent:
    // repeating context is wasteful, missing it is a wrong build.
    return false;
  }
}
