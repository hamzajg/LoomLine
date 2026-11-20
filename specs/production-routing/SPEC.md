# Spec: production-routing

> Spec-driven development artifact. This file is the contract: implementation
> is done when every acceptance criterion maps to a scenario in
> `EXAMPLES.feature` and every scenario has a passing check.

## Problem

An order can now be created, tracked through its lifecycle and broken down by
colour and size — but the shop floor still has no instruction sheet. There is
no ordered list of operations, no phase grouping, no machine assignment and no
time estimate per step. A `RELEASED` order therefore cannot be sequenced,
staffed or timed, and a supervisor opening the order has nothing to work from.

The legacy system solved this with two routing sheets per order — an assembly
routing (`GammeMontageOF`) and an operation routing (`GammeOperatoire`) — whose
lines carry a phase, an operation, a machine and time values. This feature
brings one routing sheet to LoomLine: the ordered steps that turn a released
order into work that can be executed and measured.

## Users

- **Production planner** — authors and corrects the routing sheet while the
  order is still plannable.
- **Production supervisor** — reads the routing sheet to sequence and staff
  the work.
- **Administrator** — same rights as the planner on the production section.

## Outcome hypothesis

- Expected user outcome: every order that reaches `IN_PROGRESS` carries an
  explicit, ordered routing sheet that names each step, its phase, its machine
  and its planned duration.
- Opportunity evidence: the legacy order screen has dedicated routing sheets
  (`GammeMontageOF`, `GammeOperatoire`) with columns `# | Libellé | Fq | Phase
  | P1 | P2 | Machine | Tps | TpH | TpR`; without a routing sheet an order
  cannot be scheduled or time-tracked.
- Signal: share of orders reaching `IN_PROGRESS` with at least one routing
  step; baseline 0% (feature does not exist yet).
- Follow-up owner/date: product owner, at the next planning review.

## Scope (in)

- Phase reference data (code + label), seeded for the demo and exposed
  read-only.
- Machine reference data (reference + label + active flag), seeded for the
  demo and exposed read-only; managing machines ships with the equipment
  feature.
- Routing steps on an order: ordered position, label, phase, optional
  machine, repetitions and planned minutes.
- Replace-set API: the client submits the complete ordered list; the server
  validates and stores it atomically, assigning positions `1..n` from the
  submitted order.
- Validation: non-blank label, known phase, known and active machine, positive
  repetitions, positive planned minutes.
- Edit window: routing is editable while the order is `DRAFT` or `RELEASED`;
  locked from `IN_PROGRESS` onward with `409 ROUTING_LOCKED`.
- Order detail shows the routing sheet; planners can edit it, supervisors see
  it read-only.

## Scope (out)

- Execution and time capture (start/finish per step, actual minutes) — a later
  shop-floor feature builds on this sheet.
- Machine management (create/edit/repair) and machine states — equipment
  feature.
- Operation catalogue / reusable operation templates and copying a routing
  from an article model — revisit after one routing loop is proven.
- Phase management UI (phases are seeded reference data in this feature).
- External preparation and subcontracting, files, need sheets, costs.
- Quantity or colour/size coupling: routing steps are per-unit instructions
  and do not reconcile against the order quantity.

## Acceptance criteria

| # | Criterion | Scenario(s) |
|---|-----------|-------------|
| 1 | A planner can set an ordered routing sheet on a plannable order | Set the routing sheet of a draft order, Read the routing sheet in submitted order |
| 2 | An empty list clears the routing sheet | Clear the routing sheet of an order |
| 3 | Invalid steps are rejected with typed field errors and nothing is stored | Reject a step with an unknown phase or machine, Reject a step with an invalid label, duration or repetitions |
| 4 | Routing locks once production starts | Reject routing changes on an order in progress |
| 5 | Planners edit routing from the order screen and viewers see it read-only | Edit routing steps on the order screen, View routing without manage rights |
| 6 | A locked order shows its routing without edit controls | Show a locked routing sheet on an order in progress |

## Decisions

### D1 — The routing sheet is a replace-set ordered list

- **Context & forces:** a route is a sequence whose meaning depends on order
  and completeness. Per-step CRUD invites intermediate invalid states and
  makes "move step 3 before step 2" a multi-request dance. The composition
  feature already established replace-set as the write contract for
  aggregate-internal collections.
- **Options considered:**
  1. Per-step REST resources (`POST/PUT/DELETE /routing/steps/{n}`) — simple
     single-step edits, but whole-sheet invariants and ordering become
     multi-request and racy.
  2. Replace-set (`PUT /api/orders/{id}/routing`) — one atomic write, the
     client owns the desired order.
  3. Patch/diff API — smallest payloads, most client and server complexity.
- **Decision & why:** option 2. The whole sheet is the unit of intent; atomic
  validation is worth the larger payload for a sheet of a few dozen rows.
- **Consequences:** positive — no intermediate states, ordering is explicit,
  lock and validation live in one use case. Negative — a client must resend
  the full sheet on every edit; concurrent editors overwrite each other
  (accepted for v1; order-level version can be added later).
