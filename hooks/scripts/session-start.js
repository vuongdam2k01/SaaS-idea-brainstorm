#!/usr/bin/env node
/**
 * SessionStart hook (saas-idea-brainstorm plugin) — v2.
 * Injects a summary of validation-pipeline state for ideas in this workspace.
 * Fixes from adversarial review:
 * - Walks upward from cwd to the workspace/git root to find ideas/ (a session
 *   started in a subdirectory still finds the project state).
 * - Uses LOCAL calendar date for deadline comparison, not UTC.
 * - Each idea is isolated in its own try/catch (one corrupt state cannot
 *   suppress healthy ideas' summaries).
 * - Sentinel: only reports state.json files containing pipeline_version.
 * Fails open. Skills must not depend on this summary (hooks can be disabled).
 */
const fs = require("fs");
const path = require("path");

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
        const waiting = (Array.isArray(st.waiting_on) ? st.waiting_on : [])
          .map((w) => (typeof w === "string" ? w : w && w.what))
          .filter(Boolean)
          .join(", ");
        const active = Array.isArray(st.active) ? st.active.join(",") : st.current_stage;
        let line =
          `- ${entry.name}: active [${active ?? "?"}], mode ${st.mode || "analysis"}` +
          `; passed [${byStatus("passed").join(",") || "none"}]`;
        const failed = byStatus("failed");
        const open = byStatus("open");
        if (failed.length) line += `; FAILED [${failed.join(",")}]`;
        if (open.length) line += `; accepted-open [${open.join(",")}]`;
        if (waiting) line += `; waiting on: ${waiting}`;
        if (overdue.length)
          line += `; !! KILL CRITERIA OVERDUE: ${overdue
            .map((k) => `"${k.desired_state}" not reached by ${k.by_date} → ${k.then || "review"}`)
            .join("; ")}`;
        lines.push(line);
      } catch {
        /* isolate per idea */
      }
    }
    if (!lines.length) return process.exit(0);
    const ctx =
      "SaaS validation pipeline state (saas-idea-brainstorm plugin):\n" +
      lines.join("\n") +
      "\nCore rules: (1) evidence must trace to real humans or real data — the model is never an evidence source; " +
      "(2) pass/fail thresholds are written BEFORE any test runs (gate-check verifies the signed snapshot in decision-log); " +
      "(3) a failed gate returns to the previous gate. " +
      "Overdue kill criteria must be surfaced to the user before other pipeline work. " +
      "Do not act on this summary alone: read the idea's state.json first.";
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: ctx },
      })
    );
    process.exit(0);
  } catch {
    process.exit(0);
  }

  function findIdeasDir(start) {
    let dir = path.resolve(start);
    for (let i = 0; i < 12; i++) {
      const cand = path.join(dir, "ideas");
      try {
        if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) return cand;
      } catch {}
      const isRoot =
        fs.existsSync(path.join(dir, ".git")) || path.dirname(dir) === dir;
      if (isRoot) return null;
      dir = path.dirname(dir);
    }
    return null;
  }
});
