#!/usr/bin/env node
/**
 * SessionStart hook (saas-idea-brainstorm plugin) — v3.
 * Injects a summary of validation-pipeline state for ideas in this workspace.
 * Fixes from adversarial review:
 * - Walks upward from cwd to the workspace/git root to find ideas/ (a session
 *   started in a subdirectory still finds the project state).
 * - Uses LOCAL calendar date for deadline comparison, not UTC.
 * - Each idea is isolated in its own try/catch (one corrupt state cannot
 *   suppress healthy ideas' summaries).
 * - Sentinel: only reports state.json files containing pipeline_version.
 * Fails open. Skills must not depend on this summary (hooks can be disabled).
 *
 * THIS HOOK NEVER BLOCKS (v1.13.0 note, not a behavior change). SessionStart
 * output is `additionalContext` injected into the session — there is no
 * `permissionDecision` at this event, so nothing emitted here CAN block a
 * tool call the way `guard-thresholds.js`'s `ask()` does. Every emitted
 * segment below is therefore tagged `[INFORMATIONAL]` or
 * `[ACTION_REQUIRED_LATER]`, never `[BLOCKING]` — if a future edit ever finds
 * itself wanting to tag a line here `[BLOCKING]`, that is a signal this
 * hook's role has drifted into something a SessionStart hook cannot actually
 * do, not an instruction to force the tag on. `[ACTION_REQUIRED_LATER]`
 * marks overdue kill/health criteria, overdue retention duties, a
 * reactivated post-launch-validation register, and drift declared-but-not-
 * reconciled — things the founder must eventually act on, just not by
 * blocking this session's next tool call. Everything else (waiting-on list,
 * blueprint status, the last-reconcile line, routine gate/position reporting)
 * is `[INFORMATIONAL]`. See method-rules §15 and `guard-thresholds.js`'s own
 * header comment for where real `[BLOCKING]` behavior actually lives in this
 * plugin's hook layer.
 */
const fs = require("fs");
const path = require("path");

