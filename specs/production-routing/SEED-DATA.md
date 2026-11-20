# Seed data — phases and machines for the routing sheet

Gate: **G2 — Reference data seeded** (before wave 1). Owner: product owner.
Purpose: a routing step needs a phase and may need a machine. The demo and the
automated tests must never stall on empty lookups, and the data must be
reproducible from the repository alone.

## Required reference records

### Phases

| Key (stable id for tests) | Code | Label |
|---------------------------|------|-------|
| `77777777-7777-4777-8777-777777777771` | `CUT` | Cutting |
| `77777777-7777-4777-8777-777777777772` | `SEW` | Sewing |
| `77777777-7777-4777-8777-777777777773` | `ASM` | Assembly |
| `77777777-7777-4777-8777-777777777774` | `FIN` | Finishing |
| `77777777-7777-4777-8777-777777777775` | `QC` | Quality check |
| `77777777-7777-4777-8777-777777777776` | `PACK` | Packing |

Codes are unique and case-insensitive; labels are unique and case-insensitive.

### Machines

| Key (stable id for tests) | Reference | Label | Active |
|---------------------------|-----------|-------|--------|
| `88888888-8888-4888-8888-888888888881` | `MC-01` | Overlock machine | yes |
| `88888888-8888-4888-8888-888888888882` | `MC-02` | Straight-stitch machine | yes |
| `88888888-8888-4888-8888-888888888883` | `MC-03` | Cutting table | yes |
| `88888888-8888-4888-8888-888888888884` | `MC-04` | Press station | no |

`MC-04` is intentionally inactive so the negative path — a routing step that
references an inactive machine is rejected — is exercisable from the seed.

## Rules

- Machine references are unique and case-insensitive; `MC-01` and `mc-01`
  collide.
- A routing step references a phase and an optional machine by id; no
  free-text phase or machine names.
- Phases and machines are read-only through the API in this feature; the seed
  is the only writer. Machine management arrives with the equipment feature.

## Where the data lives

- **Schema:** Flyway migration `V3__production_routing.sql` creates `phase`,
  `machine` and `order_routing_step`; owned by wave 1.
- **Seed rows:** the existing repeatable/dev seed `R__seed_reference_data.sql`
  gains the rows above, so the same dataset loads in local Compose and in
  Testcontainers tests. Production deployments skip the seed.
- Seeding must be **idempotent**: insert-by-natural-key (`code`, `reference`),
  never assume an empty table.

## Demo preconditions

1. `docker compose up` starts `db`, `api` and `web` with the seed enabled.
2. The routing form's phase and machine pickers return the six phases and four
   machines above.
3. At least one order can be given a three-step routing sheet against the
   seeded article/client without creating reference data first.
4. Empty states remain reachable (a fresh production database without the
   seed) and explain how phases and machines are provisioned rather than
   showing a dead selector.

## Evidence

Record the seed output (row counts for `phase` and `machine`) as gate evidence
when marking G2 met.
