---
paths:
  - "docs/product/**"
---
<!-- saas-idea-brainstorm:handoff v{{PLUGIN_VERSION}} — GENERATED, do not hand-edit. -->

# Reading the frozen product spec

You have a file under `docs/product/` open. These files were produced by a validation pipeline
and are written to be read by anchor and by id, not skimmed.

## Sections are delimited by anchor comments

Section boundaries are HTML comments — `<!-- bp:acceptance -->`, `<!-- pack:core-loop -->`. A
section runs from its anchor to the next anchor comment. Anchors are language-stable: the prose
between them may be in any language, the anchor names never change. Quote and cite by anchor
(`fs-03 · bp:edge-cases`), not by heading text.

Anchors you will meet most often:

| anchor | holds |
|---|---|
| `bp:trace` | what in the pack this spec descends from — the authority for it existing at all |
| `bp:acceptance` | the `AC-NN-n` criteria: binary given/when/then. The test oracle. |
| `bp:fields` | field-level rules: type, constraints, default, invalid-input copy |
| `bp:states` | per-screen empty / loading / error states with their copy |
| `bp:edge-cases` | the answered checklist — empty, duplicate, oversized, permission boundary, dependency failure, retry/idempotency, concurrency, timezone/locale/currency |
| `bp:open-decisions` | decisions delegated to build time, each with a `DR-n` in the decision register |
| `bp:entities` / `bp:state-machines` | schema entities; `ST-<entity>-n` transitions, every one owned |
| `bp:conflict-domains` / `bp:invariants` / `bp:jobs` | multi-writer rules, `INV-n` invariants, `JOB-n` async semantics |
| `bp:capabilities` / `bp:evals` / `bp:degradation` | subsystem `CAP-NN-n` budgets, `EV-n` eval bindings, what happens when the subsystem degrades |
| `bp:event-dictionary` | the single definition of every tracking event and payload — feature specs reference it, never redefine it |
| `bp:decisions` | the `DR-n` register: decisions the founder explicitly delegated, with their words |

## Id forms

{{ID_TABLE}}

`docs/product/spec-index.json` maps every one of these to `{file, anchor, label}`. Prefer it over
grep: it distinguishes the definition site from the many places an id is merely referenced.

`E-nnn` is the exception: those are evidence-ledger entries recording *why* a decision was made.
The ledger stays in the source workspace and is not copied here, so an `E-nnn` is a citation you
cannot follow from this repo — not a missing file, and not something to reconstruct.

## An empty cell is not permission

These artifacts passed a validator that rejects unresolved markers, so you will not find
`[TBD]`, `[GUESS]`, `[OPEN]` or blanks standing in for decisions. Some cells are legitimately
`N/A` **with a reason attached**, and some inherit a value declared elsewhere (a blank determinism
cell inherits its capability's declaration). If a cell looks empty and you cannot find what it
inherits from, treat it as a spec gap — `/spec-gap` — not as a free choice.

## These files are read-only

They are byte-frozen and hashed in `spec-index.json`. Corrections go through the amendment
process in the source workspace, never through an edit here. See Rule 1 in `AGENTS.md`.

`amendment-log.md` overrides the locked files wherever it speaks. If you are reading a locked
file and have not read the amendment log this session, read it now.
