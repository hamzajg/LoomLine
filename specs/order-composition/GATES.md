# Gates: order-composition

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

## G1 — Design decisions challenged

- Before: plan
- Type: artifact
- Owner: agent
- Resolver: agent
- Blocking: yes
- Check: file:specs/order-composition/DECISION-REVIEW.md
- Why: D1–D5 (replace-set contract, optional-but-reconciling lines, status
  lock, reference tables, size-type compatibility) are one-way doors every
  wave inherits.

## G2 — Reference data seeded

- Before: wave:1
- Type: data
- Owner: product-owner
- Resolver: agent
- Blocking: yes
- Check: file:specs/order-composition/SEED-DATA.md
- Why: quantity lines need colours and sizes; the demo must not stall on
  empty lookups.

## G3 — Composition rules agreed

- Before: wave:1
- Type: decision
- Owner: product-owner
- Resolver: human
- Blocking: yes
- Check: file:specs/order-composition/COMPOSITION-RULES.md
- Why: the sum-reconciliation rule, the DRAFT/RELEASED edit window and the
  size-type compatibility check are product decisions the owner must accept
  before wave 1 locks them into code.

## G4 — Demo environment available

- Before: validate
- Type: technical
- Owner: tech-lead
- Resolver: agent
- Blocking: no
- Check: command:docker compose config
- Why: the acceptance demo needs the application and database to start from
  the repo.
