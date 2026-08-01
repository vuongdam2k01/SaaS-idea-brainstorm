---
paths:
{{TEST_PATHS}}
---
<!-- saas-idea-brainstorm:handoff v{{PLUGIN_VERSION}} — GENERATED, do not hand-edit. -->

# Tests answer to the spec, not the other way round

## Acceptance criteria are the oracle

`AC-NN-n` criteria in `docs/product/blueprint/feature-specs/` are written binary — given/when/then
with no room for interpretation. A test asserts the criterion **as written**. Name the id in the
test name or a comment so the mapping survives refactoring:

```
test("AC-03-2: invite to an address already on the team is rejected with the duplicate message")
```

**Never weaken a criterion to make a test pass.** A red test against a correct criterion is
information; a green test against a softened criterion is a recorded lie, and it is the exact
failure the spec set exists to prevent. If the criterion itself is wrong, that is a spec defect →
`/spec-gap` → amendment in the source workspace. Not an edit here.

The same applies to the copy in `bp:states` and `bp:fields`: user-visible strings are specified,
so assert the specified string rather than a substring that happens to pass today.

## What must be covered regardless of what you are building

`docs/product/blueprint/test-plan.md` is the authority. It binds every definition-of-done item,
every minimum-service-promise commitment, every `INV-n` invariant and every `EV-n` eval to a
scenario, and it carries mandatory scenarios that are not tied to any one feature — typically
cross-tenant isolation, payment failure paths, and backup restore.

For work involving a model or other non-deterministic subsystem, the spec states a determinism
strategy per capability (`CAP-NN-n`) and binds acceptance to an eval (`EV-n`) with a threshold.
Assert against the eval and its threshold; do not substitute a hand-written example that happens
to be stable.

## Async and multi-writer behaviour

`JOB-n` rows in `docs/product/blueprint/interaction-map.md` specify cancellation, second submit,
disconnect, partial results and result lifetime. These are behaviours with acceptance criteria,
not implementation details — they get tests. So do the `ST-<entity>-n` transitions: a test that
an unlisted transition is refused is worth more than one that a listed transition works.
