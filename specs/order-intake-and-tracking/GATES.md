# Gates: Order intake and tracking

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
- Type: decision
- Owner: architect
- Resolver: agent
- Blocking: yes
- Check: file:specs/order-intake-and-tracking/DECISION-REVIEW.md
- Why: D1 (stack), D3 (status model) and D6 (security posture) are one-way doors every wave inherits.

## G2 — Reference data seeded

- Before: wave:1
- Type: data
- Owner: product-owner
- Resolver: agent
- Blocking: yes
- Check: file:specs/order-intake-and-tracking/SEED-DATA.md
- Why: an order needs a client and an article; the demo must not stall on empty lookups.

## G3 — Stack and scaffold approved

- Before: wave:1
- Type: decision
- Owner: tech-lead
- Resolver: human
- Blocking: yes
- Check: file:specs/order-intake-and-tracking/ADR-0001-stack.md
- Why: the first code lands in this phase; the stack choice must be recorded and accepted.

## G4 — Status transition rules agreed

- Before: wave:3
- Type: decision
- Owner: product-owner
- Resolver: human
- Blocking: yes
- Check: file:specs/order-intake-and-tracking/STATUS-RULES.md
- Why: AC-6, AC-7 and AC-8 depend on the exact lifecycle and terminal states.

## G5 — Demo environment available

- Before: validate
- Type: technical
- Owner: tech-lead
- Resolver: agent
- Blocking: no
- Check: command:docker compose config
- Why: the acceptance demo needs the application and database to start from the repo.
