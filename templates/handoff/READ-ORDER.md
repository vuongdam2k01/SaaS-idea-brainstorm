<!-- saas-idea-brainstorm:handoff v{{PLUGIN_VERSION}} — GENERATED, do not hand-edit. -->
# `{{SPEC_ROOT}}/` — what each file is, and the order to read it
{{DRAFT_BANNER}}
Generated {{GENERATED}} from `{{SOURCE}}` · pack class **{{PACK_CLASS}}** · amendments through
**{{AMENDMENTS_THROUGH}}** · {{FILE_COUNT}} files · {{ID_COUNT}} indexed ids.

Everything here is **read-only**. It is the specification this repository owes, not notes about
it. Corrections go through the amendment process described in `AGENTS.md`, never through an edit.

## Order

{{READ_ORDER_TABLE}}

You do not read the whole set before starting. You read 1–3, then the feature spec you are
implementing, then whatever that spec's constraints point at.

## Every file

{{FILE_TABLE}}

## Which file answers which kind of question

| your question | file |
|---|---|
| Is this in scope at all? What was cut? | `{{PACK}}/mvp-spec.md` |
| What does "done" mean for this product? | `{{PACK}}/definition-of-done.md` |
| What exactly must this feature do, and when is it correct? | `blueprint/feature-specs/fs-NN-*.md` |
| What is this field called, what type, what limit, what happens on invalid input? | `blueprint/data-schema.md` + the feature spec's `bp:fields` |
| What states can this record be in, and who may move it between them? | `blueprint/data-schema.md` → `bp:state-machines` |
| Two features write the same record — what is allowed? | `blueprint/interaction-map.md` |
| What happens if this async job is cancelled / submitted twice / disconnected? | `blueprint/interaction-map.md` → `bp:jobs` |
| What does the screen show while loading, on error, when empty? | the feature spec's `bp:states` + `blueprint/ux-spec.md` |
| What is the exact wording the user sees? | the feature spec (`bp:fields`, `bp:states`) and `blueprint/ux-spec.md` → `bp:copy` |
| What is the request/response shape, the auth, the error codes? | `blueprint/api-contract.md` |
| How does this third-party provider fail, and what then? | `blueprint/integration-specs.md` |
| Who is allowed to do this? How fast must it be? | `blueprint/nfr-spec.md` |
| What must be tested, and what counts as passing? | `blueprint/test-plan.md` |
| What order should this be built in? | `blueprint/build-plan.md` |
| What does this tracking event look like? | `blueprint/blueprint-overview.md` → `bp:event-dictionary` |
| Was this decision left to me? | `blueprint/blueprint-overview.md` → `bp:decisions` (`DR-n`) |
| Has this already been changed since the lock? | `blueprint/amendment-log.md` |

## Id lookup

`spec-index.json` maps every id to its defining file and section:

```bash
node {{LOOKUP}} AC-03-2
node {{LOOKUP}} --list fs
node {{LOOKUP}} --grep invite
```

In a Claude Code session, `/{{SKILL_SPEC}} <id>` does the same thing and reads the surrounding constraints
for you.
