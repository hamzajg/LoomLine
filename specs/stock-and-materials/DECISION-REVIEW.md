# Decision review brief — Spec: stock-and-materials

- Source: `specs/stock-and-materials/SPEC.md (## Decisions)`
- Generated: 2026-11-22T09:12:23Z
- Detected type: api, data
- Readiness: **CHALLENGE** (6/6 record elements)
- This brief is input to judgment, not a verdict. The agent fills the scorecard after reading the code.

**Reversibility:** stated

## Domain contract on record (DOMAIN.md — verify against code)

# Domain model: stock-and-materials

> The domain contract for this feature (D019): ubiquitous language,
> bounded contexts, aggregates and invariants. Fill every section. `simple`
> tier means the feature introduces no NEW domain concepts — say so
> explicitly and name the owning context; it is not a blank file. Deeper
> tiers are checked semantically by the spec audit and wave reviewer.

**Tier:** standard

The feature introduces a new inventory bounded context (materials, locations,
movements, levels) with real invariants, but it does not reshape the existing
order, catalogue, routing, or identity contexts.

## Ubiquitous language

- Material: a stocked raw input such as thread, supply, or fabric — used in
  material CRUD, movements, levels, and stock screens.
- Material kind: `THREAD`, `SUPPLY`, or `FABRIC` — used in material validation
  and filters.
- Stock location: a seeded place where stock is held, such as `MAIN` or
  `SECONDARY` — used as the location half of every movement and level.
- Stock movement: one immutable record of stock entering, leaving, or being
  corrected — used in the movement ledger and audit.
- Movement type: `RECEIPT`, `ISSUE`, or `ADJUSTMENT` — used in movement
  validation and UI labels.
- Quantity: positive units for `RECEIPT` and `ISSUE`; non-zero signed delta for
  `ADJUSTMENT` — used in movement payloads and level math.
- Adjustment reason: mandatory explanation for `ADJUSTMENT` — used in
  correction workflows and audit.
- Stock level: derived balance for one material at one location — used in
  level reads and availability checks.
- Active material: a material that may receive new movements — used in
  validation and deactivate flows.
- Manage grant: permission to create materials and post movements — used in
  authorization and UI controls.
- View grant: permission to read materials, movements, and levels — used in
  authorization and navigation.

## Bounded contexts

- Inventory context owns materials, stock locations, stock movements, and
  derived stock levels. It is the only writer of stock truth in this feature.
- Identity/access context owns roles and section grants. Inventory depends on
  it for `stock.view` / `stock.manage` decisions; it does not own user records.
- Production catalogue context owns sellable articles, colours, sizes, and
  routing reference data. It remains separate from raw-material inventory.
- Order/production context owns orders, composition, lifecycle, and routing.
  It does not consume stock in v1.
- Context map: Inventory → Identity is a synchronous authorization dependency.
  Inventory has no dependency on Orders in v1; a future BOM/consumption
  feature must translate order demand into material movements explicitly.
- New concepts introduced: material, stock location, stock movement, movement
  type, adjustment reason, stock level. Locations are borrowed reference data
  expanded into a first-class inventory key.

## Domain model

- Material aggregate: identity (id, code, label, kind, unit, optional supplier
  reference, active flag). Invariants: code unique case-insensitively, kind is
  one of the declared values, unit is non-blank, inactive materials reject new
  movements but remain readable.
- StockMovement entity: immutable ledger row (id, material, location,
  movement type, quantity/delta, reason, actor, created_at). Invariants:
  material and location must exist and be usable; `RECEIPT`/`ISSUE` quantity is
  a positive integer; `ADJUSTMENT` delta is non-zero and requires a reason;
  resulting balance must not go negative for `ISSUE` or negative `ADJUSTMENT`
  under the proposed rule pending gate `G4`.
- StockLocation reference: seeded read-only aggregate/value set (`MAIN`,
  `SECONDARY` in demo data). Invariant: locations are stable keys; no CRUD in
  v1.
- StockLevel read model: derived `SUM(delta)` grouped by material + location.
  It is not a second write model; it is computed or projected from movements.
- Transaction boundary: posting a move

**Alternatives on record (verify they are credible, not strawmen):**
- Material masters: stable code, label, kind (THREAD, SUPPLY, FABRIC), unit, optional supplier reference, active flag, create/list/filter. - Stock locations as se
- view grants. - REST contract documented by the generated OpenAPI output for the new endpoints
- A mutable quantity_on_hand column is simplest to read but lets updates bypass the movement record; separate balance + movement writes can diverge under retries 
- Dual-write balance and movement in one transaction — faster reads, but two writers for one truth and more failure modes. - Decision & why: option 2.

