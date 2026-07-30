#!/usr/bin/env node
/**
 * Regenerate `.codex/agents/*.toml` from `agents/*.md` (saas-idea-brainstorm plugin).
 *
 * The Codex parity contract says the Codex agent bodies are the Claude bodies
 * verbatim. That claim silently went stale the moment an agent gained a new check
 * on the Claude side — which is exactly what happened when the gatekeeper grew its
 * independence / usability / claim / privacy / manifest / cross-domain checks. Two
 * hand-maintained copies of the same prompt always drift, so generate one from the
 * other and let a fixture fail when they diverge.
 *
 * Usage:
 *   node scripts/sync-codex-agents.js          # rewrite the TOML files
 *   node scripts/sync-codex-agents.js --check  # exit 1 if any file is out of date
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "agents");
const DEST = path.join(ROOT, ".codex", "agents");
const SANDBOX = "read-only"; // every agent here researches or audits; none writes files

/** Split a Claude agent file into its frontmatter fields and its body. */
function parseAgent(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error("agent file has no frontmatter");
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return { fm, body: m[2].trim() };
}

function tomlEscape(s) {
  // Inside a basic multi-line string only backslashes and a literal triple quote
  // need care; keep everything else byte-identical so the bodies really match.
  return s.replace(/\\/g, "\\\\").replace(/"""/g, '\\"\\"\\"');
}

function render(name, description, body) {
  return (
    `name = "${name}"\n` +
    `description = "${description.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"\n` +
    `sandbox_mode = "${SANDBOX}"\n` +
    `developer_instructions = """\n${tomlEscape(body)}\n"""\n`
  );
}

function main(argv) {
  const check = argv.includes("--check");
  let stale = 0;
  for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith(".md")).sort()) {
    const { fm, body } = parseAgent(fs.readFileSync(path.join(SRC, file), "utf8"));
    const name = fm.name || path.basename(file, ".md");
    const out = render(name, fm.description || "", body);
    const target = path.join(DEST, `${name}.toml`);
    const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
    if (current === out) continue;
    if (check) {
      stale++;
      const reason = current === null ? "missing" : "out of date";
      process.stdout.write(`STALE ${path.relative(ROOT, target)} (${reason} vs agents/${file})\n`);
    } else {
      fs.writeFileSync(target, out);
      process.stdout.write(`wrote ${path.relative(ROOT, target)}\n`);
    }
  }
  // An orphan TOML (no Markdown source) would keep shipping an agent nobody
  // maintains — the parity claim covers both directions.
  const expected = new Set(
    fs.readdirSync(SRC).filter((f) => f.endsWith(".md")).map((f) => {
      const { fm } = parseAgent(fs.readFileSync(path.join(SRC, f), "utf8"));
      return `${fm.name || path.basename(f, ".md")}.toml`;
    })
  );
  for (const t of fs.readdirSync(DEST).filter((f) => f.endsWith(".toml")).sort()) {
    if (expected.has(t)) continue;
    stale++;
    process.stdout.write(`ORPHAN .codex/agents/${t} (no agents/*.md source)
`);
  }
  if (check) {
    if (stale) {
      process.stdout.write(`\n${stale} Codex agent file(s) do not match their Claude source — run: node scripts/sync-codex-agents.js\n`);
      return 1;
    }
    process.stdout.write("Codex agent bodies match their Claude sources.\n");
  }
  return 0;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { parseAgent, render, main };
