---
name: handoff-to-build
description: Generate (or refresh) the handoff kit from a locked pack + blueprint, so the coding agents that implement the product - Claude Code, Codex, and anything else reading AGENTS.md - arrive already knowing the specs exist, that they are frozen, how to resolve an id, and where a spec defect goes. Two modes - a separate build repository, or in-place when one repo holds both the idea workspace and the code. Use after gate BP passes, after every blueprint amendment, and whenever a build session reports that it had to guess.
argument-hint: "[idea-slug] [build-repo path, or 'in-place']"
---

Make the pipeline's output legible to the **next** agent — the one in the build repository, which
has none of this conversation and no reason to know that `AC-03-2` is an id rather than prose.
Load `method-rules`; read `state.json`. Everything here is generated from artifacts that are
already locked: this skill adds **no** founder judgement and authors **no** product statement.

Idea slug = $0, build-repo path = $1 (ask if missing).

## What the kit is, and is not

It is **awareness only**. It tells a session that these artifacts exist, what each one already
settles, how to resolve an id, and where a spec defect goes. It prescribes no architecture, no
stack, no methodology, and no workflow beyond what the locked specs themselves decide — every
engineering choice the spec does not fix stays with whoever is building. That boundary is what
keeps the kit useful in any repo and incapable of contradicting the artifacts.

## Why this exists

Stage 6 ends with a set of specs that a fresh session can implement without inventing a product
decision — proved by the level-2 cold-start test. But that proof assumes the session **reads the
set**. A coding agent opening an unfamiliar repo does what it always does: skims the tree, infers
a structure, and fills the gaps with plausible invention. One directory downstream, the failure
stage 6 exists to prevent comes back.

The kit closes that by using the mechanisms the host tools load **on their own**, without anyone
remembering to mention them:

| generated | loaded by | carries |
|---|---|---|
| `.claude/rules/product-spec/spec-vocabulary.md` | automatically, when a spec file is opened | anchors, id forms, "an empty cell is not permission" |
| `.claude/rules/product-spec/implementation.md` | automatically, on source paths | the product-vs-technical decision boundary |
| `.claude/rules/product-spec/spec-tests.md` | automatically, on test paths | acceptance criteria are the oracle; never weaken one |
| `.claude/skills/product-spec/` | `/product-spec <id>`, or by the model when an id appears | deterministic id → file → section → text |
| `.claude/skills/product-spec-gap/` | `/product-spec-gap`, or by the model when the spec is silent | the triage, and the amendment request draft |
| `.claude/product-spec/spec-index.json` | on demand, and by `spec-lookup.js` | every id → its **defining** file and section |

## Two modes — pick by where the code will live

**`--to <build-repo>`** — idea workspace and code are **separate repositories**. Adds
`AGENTS.md` (the open standard: Codex, Cursor, Copilot, Zed…), `CLAUDE.md` importing it (Claude
Code reads `CLAUDE.md`, not `AGENTS.md`), a hashed read-only `docs/product/` copy, and a
SessionStart hook in `.claude/settings.json` that states the contract and alarms on drift.

**`--in-place`** — **one repo** holds the idea workspace *and* the code. This is the common solo
case and it is **not** "run the normal mode pointed at the same folder": copying here would put a
second copy of the spec in the same tree, and the pipeline's own hooks guard only paths under
`ideas/`, so the copy would be a freely-editable twin of a frozen file — the exact divergence the
whole method exists to prevent. So in-place:

- **copies nothing** — every generated artifact points at `ideas/<slug>/` directly
- **hashes nothing** — a hash of the source against itself proves nothing and would go stale on
  every legitimate amendment. `--check` instead reports whether the **index** has gone stale
  (a feature spec or amendment added since generation resolving to nothing)
- **registers no hook** — the plugin's own SessionStart already briefs the session on pipeline
  state, and its PreToolUse already blocks edits to locked artifacts
- **does not touch `CLAUDE.md` or `AGENTS.md`** — it adds an always-loaded
  `.claude/rules/product-spec/contract.md` instead. Pass `--codex` to also maintain a
  begin/end-marked block inside `AGENTS.md` (Codex does not read `.claude/rules/`); everything
  outside the markers is left exactly as it was.

## Living beside other plugins

A repo that builds software carries other plugins. Three decisions follow from that, and they are
not cosmetic:

1. **Everything lands under two deletable namespaces** — `.claude/product-spec/` and
   `.claude/rules/product-spec/` — plus two prefixed skills. Project skills are *not* namespaced
   the way plugin skills are (`plugin:skill` cannot collide; `.claude/skills/spec/` can, and can
   shadow a bundled skill of the same name). A generic `implementation.md` or a bare `/spec` is
   exactly what two tools collide on. Uninstalling is deleting those folders.
