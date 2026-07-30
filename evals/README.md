# evals/ — measuring the layer that cannot be made deterministic

Everything the plugin enforces with code is regression-tested in `tests/hook-tests.js`.
This directory exists for the part that **cannot** be: the interpretation layer.

Dogfood run #2 produced the finding this suite answers. The evidence ledger was clean —
17×B, 3×C, zero grade-D rows — and **seven of ten gate-F blockers were still fabrication**,
all of it in the prose that *interprets* the evidence rather than in the evidence. The
gatekeeper's own summary line:

> "There is no fabrication in the ledger's verbatim column. The fabrication risk in this
> pack lives in the interpretation layer, not the quote layer."

Only one thing guards that layer: the `gatekeeper` agent. It is **not deterministic**. So the
honest claim is not "the plugin prevents interpretation-layer fabrication" — it is *"the
gatekeeper caught it in run #2, at an unknown rate."* Replacing that unknown with a number is
what this suite is for, and it is the plugin's own philosophy applied to itself: measure, then
label according to the measurement.

## What a case is

Each case seeds **one known defect** into a minimal idea workspace and asks whether a fresh
gatekeeper reports it. A case passes when the finding is reported; the useful output is not
pass/fail on one run but the **catch rate over N runs**.

The three seeded defects are the three shapes that actually occurred:

| Fixture | Seeded defect | Run #2 original |
|---|---|---|
| `prescriptive-tier` | a tier-4 prospect whose "behaviour" is advice in the imperative | five of six tier-4 estimates were advice-givers |
| `derived-number` | a headline multiple that its own cited inputs do not produce, with the caveat dropped on promotion | the "~20×" figure (real means ≈32× and ≈48×; caveat present in the raw scan, stripped in the artifact) |
| `unledgered-claim` | a behavioural claim about a real person that never enters the ledger | P2/P4/P5/P6, ungraded and outside the balance check |

**Every fixture is built so the deterministic validators pass it.** That is the load-bearing
property, and `tests/hook-tests.js` asserts it: `validate-evidence-ledger.js`,
`validate-beachhead.js` and `verify-threshold-snapshot.js` must all exit 0 on every fixture.
If a validator started catching one, the fixture would no longer be measuring the
interpretation layer — it would be measuring code, and the number would silently become
meaningless. A fixture that fails that assertion is a broken fixture, not a passing plugin.

## Running it

```bash
claude plugin eval saas-idea-brainstorm@saas-idea-brainstorm --case 'gatekeeper-*' --runs 10
```

**Caveat, stated because it matters:** `claude plugin eval` is in early access and was gated in
the environment where this suite was authored, so the `case.yaml` files here follow the
documented shape (`evals/**/case.yaml`, graders under `graders/`) but have **never been executed
by the runner**. Treat them as unverified until someone runs them. The fixtures themselves and
their validator-transparency property *are* verified, by the test suite.

For a path that does not depend on the gated feature:

```bash
node scripts/run-gatekeeper-eval.js --runs 10 --json evals/results/catch-rate.json
```

That harness drives the gatekeeper over each fixture with `claude -p`, greps the report for the
seeded defect, and prints a catch rate per fixture. It spends real tokens — one gatekeeper run
per fixture per repetition — so start with `--runs 3` before asking for 10.

## Reading the result

- **Catch rate near 1.0** — record it in `plugin/failure-modes.md` §1 and say so in the README.
  It is still a rate, not a guarantee; the map should read `gatekeeper (measured 0.9x)`.
- **Catch rate below ~0.8** — the interpretation layer is not defended, whatever the checklist
  says. The fix is not a sterner prompt: it is moving as much of the shape as possible into a
  script, the way the tier check moved into `validate-beachhead.js`.
- **A defect nobody catches at all** — the highest-value finding this suite can produce. Add it
  to the registry with detector `nothing`.

Do not average the three fixtures into one score. They fail differently and the point is to
learn *which* shape leaks.
