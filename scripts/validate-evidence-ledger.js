#!/usr/bin/env node
/**
 * Evidence-ledger structural validator (saas-idea-brainstorm plugin, v1.2.0).
 *
 * Deliberately a GATE-TIME helper, not a hook:
 *  - markdown table parsing plus cross-row reasoning is too expensive and too
 *    fragile for the per-write hook budget;
 *  - the failures it catches (a syndicated repost counted as an independent
 *    person, a superseded row still counted, a missing relationship target)
 *    only matter when a metric is computed — i.e. at V1 / P / LOCK.
 *
 * It checks STRUCTURE and ARITHMETIC only. It cannot judge whether two
 * differently-worded rows say the same thing; semantic duplication stays a
 * gatekeeper (human/agent) judgement, and pretending otherwise would be the
 * cargo-cult version of this tool.
 *
 * Usage:
 *   node scripts/validate-evidence-ledger.js <path-to-evidence-ledger.md> [--json]
 * Exit codes: 0 = no errors (warnings allowed), 1 = errors, 2 = unusable input.
 */
"use strict";
const fs = require("fs");

const GRADES = ["A", "B", "C", "D"];
const BEARINGS = ["supports", "contradicts", "unclear"];
const LEGACY_BEARINGS = { confirms: "supports", refutes: "contradicts", unclear: "unclear" };

