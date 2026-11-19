# Validation — order-intake-and-tracking

## Traceability

| AC | Criterion | Scenarios | Wave(s) | Test evidence |
|----|-----------|-----------|---------|---------------|
| 1 | A valid order is saved with status DRAFT and can be… | Create a production order, Reject a duplicate order reference, Reject a missing required field, Reject an order with a non-positive quantity | 1 | (weak) App.test.tsx, AppShell.test.tsx |
| 2 | A duplicate order reference is rejected and no second order… | Create a production order, Reject a duplicate order reference, Reject a missing required field, Reject an order with a non-positive quantity | 1 | (weak) App.test.tsx, AppShell.test.tsx |
| 3 | An order with a non-positive quantity is rejected and… | Create a production order, Reject a duplicate order reference, Reject a missing required field, Reject an order with a non-positive quantity | 1 | (weak) App.test.tsx, AppShell.test.tsx |
| 4 | The order list can be filtered by status | Filter orders by status, Find an order by reference, View an order's details | 2 | OrdersPage.test.tsx |
| 5 | An order detail shows reference, article, client, quantity… | Filter orders by status, Find an order by reference, View an order's details | 2 | OrdersPage.test.tsx |
| 6 | An order advances through the allowed lifecycle and the… | Advance an order through its lifecycle, Reject an invalid status transition, Terminal orders cannot be cancelled | 3 | OrdersPage.test.tsx |
| 7 | An invalid status transition is rejected and the status is… | Advance an order through its lifecycle, Reject an invalid status transition, Terminal orders cannot be cancelled | 3 | OrdersPage.test.tsx |
| 8 | A terminal order (COMPLETED/CANCELLED) cannot be… | Advance an order through its lifecycle, Reject an invalid status transition, Terminal orders cannot be cancelled | 3 | OrdersPage.test.tsx |
| 9 | An order missing a required field is rejected and the… | Create a production order, Reject a duplicate order reference, Reject a missing required field, Reject an order with a non-positive quantity | 1 | (weak) App.test.tsx, AppShell.test.tsx |
| 10 | The order list can be searched by reference | Filter orders by status, Find an order by reference, View an order's details | 2 | OrdersPage.test.tsx |

## Scenario coverage

- Scenarios: 10 total, 4 with detected test evidence, 6 with weak (token-match) evidence only, 0 without
- ~ `Create a production order` (@w1)
- ~ `Reject a duplicate order reference` (@w1)
- ~ `Reject an order with a non-positive quantity` (@w1)
- ~ `Reject a missing required field` (@w1)
- ✓ `Filter orders by status` (@w2)
- ✓ `Find an order by reference` (@w2)
- ✓ `View an order's details` (@w2)
- ✓ `Advance an order through its lifecycle` (@w3)
- ~ `Reject an invalid status transition` (@w3)
- ~ `Terminal orders cannot be cancelled` (@w3)

## Demo script (manual walkthrough)

1. **Create a production order** — run the app, perform the scenario, observe the outcome.
2. **Filter orders by status** — run the app, perform the scenario, observe the outcome.
3. **Find an order by reference** — run the app, perform the scenario, observe the outcome.
4. **View an order's details** — run the app, perform the scenario, observe the outcome.
5. **Advance an order through its lifecycle** — run the app, perform the scenario, observe the outcome.

## Gaps

- none — spec is fully traced

Note: 'no evidence' means neither the scenario name nor a
token match was found in test files — verify by hand before
treating it as a real gap. '~' marks weak token-match evidence.

## Outcome follow-up

Optional; this is a post-release learning record, not a finish gate.
- Status: not yet measured
- Owner and review date: (record when known)
- Signal and observed result: (record after release; do not invent)
- Learning or next action: (record after review)