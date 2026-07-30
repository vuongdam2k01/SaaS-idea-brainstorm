#!/usr/bin/env node
/**
 * PostToolUse hook on Write|Edit (saas-idea-brainstorm plugin) — v3.
 * Validates artifact frontmatter for markdown files under a REAL pipeline idea
 * (sentinel: sibling state.json containing pipeline_version — unrelated repos'
 * ideas/ folders are untouched).
 * v3 (schema 1.2.0): phase-conditional validation — `phase: maintenance`
 * artifacts (current-baseline, reconcile manifests, validation-run reports,
 * drift-inbox, health-criteria) follow maintenance-rules.md §9 instead of the
 * pipeline frontmatter; pipeline artifacts are validated exactly as before.
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
  // Exactly three rungs (v1.2.0). `handoff-only` duplicated `handoff`; `simulate`
  // was epistemic provenance masquerading as an execution capability (it maps to
  // grade D / [GUESS], which can never satisfy a gate) — accepting it as a rung
  // invited "simulation completed the task". Legacy values are accepted ONLY on
  // pre-1.2.0 artifacts, and normalized on next edit; see LEGACY_RUNGS below.
  rung: ["enhanced-auto", "baseline-auto", "handoff"],
};
const LEGACY_RUNGS = ["handoff-only", "simulate"];
const PIPELINE_VERSIONS = ["1.0.0", "1.1.0", "1.2.0"];
const MAINT_REQUIRED = [
  "artifact",
  "artifact_kind",
  "idea",
  "phase",
  "cycle_id",
  "mutation_policy",
  "publication_status",
  "as_of",
  "pipeline_version",
  "updated",
];
const MAINT_ENUMS = {
  artifact_kind: [
    "current-baseline",
    "reconcile-manifest",
    "reconcile-intake",
    "claims-register",
    "validation-run-spec",
    "validation-run-report",
    "health-criteria",
    "drift-inbox",
  ],
  mutation_policy: ["append-only", "versioned-projection", "immutable-snapshot"],
  publication_status: ["draft", "locked"],
};
// Legal kind -> mutation policy pairing (independent enums allowed laundering)
const KIND_POLICY = {
  "current-baseline": "versioned-projection",
  "health-criteria": "versioned-projection",
  "drift-inbox": "append-only",
  "reconcile-manifest": "immutable-snapshot",
  "reconcile-intake": "immutable-snapshot",
  "claims-register": "immutable-snapshot",
  "validation-run-spec": "immutable-snapshot",
  "validation-run-report": "immutable-snapshot",
};
// Filenames/paths reserved for maintenance artifacts: they must declare
// phase: maintenance — a reserved name validated under pipeline rules would be
// a phase-laundering path.
function isReservedMaintPath(norm) {
  return (
    /\/(current-baseline-v\d+|drift-inbox|health-criteria-v\d+)\.md$/i.test(norm) ||
    /\/validation-runs\/[^/]+\.md$/i.test(norm) ||
    /\/reconcile\/[^/]+\/[^/]+\.md$/i.test(norm)
  );
}
// Collapse "." and ".." segments so exclusion/dispatch decisions run on the
// canonical path (review finding: exclusions before normalization are bypassable).
function canonicalize(p) {
  const parts = p.split("/");
  const out = [];
  for (const seg of parts) {
    if (seg === "" && out.length) continue;
    if (seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  return out.join("/");
}

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  try {
    const evt = JSON.parse(input || "{}");
    const fp = (evt.tool_input && evt.tool_input.file_path) || "";
    const norm = canonicalize(fp.replace(/\\/g, "/"));
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

    // Phase dispatch: maintenance artifacts follow maintenance-rules.md §9.
    // Reserved maintenance paths dispatch DETERMINISTICALLY — a reserved filename
    // may not opt out of maintenance validation by omitting/faking `phase`.
    if (fm.phase && fm.phase !== "pipeline" && fm.phase !== "maintenance") {
      return block(`Artifact ${norm}: invalid phase "${fm.phase}" (allowed: pipeline|maintenance).`);
    }
    if (isReservedMaintPath(norm) && fm.phase !== "maintenance") {
      return block(
        `Artifact ${norm} uses a maintenance-reserved filename/path but does not declare "phase: maintenance" — reserved paths (current-baseline-vN, drift-inbox, health-criteria-vN, validation-runs/, reconcile/) always validate under maintenance-rules §9.`
      );
    }
    if (fm.phase === "maintenance") return validateMaintenance(norm, fm);

    const problems = [];
    for (const k of REQUIRED) if (!(k in fm) || fm[k] === "") problems.push(`missing key: ${k}`);
    for (const [k, allowed] of Object.entries(ENUMS)) {
      if (fm[k] && !allowed.includes(fm[k])) {
        // A retired rung on a pre-1.2.0 artifact is a migration instruction, not
        // a hard error: the file predates the vocabulary change. Any artifact
        // claiming 1.2.0 must use the three-value enum.
        if (k === "rung" && LEGACY_RUNGS.includes(fm[k]) && fm.pipeline_version !== "1.2.0") {
          problems.push(
            `retired rung "${fm[k]}" on a pre-1.2.0 artifact: migrate it now — ` +
              `"handoff-only" becomes "handoff"; "simulate" is not a rung (set the real rung and keep the ` +
              `simulated content labeled [GUESS]/grade D, which never counts toward a gate)`
          );
        } else {
          problems.push(`invalid ${k}: "${fm[k]}" (allowed: ${allowed.join("|")})`);
        }
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
    if (fm.pipeline_version && !PIPELINE_VERSIONS.includes(fm.pipeline_version))
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

  function validDate(s) {
    const m = typeof s === "string" && s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
  }

  function validateMaintenance(norm, fm) {
    const problems = [];
    for (const k of MAINT_REQUIRED) if (!(k in fm) || fm[k] === "") problems.push(`missing key: ${k}`);
    for (const [k, allowed] of Object.entries(MAINT_ENUMS)) {
      if (fm[k] && !allowed.includes(fm[k]))
        problems.push(`invalid ${k}: "${fm[k]}" (allowed: ${allowed.join("|")})`);
    }
    // stage/gate belong to the pipeline phase only
    if ("stage" in fm) problems.push(`maintenance artifacts must not carry "stage"`);
    if ("gate" in fm) problems.push(`maintenance artifacts must not carry "gate"`);
    if (fm.pipeline_version && fm.pipeline_version !== "1.2.0")
      problems.push(`maintenance artifacts require pipeline_version 1.2.0 (got "${fm.pipeline_version}")`);
    if (fm.cycle_id && !/^C\d+$/.test(fm.cycle_id))
      problems.push(`invalid cycle_id: "${fm.cycle_id}" (shape: C<number>)`);
    for (const dk of ["as_of", "updated"]) {
      if (fm[dk] && !validDate(fm[dk])) problems.push(`invalid ${dk} date: "${fm[dk]}" (real YYYY-MM-DD)`);
    }
    // idea/path + id/filename correspondence (same rules as pipeline)
    const slug = (norm.match(/\/ideas\/([^/]+)\//i) || [])[1];
    if (fm.idea && slug && fm.idea !== slug)
      problems.push(`idea "${fm.idea}" does not match path slug "${slug}"`);
    if (fm.artifact && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.artifact))
      problems.push(`artifact id must be kebab-case: "${fm.artifact}"`);
    const base = norm.replace(/^.*\//, "").replace(/\.md$/i, "");
    if (fm.artifact && base && fm.artifact !== base)
      problems.push(`artifact id "${fm.artifact}" must match filename "${base}.md"`);
    // kind ↔ mutation-policy pairing (independent enums were a laundering path)
    if (fm.artifact_kind && fm.mutation_policy && KIND_POLICY[fm.artifact_kind] && KIND_POLICY[fm.artifact_kind] !== fm.mutation_policy)
      problems.push(`artifact_kind "${fm.artifact_kind}" requires mutation_policy "${KIND_POLICY[fm.artifact_kind]}" (got "${fm.mutation_policy}")`);
    // kind-conditional requirements + versioned-projection lineage (baseline AND health-criteria)
    const KIND_ID_SHAPE = { "current-baseline": /^current-baseline-v(\d+)$/, "health-criteria": /^health-criteria-v(\d+)$/ };
    if (KIND_ID_SHAPE[fm.artifact_kind]) {
      const vb = fm.artifact && fm.artifact.match(KIND_ID_SHAPE[fm.artifact_kind]);
      if (!vb) problems.push(`${fm.artifact_kind} artifact id must be "${fm.artifact_kind}-v<N>" (got "${fm.artifact}")`);
      else if (+vb[1] > 1) {
        if (!fm.supersedes) problems.push(`${fm.artifact_kind} v${vb[1]} requires "supersedes" (idea-relative path to v${+vb[1] - 1})`);
        if (!fm.supersedes_sha256 || !/^[0-9a-f]{64}$/i.test(fm.supersedes_sha256))
          problems.push(`${fm.artifact_kind} v${vb[1]} requires "supersedes_sha256" (sha256 of the superseded head)`);
      }
    }
    // validation-run spec/report: run_id required, basename + directory must correspond
    if (["validation-run-spec", "validation-run-report"].includes(fm.artifact_kind)) {
      if (!fm.run_id) problems.push(`${fm.artifact_kind} requires "run_id"`);
      const suffix = fm.artifact_kind === "validation-run-spec" ? "-spec" : "-report";
      if (fm.run_id && fm.artifact !== fm.run_id + suffix)
        problems.push(`${fm.artifact_kind} artifact id must be "<run_id>${suffix}" (run_id "${fm.run_id}" → expected "${fm.run_id}${suffix}", got "${fm.artifact}")`);
      if (!/\/validation-runs\/[^/]+\.md$/i.test(norm))
        problems.push(`${fm.artifact_kind} must live under validation-runs/`);
    }
    // reconcile artifacts: reconcile_id required, path must be reconcile/<reconcile_id>/,
    // manifest basename must be manifest-<reconcile_id>
    if (["reconcile-manifest", "reconcile-intake", "claims-register"].includes(fm.artifact_kind)) {
      if (!fm.reconcile_id) problems.push(`${fm.artifact_kind} requires "reconcile_id"`);
      const rm = norm.match(/\/reconcile\/([^/]+)\/[^/]+\.md$/i);
      if (!rm) problems.push(`${fm.artifact_kind} must live under reconcile/<reconcile_id>/`);
      else if (fm.reconcile_id && rm[1] !== fm.reconcile_id)
        problems.push(`reconcile directory "${rm[1]}" does not match reconcile_id "${fm.reconcile_id}"`);
      if (fm.artifact_kind === "reconcile-manifest" && fm.reconcile_id && fm.artifact !== `manifest-${fm.reconcile_id}`)
        problems.push(`reconcile-manifest artifact id must be "manifest-<reconcile_id>" (expected "manifest-${fm.reconcile_id}", got "${fm.artifact}")`);
    }
    // supersedes: same-kind successor lineage, contained inside THIS idea —
    // no absolute paths, no drive letters, no traversal out of the idea directory.
    if (fm.supersedes) {
      if (/^([a-zA-Z]:)?[\\/]/.test(fm.supersedes) || fm.supersedes.includes(":"))
        problems.push(`"supersedes" must be an idea-relative path (no absolute/drive forms): "${fm.supersedes}"`);
      const segs = fm.supersedes.replace(/\\/g, "/").split("/");
      if (segs.includes("..") || segs.includes("."))
        problems.push(`"supersedes" must not traverse directories (no "." or ".."): "${fm.supersedes}"`);
    }

    if (problems.length) {
      return block(
        `Maintenance artifact ${norm} frontmatter is invalid: ${problems.join("; ")}. Fix it now per method-rules/maintenance-rules.md §9.`
      );
    }
    return process.exit(0);
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
