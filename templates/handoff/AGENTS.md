<!-- saas-idea-brainstorm:handoff v{{PLUGIN_VERSION}} — GENERATED, do not hand-edit.
     Regenerate with: {{REGEN_CMD}}
     Hand edits are lost on regeneration; put your own repo instructions in a
     separate file and import it from CLAUDE.md instead. -->
# {{PRODUCT}} — build contract for coding agents
{{DRAFT_BANNER}}
This repository implements a product whose **product decisions were made, argued, evidenced
and frozen before this repo existed**. They live in `docs/product/`. You do not have to infer
them from the code, and you must not re-decide them.

`docs/product/` is not documentation *about* the product. It is the **specification the code
owes**. Where code and spec disagree, the spec is right until it is amended through the process
in [Rule 1](#rule-1--never-edit-docsproduct).

This file does not tell you how to build anything — no architecture, no stack, no methodology,
no workflow beyond what the specs themselves already decide. It exists for one reason: so that a
session touching these artifacts knows they exist, knows what they already settle, and looks the
answer up instead of inferring it. Every engineering choice the spec does not fix is yours.

## Read before your first edit

| # | file | why |
|---|---|---|
| 1 | `docs/product/blueprint/amendment-log.md` | **First, always.** Current truth = locked blueprint **+** amendments. Skipping it means building against a superseded decision. Absent = no amendments yet. |
| 2 | `docs/product/pack/mvp-spec.md` | Scope boundary: what is in, and the **cut list** of what was deliberately left out |
| 3 | `docs/product/blueprint/blueprint-overview.md` | Index of every spec file, the event dictionary, and the decision register |
| 4 | the feature spec you are about to implement | `docs/product/blueprint/feature-specs/fs-NN-*.md` |

Full file list with one line of purpose each: `docs/product/READ-ORDER.md`.
Machine-readable map from any id to its file and section: `docs/product/spec-index.json`
({{ID_COUNT}} ids indexed).

## The two layers

| layer | file set | answers | changed by |
|---|---|---|---|
| **Pack** (`docs/product/pack/`) | mvp-spec, tech-design, definition-of-done, charter… | *what / why / where the boundary is* | not from this repo — scope change goes back to the validation pipeline |
| **Blueprint** (`docs/product/blueprint/`) | feature specs, data schema, UX, API, integrations, NFRs, test plan, build plan | *exactly how, at the product level* | amendment only (Rule 1) |

Both are frozen. The blueprint passed a cold-start test whose bar was: *a fresh session reading
only pack + blueprint can implement every feature without inventing a single product decision.*
If you find yourself inventing one, that is a finding worth reporting — see [Rule 3](#rule-3--a-gap-is-a-finding-not-a-decision).

## Resolving an id instead of guessing

Every product noun here has an id. When a spec, a comment, a test name or a commit message
mentions one, look it up — never infer it from context.

{{ID_TABLE}}

`E-nnn` also appears in the pack. Those are evidence-ledger entries — provenance for *why* a
decision was made. The ledger stays in the source workspace and is not copied here, so treat an
`E-nnn` as a citation you cannot follow from this repo, not as a missing file.

Lookup, in order of preference:
1. `docs/product/spec-index.json` → `ids["AC-03-2"]` gives `{file, anchor, label}`
2. the `/spec` skill in this repo: `/spec AC-03-2`
3. grep the id inside `docs/product/`

Sections are delimited by HTML anchor comments such as `<!-- bp:acceptance -->`. They are stable
across languages — the prose around them may be in any language, the anchors are not. Read from
an anchor to the next anchor comment.

## Rule 1 — never edit `docs/product/`

Those files are byte-frozen and their hashes are recorded in `spec-index.json`. Editing one does
not change the product decision; it only destroys the record of what was decided and silently
desynchronises this repo from the source workspace.

- **The spec is wrong, silent, or self-contradicting on something in scope** → do not patch it
  here. It is amended in the source workspace:
  ```
  {{AMEND_CMD}}
  ```
  That produces a new immutable amendment record and appends to `amendment-log.md`; the locked
  files stay byte-identical. Then the kit in this repo is regenerated.
- **Reality departed from the locked scope** (feature added/removed, buyer or price changed) →
  that is drift, not an amendment. It goes back to the pipeline too, not into these files.

Use `/spec-gap` in this repo to work out which case you have and to draft the request.

## Rule 2 — technical choices are yours; product choices are not

| yours, decide freely | not yours, look it up or escalate |
|---|---|
| language, framework, libraries, file layout | what a feature does, and when it is done |
| algorithms, data structures, internal APIs | field names, types, limits, defaults, validation rules |
| how you satisfy a stated performance budget | what the budget is |
| test framework and file organisation | what must be tested, and what "passing" means |
| error handling mechanics, logging | user-visible copy, error states, empty states |
| DB engine details, index tuning | entities, relationships, state machines, retention duties |
| queue/worker implementation | job semantics: cancel, retry, partial result, result lifetime |

If a question changes what the user experiences, what they are promised, or what data is kept —
it is a product choice. Look it up. If it is genuinely absent, go to Rule 3.

## Rule 3 — a gap is a finding, not a decision

When the spec does not answer an in-scope question, the failure mode to avoid is *deciding
quietly and moving on*. Triage instead:

1. **Is it really absent?** Check the feature spec's edge-case and open-decision sections, the
   data schema, the interaction map, the NFR spec, and `amendment-log.md`. Most "gaps" are
   answered somewhere else in the set.
2. **Is it a product question or a technical one?** (Rule 2's table.) Technical → decide it,
   note it in the PR, move on.
3. **Product question, in scope** → stop and raise it. `/spec-gap` drafts the amendment request.
   Building on an invented product decision is exactly the failure this spec set exists to
   prevent, and it is expensive to unwind after the code depends on it.
4. **Product question, out of scope** → it is on the cut list or beyond it. Not a gap. Do not
   build it.

## Rule 4 — trace what you build

Every commit or PR that implements product behaviour names the id(s) it implements or satisfies
(`fs-03`, `AC-03-2`, `INV-1`, `DOD-4`…). Two reasons that pay off immediately: a reviewer can
check the implementation against a specific written criterion instead of a vibe, and coverage
against the definition of done stays countable rather than remembered.

## Rule 5 — acceptance criteria are the test oracle

Acceptance criteria are written as binary given/when/then. A test asserts the criterion as
written. **Never relax a criterion so a test passes** — that converts a real defect into a
recorded lie. If the criterion is genuinely wrong, that is Rule 1.

`docs/product/blueprint/test-plan.md` states which scenarios are mandatory regardless of feature
work.

## Rule 6 — the cut list is a boundary, not a backlog

`docs/product/pack/mvp-spec.md` lists what was deliberately excluded. Those items are not
"nice-to-haves you may add if it is quick". Building one is scope drift and it is the most common
way a locked MVP stops shipping. Same for a feature nobody cut but nobody specified either: if it
has no feature spec, it is not in this build.

## Freshness

This kit was generated on **{{GENERATED}}** from `{{SOURCE}}`, amendments through
**{{AMENDMENTS_THROUGH}}**. `docs/product/spec-index.json` holds a SHA-256 for every copied file.

A session-start hook re-checks those hashes and, when the source workspace is reachable, whether
it has moved ahead. If it reports drift, regenerate before trusting anything here:

```
{{REGEN_CMD}}
```

**This kit never paraphrases a spec.** Everything above is routing, vocabulary and process; every
product fact lives in `docs/product/` and only there. If you want to know what the product does,
open the file — do not rely on any summary, including this one.
