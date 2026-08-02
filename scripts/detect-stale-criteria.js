#!/usr/bin/env node
/**
 * Stale kill/health-criterion detector (saas-idea-brainstorm plugin, v1.13.0).
 *
 * Founder-observed pain: a kill criterion (or post-LOCK health criterion) gets
 * `status: "triggered"` and then the founder actually resolves the question in
 * conversation and in the artifacts — a pivot, a re-measurement, a disposition —
 * but nothing ever flips the runtime `status` field back. The status index and
 * reality then disagree, and `status` (the reporting skill) reads the stale
 * field as if it were still current.
 *
 * IMPORTANT — method-rules §1 ("session transcripts are never evidence"): this
 * script reads ONLY persisted files (state.json, decision-log.md). It has no
 * access to, and must never be extended to consult, conversation/session
 * memory. A resolution that exists only in a chat transcript and never made it
 * into decision-log.md is — by the same rule that governs every other claim in
 * this pipeline — not a resolution the plugin can act on. If this ever looks
 * like a limitation worth working around by "remembering" what happened in a
 * session, that impulse is exactly the failure mode rule 1 exists to prevent.
 *
 * What it does NOT do: it never writes state.json. It emits findings with a
 * *proposed* patch; the proposed status change is applied — if at all — only
 * by an explicit user confirmation, through `scripts/state-write.js`, exactly
 * like every other "surface, never auto-apply" duty in this plugin (privacy
 * deletion, retention-duty disposal). See skills/status/SKILL.md and
 * skills/gate-check/SKILL.md (Layer 0) for the two call sites.
 *
 * Detection is deliberately a text heuristic, not a semantic parser: a
 * decision-log row "resolves" a criterion when it (a) names the criterion's id
 * as a whole word, or is itself a `criterion-disposition` row, or paraphrases
 * the criterion's own `desired_state` text, AND (b) uses resolution language
 * (resolved/cleared/retired/superseded/no longer/settled/dispositioned). A
 * miss is possible (an oddly-worded row) and is safe: it just means no finding
 * fires. A false positive is why this only ever proposes a patch and never
 * applies one.
 *
 * Usage:
 *   node scripts/detect-stale-criteria.js <idea-dir> [--json]
 * Exit codes: 0 = no stale findings, 1 = stale findings present, 2 = unusable input.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const RESOLUTION_WORDS =
  /\b(resolved|cleared?|retired|superseded|no longer (?:applies|blocking|a concern)|settled|dispositioned|addressed)\b/i;

/** Parse decision-log.md's append-only table into rows, in file (= chronological) order. */
function parseDecisionLog(text) {
  const lines = text.split(/\r?\n/);
  let header = null;
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) {
      if (header) continue; // decision-log has narrative text around the table; keep scanning
      continue;
    }
    const cells = splitRow(line);
    if (!cells.length) continue;
    const lower = cells.map((c) => c.toLowerCase());
    if (!header) {
      if (lower.includes("date") && lower.includes("type")) {
        header = {};
        lower.forEach((name, idx) => {
          // Match by leading word so "evidence (E-ids / gatekeeper findings)"
          // still resolves under the key "evidence".
          const key = name.split(/[\s(]/)[0];
          if (key && !(key in header)) header[key] = idx;
        });
      }
      continue;
    }
    if (cells.every((c) => /^:?-+:?$/.test(c.trim()))) continue; // separator row
    rows.push({ cells, line: i + 1 });
  }
  return { header, rows };
}

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

function cellOf(row, header, name) {
  const idx = header[name];
  if (idx === undefined) return "";
  const v = row.cells[idx];
  return v === undefined ? "" : v.trim();
}

/** Word-boundary id match ("K1" must not match inside "K10"). */
function mentionsId(text, id) {
  if (!text || !id) return false;
  const re = new RegExp(`(?<![A-Za-z0-9_])${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9_])`);
  return re.test(text);
}

/**
 * Find the LATEST decision-log row (file order = chronological, append-only)
 * that plainly resolves the given criterion. Returns null if none.
 */
