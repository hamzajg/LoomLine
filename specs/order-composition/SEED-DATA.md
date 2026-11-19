# Seed data — order-composition reference data

Tables (`colour`, `size`, `order_quantity_line`) ship in a Flyway migration
`V2__order_composition.sql`. Demo rows ship in the repeatable seed file
`R__seed_reference_data.sql`, which runs in dev and test only — consistent
with how clients and articles are seeded. Ids below are fixed so tests and
demos never depend on generated values.

## Colours

| key | id | code | label |
|-----|----|------|-------|
| noir | `55555555-5555-4555-8555-555555555551` | NOIR | Noir |
| ecru | `55555555-5555-4555-8555-555555555552` | ECRU | Ecru |
| bleu | `55555555-5555-4555-8555-555555555553` | BLEU | Bleu roi |

## Sizes

Both seeded articles carry `size_type = 'Alpha'` (see
`R__seed_reference_data.sql`), so demo sizes use `size_type = 'Alpha'`.

| key | id | code | label | size_type |
|-----|----|------|-------|-----------|
| s | `66666666-6666-4666-8666-666666666661` | S | S | Alpha |
| m | `66666666-6666-4666-8666-666666666662` | M | M | Alpha |
| l | `66666666-6666-4666-8666-666666666663` | L | L | Alpha |
| xl | `66666666-6666-4666-8666-666666666664` | XL | XL | Alpha |

## Demo breakdown

SPEC scenario: Noir/S=40, Noir/M=30, Ecru/M=30 for a 100-unit order on
article ART-100.
