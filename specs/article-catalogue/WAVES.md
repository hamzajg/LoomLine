# Waves — article-catalogue

Each wave IS an iteration: a time-boxed, independently shippable
increment — one branch, one PR, green tests, demoable outcome.
Do not start wave N+1 until wave N merges.

## Wave 1 — iteration 1

Scenarios proven by this wave:
- Create an article
- Update a colour
- Delete a size
- Search catalogue entries
- Reject a duplicate article reference
- Reject an article with an unknown client
- Reject deleting an article referenced by an order
- Reject deleting a colour used in an order breakdown
- View catalogue without manage rights
- Deny catalogue writes to a viewer

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US1 | As a production planner, I want to manage articles, colours and sizes through the API, so that order pickers never depend on seed data or migrations | M | — | CRUD + list/search + validation + in-use delete guard for all three entities |

## Wave 2 — iteration 2

Scenarios proven by this wave:
- Browse the catalogue in the UI
- Create an entry from the UI
- Show a validation error in the UI
- Read-only catalogue for a supervisor

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US2 | As a production planner, I want a catalogue screen in the app, so that I can maintain reference data without calling the API directly | M | US1 | list/search/create/edit per entity, manage-gated controls, read-only for viewers |
| US3 | As a production supervisor, I want to browse the catalogue read-only, so that I can check references while planning the floor | S | US1 | covered by the view/manage split in both waves; no dedicated UI work |

## Wave 3 — iteration 3

Scenarios proven by this wave:
- A search with no matches offers to clear it

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US4 | As a production planner, I want a clear-search action when nothing matches, so that I can return to the full catalogue without retyping | S | — | builds on US2; the no-matches row offers clear search, which empties the field, refocuses it and reloads the full list |
