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
- Transaction boundary: posting a movement validates the material/location,
  checks the resulting balance when required, and inserts the immutable
  movement in one transaction. No transaction spans Material and Movement as
  separate aggregates beyond that single write; level reads do not write.

## Integration style

- Synchronous REST for all reads and writes in v1; no domain events because no
  consumer exists yet.
- Strong consistency is required for movement validation and balance checks:
  the check and the insert must see the same ledger state.
- Stock level reads may be computed or cached, but any cache is a projection of
  the ledger and must never become a write path.
- Future order consumption should arrive as explicit material-demand
  translation, not as hidden writes from the order aggregate.

## External translations

- none — v1 does not import historical stock balances or external systems;
  seed and demo data are created inside LoomLine. A later import feature must
  define its own translation for material/location identifiers.
