---
name: handoff-to-build
description: Ship a locked pack + blueprint to a build repository that is SEPARATE from the idea workspace, so the coding agents there arrive already knowing the specs exist, that they are frozen, how to resolve an id, and where a spec defect goes. Only for the two-repo case - when the code lives in the same repo as the idea workspace there is nothing to generate, because the plugin already does this natively. Use after gate BP passes, after every blueprint amendment, and whenever a build session in that repo reports it had to guess.
argument-hint: "[idea-slug] [path to the separate build repository]"
---

Load `method-rules`; read `state.json`. Everything here is generated from artifacts that are
already locked: this skill adds **no** founder judgement and authors **no** product statement.

## First, check whether it is needed at all

**If the code will live in the same repository as `ideas/<slug>/` — stop. There is nothing to
run.** The plugin covers that case natively, with nothing generated, nothing to regenerate after
an amendment, nothing to collide with another plugin, and nothing that can go stale:

| already native | what it does |
|---|---|
| `session-start.js` | injects the standing build contract every session (and after a compaction) whenever a blueprint is locked: the two layers, amendment-log-first, and the product-vs-technical line |
| `spec-awareness.js` (PostToolUse on `Read`) | on the first spec file a session opens, injects the anchor mechanism, the id vocabulary, "read-only", and the routing for a defect |
| `guard-thresholds.js` (PreToolUse) | blocks an edit to a locked artifact and names `amend-blueprint` |
| `/saas-idea-brainstorm:spec` | resolves any id to the file, section and text that **defines** it, built from the artifacts on demand |
| `/saas-idea-brainstorm:spec-gap` | triages a suspected gap and routes a real one to `amend-blueprint` |

Say that plainly and stop. The generator refuses a same-repo target anyway: a copy inside the
tree the pipeline guards would be a freely editable twin of a frozen file, because the guard
hooks scope to paths under `ideas/`.

**This skill is for the other case:** the code is in a different repository, which may not have
this plugin installed at all. There, files are the only carrier.

## What it generates there

| generated | loaded by | carries |
|---|---|---|
| `AGENTS.md` | Codex, Cursor, Copilot, Zed, Devin, Aider… (the open standard) | the contract: read order, the two layers, the six rules |
| `CLAUDE.md` | Claude Code (which reads `CLAUDE.md`, not `AGENTS.md`) | `@AGENTS.md` plus the Claude-specific helpers |
| `.claude/rules/product-spec/*.md` | automatically — on `docs/product/**`, on source paths, on test paths | id vocabulary and anchors · the decision boundary · acceptance criteria as oracle |
| `.claude/skills/product-spec{,-gap}/` | `/product-spec <id>` · `/product-spec-gap` | the same two jobs the plugin does natively, for a repo without the plugin |
| `.claude/product-spec/` | `spec-lookup.js`, `spec-freshness.js`, `spec-index.json`, `READ-ORDER.md` | id → defining file and section; SHA-256 per copied file |
| `.claude/settings.json` → SessionStart hook | every session, before the first prompt | the contract, hash verification, and a drift alarm |
| `docs/product/` | on demand | the read-only copy of pack + blueprint |

## Preconditions

1. `state.blueprint.status` is `locked` and `state.blueprint.gate.status` is `passed`. If not, say
   so plainly: a kit asserts that the specs it carries are locked and a build session will treat
   them that way. Offer `--draft` **only** if the founder explicitly wants a preview.
2. `scripts/validate-blueprint.js <idea> --at-gate` exits 0. The generator re-runs it and refuses
   otherwise — a kit must not freeze a spec set that cannot be implemented.
3. The build repository **already exists**, and is not the workspace repo. This skill never creates
   it, and never runs `git init`, scaffolds a project, or installs anything.

## Steps

1. **Confirm the two-repo shape** before doing anything. If the answer is "same repo", the section
   above is the whole response.
2. **Run the generator:**
   ```bash
   node scripts/build-handoff.js <idea-dir> --to <build-repo>
   ```
   Useful flags: `--src`/`--tests` to match an unusual source layout (defaults cover
   `src|app|lib|apps|packages|server|api|internal|pkg|cmd` and the common test paths); `--force`
   to replace generated files this generator did not write; `--draft` per precondition 1.
3. **If it refuses to overwrite something**, do not reach for `--force` on the founder's behalf.
   Someone — or another plugin — wrote that file. Show it to them. For `AGENTS.md`/`CLAUDE.md`,
   offer the merge instead: move their content into a file of their own (`@build-notes.md`) which
   the generated `CLAUDE.md` imports, then rerun.
4. **Report what landed** — file and id counts by kind, pack class, amendment high-water mark — and
   name what a session in that repo now gets: the SessionStart briefing, `/product-spec`, and
   `/product-spec-gap`.
5. **Tell them to commit the kit** to the build repo. It is meant to be shared with every session
   and every machine; a kit that exists only on one laptop protects only one laptop.

## Refresh discipline — the part that actually decays

A stale kit is worse than none: it looks authoritative while describing a superseded decision.

- **After every `amend-blueprint`** (and after a `reconcile` that changed pack or blueprint files),
  rerun the generator. This is the price of the two-repo shape, and it is the main reason to prefer
  one repo when there is a choice.
- Check without regenerating: `node scripts/build-handoff.js <idea-dir> --to <build-repo> --check`.
  Exit 1 on drift in either direction — the source moved ahead, or a frozen file was edited in the
  build repo. Cheap enough for that repo's CI.
- The generated SessionStart hook runs the same check at the start of every build session there.
  It **never** repairs anything silently.

## Living beside other plugins

A build repo carries other plugins, so: everything lands under two deletable namespaces
(`.claude/product-spec/`, `.claude/rules/product-spec/`) plus two prefixed skills — project skills
are *not* namespaced the way plugin skills are, and a generic `implementation.md` or a bare `/spec`
is exactly what two tools collide on. Every generated rule carries a scope clause disclaiming
architecture, stack, code style, formatting, commit conventions, branching, review and release
process, because Claude Code picks *arbitrarily* between contradicting instructions. And nothing
this generator did not write is ever overwritten; a refused run writes no index at all.

## What this skill will not do

- **Copy the evidence ledger.** `E-nnn` ids stay unresolvable from the build repo by design: the
  ledger is provenance for *why* a decision was made, it carries participant material, and moving
  it into another repository is the founder's decision, not a side effect of a handoff.
- **Copy `private/`.** Ever.
- **Paraphrase a spec.** Every generated file routes, indexes and explains process; not one
  restates a product fact. That is what keeps the kit incapable of drifting from the artifacts.
- **Prescribe how to build.** Awareness only: no architecture, no stack, no methodology, no
  workflow beyond what the locked specs themselves decide.
