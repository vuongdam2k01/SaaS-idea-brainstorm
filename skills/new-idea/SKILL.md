---
name: new-idea
description: Start validating a new SaaS idea - creates the idea workspace and begins stage 0 framing.
disable-model-invocation: true
argument-hint: "[raw idea description]"
---

Start the validation pipeline for a new SaaS idea.

Raw idea from the user: $ARGUMENTS

## Steps

1. Load the `method-rules` skill (Skill tool) — its rules govern everything that follows. Then load the `method-rules-state-schema` skill (Skill tool) — never read schema files off disk; they ship as skills precisely so a marketplace install has no filesystem dependency outside your workspace.
2. If `$ARGUMENTS` is empty, ask the user for the raw idea (one message is enough — vague is fine, clarifying it IS the pipeline's job).
3. Derive a short kebab-case slug **from the idea's content** — never from the working directory's name. If the two would coincide, say so and confirm, then record in `README.md` and `idea-brief.md` that the slug is a folder handle and **not** a product name or a positioning decision. (Run #3 silently adopted the repo folder name as the slug and carried an unmade branding decision into every artifact until the founder caught it.) If `ideas/<slug>/` already exists in the current workspace, ask whether to resume it (then use the status skill) or pick a new slug.
4. Create `ideas/<slug>/` with:
   - `state.json` in the **exact v1.3 shape from the `method-rules-state-schema` skill** (defaults; `mode: "analysis"`, `market_shape: "single-sided"`, `sides: []` — stage 0.3b re-classifies with the founder; never pre-assign a shape, `active: ["0.0"]`; `cycles: [{"id":"C1","status":"framing","parent":null,"state":null}]`, `active_cycle: "C1"`, `maintenance`/`health_criteria`/`validation_runs` at their empty defaults — no `current_stage` field; that is the retired v1.0 shape).
   - `idea-brief.md` — the foundational artifact (template in stage-0-framing skill): the raw idea **verbatim and immutable**, plus a first-pass refined articulation (what it is / for whom / how it's imagined to work / why now / constraints / founder's definition of success) — every refined section labeled `[GUESS]` until stage 0 elicitation firms it up. This is the living spine of the idea: the vision being tested.
   - `README.md` — two lines: pointer to idea-brief.md, and the creation date.
   - `decision-log.md` — empty append-only journal (header row only; format in method-rules artifact-schema). All gate verdicts, pivots, threshold revisions, and spends land here for the idea's whole life.
   - `founder-charter.md` — the living intent record (template in stage-0-framing skill): seed the Invariants and Definition-of-success sections from this first exchange (everything model-phrased starts `[INFERRED]`). From now on, every choice the user makes against a recommendation, every veto, and every strong preference gets captured here at the moment it happens — this file is what the build phase will consult for every question the MVP pack doesn't answer.
   - `private/` directory containing **its own `.gitignore` with exactly two lines: `*` and `!.gitignore`** — this protects sensitive material (transcripts, real names, payment identities) regardless of the user's repo configuration. Also create `private/contacts.md` (empty pseudonym map: `| Pid | real name | contact | notes |`). All public artifacts refer to people as P1, P2, …
5. Copy `${user_config.ads_budget_cap_usd}` (if set) into `state.budget.cap_usd`.
6. Ask the user two setup questions (AskUserQuestion): checkpoint preference (approve each gate vs auto-continue — note auto-continue never covers outward actions) and whether to run setup-audit now (recommended but skippable — the pipeline runs fine without any integration).
7. Record their answers in `state.json` (`auto_continue`; invoke the `setup-audit` skill if they opted in).
8. Invoke the `stage-0-framing` skill to begin framing immediately. Do not summarize the pipeline to the user first — start doing 0.0/0.1 with them; the pipeline explains itself through work.
