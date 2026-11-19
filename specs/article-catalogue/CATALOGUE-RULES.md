# Catalogue rules — articles, colours, sizes

Gate: **G3 — Catalogue rules agreed** (before wave 1). Owner: product
owner. **STATUS: AGREED by product owner 2026-11-19.** This file is
the authority for the validation, uniqueness and delete rules below.

## Entities

- `article` — reference (unique, case-insensitive), label, `client_id`
  (must exist), `size_type` (nullable; when set must match a size type in
  use by at least one size row), `unit` (required).
- `colour` — code (unique, case-insensitive), label.
- `size` — code + label, unique per `(code, size_type)` case-insensitively;
  `size_type` required.

## Rules

1. **Search.** List endpoints accept `?q=` matched case-insensitively
   against the entity's text fields (article: reference+label; colour:
   code+label; size: code+label).
2. **Uniqueness.** Duplicates are rejected with `409 DUPLICATE` before any
   write; the check is case-insensitive to match the DB indexes.
3. **Validation.** Required fields must be non-blank; `article.client_id`
   must reference an existing client; `article.size_type`, when provided,
   must equal `size.size_type` of at least one size row. Failures return
   `400 VALIDATION_FAILED` with `fieldErrors`.
4. **Delete.** Hard delete only. Deleting a record still referenced —
   article by any order, colour or size by any order quantity line —
   returns `409 IN_USE` and nothing is removed. Unreferenced records are
   deleted.
5. **Authorization.** Reads require `production` view; writes require
   `production` manage (administrator and production-planner manage;
   production-supervisor view-only).
6. **Concurrency.** Catalogue rows have no optimistic version; last write
   wins (D5).
