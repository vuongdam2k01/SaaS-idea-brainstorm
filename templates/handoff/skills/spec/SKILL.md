---
name: spec
description: Resolve a frozen product-spec id (fs-NN, AC-NN-n, INV-n, JOB-n, ST-<entity>-n, CAP-NN-n, EV-n, DR-n, DOD-n, MSP-n, DF-n, E-nnn) to the exact file, section and text that defines it. Use whenever such an id appears in a spec, task, test name, comment or commit message, and before implementing any behaviour that references one — the specification in docs/product/ is frozen and authoritative, so the answer is looked up, never inferred.
allowed-tools: Bash(node ${CLAUDE_PROJECT_DIR}/.claude/scripts/spec-lookup.js *) Read Grep
---
<!-- saas-idea-brainstorm:handoff v{{PLUGIN_VERSION}} — GENERATED, do not hand-edit. -->

# Resolve a spec id

Resolve: **$ARGUMENTS**

## 1. Look it up

```bash
node ${CLAUDE_PROJECT_DIR}/.claude/scripts/spec-lookup.js $ARGUMENTS
```

Useful variants when you do not have an exact id:

- `--list` — every indexed id grouped by kind; `--list AC` for one kind
- `--grep <text>` — ids whose label matches, for when you know the feature but not the number

The script prints the defining file, the anchor of the section, the section text, and the exact
table row for the id. It exits non-zero when an id is not indexed.

## 2. Read around it, not just at it

An id's own row rarely carries every constraint that applies to it. Before you act:

- **`AC-NN-n`** → also read that feature spec's `bp:edge-cases` and `bp:states`; a criterion is
  often narrower than the behaviour around it.
- **`fs-NN`** → read `bp:trace` (what in the pack authorises this feature) and
  `bp:open-decisions` (what was deliberately delegated, each with a `DR-n`).
- **`ST-<entity>-n`** → the whole `bp:state-machines` table: transitions are owned, and the
  interesting rule is usually which transitions are *absent*.
- **`INV-n` / `JOB-n`** → the conflict-domain rows for the same entity; an invariant that holds
  per feature can still break across two.
- **`CAP-NN-n` / `EV-n`** → the subsystem's `bp:degradation` and `bp:budgets`; a capability's
  acceptance is bound to its eval and threshold, not to a hand-picked example.
- **any id** → `docs/product/blueprint/amendment-log.md`, which overrides the locked files
  wherever it speaks.

## 3. If the id does not resolve

Do not fill the gap with a reasonable guess. An unindexed id means one of:

- a typo or a stale reference in the text you read it from — check `--grep`
- the kit is out of date and the id was added by a later amendment — check whether the freshness
  hook reported drift, and regenerate the kit if so
- it was never specified — a genuine spec gap: use `/spec-gap`

Report which of the three it is rather than working around it.

## Answer format

Quote the defining text, cite it as `<file> · <anchor>`, and state plainly what it obliges the
code to do. If the spec constrains something the user did not ask about but is about to touch,
say so — that is the whole reason these ids exist.
