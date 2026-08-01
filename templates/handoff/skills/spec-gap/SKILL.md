---
name: spec-gap
description: Use when the frozen product spec in docs/product/ does not answer an in-scope question, contradicts itself, or turns out to be wrong once real code exists — an unhandled case, a provider behaving differently than documented, two specs that cannot both be satisfied, a field whose stated limit is impossible. Triages whether the question is product or technical, checks the places answers usually hide, and drafts the amendment request for the source workspace. Reach for it BEFORE deciding an unspecified product behaviour yourself.
allowed-tools: Bash(node ${CLAUDE_PROJECT_DIR}/.claude/scripts/spec-lookup.js *) Read Grep Glob
---
<!-- saas-idea-brainstorm:handoff v{{PLUGIN_VERSION}} — GENERATED, do not hand-edit. -->

# Spec gap triage

The question at hand: **$ARGUMENTS**

The specification in `docs/product/` was written to be complete enough to implement from without
inventing product decisions. It was not written by someone who had run the code. So gaps are
expected — and the process below exists because the expensive failure is not the gap, it is
**deciding quietly and building on it**.

Work through the steps in order. Do not skip step 1: most reported gaps are answered elsewhere in
the set.

## 1. Is it really absent?

Search before concluding. In rough order of hit rate:

1. `docs/product/blueprint/amendment-log.md` — may already answer it, and overrides the locked files
2. the feature spec's `bp:edge-cases`, `bp:states`, `bp:fields`, `bp:open-decisions`
3. `docs/product/blueprint/blueprint-overview.md` → `bp:decisions` (the `DR-n` register of decisions
   the founder explicitly delegated to build time — if your question is there, **the decision is
   yours to make** within the recorded constraint; record it in the PR)
4. `docs/product/blueprint/interaction-map.md` — cross-feature rules, invariants, job semantics
5. `docs/product/blueprint/data-schema.md`, `nfr-spec.md`, `api-contract.md`, `integration-specs.md`
6. `docs/product/pack/mvp-spec.md` — it may be out of scope rather than unspecified

```bash
node ${CLAUDE_PROJECT_DIR}/.claude/scripts/spec-lookup.js --grep <keyword>
```

State what you searched. "Not specified" is a claim that should be checkable.

## 2. Product question or technical one?

If the answer changes what a user sees, what they are promised, what is stored about them, or when
the system reports success — **product**. Field names, types, limits, defaults, validation, copy,
empty/error/loading states, state transitions, retry and idempotency semantics, cancellation,
retention, permission boundaries, performance targets.

If the user cannot tell which way you went — **technical**. Decide it, note it in the PR, stop
here. No amendment is needed and none should be requested; the amendment log is not a diary.

## 3. In scope or beyond it?

Check `docs/product/pack/mvp-spec.md`. If the behaviour is on the cut list or outside the locked
scope, this is not a gap — it is a scope change, and scope changes go back through the validation
pipeline as *drift*, not through an amendment. Say so and stop; do not build it.

## 4. Draft the amendment request

For a genuine in-scope product gap, defect or contradiction, produce this block for the founder to
carry to the source workspace. Be precise: whoever answers it will not have your code open.

```
## Spec gap found during build

Where the code is:   <file:line, and what you were implementing>
Spec ids involved:   <fs-NN, AC-NN-n, INV-n, … — every id you checked>
What the spec says:  <quote, cited as file · anchor — or "silent", with the sections searched>
What the code needs: <the question, phrased so it has a decidable answer>
Why it could not be
  seen earlier:      <what only running code revealed>
Options, if any:     <A / B, with the user-visible consequence of each — not a recommendation
                      dressed as the only option>
Blocking?:           <yes: work stops here | no: what is proceeding meanwhile>
```

Then tell the user, in one line, exactly what to run in the source workspace:

```
{{AMEND_CMD}}
```

That runs the founder-answered scope test, writes an immutable amendment record and appends to
`amendment-log.md` — the locked files stay byte-identical. When it lands, the handoff kit in this
repo is regenerated and `amendment-log.md` here carries the answer.

## 5. While you wait

Do not implement the disputed behaviour "provisionally" behind a guess — that is the invented
decision the process exists to stop, and it gets harder to unwind with every file that depends on
it. Do implement everything the gap does not block, and leave the boundary visible:

- a failing or skipped test named for the open question, referencing the ids
- a comment at the call site naming the ids and stating that the behaviour is pending an amendment

Never edit `docs/product/` to record the answer locally. Those files are byte-frozen and hashed;
a local edit changes no decision and breaks the freshness check that protects everyone else.
