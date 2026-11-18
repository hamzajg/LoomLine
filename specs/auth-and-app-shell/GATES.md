# Gates: auth-and-app-shell

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
- Check: file:specs/auth-and-app-shell/DECISION-REVIEW.md
- Why: Every wave inherits the feature's architecture choices (identity store,
  session mechanism, authorization model, shell mechanism). The challenger
  review — alternatives, tradeoffs, testability — must exist before wave
  planning locks the design in.

## G2 — Identity, hashing and session mechanism recorded

- Before: wave:2
- Type: decision
- Owner: architect
- Resolver: human
- Blocking: yes
- Check: file:specs/auth-and-app-shell/ADR-0002-identity.md
- Why: AC-5 to AC-8 depend on how credentials are stored and how the session is
  carried; both are one-way doors for real user data and must be recorded and
  accepted before authentication code lands.

## G3 — Role access matrix agreed

- Before: wave:3
- Type: decision
- Owner: product-owner
- Resolver: human
- Blocking: yes
- Check: file:specs/auth-and-app-shell/ACCESS-MATRIX.md
- Why: AC-9 to AC-12 depend on which roles exist and exactly which sections and
  actions each grants; the single access map (D4) is derived from this.

## G4 — Bootstrap administrator and demo credentials seeded

- Before: wave:2
- Type: data
- Owner: tech-lead
- Resolver: agent
- Blocking: yes
- Check: file:specs/auth-and-app-shell/SEED-DATA.md
- Why: the shell and sign-in demo must not stall on an empty user table; the
  first administrator has to exist without a manual database edit.

## G5 — Demo environment available

- Before: validate
- Type: technical
- Owner: tech-lead
- Resolver: agent
- Blocking: no
- Check: command:docker compose config
- Why: the acceptance demo needs the application and database to start from the
  repository.