## Evidence signals (heuristic — verify before acting)

- `api/src/main/kotlin/com/loomline/order` — 24 source file(s); not a domain path, so layering checks were skipped
- `api/src/main/kotlin/com/loomline/identity` — no test file references this code (heuristic)
- `api/src/main/kotlin/com/loomline/identity` — 8 source file(s); not a domain path, so layering checks were skipped
- `web/src/pages` — 13 source file(s); not a domain path, so layering checks were skipped
- `api/src/main/resources/db/migration` — no source files found to inspect

Inspected: `api/src/main/kotlin/com/loomline/order`, `api/src/main/kotlin/com/loomline/identity`, `web/src/pages`, `api/src/main/resources/db/migration`

## Design moves to test

- Is this a public contract or an implementation detail? Who depends on it?
- How will it version, and what is the backward-compatibility promise?
- Are errors part of the contract — consistent shape, codes, retry semantics — or an afterthought?
- Is the contract documented where consumers can find it (OpenAPI, AsyncAPI, schema registry, docs site), and is the doc generated from code or hand-maintained?
- Which fields and operations are stable vs experimental, and what is the deprecation path?
- Is authn/authz explicit per operation with least privilege, and is that visible in the docs?
- Are writes idempotent where clients can retry (idempotency keys, natural keys, upserts)?
- Which invariant spans more than one aggregate, and does the transaction span it too?
- Can the write model be separated from read shapes without splitting the database?
- What is the migration and rollback path for existing data?
- Invert a dependency so the unstable thing depends on the stable thing.
- Make an implicit boundary or invariant explicit before adding mechanism.
- Shrink the decision: can half of it ship independently and reversibly?

## Challenge questions

### 1. Problem & forces
- What user/business outcome does this serve, and what breaks if we do nothing?
- Which quality attributes actually drive it (correctness, latency, cost, operability, compliance, time-to-market)? Rank them.
- Which constraints are fixed (budget, deadline, team, contracts) and which are assumed?
- Who owns this decision, and who must live with the consequences?
**Good looks like:** The dominant force is named, and "do nothing" is treated as a real option.

### 2. Value & economics
- What is the value gap: who bears the current cost, and how painful or frequent is it?
- Which outcome indicator and baseline prove the gap closed, and over what review window?
- What is the full-lifecycle cost (build, operate, adopt, migrate, support) and what benefit justifies it?
- Will users actually choose this? What adoption signal would show they do?
- Which quality dimensions does this affect — product (user task), system (correctness, security, reliability, operability) and business (TCO, adoption, adaptability)? Name any it makes worse.
- What is the simplest intervention that produces the same outcome — including not building it?
**Good looks like:** The value gap, a numeric target, a lifecycle cost hypothesis and an adoption signal are explicit; quality tradeoffs are named; 'do nothing' is a real option.

### 3. Alternatives & tradeoffs
- What are at least two credible alternatives, including the simplest thing that could work?
- For each: what does it make easy, what does it make hard, and what does it cost to reverse?
- Is this a one-way or two-way door? If one-way, what evidence justifies it?
- What would have to be true for the chosen option to be wrong?
**Good looks like:** A tradeoff matrix names winners and losers; reversibility is explicit; no strawman options.

### 4. Domain fit (DDD)
- Which bounded context owns this concept, and is the boundary drawn around language or deployment?
- Which terms are overloaded across contexts, and where is the translation (anti-corruption layer)?
- What are the aggregates, their invariants, and the transaction boundary? Does one transaction span aggregates?
- Are domain events the right integration mechanism, or is this a synchronous dependency?
- Does the model carry behavior, or is it an anemic data bag?
- Which consistency guarantee is required, and which can be eventual?
**Good looks like:** Ubiquitous language is explicit, invariants are protected at the boundary, external models are translated.

### 5. Architecture & boundaries
- Which direction do dependencies point? Can the core be tested without the framework, DB, or network?
- What is the smallest boundary that isolates this change (module, port, package)?
- What happens when each external dependency is slow, down, or returns garbage?
- Where does data ownership live, and is there a second writer?
- What is the operational story: config, migrations, rollout, rollback, observability?
- Who are the consumers, and what is the deprecation policy?
**Good looks like:** Policy depends on nothing; mechanisms are adapters; failure and migration paths are named.

