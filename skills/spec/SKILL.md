---
name: spec
description: Resolve a locked product-spec id - fs-NN, AC-NN-n, ST-<entity>-n, INV-n, JOB-n, CAP-NN-n, EV-n, DR-n, DOD-n, MSP-n, SC-n, DF-n, BA-nnn - to the exact file, section and text that DEFINES it. Use whenever such an id appears in a spec, a task, a test name, a comment or a commit message, and before implementing any behaviour that references one. The specification under ideas/<slug>/ is frozen and authoritative, so the answer is looked up, never inferred.
argument-hint: "[id ...] | --list [kind] | --grep <text> | --files"
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/../../scripts/spec-lookup.js *) Read Grep
---

Resolve **$ARGUMENTS** against the locked pack + blueprint. This is the build-time
counterpart to the pipeline: the specs are already written, and the job here is to find what
they say — not to reconstruct it from the code or from context.

## 1. Look it up

```bash
node "${CLAUDE_SKILL_DIR}/../../scripts/spec-lookup.js" $ARGUMENTS
```

The index is built from the artifacts on every run, so it is never stale against an amendment
that landed a minute ago. Variants when the exact id is unknown: `--list` (every id grouped by
kind, `--list AC` for one kind), `--grep <text>` (ids whose label matches), `--files` (the spec
file set with the read order). Add `--idea <slug>` when the workspace holds more than one spec.

## 2. Read around it, not just at it

An id's own row rarely carries every constraint that applies to it:

- **`AC-NN-n`** → also that feature spec's `bp:edge-cases` and `bp:states`; a criterion is often
  narrower than the behaviour around it.
- **`fs-NN`** → `bp:trace` (what in the pack authorises this feature at all) and
  `bp:open-decisions` (what was deliberately delegated, each with a `DR-n`).
- **`ST-<entity>-n`** → the whole `bp:state-machines` table: transitions are owned, and the
  interesting rule is usually which transitions are *absent*.
- **`INV-n` / `JOB-n`** → the conflict-domain rows for the same entity; an invariant that holds
  within one feature can still break across two.
- **`CAP-NN-n` / `EV-n`** → the subsystem's `bp:degradation` and `bp:budgets`; acceptance is
  bound to the eval and its threshold, not to a hand-picked example.
- **`DR-n`** → this one inverts the usual answer: a decision in the register was explicitly
  delegated to build time, so it **is** the implementer's to make, within the recorded
  constraint. Say so, and record the choice in the PR.
- **any id** → `blueprint/amendment-log.md`, which overrides the locked files wherever it speaks.

## 3. If it does not resolve

The script exits non-zero and says so. Do not close the gap with a reasonable guess — report
which of these it is:

- a typo or a stale reference in the text it was read from (try `--grep`)
- a reference to something that was never specified — a genuine gap: `spec-gap`
- an id from a different idea's spec in the same workspace (`--idea <slug>`)

## Answer format

Quote the defining text, cite it as `<file> · <anchor>`, and state plainly what it obliges the
code to do. If the spec also constrains something the user did not ask about but is about to
touch — a shared entity's conflict domain, an invariant, a specified error string — say so
unprompted. That is the entire reason these ids exist.
