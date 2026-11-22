# Gates: stock-and-materials

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
> (the agent can satisfy it). Check: `manual`, `file:<repo-relative-path>`,
> `section:<repo-relative-path>#<heading>` (the named `##` section must be
> filled — used for SPEC.md sections that need their own contract), or
> `command:<exact command>` (the agent runs it and records the output as
> evidence — the oracle never executes it).

## G0 — Value contract filled
- Before: plan
- Type: artifact
- Owner: agent
- Resolver: agent
- Blocking: yes
- Check: file:specs/stock-and-materials/SPEC.md
- Why: D017 — value is the outcome, not the output. Problem, users, baseline,
  measurable target, economic hypothesis and review owner must be on record
  before wave planning commits the features.

## G1 — Design decisions challenged
- Before: plan
- Type: artifact
- Owner: agent
- Resolver: agent
- Blocking: yes
- Check: file:specs/stock-and-materials/DECISION-REVIEW.md
- Why: Every wave inherits the feature's architecture choices (derived level
  vs mutable balance, movement model, material boundary, location scope, and
  the REST/OpenAPI contract). The challenger review must exist before wave
  planning locks the design in. A human may waive this gate for genuinely
  trivial features.

## G2 — Domain model captured
- Before: plan
- Type: artifact
- Owner: agent
- Resolver: agent
- Blocking: yes
- Check: file:specs/stock-and-materials/DOMAIN.md
- Why: D019 — waves inherit the ubiquitous language, bounded contexts,
  aggregates and invariants declared here. The file must name its tier
  (simple|standard|domain-heavy) and fill every section; `standard` must name
  the new inventory context and its invariants explicitly.

## G3 — Experience contract filled
- Before: plan
- Type: artifact
- Owner: agent
- Resolver: agent
- Blocking: yes
- Check: section:specs/stock-and-materials/SPEC.md#Experience
- Why: D019 — the stock screens are user-facing, so the primary journey, edge
  states, UX bar and accessibility notes must be filled before planning.

## G4 — Stock rules agreed
- Before: wave:1
- Type: decision
- Owner: product-owner
- Resolver: human
- Blocking: yes
- Check: manual
- Why: Movement semantics are business rules, not implementation details:
  whether ISSUE and negative ADJUSTMENT may drive a balance below zero,
  whether ADJUSTMENT requires a reason for both directions, and whether
  inactive materials reject new movements. SPEC.md records the proposed rules;
  a human must confirm or amend them before wave 1 codes them.

## G5 — Stock access matrix agreed
- Before: wave:1
- Type: decision
- Owner: product-owner
- Resolver: human
- Blocking: yes
- Check: manual
- Why: Today `AccessMap` gives administrators manage rights and
  production-planner/production-supervisor only `stock.view`. The feature needs
  an explicit decision: admin-only manage for v1, or grant `production-planner`
  `stock.manage`, possibly via a new stock role. Authorization and UI controls
  depend on this answer.

## G6 — Seed data defined
- Before: plan
- Type: data
- Owner: agent
- Resolver: agent
- Blocking: yes
- Check: file:specs/stock-and-materials/SEED-DATA.md
- Why: Tests and demos need stable material codes, kinds, units, supplier
  references, and stock locations. The seed contract must exist before wave
  planning so scenarios do not invent identifiers ad hoc.
