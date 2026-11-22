# Spec: stock-and-materials

> Spec-driven development artifact. This file is the contract: implementation
> is done when every acceptance criterion maps to a scenario in
> `EXAMPLES.feature` and every scenario has a passing check.

## Problem

LoomLine can now take orders, break them down by colour/size, authenticate
users, and maintain an ordered production routing sheet — but it still cannot
answer the most basic shop-floor question: *do we have the material, and where
is it?* The shell already reserves `/stock/materials`, `/stock/movements`, and
`/stock/levels`, but every one of those routes is a placeholder. Planners and
supervisors have no material master, no receipt/issue record, and no derived
stock level, so material availability lives outside the product or not at all.

The reference system shows the domain — threads, supplies, fabrics, warehouses,
and stock entries — but its stock slice was incomplete and defective (for
example, the fabric list endpoint threw and the stock-entry route was broken).
LoomLine needs a small, trustworthy inventory slice rather than another CRUD
screen.

## Users

- **Inventory manager** — creates and maintains material masters and posts
  stock movements. The exact role mapping is gate `G5`: administrator always
  manages; whether `production-planner` receives `stock.manage` is a human
  decision recorded in `ACCESS-MATRIX` terms before wave 1.
- **Production supervisor** — reads materials, movements, and stock levels to
  check availability; never mutates stock.
- **Administrator** — same manage rights as the inventory manager and can
  deactivate materials that must not be used for new movements.

## Value contract

- Problem: material availability is untracked inside LoomLine; planners cannot
  verify stock before releasing or staffing work, and supervisors cannot see
  what is physically on hand. Severity is operational: shortages and expedites
  are discovered late.
- Users: inventory managers bear the recording cost; production planners and
  supervisors bear the availability risk; administrators own reference-data
  hygiene.
- Baseline / current cost: today `0` materials have a LoomLine stock level and
  `0` stock movements exist; the stock navigation section is placeholder-only.
  Off-system tracking cost is treated as unverified, not invented.
- Target outcome indicator: after release, `100%` of seeded/reference materials
  have a derived stock level per active location, every stock-affecting write is
  backed by exactly one immutable movement, and `0` ISSUE or negative ADJUSTMENT
  can drive a balance below zero. Review window: within 30 days of release.
- Economic hypothesis: a bounded inventory slice is cheap to build on the
  existing Quarkus/Postgres/Flyway stack, cheap to operate as append-only rows
  plus derived reads, adopted through existing roles/navigation, and started
  from seed/demo data in v1. Over three years the avoided cost is fewer stock
  surprises and less duplicate tracking outside the product.
- Owner / date: product owner — review the signal at the next planning review
  after release, no later than 2026-12-22.

## Outcome hypothesis

- Expected user outcome: an inventory manager can keep material masters and
  post receipts/issues/adjustments without leaving the stock section, and a
  supervisor can answer "how much of material X is at location Y?" from the
  product instead of a spreadsheet or memory.
- Opportunity evidence: the shell navigation already reserves stock routes;
  production routing now references machines/phases but still has no material
  availability signal.
- Signal: share of reference materials with a current derived level; baseline
  `0%` because the feature does not exist. Do not invent usage or shortage
  baselines.
- Follow-up owner/date: product owner — same review as the value contract.

## Experience

- Primary journey: sign in → Stock → Materials → create or edit a material →
  Stock → Movements → post a receipt, issue, or adjustment → Stock → Levels →
  confirm the balance moved. A supervisor follows the same read path but sees
  no manage controls.
- Edge states: empty materials list with a create path for managers; empty
  movements/levels with a post path; loading and API error states; permission
  denied for manage actions; rejected movement forms keep the entered values
  and show field-level errors; a material with movements offers deactivate,
  not delete.
- UX bar: same density and clarity as the shipped catalogue/orders screens —
  searchable tables, explicit movement type labels, visible unit and location,
  balance shown after each post, and no hidden stock math. "Intuitive" means a
  planner can post a receipt in under a minute without documentation.
- Accessibility: all forms are keyboard reachable with visible focus and
  labels; movement type and balance are text, not color-only; errors are
  announced next to the field they concern.

## Scope (in)

- Material masters: stable code, label, kind (`THREAD`, `SUPPLY`, `FABRIC`),
  unit, optional supplier reference, active flag, create/list/filter.
- Stock locations as seeded read-only reference data (for example `MAIN`,
  `SECONDARY`); location management is out of scope.
- Append-only stock movements: `RECEIPT`, `ISSUE`, and `ADJUSTMENT`, scoped to
  material + location, with quantity/delta rules and required adjustment
  reason.
- Derived stock levels per material + location, readable by authorized users.
- Stock screens under the existing `/stock/*` routes with manage vs view
  grants.
- REST contract documented by the generated OpenAPI output for the new
  endpoints; consistent typed error responses.

## Scope (out)

- Spare parts, machines, repairs, and equipment management — equipment feature.
- Purchasing, suppliers as a managed domain, reorder points, and procurement.
- Bill-of-materials, order consumption, or reserving stock for an order.
- Packages, barcodes, scanners, file attachments, and warehouse layout.
- Location create/edit UI; locations are seeded reference data in v1.
- Importing historical stock balances; v1 uses seed/demo data only.

## Acceptance criteria