- **Reversibility:** two-way door. A per-step API can be layered on the same
  table without migration.

### D2 — One planned duration per step, not the legacy Tps/TpH/TpR triple

- **Context & forces:** the legacy routing line carries three time values
  (`Tps`, `TpH`, `TpR`) whose semantics are *inferred*, not documented. Porting
  three opaque integers would force us to invent validation for values nobody
  can define, and would let planners enter three numbers that contradict each
  other.
- **Options considered:**
  1. Port all three legacy columns verbatim — faithful, but the fields have no
     agreed meaning and no consumer yet.
  2. One `minutes` field per step (planned duration for one unit) — explicit,
     testable, sufficient for sequencing and load estimates.
  3. `minutes` + `setup_minutes` — closer to real shop-floor timing, but setup
     semantics are unverified and better decided with time capture.
- **Decision & why:** option 2. One duration the product owner can explain is
  worth more than three nobody can; the shop-floor feature will add actuals
  and can split the estimate with evidence.
- **Consequences:** positive — no invented semantics, simple validation,
  reportable load. Negative — batch/setup time is not modelled yet; estimates
  are optimistic for small batches.
- **Reversibility:** two-way door. Adding `setup_minutes` later is an additive
  migration and an optional request field.

### D3 — Phases and machines are seeded, read-only reference data here

- **Context & forces:** routing needs phases and machines to attach to. The
  legacy system has parameter screens for both; the equipment feature is the
  natural owner of machine management, and phase management is a thin
  catalogue concern.
- **Options considered:**
  1. Build machine and phase masters in this feature — complete, but grows the
     scope into the equipment domain.
  2. Seed both, expose read endpoints, defer management — keeps this feature
     about routing.
  3. Free-text phase and machine labels on the step — no reference integrity,
     no grouping or load reporting.
- **Decision & why:** option 2. Routing gains referential integrity without
  taking ownership of the equipment catalogue; the demo is never blocked
  because the seed ships with the repo.
- **Consequences:** positive — small surface, stable joins, later masters slot
  in. Negative — a planner cannot route a brand-new machine until the
  equipment feature lands; the seeded set must cover the demo.
- **Reversibility:** two-way door. Adding manage endpoints and permissions
  later does not change the routing schema.

### D4 — Routing locks at the same boundary as composition

- **Context & forces:** like the colour/size breakdown, the routing sheet is a
  planning input. Once work is `IN_PROGRESS`, changing the steps would
  invalidate whatever the floor is executing and (soon) the time recorded
  against each step.
- **Options considered:**
  1. Lock at `IN_PROGRESS`, mirroring composition — one boundary to learn.
  2. Allow edits until `COMPLETED`, with an audit trail — flexible, but breaks
     the meaning of recorded execution.
  3. Lock at `RELEASED` — safest, but prevents correcting a route after
     release, which planners legitimately need before work starts.
- **Decision & why:** option 1. A single lock boundary across planning data is
  easier to explain and test than per-collection rules.
- **Consequences:** positive — consistent contract, protected execution
  history. Negative — a wrong route discovered mid-production cannot be
  corrected in v1; it must be cancelled and re-created.
- **Reversibility:** two-way door. Relaxing to a versioned/append-only sheet is
  a later, additive change.

### D5 — Positions are assigned by the server from the submitted order

- **Context & forces:** clients can either send explicit positions or an
  ordered array. Explicit positions add a uniqueness invariant and let clients
  create gaps; array order is the natural representation of a sequence and
  makes reordering a pure client concern.
- **Options considered:**
  1. Client-supplied `position` with contiguous validation — explicit, but
     duplicates and gaps become a second validation surface.
  2. Server assigns `1..n` from the array order — one representation, no
     duplicate-position errors.
  3. Fractional/ranked ordering — supports cheap insertion, but overkill for
     sheets of tens of rows.
- **Decision & why:** option 2. The submitted sequence is the intent; storing
  it as `1..n` keeps reads deterministic and validation small.
- **Consequences:** positive — no ordering ambiguity, simple reorder. Negative —
  a client cannot address a step by a stable position across writes; it must
  send the whole array (consistent with D1).
- **Reversibility:** two-way door. Positions remain stored and can become
  client-supplied later.

### D6 — Authorization reuses the existing production grants

- **Context & forces:** the access map (`ACCESS-MATRIX.md`) already defines
  `production` view/manage for the three seeded roles.
- **Options considered:** (1) reuse `production` grants; (2) introduce a new
  `routing` grant; (3) no authorization on this endpoint.
- **Decision & why:** option 1. Routing is part of production work; a separate
  grant has no user need and would widen the matrix for every role.
- **Consequences:** positive — no access-map change, supervisor stays read-only
  by construction. Negative — a future "routing author" role cannot be scoped
  without splitting the grant then.
- **Reversibility:** two-way door. The check is one policy lookup.