function findResolvingRow(rows, header, criterion) {
  let hit = null;
  for (const row of rows) {
    const type = cellOf(row, header, "type");
    const decision = cellOf(row, header, "decision");
    const rationale = cellOf(row, header, "rationale");
    const detail = cellOf(row, header, "detail");
    const haystack = [decision, rationale, detail].join(" \n ");

    const namesId = mentionsId(haystack, criterion.id) || mentionsId(type, criterion.id);
    const paraphrasesDesiredState =
      criterion.desired_state &&
      criterion.desired_state.length > 12 &&
      haystack.toLowerCase().includes(criterion.desired_state.toLowerCase().slice(0, 24));
    const isDispositionType = type.toLowerCase() === "criterion-disposition" && namesId;

    if (isDispositionType || ((namesId || paraphrasesDesiredState) && RESOLUTION_WORDS.test(haystack))) {
      hit = { row, type, decision, rationale, detail };
    }
  }
  return hit;
}

/** What the resolving row's own language implies the new status should be. */
function proposedStatus(hit, kind) {
  const text = `${hit.type} ${hit.decision} ${hit.rationale} ${hit.detail}`.toLowerCase();
  if (kind === "health") return "cleared"; // health_criteria has no "retired" status
  if (/\bretir(e|ed|ement)\b/.test(text) || hit.type.toLowerCase() === "criterion-disposition") return "retired";
  return "cleared";
}

function detect(state, decisionLogText) {
  const { header, rows } = decisionLogText
    ? parseDecisionLog(decisionLogText)
    : { header: null, rows: [] };
  const findings = [];

  const scan = (list, kind) => {
    if (!Array.isArray(list)) return;
    for (const c of list) {
      if (!c || c.status !== "triggered") continue;
      if (!header) continue; // no parseable decision-log table: nothing to compare against
      const hit = findResolvingRow(rows, header, c);
      if (!hit) continue;
      findings.push({
        kind, // "kill" | "health"
        id: c.id,
        desired_state: c.desired_state,
        current_status: c.status,
        resolving_row: {
          line: hit.row.line,
          type: hit.type,
          decision: hit.decision,
          rationale: hit.rationale,
          detail: hit.detail,
        },
        proposed_status: proposedStatus(hit, kind),
        note:
          proposedStatus(hit, kind) === "retired"
            ? "retirement is legal only via the LOCK kill-criterion disposition ceremony and requires a disposition{result,date} object — this proposal still needs that ceremony, it is not a bare status flip"
            : "cleared can be written directly via state-write.js on explicit user confirmation",
      });
    }
  };

  scan(state.kill_criteria, "kill");
  scan(state.health_criteria, "health");
  return findings;
}

function main(argv) {
  const args = argv.slice(2);
  const jsonOut = args.includes("--json");
  const ideaDir = args.find((a) => !a.startsWith("--"));
  if (!ideaDir) {
    process.stderr.write("usage: detect-stale-criteria.js <idea-dir> [--json]\n");
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
  const logPath = path.join(ideaDir, "decision-log.md");
  let logText = "";
  try {
    logText = fs.readFileSync(logPath, "utf8");
  } catch {
    // No decision-log.md yet (a very early idea): nothing to compare against,
    // not an error — every scan below simply finds nothing.
  }

  const findings = detect(state, logText);

  if (jsonOut) {
    process.stdout.write(JSON.stringify({ stale_count: findings.length, findings }, null, 2) + "\n");
  } else {
    if (!findings.length) {
      process.stdout.write("no stale triggered criteria found\n");
    } else {
      for (const f of findings) {
        process.stdout.write(
          `STALE ${f.kind} criterion ${f.id} ("${f.desired_state}") is still "${f.current_status}" but ` +
            `decision-log.md row ${f.resolving_row.line} (type ${f.resolving_row.type || "?"}) plainly resolves it.\n` +
            `  proposed patch: status -> "${f.proposed_status}"  (${f.note})\n`
        );
      }
      process.stdout.write(`${findings.length} stale finding(s) — surface for confirmation, never auto-apply.\n`);
    }
  }
  return findings.length ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { detect, parseDecisionLog, findResolvingRow, mentionsId };
