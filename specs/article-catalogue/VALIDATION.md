# Validation — 

## Traceability

| AC | Criterion | Scenarios | Wave(s) | Test evidence |
|----|-----------|-----------|---------|---------------|
| 1 | A planner can create, list, update and delete catalogue… | Create an article, Delete a size, Deny catalogue writes to a viewer, Reject a duplicate article reference, Reject an article with an unknown client, Reject deleting a colour used in an order breakdown, Reject deleting an article referenced by an order, Search catalogue entries, Update a colour, View catalogue without manage rights | 1 | — |
| 2 | Invalid or duplicate entries are rejected with typed errors | Create an article, Delete a size, Deny catalogue writes to a viewer, Reject a duplicate article reference, Reject an article with an unknown client, Reject deleting a colour used in an order breakdown, Reject deleting an article referenced by an order, Search catalogue entries, Update a colour, View catalogue without manage rights | 1 | — |
| 3 | Entries still in use cannot be deleted | Create an article, Delete a size, Deny catalogue writes to a viewer, Reject a duplicate article reference, Reject an article with an unknown client, Reject deleting a colour used in an order breakdown, Reject deleting an article referenced by an order, Search catalogue entries, Update a colour, View catalogue without manage rights | 1 | — |
| 4 | Catalogue writes and reads follow the production access… | Create an article, Delete a size, Deny catalogue writes to a viewer, Reject a duplicate article reference, Reject an article with an unknown client, Reject deleting a colour used in an order breakdown, Reject deleting an article referenced by an order, Search catalogue entries, Update a colour, View catalogue without manage rights | 1 | — |
| 5 | The catalogue is usable in the app for planners and… | Browse the catalogue in the UI, Create an entry from the UI, Read-only catalogue for a supervisor, Show a validation error in the UI | 2 | — |

## Scenario coverage

- Scenarios: 14 total, 0 with detected test evidence, 14 without
- ✗ `Create an article` (@w1)
- ✗ `Update a colour` (@w1)
- ✗ `Delete a size` (@w1)
- ✗ `Search catalogue entries` (@w1)
- ✗ `Reject a duplicate article reference` (@w1)
- ✗ `Reject an article with an unknown client` (@w1)
- ✗ `Reject deleting an article referenced by an order` (@w1)
- ✗ `Reject deleting a colour used in an order breakdown` (@w1)
- ✗ `View catalogue without manage rights` (@w1)
- ✗ `Deny catalogue writes to a viewer` (@w1)
- ✗ `Browse the catalogue in the UI` (@w2)
- ✗ `Create an entry from the UI` (@w2)
- ✗ `Show a validation error in the UI` (@w2)
- ✗ `Read-only catalogue for a supervisor` (@w2)

## Demo script (manual walkthrough)

1. **Create an article** — run the app, perform the scenario, observe the outcome.
2. **Update a colour** — run the app, perform the scenario, observe the outcome.
3. **Delete a size** — run the app, perform the scenario, observe the outcome.
4. **Search catalogue entries** — run the app, perform the scenario, observe the outcome.
5. **Browse the catalogue in the UI** — run the app, perform the scenario, observe the outcome.
6. **Create an entry from the UI** — run the app, perform the scenario, observe the outcome.

## Gaps

- 14 scenario(s) lack detected test evidence — verify manually or add checks

Note: 'no evidence' means neither the scenario name nor a
token match was found in test files — verify by hand before
treating it as a real gap. '~' marks weak token-match evidence.

## Outcome follow-up

Optional; this is a post-release learning record, not a finish gate.
- Status: not yet measured
- Owner and review date: (record when known)
- Signal and observed result: (record after release; do not invent)
- Learning or next action: (record after review)