# Gates: production-routing

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
- Check: file:specs/production-routing/DECISION-REVIEW.md
- Why: D1–D6 (replace-set sheet, single duration, seeded read-only reference
  data, lock boundary, server-assigned positions, reused grants) are inherited
  by every wave and constrain the future shop-floor and equipment features.

## G2 — Reference data seeded

- Before: wave:1
- Type: data
- Owner: product-owner
- Resolver: agent
- Blocking: yes
- Check: file:specs/production-routing/SEED-DATA.md
- Why: routing steps need phases and machines; the demo and tests must not
  stall on empty pickers.

## G3 — Routing rules agreed

- Before: wave:1
- Type: decision
- Owner: product-owner
- Resolver: human
- Blocking: yes
- Check: file:specs/production-routing/ROUTING-RULES.md
- Why: the single duration, the DRAFT/RELEASED edit window and the seeded
  read-only machine set are product decisions the owner must accept before
  wave 1 locks them into code.

## G4 — Demo environment available

- Before: validate
- Type: technical
- Owner: tech-lead
- Resolver: agent
- Blocking: no
- Check: command:docker compose config
- Why: the acceptance demo needs the application and database to start from
  the repository.