| # | Criterion | Scenario(s) |
|---|-----------|-------------|
| 1 | Authorized managers can create and list/filter material masters | Create a material with a stable code, List and filter materials |
| 2 | Authorized managers can post receipts and issues that move derived levels | Post a stock receipt, Post a stock issue |
| 3 | Invalid movements are rejected with typed errors and nothing is stored | Reject a movement with unknown material or location, Reject a movement with non-positive quantity |
| 4 | Stock levels are derived per material and location | Keep stock levels scoped by location |
| 5 | Managers can work materials, movements, and levels from the stock screens | Post a movement from the stock screen, Show an empty stock workspace with a create path |
| 6 | Supervisors and users without manage grants get read-only or denied access | View stock levels read-only as supervisor, Deny stock manage actions without the manage grant |
| 7 | Inventory guardrails hold: adjustment reason, no negative issue/adjustment, no delete-with-history | Adjust stock with a required reason, Reject an adjustment without a reason, Reject an issue that would make the balance negative, Prevent deleting a material that has movements |

## Decisions

### D1 — Stock level is derived from immutable movements, not a mutable balance column

- **Context & forces:** stock must be auditable and must not drift. A mutable
  `quantity_on_hand` column is simplest to read but lets updates bypass the
  movement record; separate balance + movement writes can diverge under
  retries or partial failure.
- **Options considered:**
  1. Mutable balance column updated with each movement — simplest read path,
     but the balance can drift from history and retries are risky.
  2. Append-only movements plus a derived level read model — the movement is
     the only write; level is `SUM(delta)` per material+location.
  3. Dual-write balance and movement in one transaction — faster reads, but
     two writers for one truth and more failure modes.
- **Decision & why:** option 2. The movement ledger is the source of truth;
  the level is a projection. This matches the product's evidence-over-output
  posture and keeps stock trustworthy.
- **Consequences:** positive — every balance is explainable, retries are
  idempotent by movement identity, and corrections are new movements. Negative —
  level reads aggregate history; if it becomes slow, add a materialized
  projection later without changing the write model.
- **Reversibility:** two-way door. A cached/materialized level can be added
  later; the ledger remains valid.

### D2 — Movement model: typed movements with quantity rules

- **Context & forces:** users think in receipts, issues, and adjustments, not
  signed integers. Typed movements make UI copy, validation, and audit clearer.
  Negative stock is a business decision, not a technical default.
- **Options considered:**
  1. Single signed `delta` column — smallest model, easiest to misuse.
  2. `RECEIPT` / `ISSUE` / `ADJUSTMENT` with positive quantity for receipt and
     issue, signed non-zero delta for adjustment, reason required for
     adjustment — explicit and testable.
  3. Full inventory transaction document with lines, costs, and references —
     more than this slice needs.
- **Decision & why:** option 2. It keeps the common cases obvious while
  preserving an explicit escape hatch for corrections.
- **Consequences:** positive — validation is local, UI labels map directly,
  and audit reads naturally. Negative — adjustment semantics need care so a
  positive/negative delta cannot be confused with receipt/issue.
- **Reversibility:** two-way door for the enum/rules; the append-only ledger
  shape stays.

### D3 — Materials are a separate aggregate from articles; no BOM link in v1

- **Context & forces:** `article` is a sellable finished good with client,
  colour/size, and routing context. Raw materials have different lifecycle,
  units, suppliers, and stock semantics. Coupling them now would blur the
  catalogue and inventory contexts.
- **Options considered:**
  1. Extend `article` with material kinds — reuses one table but conflates
     finished goods and consumables.
  2. Separate `material` aggregate in an inventory context — clean boundary,
     explicit translation later if BOM/consumption arrives.
  3. Model BOM/consumption now — needed eventually, but too large for the
     first inventory slice.
- **Decision & why:** option 2. It keeps the domain honest and leaves a clear
  future seam for order consumption without shipping it prematurely.
- **Consequences:** positive — materials can have stock rules articles should
  not inherit; negative — a future BOM must translate article requirements
  into material demand explicitly.
- **Reversibility:** two-way door; a later feature can add BOM links without
  changing material identity.

### D4 — Stock locations are seeded read-only reference data in v1

- **Context & forces:** levels are only meaningful per location, but location
  management is its own admin surface. Seeding `MAIN`/`SECONDARY` gives the
  domain real scoping without a second CRUD area.
- **Options considered:**
  1. Single implicit location — simplest, but makes the level model a lie.
  2. Full location CRUD now — scope creep and another access decision.
  3. Seeded read-only locations, manage later — enough for v1 and reversible.
- **Decision & why:** option 3. It preserves the material+location key without
  committing to location administration.
- **Consequences:** positive — levels are correctly scoped and tests can prove
  separation; negative — users cannot create locations until a later feature.
- **Reversibility:** two-way door; location management can be added as a new
  feature.

### D5 — REST contract is generated, movements are append-only

- **Context & forces:** the product exposes REST only; external systems are not
  a contract source and error shapes must stay consistent with existing typed
  errors. Stock corrections must never rewrite history.
- **Options considered:**
  1. Hand-written API docs — drift risk.
  2. Enable Quarkus OpenAPI for the new resources and keep curl/response
     walkthroughs as wave evidence — generated contract plus live proof.
  3. Event/messaging contract now — no consumer exists yet.
- **Decision & why:** option 2 for REST. Materials use normal CRUD with
  deactivate-not-delete for materials that have movements; movements expose
  create/list only — no update or delete.
- **Consequences:** positive — contract is generated from code and errors stay
  typed; negative — adding the OpenAPI extension is a dependency choice wave 1
  must verify.
- **Reversibility:** two-way door; OpenAPI can be extended or replaced without
  changing domain rules.
