# Spec: Order intake and tracking

> Spec-driven development artifact. This file is the contract: implementation
> is done when every acceptance criterion maps to a scenario in
> `EXAMPLES.feature` and every scenario has a passing check.

## Problem

Production planners have no trustworthy place to record a production order
and follow it through the shop floor. In the legacy tool, order entry is the
richest screen but it depends on an unauthenticated API, several reference
lists are empty, and order states are stored without enforced transitions.
The result is duplicated or lost orders and no reliable answer to "what is
ready to produce?" This feature establishes the core daily loop for the new
product.

## Users

- **Production planner** (primary): creates orders and drives their status.
- **Production supervisor** (secondary): inspects orders and quantities
  before releasing work.
- **Administrator** (secondary): maintains the minimal client/article
  reference data the order form needs.

## Outcome hypothesis

- Expected user outcome: a planner can capture an order in one flow and find
  or advance it later without a spreadsheet.
- Opportunity evidence: the order form is the richest workflow observed in
  the legacy system; no current product exists. The claim that this is the
  highest-frequency task is an **assumption** to validate with the first
  users.
- Signal: median time to create an order and the share of orders with a valid,
  non-stale status. Baseline is unknown; no numeric target is asserted.
- Follow-up owner/date: product owner, four weeks after first release.

## Scope (in)

- Create a production order: reference, article, client, quantity, due date.
- Enforce required fields, positive quantity, and unique reference.
- List orders and filter by status and reference.
- Open an order detail showing its fields and current status.
- Advance an order through an explicit status lifecycle.
- Persist orders and status changes transactionally; timestamp status changes.

## Scope (out)

- Routing sheets / operation gammas (follow-on feature).
- External production, subcontracting, and preparation lines.
- Dual-currency costing and selling prices.
- File attachments.
- Authentication, authorisation, and multi-tenant access (follow-on feature).
- Stock, equipment, quality, and HR modules.
- Full article catalogue (colour/size/fabric links); this feature keeps only
  the minimal reference data an order needs.

## Acceptance criteria

<!-- Scenario(s): use scenario names verbatim from EXAMPLES.feature and/or
     @w<N> tags — ship_validate resolves both for traceability. -->

| # | Criterion | Scenario(s) |
|---|-----------|-------------|
| 1 | A valid order is saved with status DRAFT and can be retrieved by its reference | @w1 |
| 2 | A duplicate order reference is rejected and no second order is stored | @w1 |
| 3 | An order with a non-positive quantity is rejected and nothing is stored | @w1 |
| 4 | The order list can be filtered by status | @w2 |
| 5 | An order detail shows reference, article, client, quantity, due date and status | @w2 |
| 6 | An order advances through the allowed lifecycle and the change is timestamped | @w3 |
| 7 | An invalid status transition is rejected and the status is unchanged | @w3 |
| 8 | A terminal order (COMPLETED/CANCELLED) cannot be transitioned further | @w3 |
| 9 | An order missing a required field is rejected and the missing field is identified | @w1 |
| 10 | The order list can be searched by reference | @w2 |

## Decisions

- **D1 — Stack.** Quarkus 3.40 (Kotlin, Gradle 9, JDK 25) REST backend,
  React + TypeScript (Vite) frontend, PostgreSQL 16, Flyway migrations.
  Justification: the domain is transactional and relational; Quarkus gives a
  fast-starting, container-friendly service with first-class Hibernate ORM
  and Flyway support, Kotlin adds null-safety and concise domain modelling,
  and Gradle 9 / JDK 25 are supported and available in the workspace (JDK 25
  at `/usr/lib/jvm/java-25-openjdk-amd64`). React replaces the legacy
  AngularJS SPA with a maintainable component model. Alternatives considered:
  Spring Boot 3 + Java 17 (the earlier proposal), .NET 10 + React, NestJS +
  React, and server-rendered Spring MVC + Thymeleaf (tradeoffs in
  `DECISION-REVIEW.md`). Owner: tech lead (stack proposed), product owner
  (accepted 2026-11-18 with the Quarkus/Kotlin/Gradle/JDK 25 amendment).
  Date: 2026-11-18. Revisit if the team cannot staff Kotlin/Quarkus, the first
  demo exceeds two weeks, or the authentication feature cannot follow within
  one wave. (ADR-style; one-way door — reviewed under gate G1, recorded in
  `ADR-0001-stack.md`.)
- **D2 — Persistence.** Single relational schema with Flyway migrations and
  server-side transactions; no event sourcing for v1. Order status history is
  a table, not derived from events.
- **D3 — Status model.** Status is an explicit enum with a fixed transition
  table: `DRAFT → RELEASED | CANCELLED`, `RELEASED → IN_PROGRESS | CANCELLED`,
  `IN_PROGRESS → COMPLETED | CANCELLED`; `COMPLETED` and `CANCELLED` are
  terminal. Transitions are validated server-side, not in the client.
- **D4 — Reference data ownership.** For this feature, minimal `Client` and
  `Article` records are owned here and seeded through the data gate (G2).
  The catalogue feature will take over their full lifecycle. Orders store
  foreign keys, never free-text names.
- **D5 — Public contract.** REST under `/api/orders`; orders are addressed by
  server-generated UUIDs; dates are ISO-8601; errors use a stable
  `{code, message, fieldErrors?}` shape.
- **D6 — Security posture.** This feature is scoped to a trusted internal
  deployment. Authentication/authorisation is a follow-on feature; until it
  lands, the API must not be exposed outside the internal network. This is a
  known one-way-door risk and is in scope for the G1 review.
- **D7 — Architecture and test seams.** Modular monolith, packaged by feature
  (`order`, `reference`), with a framework-free Kotlin domain layer behind ports
  and adapters; persistence uses Hibernate ORM with Panache, Flyway owns the
  schema, and `Clock` / id generation are injected so tests are deterministic.
  Quarkus runs on the JVM (no native image in v1). Test strategy: table-driven
  unit tests for the transition table, PostgreSQL integration tests with
  QuarkusTest + Testcontainers, and one contract test for the error shape.
  Migrations are forward-only and additive; rollback is a redeploy of the
  previous build.
- **Review outcome.** `/challenge-decision` returned **REVISE** (advisory):
  alternatives, ownership/date, aggregate boundaries, test seams, and a
  revisit trigger are now recorded here. The backend was amended from Spring
  Boot/Java 17 to Quarkus/Kotlin/Gradle/JDK 25 by the product owner on
  2026-11-18; the decision was re-challenged after the amendment
  (`DECISION-REVIEW.md`).