function main(argv) {
  const args = argv.slice(2);
  const jsonOut = args.includes("--json");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    process.stderr.write("usage: validate-evidence-ledger.js <ledger.md> [--json]\n");
    return 2;
  }
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (e) {
    process.stderr.write(`cannot read ${file}: ${e.message}\n`);
    return 2;
  }

  const findings = [];
  const add = (level, code, where, message) => findings.push({ level, code, where, message });

  const parsed = parseLedger(text);
  if (!parsed.header) {
    add("error", "no-ledger-table", file, "no evidence table found (need a header row containing `id` and `grade`)");
    return report(findings, jsonOut, null);
  }

  const cols = parsed.header;
  for (const required of ["id", "grade"]) {
    if (!(required in cols)) add("error", "missing-column", "header", `required column: ${required}`);
  }
  for (const expected of ["root_source_id", "bearing", "scope_limits"]) {
    if (!(expected in cols)) {
      add(
        "error",
        "missing-column",
        "header",
        `required column: ${expected} (v1.2.0 ledger shape — see the method-rules-artifact-schema skill)`
      );
    }
  }
  if ("status" in cols && !("bearing" in cols)) {
    add("error", "legacy-status-column", "header", 'rename the ledger `status` column to `bearing` (values supports|contradicts|unclear)');
  }

  const ids = new Map();
  const rootCounts = new Map();
  const supersededBy = new Map();
  const rowRoots = new Map();

  for (const row of parsed.rows) {
    const at = `row ${row.line}`;
    const id = cell(row, cols, "id");
    if (!id) {
      add("error", "missing-id", at, "row has no evidence id");
      continue;
    }
    if (!/^E\d+$/.test(id)) add("error", "id-format", at, `evidence id must be E<number>, got "${id}"`);
    if (ids.has(id)) add("error", "duplicate-id", at, `duplicate evidence id "${id}" (also ${ids.get(id)})`);
    else ids.set(id, at);

    const grade = cell(row, cols, "grade");
    if (!grade) add("error", "missing-grade", at, `${id}: no grade`);
    else if (/[+-]$/.test(grade))
      add("error", "grade-modifier", at, `${id}: grade modifiers are forbidden ("${grade}") — strictly A/B/C/D`);
    else if (!GRADES.includes(grade)) add("error", "grade-value", at, `${id}: invalid grade "${grade}"`);
    else if (grade === "D")
      add("error", "grade-d-in-ledger", at, `${id}: grade D never enters the ledger (method-rules rule 2)`);

    const bearing = cell(row, cols, "bearing");
    if (bearing) {
      if (!BEARINGS.includes(bearing)) {
        if (bearing in LEGACY_BEARINGS)
          add("error", "legacy-bearing", at, `${id}: "${bearing}" is the retired vocabulary — use "${LEGACY_BEARINGS[bearing]}"`);
        else add("error", "bearing-value", at, `${id}: invalid bearing "${bearing}" (supports|contradicts|unclear)`);
      }
    } else add("warning", "missing-bearing", at, `${id}: no bearing recorded`);

    const rootRaw = cell(row, cols, "root_source_id");
    if (!isPresent(rootRaw)) {
      add(
        "error",
        "missing-root-source",
        at,
        `${id}: root_source_id is required — independence is computed from distinct root sources, never self-declared`
      );
    } else {
      // Group case- and whitespace-insensitively: "RS-a" and "rs-A" are one
      // source recorded twice, and treating them as two would inflate the
      // independent count — the exact failure root_source_id exists to prevent.
      const root = rootRaw.trim().replace(/\s+/g, " ").toLowerCase();
      if (/\s/.test(root))
        add(
          "warning",
          "root-id-format",
          at,
          `${id}: root_source_id "${rootRaw.trim()}" contains spaces — use a stable slug (RS-<something>) so the same source is always written the same way`
        );
      if (!rootCounts.has(root)) rootCounts.set(root, []);
      rootCounts.get(root).push(id);
      rowRoots.set(id, root);
    }

    const scope = cell(row, cols, "scope_limits");
    if (!isPresent(scope))
      add("warning", "no-scope-limits", at, `${id}: no scope_limits — gates will read this row at its narrowest possible scope`);

    const sup = cell(row, cols, "supersedes");
    if (isPresent(sup)) {
      const targets = sup.split(/[,\s]+/).filter(Boolean);
      // The schema describes ONE predecessor per row. Allowing several meant the
      // cycle walk had to keep a single edge per node and silently dropped the
      // rest — a loop could hide behind the discarded edge. Reject the ambiguity
      // instead: correcting two rows at once is two corrections.
      if (targets.length > 1) {
        add(
          "error",
          "multiple-supersede-targets",
          at,
          `${id} supersedes ${targets.length} rows (${targets.join(", ")}) — one row replaces exactly one row; split it`
        );
        continue;
      }
      for (const target of targets) {
        if (target === id) {
          add("error", "self-supersede", at, `${id}: cannot supersede itself`);
          continue;
        }
        // Two rows both claiming to replace the same one is ambiguous lineage;
        // a Map would have silently kept whichever was parsed last.
        if (supersededBy.has(target)) {
          add(
            "error",
            "multiple-superseders",
            at,
            `${target} is superseded by both ${supersededBy.get(target)} and ${id} — exactly one row may replace another`
          );
          continue;
        }
        supersededBy.set(target, id);
      }
    }

    const rel = cell(row, cols, "relationship");
    if (isPresent(rel)) {
      for (const m of rel.matchAll(/(supports|contradicts)\s*:\s*(E\d+)/gi)) {
        if (m[2] === id) add("error", "self-relation", at, `${id}: relationship cannot reference itself`);
        else row._relTargets = (row._relTargets || []).concat(m[2]);
      }
      if (!/(supports|contradicts)\s*:\s*E\d+/i.test(rel))
        add("warning", "relationship-shape", at, `${id}: relationship should read "supports:E<n>" or "contradicts:E<n>"`);
    }
  }

  for (const row of parsed.rows) {
    for (const target of row._relTargets || []) {
      if (!ids.has(target))
        add("error", "missing-relation-target", `row ${row.line}`, `relationship points at unknown evidence id "${target}"`);
    }
  }
  for (const [target, by] of supersededBy) {
    if (!ids.has(target))
      add("error", "missing-supersede-target", "ledger", `${by} supersedes unknown evidence id "${target}"`);
  }

  // Supersession must be a chain. A loop of ANY length makes every row in it
  // non-live, which would silently zero a denominator — a two-node check missed
  // the three-node case entirely, so walk the graph.
  {
    const next = new Map(); // successor -> the row it supersedes
    for (const [target, by] of supersededBy) next.set(by, target);
    const state = new Map(); // 0 = visiting, 1 = done
    for (const start of next.keys()) {
      if (state.get(start) === 1) continue;
      const path = [];
      let node = start;
      while (node !== undefined && state.get(node) !== 1) {
        if (state.get(node) === 0) {
          const loop = path.slice(path.indexOf(node)).concat(node);
          add(
            "error",
            "supersession-cycle",
            "ledger",
            `supersession loop: ${loop.join(" → ")} — supersession must be a chain, not a loop`
          );
          break;
        }
        state.set(node, 0);
        path.push(node);
        node = next.get(node);
      }
      for (const n of path) state.set(n, 1);
    }
  }

  // Independence: same root source = one piece of evidence, however many rows.
  const collapsed = [];
  for (const [root, members] of rootCounts) {
    if (members.length > 1) collapsed.push({ root, members });
  }
  for (const c of collapsed) {
    add(
      "warning",
      "shared-root-source",
      "ledger",
      `${c.members.join(", ")} share root_source_id "${c.root}" — they count as ONE independent source in any denominator`
    );
  }

  const live = [...ids.keys()].filter((id) => !supersededBy.has(id));
  // The ceiling counts roots of LIVE rows only. A superseded row has been
  // retracted or corrected; letting its root keep raising the ceiling would let
  // withdrawn evidence widen a denominator.
  const liveRoots = new Set();
  for (const id of live) {
    const r = rowRoots.get(id);
    if (r) liveRoots.add(r);
  }
  const summary = {
    rows: parsed.rows.length,
    unique_ids: ids.size,
    superseded: supersededBy.size,
    live_rows: live.length,
    distinct_root_sources: rootCounts.size,
    live_root_sources: liveRoots.size,
    max_independent_count: liveRoots.size,
    collapsed_groups: collapsed.length,
  };
  return report(findings, jsonOut, summary);
}

