---
name: handoff-to-build
description: Generate (or refresh) the build-repo handoff kit from a locked pack + blueprint, so the coding agents that implement the product - Claude Code, Codex, and anything else reading AGENTS.md - arrive already knowing the specs exist, that they are frozen, how to resolve an id, and where a spec defect goes. Use after gate BP passes, after every blueprint amendment, and whenever a build session reports that it had to guess.
argument-hint: "[idea-slug] [path to the build repository]"
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
| `AGENTS.md` | Codex, Cursor, Copilot, Zed, Devin, Aider… (the open standard) | the contract: read order, the two layers, the six rules |
| `CLAUDE.md` | Claude Code (which reads `CLAUDE.md`, not `AGENTS.md`) | `@AGENTS.md` plus the Claude-specific helpers |
| `.claude/rules/spec-vocabulary.md` | automatically, when a file under `docs/product/` is opened | anchors, id forms, "an empty cell is not permission" |
| `.claude/rules/implementation.md` | automatically, on source paths | the product-vs-technical decision boundary |
| `.claude/rules/spec-tests.md` | automatically, on test paths | acceptance criteria are the oracle; never weaken one |
| `.claude/skills/spec/` | `/spec <id>`, or by the model when an id appears | deterministic id → file → section → text |
| `.claude/skills/spec-gap/` | `/spec-gap`, or by the model when the spec is silent | the triage, and the amendment request draft |
| `.claude/settings.json` → SessionStart hook | every session, before the first prompt | the contract in one paragraph + hash verification + drift alarm |
| `docs/product/` + `spec-index.json` | on demand | the read-only copy, hashed, with every id mapped to its definition site |

## Preconditions

1. `state.blueprint.status` is `locked` and `state.blueprint.gate.status` is `passed`. If not,
   say so plainly: a kit asserts that the specs it carries are locked and a build session will
   treat them that way. Offer `--draft` **only** if the founder explicitly wants a preview; the
   draft kit stamps every generated file and the SessionStart hook announces it.
2. `scripts/validate-blueprint.js <idea> --at-gate` exits 0. The generator re-runs it and refuses
   otherwise — a kit must not freeze a spec set that cannot be implemented.
3. The build repository **already exists**. This skill never creates it, and never runs `git init`,
   scaffolds a project, or installs anything.

## Steps

1. **Resolve the target.** Ask for the build repo path if it was not given. If the founder does not
   have one yet, stop here — the kit belongs in the repo where the code will live, and generating
   it into the idea workspace helps nobody.
2. **Run the generator:**
   ```bash
   node scripts/build-handoff.js <idea-dir> --to <build-repo>
   ```
   Useful flags: `--src`/`--tests` to match an unusual source layout (defaults cover
   `src|app|lib|apps|packages|server|api|internal|pkg|cmd` and the common test paths); `--force`
   to replace an `AGENTS.md`/`CLAUDE.md` this generator did not write; `--draft` per precondition 1.
3. **If it refuses to overwrite an existing `AGENTS.md`/`CLAUDE.md`**, do not reach for `--force`
   on the founder's behalf. Someone wrote instructions for that repo. Show them the file, and
   offer the merge: move their content to a file of their own (`@build-notes.md`) which the
   generated `CLAUDE.md` can import, then rerun.
4. **Report what landed** — file count, id count by kind, pack class, amendment high-water mark —
   and name the three things a build session now gets for free: the SessionStart briefing, `/spec`,
   and `/spec-gap`.
5. **Tell them to commit the kit** to the build repo. It is meant to be shared with every session
   and every machine; a kit that exists only on one laptop protects only one laptop.

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
