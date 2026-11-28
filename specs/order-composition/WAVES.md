# Waves — order-composition

Each wave IS an iteration: a time-boxed, independently shippable
increment — one branch, one PR, green tests, demoable outcome.
Do not start wave N+1 until wave N merges.

## Wave 1 — iteration 1

Scenarios proven by this wave:
- Set the colour-size breakdown of an order
- Read the breakdown of an order
- Reject a breakdown exceeding the order quantity
- Reject a breakdown with an unknown colour or size

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US1 | As a production planner, I want to record the colour and size quantities of an order, so that production can be planned per variant | M | — | replace-set API; sum may not exceed order quantity (partial allowed) |

## Wave 2 — iteration 2

Scenarios proven by this wave:
- Reject composition changes on an order in progress
- View the breakdown without manage rights

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US2 | As a production planner, I want composition changes blocked once production starts, so that the breakdown stays a fact of production | S | US1 | editable in DRAFT/RELEASED only |
| US3 | As a production supervisor, I want to see the colour/size breakdown on an order, so that I can verify what to produce | S | US1 | read-only for view-only roles; UI in order detail |

## Wave 3 — iteration 3

Scenarios proven by this wave:
- The editor shows planned and remaining quantities

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US4 | As a production planner, I want to see the planned and remaining quantities while editing, so that I catch an over-total before saving | S | — | builds on US1; the editor shows planned total and remaining against the order, and warns as soon as the draft goes over; saving still replaces the whole set |

## Wave 4 — iteration 4

Scenarios proven by this wave:
- A rejected breakdown marks its quantity lines

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US5 | As a keyboard or screen-reader user, I want a rejected breakdown to mark the quantity lines and name the message, so that I know which lines to correct | S | — | apply ADR 0014 to the breakdown editor — rejected lines are `aria-invalid`, reference the single alert with `aria-describedby`, and every entered value is kept |
