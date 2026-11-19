# Waves — order-composition

Each wave IS an iteration: a time-boxed, independently shippable
increment — one branch, one PR, green tests, demoable outcome.
Do not start wave N+1 until wave N merges.

## Wave 1 — iteration 1

Scenarios proven by this wave:
- Set the colour-size breakdown of an order
- Read the breakdown of an order
- Reject a breakdown that does not reconcile
- Reject a breakdown with an unknown colour or size

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US1 | As a production planner, I want to record the colour and size quantities of an order, so that production can be planned per variant | M | — | replace-set API; sum must equal order quantity when lines exist |

## Wave 2 — iteration 2

Scenarios proven by this wave:
- Reject composition changes on an order in progress
- View the breakdown without manage rights

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US2 | As a production planner, I want composition changes blocked once production starts, so that the breakdown stays a fact of production | S | US1 | editable in DRAFT/RELEASED only |
| US3 | As a production supervisor, I want to see the colour/size breakdown on an order, so that I can verify what to produce | S | US1 | read-only for view-only roles; UI in order detail |
