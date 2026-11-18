# Seed data — reference records for the order workflow

Gate: **G2 — Reference data seeded** (before wave 1). Owner: product owner.
Purpose: an order needs a client and an article. The demo and the automated
tests must never stall on empty lookups, and the data must be reproducible
from the repository alone.

## Required reference records

### Clients

| Key (stable id for tests) | Name | Country | Contact |
|---------------------------|------|---------|---------|
| `client-maison-textile` | Maison Textile | TN | Ines Baklouti |
| `client-atelier-nord` | Atelier du Nord | FR | Luc Martin |

### Articles

| Reference | Label | Client | Size type | Unit |
|-----------|-------|--------|-----------|------|
| `ART-100` | Chemise popeline homme | Maison Textile | Alpha | pcs |
| `ART-200` | Blouse lin femme | Atelier du Nord | Alpha | pcs |

### Rules

- References are unique and case-insensitive; `ART-100` and `art-100` collide.
- An order references a client and an article by id; no free-text names.
- Articles carry no colour/size matrix in this feature (catalogue follow-on).

## Where the data lives

- **Schema + reference tables:** Flyway migration `V1__reference_data.sql`
  (structure) is owned by wave 1.
- **Seed rows:** Flyway repeatable/dev migration
  `R__seed_reference_data.sql`, or a `seed` profile migration, so the same
  dataset loads in local Compose and in Testcontainers tests. Production
  deployments skip the seed.
- Seeding must be **idempotent**: insert-by-natural-key, never assume an empty
  table.

## Demo preconditions

1. `docker compose up` starts `db`, `app`, and `web`.
2. The order form's client and article selectors return the four records above.
3. At least one order can be created against `client-maison-textile` /
   `ART-100` without creating reference data first.
4. Empty states remain reachable (e.g. a fresh database without the seed) and
   must explain how to add reference data rather than showing a dead selector.

## Evidence

Record the seed command output (row counts for `client` and `article`) as gate
evidence when marking G2 met.
