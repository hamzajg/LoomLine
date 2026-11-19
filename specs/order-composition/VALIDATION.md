# Validation — order-composition

## Traceability

| AC | Criterion | Scenarios | Wave(s) | Test evidence |
|----|-----------|-----------|---------|---------------|
| 1 | A planner can set the colour/size quantity breakdown on a… | Read the breakdown of an order, Reject a breakdown exceeding the order quantity, Reject a breakdown with an unknown colour or size, Set the colour-size breakdown of an order | 1 | (weak) NewOrderPage.test.tsx, SetOrderQuantitiesUseCaseTest.kt |
| 2 | Invalid breakdowns are rejected with typed errors and… | Read the breakdown of an order, Reject a breakdown exceeding the order quantity, Reject a breakdown with an unknown colour or size, Set the colour-size breakdown of an order | 1 | (weak) NewOrderPage.test.tsx, SetOrderQuantitiesUseCaseTest.kt |
| 3 | The breakdown locks once production starts | Reject composition changes on an order in progress, View the breakdown without manage rights | 2 | (weak) OrdersPage.test.tsx, SetOrderQuantitiesUseCaseTest.kt |
| 4 | Viewers see the breakdown without being able to change it | Reject composition changes on an order in progress, View the breakdown without manage rights | 2 | (weak) OrdersPage.test.tsx, SetOrderQuantitiesUseCaseTest.kt |

## Scenario coverage

- Scenarios: 6 total, 0 with detected test evidence, 6 with weak (token-match) evidence only, 0 without
- ~ `Set the colour-size breakdown of an order` (@w1)
- ~ `Read the breakdown of an order` (@w1)
- ~ `Reject a breakdown exceeding the order quantity` (@w1)
- ~ `Reject a breakdown with an unknown colour or size` (@w1)
- ~ `Reject composition changes on an order in progress` (@w2)
- ~ `View the breakdown without manage rights` (@w2)

## Demo script (manual walkthrough)

1. **Set the colour-size breakdown of an order** — run the app, perform the scenario, observe the outcome.
2. **Read the breakdown of an order** — run the app, perform the scenario, observe the outcome.
3. **View the breakdown without manage rights** — run the app, perform the scenario, observe the outcome.

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