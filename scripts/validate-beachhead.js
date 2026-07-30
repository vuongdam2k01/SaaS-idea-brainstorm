#!/usr/bin/env node
/**
 * Beachhead prospect-list validator (saas-idea-brainstorm plugin, v1.2.0).
 *
 * Gate F counts prospects, and dogfood run #2 showed the count was the softest
 * number in the pipeline. Six rows were labelled "Tier 4 (est.)"; the gatekeeper
 * fetched the source thread and found five were people giving advice in the
 * imperative ("if you have PR templates, add a checklist item") — prescription
 * read as past behaviour, which manufactures the exact signal the tier scale
 * measures. Four of the eight had no evidence-ledger entry at all, so
 * `validate-evidence-ledger.js` structurally could not see them, and none had a
 * reach channel through which a reply was plausible.
 *
 * This file makes the MECHANICAL half deterministic: does each counted row carry
 * a tier, a stated behaviour, a resolvable `E-id`, and a plausible reach channel,
 * and does the qualifying count clear the contract floor. It deliberately does
 * NOT decide whether a quote is really behavioural — that is a reading, and
 * pretending a regex can do it would be the cargo-cult version of the check. What
 * it does instead is surface prescriptive-looking rows as warnings so the
 * gatekeeper attacks the right ones (checklist item 18).
 *
 * Usage:
 *   node scripts/validate-beachhead.js <idea-dir> [--json] [--min 15] [--target 20]
 * Exit codes: 0 = floor cleared (warnings allowed), 1 = below floor or invalid rows, 2 = unusable input.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const DEFAULT_MIN = 15;
const DEFAULT_TARGET = 20;

// Imperative/conditional openers that mark advice rather than a past act. A hit is
// a WARNING, never a verdict: "you should keep docs in the repo, which is why we
// built the linter" is advice wrapped around real behaviour. Precision here is
// impossible and faking it would be worse than not trying.
const PRESCRIPTIVE = [
  /\bif you\b/i, /\byou should\b/i, /\bshould\b/i, /\bmake sure\b/i, /\bjust\b\s+\w+\s+\bit\b/i,
  /\btry\b\s/i, /\bconsider\b/i, /\buse\b\s+\w+\s+\binstead\b/i, /\badd a\b/i, /\bneeds? to be\b/i,
  /\bhave to\b/i, /\bmust\b/i, /\brecommend/i, /\bthe trick is\b/i, /\bwhat works is\b/i,
];
// Past-behaviour markers. Absence is not proof of anything either; presence lowers
// the suspicion that a row is advice.
const BEHAVIOURAL = [
  /\bwe (built|wrote|set up|made|added|imposed|rolled|run|ran|switched|hacked)\b/i,
  /\bi (built|wrote|set up|made|added|rolled|run|ran|switched|hacked|spent|paid)\b/i,
  /\bour team\b/i, /\bwe have been\b/i, /\bwe use\b/i, /\bended up\b/i, /\bso we\b/i,
  /\bare required to\b/i, /\btwice-yearly\b/i, /\bevery (sprint|week|month|quarter)\b/i,
];
// A channel that permits one public reply with no expectation of an answer is not
// reach — the run #2 finding stated as a rule.
const NON_CHANNEL = [
  /^-+$/, /^\s*$/, /\bnone\b/i, /\bunknown\b/i, /\bno (known )?(contact|channel)\b/i,
  /\bforum handle\b/i, /\bpublic (reply|comment|post)\b/i, /\bhn handle\b/i, /\bhandle only\b/i,
];

const cell = (cells, i) => (cells[i] === undefined ? "" : String(cells[i]).trim());
const stripMd = (s) => s.replace(/\*\*/g, "").replace(/`/g, "").replace(/[*_]/g, "").trim();

function splitRow(line) {
  const t = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return t.split("|").map((s) => s.trim());
}
const isSeparator = (line) => /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");

/** Locate the prospect table by header content, not position. */
function findTable(text) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*\|/.test(lines[i])) continue;
    const head = splitRow(lines[i]).map((h) => stripMd(h).toLowerCase());
    const hasPid = head.some((h) => /^p?id$/.test(h) || h === "pid");
    const hasTier = head.some((h) => h === "tier" || /\btier\b/.test(h));
    if (!hasPid || !hasTier) continue;
    if (!isSeparator(lines[i + 1] || "")) continue;
    const rows = [];
    for (let j = i + 2; j < lines.length; j++) {
      if (!/^\s*\|/.test(lines[j])) break;
      if (isSeparator(lines[j])) continue;
      rows.push({ line: j + 1, cells: splitRow(lines[j]) });
    }
    return { headerLine: i + 1, head, rows };
  }
  return null;
}

function colIndex(head, ...patterns) {
  for (const p of patterns) {
    const i = head.findIndex((h) => p.test(h));
    if (i !== -1) return i;
  }
  return -1;
}

function validate(ideaDir, opts) {
  const min = opts.min, target = opts.target;
  const errors = [], warnings = [];
  const file = path.join(ideaDir, "beachhead-icp.md");
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (e) {
    return { fatal: `cannot read ${file}: ${e.message}` };
  }

  // E-ids that actually resolve. A missing ledger is not fatal here (the ledger has
  // its own validator) but it does mean no E-id can be confirmed.
  const ledgerIds = new Set();
  let ledgerPresent = false;
  try {
    const lt = fs.readFileSync(path.join(ideaDir, "evidence-ledger.md"), "utf8");
    ledgerPresent = true;
    for (const m of lt.matchAll(/^\s*\|\s*(E\d+)\s*\|/gim)) ledgerIds.add(m[1].toUpperCase());
  } catch { /* handled below */ }

  const table = findTable(text);
  if (!table) {
    return { fatal: `no prospect table found in ${file} (need a header row containing "Pid" and "Tier")` };
  }
  const { head, rows } = table;
  const iPid = colIndex(head, /^p?id$/, /pid/);
  const iTier = colIndex(head, /^tier$/, /\btier\b/);
  const iBehav = colIndex(head, /behaviour|behavior/);
  const iEvid = colIndex(head, /evidence|e-?id/);
  const iReach = colIndex(head, /reach/);
  const iStatus = colIndex(head, /funnel|status/);

  for (const [name, idx] of [["Behaviour", iBehav], ["Evidence (E-id)", iEvid], ["Reach channel", iReach]]) {
    if (idx === -1) {
      errors.push({ code: "missing-column", msg: `the prospect table has no "${name}" column — a tier is an evidence claim and needs all three cells (gate-contracts F). Regenerate the table from the stage-0 template.` });
    }
  }
  if (errors.length) return { errors, warnings, counted: 0, rows: rows.length, min, target };

  let counted = 0;
  const quarantined = [];
  for (const r of rows) {
    const pid = stripMd(cell(r.cells, iPid)) || `row ${r.line}`;
    const at = `${pid} (line ${r.line})`;
    const tierRaw = stripMd(cell(r.cells, iTier));
    const behav = stripMd(cell(r.cells, iBehav));
    const evid = stripMd(cell(r.cells, iEvid));
    const reach = stripMd(cell(r.cells, iReach));
    const status = iStatus === -1 ? "" : stripMd(cell(r.cells, iStatus));
    if (!pid && !tierRaw && !behav) continue; // blank template row

    const explicitlyQuarantined = /quarantin|not counted|nurture/i.test(
      [tierRaw, behav, evid, reach, status].join(" ")
    );
    const tierNum = (tierRaw.match(/[1-5]/) || [])[0];
    const isEstimate = /\best\.?\b|estimate|likely|probabl|assum/i.test(tierRaw);

    if (explicitlyQuarantined) { quarantined.push(pid); continue; }
    if (!tierNum) {
      warnings.push({ code: "no-tier", msg: `${at}: no tier 1-5 in "${tierRaw}" — uncounted` });
      continue;
    }
    if (+tierNum < 4) { quarantined.push(pid); continue; } // sub-tier: legal to keep, never counted

    // Tier 4-5 claimed: now all three cells must hold.
    const problems = [];
    if (isEstimate)
      problems.push(`tier is an estimate ("${tierRaw}") — an estimated tier is [GUESS] and cannot be counted`);
    if (!behav || /^-+$/.test(behav))
      problems.push("no behaviour stated (tier 4 means they BUILT or imposed something — a past act)");
    const eids = (evid.toUpperCase().match(/E\d+/g) || []);
    if (!eids.length) problems.push(`no E-id in the evidence cell ("${evid}")`);
    else if (ledgerPresent) {
      const missing = eids.filter((e) => !ledgerIds.has(e));
      if (missing.length) problems.push(`E-id(s) ${missing.join(", ")} are not in evidence-ledger.md`);
    } else {
      warnings.push({ code: "no-ledger", msg: `${at}: cites ${eids.join(", ")} but evidence-ledger.md is unreadable, so the reference is unconfirmed` });
    }
    if (NON_CHANNEL.some((p) => p.test(reach)))
      problems.push(`reach channel "${reach}" does not permit an expected reply — a forum handle is not reach`);

    if (problems.length) {
      errors.push({ code: "row-not-countable", msg: `${at}: claims tier ${tierNum} but ${problems.join("; ")}` });
      continue;
    }

    counted++;
    // Heuristics — for the gatekeeper's attention, never a verdict of their own.
    if (PRESCRIPTIVE.some((p) => p.test(behav)) && !BEHAVIOURAL.some((p) => p.test(behav))) {
      warnings.push({
        code: "possibly-prescriptive",
        msg: `${at}: the behaviour reads as advice, not a past act — "${behav.slice(0, 120)}". Test it: could this sentence have been written by someone who never did the thing? If yes it is tier 1-3 (gatekeeper item 18).`,
      });
    }
  }

  if (counted < min) {
    errors.push({
      code: "below-floor",
      msg: `${counted} qualifying tier-4/5 prospect(s); the contract floor is a hard minimum of ${min} (target ${target}). Fewer than ${min} is a Layer 1 formal FAIL — a founder acknowledging the shortfall does not pass it, that would be a will-override, and a will-override never satisfies a gate.`,
    });
  } else if (counted < target) {
    warnings.push({
      code: "reach-risk",
      msg: `${counted} qualifying prospects: clears the ${min} floor but is under the ${target} target, so Layer 2/3 must log a mandatory reach-risk finding.`,
    });
  }
  if (quarantined.length) {
    warnings.push({ code: "quarantined", msg: `${quarantined.length} row(s) kept but uncounted (sub-tier or explicitly quarantined): ${quarantined.join(", ")}` });
  }

  return { errors, warnings, counted, rows: rows.length, quarantined: quarantined.length, min, target };
}

function main(argv) {
  const args = argv.slice(2);
  const jsonOut = args.includes("--json");
  const num = (flag, dflt) => {
    const i = args.indexOf(flag);
    if (i === -1) return dflt;
    const v = Number(args[i + 1]);
    return Number.isFinite(v) ? v : dflt;
  };
  const dir = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--min" && args[i - 1] !== "--target");
  if (!dir) {
    process.stderr.write("usage: validate-beachhead.js <idea-dir> [--json] [--min 15] [--target 20]\n");
    return 2;
  }
  const res = validate(dir, { min: num("--min", DEFAULT_MIN), target: num("--target", DEFAULT_TARGET) });
  if (res.fatal) {
    if (jsonOut) process.stdout.write(JSON.stringify({ ok: false, fatal: res.fatal }, null, 2) + "\n");
    else process.stderr.write(`UNUSABLE: ${res.fatal}\n`);
    return 2;
  }
  const ok = res.errors.length === 0;
  if (jsonOut) {
    process.stdout.write(JSON.stringify({ ok, qualifying: res.counted, rows: res.rows, quarantined: res.quarantined, min: res.min, target: res.target, errors: res.errors, warnings: res.warnings }, null, 2) + "\n");
  } else {
    for (const e of res.errors) process.stdout.write(`ERROR [${e.code}] ${e.msg}\n`);
    for (const w of res.warnings) process.stdout.write(`warn  [${w.code}] ${w.msg}\n`);
    process.stdout.write(ok
      ? `OK: ${res.counted} qualifying tier-4/5 prospects (floor ${res.min}, target ${res.target})\n`
      : `FAILED: ${res.errors.length} error(s); ${res.counted} qualifying\n`);
  }
  return ok ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { main, validate, findTable };