function report(findings, jsonOut, summary) {
  const errors = findings.filter((f) => f.level === "error").length;
  const warnings = findings.length - errors;
  if (jsonOut) {
    process.stdout.write(JSON.stringify({ errors, warnings, findings, summary }, null, 2) + "\n");
  } else {
    for (const f of findings) process.stdout.write(`${f.level.toUpperCase()} ${f.code} [${f.where}] ${f.message}\n`);
    if (summary) {
      process.stdout.write(
        `\nrows ${summary.rows} · unique ids ${summary.unique_ids} · superseded ${summary.superseded} · ` +
          `live ${summary.live_rows} · distinct root sources ${summary.distinct_root_sources}\n` +
          `A denominator over these rows may not exceed ${summary.max_independent_count} independent sources.\n`
      );
    }
    process.stdout.write(`${errors} error(s), ${warnings} warning(s)\n`);
  }
  return errors ? 1 : 0;
}

function parseLedger(text) {
  const lines = text.split(/\r?\n/);
  let header = null;
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) {
      // The ledger table is contiguous. Once its HEADER is found, the first
      // non-table line ends it — including when the table has zero rows, which
      // previously let the next table in the file be read as evidence rows.
      if (header) break;
      continue;
    }
    const cells = splitRow(line);
    if (!cells.length) continue;
    const lower = cells.map((c) => c.toLowerCase());
    if (!header) {
      if (lower.includes("id") && lower.includes("grade")) {
        header = {};
        lower.forEach((name, idx) => {
          if (name && !(name in header)) header[name] = idx;
        });
      }
      continue;
    }
    if (/^-{2,}$/.test(cells[0].replace(/[\s:]/g, "")) || cells.every((c) => /^:?-+:?$/.test(c.trim()))) continue;
    if (cells[0].startsWith(">") || !cells[0]) continue;
    rows.push({ cells, line: i + 1 });
  }
  return { header, rows };
}

/**
 * Split a markdown table row on UNESCAPED pipes. A quote containing `\|` used to
 * shift every later column by one, silently misreading grade/bearing/root.
 */
function splitRow(line) {
  const t = line.trim().replace(/^\|/, "").replace(/\|\s*$/, "");
  const cells = [];
  let cur = "";
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === "\\" && t[i + 1] === "|") {
      cur += "|";
      i++;
      continue;
    }
    if (ch === "|") {
      cells.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

/** A cell counts as filled only if it says something — "", "-", "—", "n/a" do not. */
function isPresent(v) {
  if (!v) return false;
  const t = String(v).trim().toLowerCase();
  return t !== "" && t !== "-" && t !== "—" && t !== "--" && t !== "n/a" && t !== "na" && t !== "none";
}

function cell(row, cols, name) {
  const idx = cols[name];
  if (idx === undefined) return "";
  const v = row.cells[idx];
  return v === undefined ? "" : v.trim();
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { main, parseLedger };
