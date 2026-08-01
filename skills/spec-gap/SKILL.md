---
name: spec-gap
description: Use when the locked spec under ideas/<slug>/ does not answer an in-scope question, contradicts itself, or turns out to be wrong once real code exists - an unhandled case, a provider behaving differently than documented, two specs that cannot both be satisfied, a stated limit that is impossible. Triages product versus technical, checks the places answers usually hide, and either resolves it or drafts the amendment. Reach for it BEFORE deciding an unspecified product behaviour during a build.
argument-hint: "[what the code needs to know]"
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/../../scripts/spec-lookup.js *) Read Grep Glob
---

The question at hand: **$ARGUMENTS**

The blueprint was written to be complete enough to implement from without inventing product
decisions — that is the level-2 cold-start bar it passed. It was not written by anyone who had
run the code. So gaps are expected, and this exists because the expensive failure is never the
gap itself: it is **deciding quietly and building on it**.

Work the steps in order. Do not skip step 1 — most reported gaps are answered elsewhere in the set.

## 1. Is it really absent?

Search before concluding, roughly in order of hit rate:

1. `blueprint/amendment-log.md` — may already answer it, and overrides the locked files
2. the feature spec's `bp:edge-cases`, `bp:states`, `bp:fields`, `bp:open-decisions`
3. `blueprint/blueprint-overview.md` → `bp:decisions` — the `DR-n` register. **If the question
   is there, the decision is the implementer's to make** within the recorded constraint. Not a
   gap; make it, record it in the PR, stop.
4. `blueprint/interaction-map.md` — cross-feature rules, invariants, job semantics
5. `blueprint/data-schema.md`, `nfr-spec.md`, `api-contract.md`, `integration-specs.md`
6. `mvp-pack/mvp-spec.md` — it may be out of scope rather than unspecified

```bash
node "${CLAUDE_SKILL_DIR}/../../scripts/spec-lookup.js" --grep <keyword>
```

State what was searched. "Not specified" is a claim that should be checkable.

## 2. Product question or technical one?

**Product** if the answer changes what a user sees, what they are promised, what is stored about
them, or when the system reports success: field names, types, limits, defaults, validation, copy,
empty/error/loading states, state transitions, retry and idempotency semantics, cancellation,
retention, permission boundaries, performance targets.

**Technical** if the user cannot tell which way it went: libraries, layering, naming inside the
code, algorithms, index choice, how a stated budget is met. Decide it, note it in the PR, stop
here — no amendment is needed and none should be requested. The amendment log is not a diary.

Watch for the disguise: when the obvious technical answer would also settle a product question,
it is a product question.

## 3. In scope or beyond it?

Check `mvp-pack/mvp-spec.md`. On the cut list or outside the locked scope → this is not a gap, it
is a scope change, and scope changes route through `declare-drift` and `reconcile`, never through
an amendment. Say so and stop; do not build it.

## 4. Route it

A genuine in-scope product gap, defect or contradiction goes to **`amend-blueprint`**, which runs
the founder-answered scope test, writes an immutable `ba-NNN` record and appends to
`amendment-log.md` — the locked files stay byte-identical. Hand it this, filled in; whoever
answers will not have the code open:

```
Where the code is:   <file:line, and what was being implemented>
Spec ids involved:   <fs-NN, AC-NN-n, INV-n, … — every id checked>
What the spec says:  <quote, cited as file · anchor — or "silent", with the sections searched>
What the code needs: <the question, phrased so it has a decidable answer>
Why it could not be
  seen earlier:      <what only running code revealed>
Options, if any:     <A / B, with the user-visible consequence of each — not a recommendation
                      dressed up as the only option>
Blocking?:           <yes: work stops here | no: what proceeds meanwhile>
```

## 5. While it is open

Do not implement the disputed behaviour "provisionally" behind a guess — that is exactly the
invented decision this prevents, and it gets harder to unwind with every file that depends on it.
Implement everything the gap does not block, and leave the boundary visible: a failing or skipped
test named for the open question and referencing the ids, and a comment at the call site saying
the behaviour is pending an amendment.

Never edit a locked file to record the answer locally. The bytes are the record of what was
decided; a local edit changes no decision and destroys the record. A hook blocks the write in any
case, but the routing is the point, not the block.
