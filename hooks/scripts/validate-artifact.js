#!/usr/bin/env node
/**
 * PostToolUse hook on Write|Edit (saas-idea-brainstorm plugin) — v2.
 * Validates artifact frontmatter for markdown files under a REAL pipeline idea
 * (sentinel: sibling state.json containing pipeline_version — unrelated repos'
 * ideas/ folders are untouched). Fixes from adversarial review:
 * - Validates all 9 schema keys, enum values, stage range, and date format.
 * - Blocks (repair request) on missing frontmatter OR invalid required values.
 * Fails open on internal errors.
 */
const fs = require("fs");
const path = require("path");

const REQUIRED = [
  "artifact",
  "idea",
  "stage",
  "gate",
  "status",
  "evidence_grade",
  "rung",
  "pipeline_version",
  "updated",
];
const ENUMS = {
  gate: ["F", "C", "V1", "V2", "V3", "R1", "R2", "P", "LOCK"],
  status: ["draft", "ready", "locked"],
  evidence_grade: ["A", "B", "C", "D", "none"],
  rung: ["enhanced-auto", "baseline-auto", "handoff", "handoff-only", "simulate"],
};

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  try {
    const evt = JSON.parse(input || "{}");
    const fp = (evt.tool_input && evt.tool_input.file_path) || "";
    const norm = fp.replace(/\\/g, "/");
    if (!/\/ideas\/[^/]+\/.+\.md$/i.test(norm)) return process.exit(0);
    if (/\/private\//i.test(norm) || /README\.md$/i.test(norm)) return process.exit(0);
    if (/\/decision-log\.md$/i.test(norm) || /\/post-mortem\.md$/i.test(norm))
      return process.exit(0); // journal formats, not artifact frontmatter
    if (/\/error-analysis\/batch-\d+\.md$/i.test(norm))
      return process.exit(0); // frontmatter-exempt worker trace files (canonical artifact is summary.md)
    if (!sentinelOk(norm)) return process.exit(0);
    if (!fs.existsSync(fp)) return process.exit(0);
    const text = fs.readFileSync(fp, "utf8");

    const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) {
      return block(
        `Artifact ${norm} was written without YAML frontmatter. Required keys: ${REQUIRED.join(", ")}. See method-rules/artifact-schema.md and add it now.`
      );
    }

    const fm = {};
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (m) fm[m[1]] = m[2].trim();
    }

    const problems = [];
    for (const k of REQUIRED) if (!(k in fm) || fm[k] === "") problems.push(`missing key: ${k}`);
    for (const [k, allowed] of Object.entries(ENUMS)) {
      if (fm[k] && !allowed.includes(fm[k])) {
        problems.push(`invalid ${k}: "${fm[k]}" (allowed: ${allowed.join("|")})`);
      }
    }
    if (fm.evidence_grade && /[+-]$/.test(fm.evidence_grade))
      problems.push(`grade modifiers are forbidden: "${fm.evidence_grade}" — grades are strictly A/B/C/D`);
    if (fm.stage && !/^[0-5]$/.test(fm.stage)) problems.push(`invalid stage: "${fm.stage}" (0-5)`);
    // Real calendar date, not just shape (2026-99-99 must fail)
    if (fm.updated) {
      const m = fm.updated.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) problems.push(`invalid updated date: "${fm.updated}" (YYYY-MM-DD)`);
      else {
        const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
        if (
          d.getUTCFullYear() !== +m[1] ||
          d.getUTCMonth() !== +m[2] - 1 ||
          d.getUTCDate() !== +m[3]
        )
          problems.push(`impossible calendar date: "${fm.updated}"`);
      }
    }
    // idea must match the path slug
    const slug = (norm.match(/\/ideas\/([^/]+)\//i) || [])[1];
    if (fm.idea && slug && fm.idea !== slug)
      problems.push(`idea "${fm.idea}" does not match path slug "${slug}"`);
    // supported pipeline versions only
    if (fm.pipeline_version && !["1.0.0", "1.1.0"].includes(fm.pipeline_version))
      problems.push(`unsupported pipeline_version: "${fm.pipeline_version}"`);
    // artifact id shape + filename correspondence
    if (fm.artifact && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.artifact))
      problems.push(`artifact id must be kebab-case: "${fm.artifact}"`);
    const base = norm.replace(/^.*\//, "").replace(/\.md$/i, "");
    if (fm.artifact && base && fm.artifact !== base && !(base === "summary" && /^error-analysis/.test(fm.artifact)))
      problems.push(`artifact id "${fm.artifact}" must match filename "${base}.md"`);
    // stage/gate compatibility
    const STAGE_GATES = { 0: ["F"], 1: ["C"], 2: ["V1", "V2", "V3"], 3: ["R1", "R2"], 4: ["P"], 5: ["LOCK"] };
    if (fm.stage && fm.gate && STAGE_GATES[fm.stage] && !STAGE_GATES[fm.stage].includes(fm.gate))
      problems.push(`gate ${fm.gate} is illegal for stage ${fm.stage} (allowed: ${STAGE_GATES[fm.stage].join("|")})`);

    const warnings = [];
    if (/evidence-ledger\.md$/i.test(norm)) {
      const rows = text.split(/\r?\n/).filter((l) => /^\|/.test(l));
      const dRows = rows.filter((l) => /\|\s*D\s*\|/i.test(l));
      if (dRows.length)
        warnings.push(
          `evidence-ledger.md contains ${dRows.length} grade-D row(s): model-generated items are hypotheses, not evidence — move them out of the ledger.`
        );
    }

    if (problems.length) {
      return block(
        `Artifact ${norm} frontmatter is invalid: ${problems.join("; ")}. Fix it now per method-rules/artifact-schema.md.` +
          (warnings.length ? " Also: " + warnings.join(" ") : "")
      );
    }
    if (warnings.length) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: warnings.join(" ") },
        })
      );
    }
    process.exit(0);
  } catch {
    process.exit(0);
  }

  function sentinelOk(norm) {
    try {
      const m = norm.match(/^(.*\/ideas\/[^/]+)\//i);
      if (!m) return false;
      const statePath = path.join(m[1].replace(/\//g, path.sep), "state.json");
      if (!fs.existsSync(statePath)) return false;
      // Parsed-property check, not substring: a foreign state.json that merely
      // MENTIONS pipeline_version in a note must not activate validation.
      const st = JSON.parse(fs.readFileSync(statePath, "utf8"));
      return !!(st && typeof st.pipeline_version === "string");
    } catch {
      return false;
    }
  }

  function block(reason) {
    process.stdout.write(JSON.stringify({ decision: "block", reason }));
    process.exit(0);
  }
});
