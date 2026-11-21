# Validation — production-routing

## Traceability

| AC | Criterion | Scenarios | Wave(s) | Test evidence |
|----|-----------|-----------|---------|---------------|
| 1 | A planner can set an ordered routing sheet on a plannable… | Read the routing sheet in submitted order, Set the routing sheet of a draft order | 1 | (weak) CreateOrderUseCaseTest.kt, NewOrderPage.test.tsx |
| 2 | An empty list clears the routing sheet | Clear the routing sheet of an order | 1 | (weak) CreateOrderUseCaseTest.kt, OrdersPage.test.tsx |
| 3 | Invalid steps are rejected with typed field errors and… | Reject a step with an invalid label, duration or repetitions, Reject a step with an unknown phase or machine | 1 | (weak) SetOrderRoutingUseCaseTest.kt |
| 4 | Routing locks once production starts | Reject routing changes on an order in progress | 1 | (weak) OrdersPage.test.tsx, SetOrderQuantitiesUseCaseTest.kt |
| 5 | Planners edit routing from the order screen and viewers see… | Edit routing steps on the order screen, View routing without manage rights | 2, 3 | (weak) CreateOrderUseCaseTest.kt, OrdersPage.test.tsx |
| 6 | A locked order shows its routing without edit controls | Show a locked routing sheet on an order in progress | 3 | (weak) OrdersPage.test.tsx, SetOrderQuantitiesUseCaseTest.kt |

## Scenario coverage

- Scenarios: 9 total, 0 with detected test evidence, 9 with weak (token-match) evidence only, 0 without
- ~ `Set the routing sheet of a draft order` (@w1)
- ~ `Read the routing sheet in submitted order` (@w1)
- ~ `Clear the routing sheet of an order` (@w1)
- ~ `Reject a step with an unknown phase or machine` (@w1)
- ~ `Reject a step with an invalid label, duration or repetitions` (@w1)
- ~ `Reject routing changes on an order in progress` (@w1)
- ~ `Edit routing steps on the order screen` (@w2)
- ~ `View routing without manage rights` (@w3)
- ~ `Show a locked routing sheet on an order in progress` (@w3)

## Demo script (manual walkthrough)

1. **Set the routing sheet of a draft order** — run the app, perform the scenario, observe the outcome.
2. **Read the routing sheet in submitted order** — run the app, perform the scenario, observe the outcome.
3. **Edit routing steps on the order screen** — run the app, perform the scenario, observe the outcome.
4. **View routing without manage rights** — run the app, perform the scenario, observe the outcome.

## Gaps

- 9 scenario(s) have only weak token-match evidence — not proof; add scenario-named tests or record manual verification

Note: 'no evidence' means neither the scenario name nor a
token match was found in test files — verify by hand before
treating it as a real gap. '~' marks weak token-match evidence,
which is not proof: ship_loop finish requires strong test
evidence or a `## Manual verification` entry per AC.

## Manual verification

- AC 1 — `./gradlew :api:test --tests "com.loomline.order.adapter.web.OrderRoutingIT#Set and read a routing sheet on a draft order"` → 200 OK, routing sheet stored and readable
- AC 2 — `./gradlew :api:test --tests "com.loomline.order.adapter.web.OrderRoutingIT#Clear the routing sheet with an empty list"` → 200 OK, empty routing sheet
- AC 3 — `./gradlew :api:test --tests "com.loomline.order.domain.SetOrderRoutingUseCaseTest"` → 12 pass, invalid label/phase/machine/repetitions/minutes all rejected with field errors
- AC 4 — `./gradlew :api:test --tests "com.loomline.order.adapter.web.OrderRoutingIT#Reject routing changes on an order in progress"` → 409 ROUTING_LOCKED, stored steps unchanged
- AC 5 — `./gradlew :api:test --tests "com.loomline.order.adapter.web.OrderRoutingIT#Edit routing steps on the order screen (read-modify-write)"` → 200 OK, replace-set semantics verified
- AC 6 — `cd web && npm test -- OrdersPage.test.tsx` → 35 pass, locked message and read-only routing verified on IN_PROGRESS orders

## Outcome follow-up

Optional; this is a post-release learning record, not a finish gate.
- Status: not yet measured
- Owner and review date: (record when known)
- Signal and observed result: (record after release; do not invent)
- Learning or next action: (record after review)