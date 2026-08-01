<!-- saas-idea-brainstorm:handoff v{{PLUGIN_VERSION}} — GENERATED, do not hand-edit.
     Regenerate: {{REGEN_CMD}} · Remove: delete .claude/rules/product-spec/ -->
# Product decisions in this repository are already made
{{DRAFT_BANNER}}
This repo contains both a validated product specification and the code that implements it. The
specification lives in `{{SPEC_ROOT}}/` and is **frozen** — it was argued, evidenced and locked
before implementation started.

- `{{SPEC_ROOT}}/{{PACK}}/` — what the product is, why, and the **cut list** of what was excluded
- `{{SPEC_ROOT}}/blueprint/` — exactly how, at the product level: feature specs, field-level
  schema, UX, API, integrations, NFRs, test plan, build plan
- `{{SPEC_ROOT}}/blueprint/amendment-log.md` — **read first when it exists**: current truth =
  locked blueprint **+** amendments

## The line

**Technical decisions are yours.** Language, framework, libraries, layering, naming inside the
code, algorithms, index choice, how you meet a stated budget — the spec does not touch these and
neither does this rule.

**Product decisions are not.** What a feature does and when it is done, field names and types,
limits, defaults, validation, user-visible copy, empty/error/loading states, state transitions,
retry and idempotency semantics, cancellation, retention duties, permission boundaries,
performance targets — all already decided, all written down. Look them up.

A question is a product question when the answer changes what a user sees, what they are promised,
what is stored about them, or when the system reports success.

## Instead of guessing

- **Resolve an id** (`fs-03`, `AC-03-2`, `INV-1`, `ST-order-2`, `CAP-01-1`, `EV-2`, `DR-1`,
  `DOD-4`…) with **`/{{SKILL_SPEC}} <id>`**, or `node {{LOOKUP}} <id>`. `{{INDEX}}` maps every id to
  its **defining** file and section — not to whichever file cites it first.
- **Hit something the spec does not answer?** Use **`/{{SKILL_GAP}}`** *before* deciding. Most gaps
  turn out to be answered elsewhere in the set; a real one is a finding worth raising, and building
  on an invented product decision is expensive to unwind once code depends on it.
- **Spec is wrong or silent on something in scope** → `/saas-idea-brainstorm:amend-blueprint`.
  Never edit a locked file: the bytes are the record of what was decided, and a hook blocks the
  write anyway.

Acceptance criteria are binary and are the test oracle. Never weaken one so a test passes — if the
criterion is wrong, that is an amendment, not an edit.

{{PRECEDENCE}}