// Walk up to the WORKSPACE boundary only. The previous version climbed 12 levels
// and stopped only at `.git` or the filesystem root, so a session started in a
// plain directory (no repo) would surface `~/ideas` — some unrelated project's
// pipeline state — as if it belonged to this workspace (dogfood run #3). A
// workspace marker is the honest boundary: past it we are in someone else's tree.
const WORKSPACE_MARKERS = [".git", ".claude", "package.json", "pyproject.toml", "go.mod", "Cargo.toml"];

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  try {
    const evt = JSON.parse(input || "{}");
    const start = evt.cwd || process.cwd();
    const ideasDir = findIdeasDir(start);
    if (!ideasDir) return process.exit(0);

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`; // local date

    const lines = [];
    const lockedSpecs = [];
    for (const entry of fs.readdirSync(ideasDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      try {
        const statePath = path.join(ideasDir, entry.name, "state.json");
        if (!fs.existsSync(statePath)) continue;
        const raw = fs.readFileSync(statePath, "utf8");
        if (!raw.includes("pipeline_version")) continue; // not ours
        let st;
        try {
          st = JSON.parse(raw);
        } catch {
          lines.push(`- ${entry.name}: state.json unparsable — repair before continuing (artifacts are ground truth).`);
          continue;
        }
        const gates = st.gates && typeof st.gates === "object" ? st.gates : {};
        const names = Object.keys(gates);
        const byStatus = (s) =>
          names.filter((g) => gates[g] && gates[g].status === s);
        const overdue = (Array.isArray(st.kill_criteria) ? st.kill_criteria : []).filter(
          (k) => k && k.status === "armed" && k.by_date && k.by_date < today
        );
        const overdueHealth = (Array.isArray(st.health_criteria) ? st.health_criteria : []).filter(
          (k) => k && k.status === "armed" && k.by_date && k.by_date < today
        );
        // Participant-data retention duties: a date nobody checks is not a
        // safeguard. Surfaced like overdue criteria; deletion is never automatic.
        const duties = st.privacy && Array.isArray(st.privacy.retention_duties) ? st.privacy.retention_duties : [];
        const dueDuties = duties.filter(
          (d) => d && d.delete_by && d.delete_by < today && d.status !== "disposed"
        );
        const maint = st.maintenance && typeof st.maintenance === "object" ? st.maintenance : null;
        const lastRec = maint && maint.last_reconcile;
        // Epoch comparison (lexicographic ISO ordering breaks on fractional
        // seconds and offsets); unparsable timestamps and exact ties are treated
        // as PENDING — conservative: a false "reconcile needed" is harmless, a
        // false "all reconciled" is not. Skills use last_reconcile.consumed_through
        // (drift-id high water mark) for the exact boundary.
        const epoch = (s) => {
          const t = Date.parse(s);
          return Number.isFinite(t) ? t : null;
        };
        let driftPending = false;
        if (maint && maint.drift_declared_at) {
          if (!lastRec || !lastRec.completed_at) driftPending = true;
          else {
            const d = epoch(maint.drift_declared_at);
            const r = epoch(lastRec.completed_at);
            driftPending = d === null || r === null || d >= r;
          }
        }
        const waiting = (Array.isArray(st.waiting_on) ? st.waiting_on : [])
          .map((w) => (typeof w === "string" ? w : w && w.what))
          .filter(Boolean)
          .join(", ");
        const active = Array.isArray(st.active) ? st.active.join(",") : st.current_stage;
        // [BLOCKING]/[ACTION_REQUIRED_LATER]/[INFORMATIONAL] tags (v1.13.0) mark
        // each segment's urgency class. The "- <idea>:" prefix itself is never
        // tagged (tests and readers key off it as a stable line anchor); every
        // segment appended after it carries its own tag. This hook never emits
        // [BLOCKING] — see the header comment.
        let line =
          `- ${entry.name}: [INFORMATIONAL] active [${active ?? "?"}], mode ${st.mode || "analysis"}` +
          `; passed [${byStatus("passed").join(",") || "none"}]`;
        // Post-launch validation (v1.5.0): a deferred V1 whose controlled MVP
        // release has been declared (declare-drift --release) is due for REAL
        // evidence collection now — surfaced loudly and first, same class as an
        // overdue kill criterion, structurally identical to that block below.
        const plv = st.post_launch_validation && typeof st.post_launch_validation === "object" ? st.post_launch_validation : null;
        if (plv && plv.status === "reactivated")
          line += `; [ACTION_REQUIRED_LATER] !! POST-LAUNCH VALIDATION DUE: V1 was deferred and the controlled MVP release was declared${
            plv.mvp_release_declared_at ? ` at ${plv.mvp_release_declared_at}` : ""
          } — real problem-evidence collection is due (reopen condition: "${plv.reopen_on || "see " + (plv.register_ref || "post-launch-validation-register.md")}")`;
        const failed = byStatus("failed");
        const open = byStatus("open");
        if (failed.length) line += `; [INFORMATIONAL] FAILED [${failed.join(",")}]`;
        if (open.length) line += `; [INFORMATIONAL] accepted-open [${open.join(",")}]`;
        if (waiting) line += `; [INFORMATIONAL] waiting on: ${waiting}`;
        if (overdue.length)
          line += `; [ACTION_REQUIRED_LATER] !! KILL CRITERIA OVERDUE: ${overdue
            .map((k) => `"${k.desired_state}" not reached by ${k.by_date} → ${k.then || "review"}`)
            .join("; ")}`;
        if (overdueHealth.length)
          line += `; [ACTION_REQUIRED_LATER] !! HEALTH CRITERIA OVERDUE: ${overdueHealth
            .map((k) => `"${k.desired_state}" not reached by ${k.by_date} → ${k.then || "review"}`)
            .join("; ")}`;
        if (dueDuties.length)
          line += `; [ACTION_REQUIRED_LATER] !! PARTICIPANT-DATA RETENTION DUE: ${dueDuties
            .map((d) => `${d.duty_id || "?"}/${d.participant_id || "?"} by ${d.delete_by} (${d.manifest_ref || "private/participant-data-manifest.md"})`)
            .join("; ")} — confirm disposal with the founder over the exact files; never delete unprompted`;
        const bp = st.blueprint && typeof st.blueprint === "object" ? st.blueprint : null;
        if (bp && bp.status === "locked") lockedSpecs.push(entry.name);
        if (bp) {
          line += `; [INFORMATIONAL] blueprint(${bp.cycle_id || "?"}): ${bp.status || "?"}, gate BP ${
            (bp.gate && bp.gate.status) || "?"
          }`;
          if (bp.amendments && bp.amendments.last_id)
            line += `, amendments through ${bp.amendments.last_id} (read blueprint/amendment-log.md FIRST — current truth = locked blueprint + amendments)`;
          if (bp.status === "abandoned") line += " (superseded — a later cycle owns the current blueprint)";
          else if (bp.status !== "locked")
            line += " — stage 6 in progress: resume at the first non-ready row of blueprint-overview.md's index before build work";
        }
        if (lastRec && lastRec.completed_at)
          line += `; [INFORMATIONAL] last reconcile ${lastRec.id || "?"} ${lastRec.completed_at} (${lastRec.intake_authority || "?"})`;
        if (driftPending)
          line += `; [ACTION_REQUIRED_LATER] !! DRIFT DECLARED (${maint.drift_declared_at}) not yet reconciled — pack issuing/relabeling, validation runs, and switch-mode are blocked until reconcile completes`;
        lines.push(line);
      } catch {
        /* isolate per idea */
      }
    }
    if (!lines.length) return process.exit(0);
    let ctx =
      "SaaS validation pipeline state (saas-idea-brainstorm plugin):\n" +
      lines.join("\n") +
      "\n[INFORMATIONAL] Core rules: (1) evidence must trace to real humans or real data — the model is never an evidence source; " +
      "(2) pass/fail thresholds are written BEFORE any test runs (gate-check verifies the signed snapshot in decision-log); " +
      "(3) a failed gate returns to the previous gate. " +
      "Overdue kill criteria must be surfaced to the user before other pipeline work. " +
      "Do not act on this summary alone: read the idea's state.json first.";
    // Standing build contract. A workspace with a locked blueprint is usually also the
    // repo the product gets written in, and the coding session arrives knowing none of
    // this. Re-fires on `compact`, so it survives a context reset.
    if (lockedSpecs.length)
      ctx +=
        "\n\n[INFORMATIONAL] Build contract for " + lockedSpecs.map((s) => `ideas/${s}/`).join(", ") + ": the product decisions " +
        "for this work are already made and frozen — mvp-pack/ holds what and why plus the cut list, blueprint/ " +
        "holds exactly how (feature specs, field-level schema, UX, API, integrations, NFRs, test plan), and " +
        "blueprint/amendment-log.md, where it exists, is read first because current truth = locked blueprint + " +
        "amendments. Technical choices — language, libraries, layering, algorithms, how a stated budget is met — " +
        "are the implementer's. Product choices are not: what a feature does and when it is done, field names, " +
        "types, limits, defaults, validation, user-visible copy, empty/error/loading states, state transitions, " +
        "retry and cancellation semantics, retention duties, permission boundaries and performance targets are " +
        "written down already. Resolve an id with /saas-idea-brainstorm:spec <id> instead of inferring it. When " +
        "the spec is silent, wrong or self-contradicting on something in scope, that is " +
        "/saas-idea-brainstorm:spec-gap and then amend-blueprint — deciding it quietly and building on it is the " +
        "failure this whole method exists to prevent. Nothing here constrains architecture, stack, code style, " +
        "commit conventions or release process.";
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: ctx },
      })
    );
    process.exit(0);
  } catch (e) {
    // Fail open, but OBSERVABLY (dogfood run #2, FM-10). This exact catch hid a
    // ReferenceError that disabled state injection for a whole run while looking
    // identical to "no ideas in this workspace". stderr never blocks the session.
    try { process.stderr.write(`[saas-idea-brainstorm] session-start.js failed open: ${e && e.name}: ${e && e.message}\n`); } catch {}
    process.exit(0);
  }

  function findIdeasDir(start) {
    let dir = path.resolve(start);
    for (let i = 0; i < 12; i++) {
      const cand = path.join(dir, "ideas");
      try {
        if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) return cand;
      } catch {}
      // Stop AT the boundary (after checking this level's own ideas/), never past it.
      const atBoundary =
        WORKSPACE_MARKERS.some((m) => {
          try {
            return fs.existsSync(path.join(dir, m));
          } catch {
            return false;
          }
        }) || path.dirname(dir) === dir;
      if (atBoundary) return null;
      dir = path.dirname(dir);
    }
    return null;
  }
});