### 6. Testable design
- Where are the seams? Can time, randomness, IO, and external calls be injected?
- Which behaviors get fast unit tests, which need integration, which need contract tests?
- Does each acceptance criterion map to an observable check, or only to implementation details?
- Are the tests deterministic and independent (no shared state, no sleeps)?
- What is the failure signal when this decision turns out wrong in production?
**Good looks like:** Behavior-first tests, deterministic seams, scenario-to-test traceability, a named failure signal.

### 7. Craftsmanship
- Is this the smallest reversible step, or a big-bang change?
- Are names from the domain, or from the framework/table?
- Is the error model explicit (typed failures vs exceptions vs silent nulls)?
- Is there speculative abstraction (interfaces with one implementation, config nobody sets)?
- Is the migration path documented and rollback-able?
**Good looks like:** Small steps, intention-revealing names, explicit errors, no speculative generality, documented migration.

### 8. Decision record
- Are status, owner, and date recorded?
- Are consequences (positive and negative) written down?
- Is there a revisit trigger (metric, date, event)?
- Are links to evidence, code, and related ADRs present?
**Good looks like:** A future reader can tell why, what was traded, and when to revisit.

## Scorecard (agent fills; 1 = poor, 5 = strong, evidence required)

| Lens | Score | Evidence (file:line, test, benchmark) | Action |
|------|-------|----------------------------------------|--------|
| Problem & forces | 4 | SPEC.md `## Value contract` names inventory truth, stock visibility, and the cost of unrecorded movement; `## Experience` names planner/supervisor journeys. | Keep the numeric target and baseline tied to seeded demo data so wave evidence can prove it. |
| Value & economics | 4 | SPEC.md value contract gives users, baseline, target indicator, economic hypothesis, and owner/date; outcome stays post-release learning per D009. | Do not claim business outcome until `ship_validate`/post-release evidence exists. |
| Alternatives & tradeoffs | 4 | SPEC.md `## Decisions` D1–D5 records derived levels vs mutable balance, movement model, material boundary, seeded locations, and REST/OpenAPI choices with reversibility. | Keep alternatives credible; do not let wave 1 smuggle in a mutable balance column. |
| Domain fit (DDD) | 4 | DOMAIN.md declares standard tier, inventory bounded context, material/movement/location/level language, and transaction boundary. | Confirm G4 stock rules before coding invariants; DOMAIN.md already flags negative-balance rule as pending. |
| Architecture & boundaries | 3 | DOMAIN.md separates Inventory from Identity/Catalogue/Orders; SPEC.md D5 chooses generated REST contract. Existing code has Quarkus resources and React pages but no stock module yet. | Wave 1 must keep policy in domain use cases and adapters thin; verify OpenAPI output exists before claiming the contract. |
| Testable design | 4 | EXAMPLES.feature maps scenarios to @w1/@w2/@w3; BACKLOG.md/WAVES.md give three independently shippable waves; existing LoomLine tests use JUnit/React Testing Library. | Each wave needs RED→GREEN→REFACTOR evidence and scenario-named tests. |
| Craftsmanship | 4 | SPEC.md/DOMAIN.md use domain names, explicit invariants, append-only ledger, seeded locations, and small wave scope. | Avoid speculative warehouse/location CRUD or BOM links in v1. |
| Decision record | 4 | SPEC.md `## Decisions` has context, alternatives, decision, consequences, reversibility, and revisit triggers for D1–D5. | Record G4/G5 human decisions in LOOP.md before wave 1 rather than editing SPEC silently. |

## Verdict (agent fills)

```
VERDICT: ACCEPT
STEELMAN: The strongest version is a small inventory context with immutable
  movements, derived levels, seeded locations, explicit material/movement
  validation, generated REST contract, and access enforced by existing section
  grants — enough to make stock truth usable without prematurely modeling
  purchasing, warehouses, BOMs, or spare parts.
SMALLEST NEXT STEP: Get human confirmation for G4 stock rules and G5 access
  matrix, then start wave 1 with material masters + movement ledger + derived
  levels and scenario-named failing tests.
REVISIT TRIGGER: Reopen if stock volume needs multiple real warehouses, if
  order consumption/BOM becomes the next feature, if negative-stock policy is
  challenged by production, or if OpenAPI/REST contract cannot be generated
  cleanly from the Quarkus endpoints.
```

Run the review with `/challenge-decision` and the `decision-challenger`
subagent. It is advisory: it never blocks a gate or a merge.
