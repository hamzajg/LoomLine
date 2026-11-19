# Gates: article-catalogue

> Preconditions for phase transitions. Each `## G<n> — <title>` block is a
> gate. `ship_loop` refuses to advance past a phase while a blocking gate is
> pending. Definitions live here; status and evidence live in `LOOP.md`.
>
> Gate phases: `spec` (before writing the spec), `plan` (before planning
> waves), `wave:<n>` (before starting wave n), `validate` (before validation),
> `finish` (before closing the feature).
>
> Gate types: decision | artifact | external | technical | quality | data.
> Resolver: `human` (needs a person to decide/provide something) or `agent`
> (the agent can satisfy it). Check: `manual`, `file:<repo-relative-path>`, or
> `command:<exact command>` (the agent runs it and records the output as
> evidence — the oracle never executes it).

<!-- Example (indented so it is not parsed):
  ## G1 — Domain glossary agreed
  - Before: spec
  - Type: decision
  - Owner: product-owner
  - Resolver: human
  - Blocking: yes
  - Check: manual
  - Why: AC-2 and AC-3 use domain terms that must be defined once.
-->

## G1 — Design decisions challenged
- Before: plan
- Type: artifact
- Owner: agent
- Resolver: agent
- Blocking: yes
- Check: file:specs/article-catalogue/DECISION-REVIEW.md
- Why: Every wave inherits the feature's architecture choices (persistence
  model, consistency, module boundaries, stateless vs stateful). The
  challenger review — alternatives, tradeoffs, testability — must exist
  before wave planning locks the design in. A human may waive this gate
  for genuinely trivial features.

## G2 — Reference data seeded

- Before: wave:1
- Type: data
- Owner: product-owner
- Resolver: agent
- Blocking: yes
- Check: file:api/src/main/resources/db/seed/R__seed_reference_data.sql
- Why: catalogue CRUD needs existing clients, articles, colours and sizes
  to validate against; the demo must not stall on empty lookups.

## G3 — Catalogue rules agreed

- Before: wave:1
- Type: decision
- Owner: product-owner
- Resolver: human
- Blocking: yes
- Check: file:specs/article-catalogue/CATALOGUE-RULES.md
- Why: uniqueness, size-type validation and the in-use delete rule are
  product decisions the owner must accept before wave 1 locks them into
  code.

## G4 — Demo environment available

- Before: validate
- Type: technical
- Owner: tech-lead
- Resolver: agent
- Blocking: no
- Check: command:docker compose config
- Why: the acceptance demo needs the application and database to start from
  the repo.
