# Spec: article-catalogue

> Spec-driven development artifact. This file is the contract: implementation
> is done when every acceptance criterion maps to a scenario in
> `EXAMPLES.feature` and every scenario has a passing check.

## Problem

Orders reference articles, colours and sizes, but today that reference data
is fixed seed content — there is no way to add a new article, colour or size
without a database migration. When a client sends a new model or a buyer adds
a colour to the range, planners cannot record it and the order form silently
misses options. This feature turns the reference tables into a managed
catalogue with validated writes, so the data the order features depend on
can grow with the business.

## Users

- **Production planner** — creates and maintains articles, colours and sizes
  so orders can reference them.
- **Production supervisor** — browses the catalogue to check references.
- **Administrator** — same rights as the planner on the production section.

## Outcome hypothesis

- Expected user outcome: catalogue entries are created and corrected through
  the UI/API with server-side validation, and invalid or in-use deletes are
  refused with typed errors instead of corrupting order data.
- Opportunity evidence: the reference product manages articles, colours and
  size types as first-class screens with dedicated endpoints (article create
  form, colour and size lookups); LoomLine currently has read-only seeded
  copies of the same concepts.
- Signal: number of catalogue records created through the API after
  delivery; baseline 0 (no write path exists).
- Follow-up owner/date: product owner, at the next planning review.

## Scope (in)

- Catalogue entities: **article** (reference, label, client, size type,
  unit), **colour** (code, label), **size** (code, label, size type).
- List endpoints with case-insensitive search on the natural key fields.
- Create, update and delete for each entity via REST.
- Validation: required fields, non-empty codes/references, case-insensitive
  uniqueness matching the existing DB constraints, article client must
  exist, article size type (when set) must match a size type in use.
- Delete refused with a typed conflict error when the record is still
  referenced (article → orders; colour/size → order quantity lines).
- Access: reads need `production` view, writes need `production` manage —
  the same section policy the order endpoints already use.
- Frontend: catalogue pages listing/searching each entity with create/edit
  forms, gated to manage rights; viewers get read-only lists.

## Scope (out)

- Client management (clients stay read-only reference data here).
- Article models, fabrics, supplies, files, seasons — the richer reference
  product's article sub-entities.
- Colour/size association matrices on articles (which colours a given
  article is produced in) — composition validates against global pickers.
- Bulk import, soft-delete/active flags, audit history for catalogue rows.
- Changes to the order endpoints themselves.

## Acceptance criteria

| # | Criterion | Scenario(s) |
|---|-----------|-------------|
| 1 | A planner can create, list, update and delete catalogue entries | Create an article, Update a colour, Delete a size, Search catalogue entries |
| 2 | Invalid or duplicate entries are rejected with typed errors | Reject a duplicate article reference, Reject an article with an unknown client |
| 3 | Entries still in use cannot be deleted | Reject deleting an article referenced by an order, Reject deleting a colour used in an order breakdown |
| 4 | Catalogue writes and reads follow the production access policy | View catalogue without manage rights, Deny catalogue writes to a viewer |
| 5 | The catalogue is usable in the app for planners and read-only for viewers | Browse the catalogue in the UI, Create an entry from the UI, Show a validation error in the UI, Read-only catalogue for a supervisor |

## Decisions

- **D1 — Catalogue = article + colour + size; clients stay read-only.**
  Orders need three pickers beyond client; client management belongs to the
  commercial section and is deferred. Context: `client` rows are seeded and
  referenced by orders/articles; exposing client CRUD here would mix
  sections. Options: (a) all four entities now — simplest for users but
  pulls commercial scope forward; (b) articles/colours/sizes only —
  chosen; (c) articles only — rejected, colours/sizes are equally
  seed-locked and equally needed by order composition. Reversibility:
  two-way door; clients can be added as a follow-up feature.
- **D2 — Writes reuse the `production` section policy.** Create/update/
  delete require `production` manage; reads require `production` view —
  identical to the existing order and reference endpoints and to the
  approved ACCESS-MATRIX. Chosen over a new `catalogue` section because the
  access map is a human-approved contract (G3 of auth-and-app-shell) and
  catalogue data is production reference data. Reversibility: two-way
  door; a dedicated section is a one-line AccessMap change plus matrix
  re-approval.
- **D3 — Hard delete with a usage check, no soft-delete.** Deleting a row
  that is still referenced (article→orders, colour/size→quantity lines)
  returns `409` with a typed `IN_USE` error; otherwise the row is removed.
  Chosen over soft-delete/`active` flags because seeded demo data has no
  deactivation need yet and a flag adds a hidden state every query must
  respect. Options: (a) hard delete + usage check — chosen, simplest and
  keeps referential integrity honest; (b) soft-delete — deferred until a
  real need appears; (c) cascade delete — rejected, it would silently
  destroy order history. Reversibility: two-way door; adding `active` later
  is additive.
- **D4 — Uniqueness is case-insensitive, matching existing DB indexes.**
  `article.reference`, `colour.code`, and `(size.code, size.size_type)`
  already have `lower(...)` unique indexes; the domain layer rejects
  duplicates case-insensitively so the API error is typed (`DUPLICATE`)
  rather than a raw constraint violation. Reversibility: two-way door.
- **D5 — No optimistic locking on catalogue rows.** Articles/colours/sizes
  have no `version` column; catalogue edits are low-contention reference
  data, so last-write-wins is acceptable and matches the existing schema.
  Orders keep their `@Version` guard — composition correctness depends on
  it, catalogue correctness does not. Revisit trigger: concurrent-edit
  conflicts reported by planners.
- **D6 — `article.size_type` stays a nullable text field validated against
  size types in use.** The DB column is `text`; normalizing it into a
  `size_type` table is disproportionate while size types are a short,
  stable list (currently two seeded values). When provided it must match
  `size.size_type` of at least one size row, keeping order-composition's
  size-type check meaningful. Reversibility: two-way door; a lookup table
  can replace the text column later.
- **D7 — API surface follows the existing REST style.** Collection +
  item endpoints under `/api/articles`, `/api/colours`, `/api/sizes` with
  the same JSON error envelope (`code`, `message`, `fieldErrors`) as the
  order endpoints; list endpoints accept `?q=` search. No OpenAPI
  generation is added — consistent with the rest of the API today.
  Reversibility: two-way door.
