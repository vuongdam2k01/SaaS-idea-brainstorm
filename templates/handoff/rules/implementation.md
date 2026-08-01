---
paths:
{{SRC_PATHS}}
---
<!-- saas-idea-brainstorm:handoff v{{PLUGIN_VERSION}} — GENERATED, do not hand-edit. -->

# What is already decided about the code you are touching

Product behaviour in this repository is specified in `{{SPEC_ROOT}}/`, not decided here. Nothing
below prescribes how to build — only what is already settled and where it is written.

## Before writing behaviour, name what you are implementing

Every unit of product behaviour traces to a feature spec (`fs-NN`) and usually to specific
acceptance criteria (`AC-NN-n`). If you cannot name the id your code serves, one of three things
is true, and it is worth knowing which:

- you have not looked it up yet — `/{{SKILL_SPEC}} <id>`, or `{{INDEX}}`
- it is infrastructure with no product surface — fine, carry on
- it is unspecified product behaviour — stop, `/{{SKILL_GAP}}`

## The line you must not cross alone

Technical decisions are yours. Product decisions are already made, or must be escalated.

A question is a **product** question when the answer changes what a user sees, what they are
promised, what is stored about them, or when the system says an operation succeeded. Field names
and types, limits, defaults, validation rules, user-visible copy, empty/error/loading states,
state transitions, retry and idempotency semantics, cancellation behaviour, retention duties,
performance budgets, permission boundaries — all product, all specified.

A question is **technical** when the user cannot tell which way you went: libraries, layering,
naming inside the code, algorithms, index choice, how you meet a stated budget.

When the obvious technical answer would also settle a product question, that is a product
question wearing a disguise.

## Constraints that live outside the feature spec

Implementing one feature can violate a rule written somewhere else. Check these when your change
touches shared data or async work:

- `{{SPEC_ROOT}}/blueprint/interaction-map.md` — conflict domains name every writer of an entity;
  invariants (`INV-n`) must hold across features, not per feature; `JOB-n` rows fix async
  semantics (queued/running/cancelled/partial, second submit, disconnect, result lifetime)
- `{{SPEC_ROOT}}/blueprint/data-schema.md` — `ST-<entity>-n` transitions: every transition has an
  owner, and code that changes state outside a listed transition is a defect
- `{{SPEC_ROOT}}/blueprint/nfr-spec.md` — the authorization matrix and performance budgets
- `{{SPEC_ROOT}}/blueprint/blueprint-overview.md` — `bp:event-dictionary` is the only definition of
  each tracking event and its payload; emit exactly that shape

## Traceability

Name the ids you implemented in the commit message or PR body. It lets a reviewer check your code
against a written criterion instead of an impression, and it keeps definition-of-done coverage
countable.

## Do not build what was cut

`{{SPEC_ROOT}}/{{PACK}}/mvp-spec.md` carries the cut list. Adjacent-and-easy is exactly how a locked
scope stops shipping. A behaviour with no feature spec is not in this build.

{{PRECEDENCE}}