2. **Every generated rule carries a scope clause** disclaiming architecture, stack, code style,
   formatting, commit conventions, branching, review and release process — because Claude Code
   picks *arbitrarily* between contradicting instructions, and an unbounded rule is how this kit
   would start losing arguments it should never have been in. What the clause does assert: a
   product decision recorded in the spec is not overridden by another instruction; it is amended,
   or it stands.
3. **Nothing is overwritten that this generator did not write.** Pre-existing files are named and
   the run refuses, writing no index at all — a half-generated kit must never claim to be one.

One friction worth naming to the founder: a formatter or lint plugin that rewrites `**/*.md` will
hit the locked artifacts and be **blocked by this plugin's PreToolUse hook**. That is correct
behaviour, but it looks like a mysterious failure — exclude `ideas/` in that tool's config.

## Preconditions

1. `state.blueprint.status` is `locked` and `state.blueprint.gate.status` is `passed`. If not,
   say so plainly: a kit asserts that the specs it carries are locked and a build session will
   treat them that way. Offer `--draft` **only** if the founder explicitly wants a preview; the
   draft kit stamps every generated file and the SessionStart hook announces it.
2. `scripts/validate-blueprint.js <idea> --at-gate` exits 0. The generator re-runs it and refuses
   otherwise — a kit must not freeze a spec set that cannot be implemented.
3. For `--to`, the build repository **already exists**. This skill never creates it, and never runs
   `git init`, scaffolds a project, or installs anything.

## Steps

1. **Establish which mode.** Ask where the code will live if it is not obvious from the argument:
   *the same repo as the idea, or a separate one?* Do not default silently — the two modes write
   different things, and picking `--to` for a mono-repo is the one way this skill can actively make
   the repo worse.
2. **Run the generator:**
   ```bash
   node scripts/build-handoff.js <idea-dir> --in-place          # same repo
   node scripts/build-handoff.js <idea-dir> --to <build-repo>   # separate repo
   ```
   Useful flags: `--src`/`--tests` to match an unusual source layout (defaults cover
   `src|app|lib|apps|packages|server|api|internal|pkg|cmd` and the common test paths); `--codex`
   for the in-place AGENTS.md block; `--force` to replace generated files this generator did not
   write; `--draft` per precondition 1.
3. **If it refuses to overwrite something**, do not reach for `--force` on the founder's behalf.
   Someone — or another plugin — wrote that file. Show it to them. For `AGENTS.md`/`CLAUDE.md`,
   offer the merge instead: move their content into a file of their own (`@build-notes.md`) which
   the generated `CLAUDE.md` imports, then rerun.
4. **Report what landed** — mode, spec root, file and id counts by kind, pack class, amendment
   high-water mark — and name what a session now gets for free: the standing contract,
   `/product-spec`, `/product-spec-gap`, and (copy mode) the SessionStart briefing.
5. **Tell them to commit the kit.** It is meant to be shared with every session and every machine;
   a kit that exists only on one laptop protects only one laptop.
6. **In-place only, mention once:** the repo now carries the evidence ledger and interview quotes
   alongside the code. `private/` has its own `.gitignore` and stays out, but the ledger does not.
   Fine for a private solo repo; worth knowing before open-sourcing or adding a collaborator.

## Refresh discipline — the part that actually decays

A stale kit is worse than none: it looks authoritative while describing a superseded decision. So:

- **After every `amend-blueprint`**, rerun the generator. The amendment log is in the build read
  order, and the kit is where a build session reads it.
- **After a `reconcile` that changed pack or blueprint files**, likewise.
- The founder can check without regenerating:
  ```bash
  node scripts/build-handoff.js <idea-dir> --to <build-repo> --check
  ```
  Exit 1 on drift, in either direction — the source moved ahead, or someone edited a frozen file
  in the build repo. It is cheap enough to run in the build repo's CI.
- The SessionStart hook performs the same check at the start of every build session and reports
  drift in-context. It **never** repairs anything silently.

## What this skill will not do

- **Copy the evidence ledger.** `E-nnn` ids stay unresolvable from the build repo by design: the
  ledger is provenance for *why* a decision was made, it carries participant material, and moving
  it into another repository is the founder's decision, not a side effect of a handoff.
- **Copy `private/`.** Ever.
- **Paraphrase a spec.** Every generated file routes, indexes and explains process; not one of them
  restates a product fact. That is what keeps the kit incapable of drifting from the artifacts —
  and it is why "read the file" is the right answer to any question about the product.
- **Write into `docs/product/` by hand**, or accept an edit there as a correction. Spec defects go
  through `amend-blueprint`; scope changes go through `declare-drift`.
