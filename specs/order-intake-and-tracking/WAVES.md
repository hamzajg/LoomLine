# Waves — order-intake-and-tracking

Each wave IS an iteration: a time-boxed, independently shippable
increment — one branch, one PR, green tests, demoable outcome.
Do not start wave N+1 until wave N merges.

## Wave 1 — iteration 1

Scenarios proven by this wave:
- Create a production order
- Reject a duplicate order reference
- Reject an order with a non-positive quantity
- Reject a missing required field

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US1 | As a production planner, I want to create a production order with its article, client, quantity and due date, so that the work is recorded once and can be planned | M | — | includes required-field, positive-quantity and unique-reference validation; persists in DRAFT |

## Wave 2 — iteration 2

Scenarios proven by this wave:
- Filter orders by status
- Find an order by reference
- View an order's details

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US2 | As a production planner, I want to list orders and filter them by status or reference, so that I can find what needs attention | M | US1 | server-side filter and search; paged list |
| US3 | As a production supervisor, I want an order detail view, so that I can verify article, client, quantity and dates before releasing work | S | US1 | read-only detail for the first cut |

## Wave 3 — iteration 3

Scenarios proven by this wave:
- Advance an order through its lifecycle
- Reject an invalid status transition
- Terminal orders cannot be cancelled

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US4 | As a production planner, I want to advance an order through valid statuses only and see when each change happened, so that the production state reflects reality | M | US1 | server-enforced transition table; append-only status history; terminal states are final |

## Wave 4 — iteration 4

Scenarios proven by this wave:
- Order list keeps its filter after a detail visit
- A failed save focuses the first invalid field

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US5 | As a planner, I want the order list to remember my filter and the form to point at the first problem, so that I do not repeat work after opening an order | S | — | builds on US2 and US1; the status/reference filter survives a detail round trip and a reload in the same session; a failed save focuses the first invalid field while every missing field is explained |

## Wave 5 — iteration 5

Scenarios proven by this wave:
- The order list announces its result count

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US6 | As a screen-reader user, I want the order list to announce loading and its result count, so that filtering is not a silent change | S | — | apply ADR 0014 to the list — a polite live region reports loading and "N orders shown" after each filter change |
