<!-- saas-idea-brainstorm:handoff v{{PLUGIN_VERSION}} — GENERATED, do not hand-edit.
     Regenerate with: {{REGEN_CMD}}
     Claude Code reads CLAUDE.md and not AGENTS.md, so this file imports the shared
     contract and adds the Claude-specific parts. To add your own standing instructions,
     put them in a file of your own and import it below — anything written directly in
     this file is lost on regeneration. -->
@AGENTS.md

## Claude Code specifics

The product specification in `{{SPEC_ROOT}}/` is frozen. Three helpers in this repo exist so you
never have to guess at it:

- **`/{{SKILL_SPEC}} <id>`** — resolve any spec id (`fs-03`, `AC-03-2`, `INV-1`, `ST-order-2`, `CAP-01-1`,
  `EV-2`, `DOD-4`, `DR-1`…) to its file, section and text. Use it the moment an id appears in a
  spec, a test name, a comment or a task description.
- **`/{{SKILL_GAP}}`** — use when the spec does not answer an in-scope question. It triages
  product-vs-technical, checks the places gaps usually hide, and drafts the amendment request for
  the source workspace. Reach for it *before* deciding something yourself.
- **`.claude/rules/`** — the id vocabulary loads automatically when you open a file under
  `{{SPEC_ROOT}}/`, and the test-authority rule when you open a test file. You do not need to read
  the rules directory yourself.

Two things worth doing without being asked:

- When you implement product behaviour, name the ids in the commit message or PR body (Rule 4).
- When you notice the spec is silent, contradictory or wrong, say so explicitly in your reply
  rather than resolving it silently — even if the technically obvious choice seems safe.

Use plan mode for work that spans more than one feature spec: the interaction map
(`{{SPEC_ROOT}}/blueprint/interaction-map.md`, when present) constrains how features that write
the same data may combine, and those constraints are easy to violate one file at a time.
