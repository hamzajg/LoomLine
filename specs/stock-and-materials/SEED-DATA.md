# Seed data — stock-and-materials

Contract for demo/test reference data. Wave 1 implements this as idempotent
seed rows alongside the existing reference seed; production deployments create
the same reference data through the application or migrations, not by relying
on dev-only seeds.

## Stock locations

| key       | label     | notes |
|-----------|-----------|-------|
| MAIN      | Main store | default receiving and issue location |
| SECONDARY | Secondary store | used to prove level scoping |

Locations are read-only reference data in v1. Codes are stable uppercase keys;
labels are display text.

## Materials

| code            | label                 | kind    | unit | supplier_ref | notes |
|-----------------|-----------------------|---------|------|--------------|-------|
| MAT-THREAD-COTTON-20   | Cotton thread 20/2    | THREAD  | kg   | SUP-001      | primary demo thread |
| MAT-SUPPLY-ZIP-40    | Zip fastener 40 cm    | SUPPLY  | pcs  | SUP-014      | primary demo supply |
| MAT-FABRIC-POPLINE-150 | Poplin fabric 150 g/m | FABRIC  | m    | SUP-027      | primary demo fabric |
| MAT-FABRIC-LINEN-200     | Linen fabric 200 g/m  | FABRIC  | m    | SUP-031      | secondary fabric for filtering |

Rules for the seed:

- Codes are unique case-insensitively and stable across environments.
- `kind` is one of `THREAD`, `SUPPLY`, `FABRIC`.
- `unit` is a non-blank display unit (`kg`, `pcs`, `m`).
- `supplier_ref` is optional reference text, not a managed supplier record.
- Materials seed as `active = true`.

## Opening movements

To make demo levels non-zero without hand-editing balances, seed opening
`RECEIPT` movements with fixed UUIDs and `created_at` ordered before demo
activity:

| material         | location  | type    | quantity | reason            |
|------------------|-----------|---------|----------|-------------------|
| MAT-THREAD-COTTON-20    | MAIN      | RECEIPT | 100 kg   | opening stock     |
| MAT-THREAD-COTTON-20    | SECONDARY | RECEIPT | 40 kg    | opening stock     |
| MAT-SUPPLY-ZIP-40     | MAIN      | RECEIPT | 500 pcs  | opening stock     |
| MAT-FABRIC-POPLINE-150  | MAIN      | RECEIPT | 250 m    | opening stock     |

Opening receipts are demo data, not an import path. They must obey the same
movement validation as user-posted movements.
