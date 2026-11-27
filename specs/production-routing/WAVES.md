# Waves — production-routing

Each wave IS an iteration: a time-boxed, independently shippable
increment — one branch, one PR, green tests, demoable outcome.
Do not start wave N+1 until wave N merges.

## Wave 1 — iteration 1

Scenarios proven by this wave:
- Set the routing sheet of a draft order
- Read the routing sheet in submitted order
- Clear the routing sheet of an order
- Reject a step with an unknown phase or machine
- Reject a step with an invalid label, duration or repetitions
- Reject routing changes on an order in progress

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US1 | As a production planner, I want to record an ordered routing sheet on an order, so that the shop floor has a sequence of steps to execute | M | — | replace-set API; server assigns positions 1..n; empty list clears |
| US2 | As a production planner, I want invalid routing steps refused atomically, so that a partial or contradictory sheet never reaches the floor | S | — | unknown phase/machine, blank label, non-positive minutes or repetitions |

## Wave 2 — iteration 2

Scenarios proven by this wave:
- Edit routing steps on the order screen

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US3 | As a production planner, I want to edit the routing on the order screen, so that I can correct the sequence without leaving the order | M | US1 | add/remove/reorder in the order detail; save replaces the sheet |

## Wave 3 — iteration 3

Scenarios proven by this wave:
- View routing without manage rights
- Show a locked routing sheet on an order in progress

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US4 | As a production supervisor, I want to read the routing sheet and see locked orders, so that I can work from the same sequence without changing it | S | US3 | read-only for production view; locked message from IN_PROGRESS |

## Wave 4 — iteration 4

Scenarios proven by this wave:
- The routing sheet shows its total and reorders from the keyboard
- An empty routing sheet asks before it clears

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US5 | As a production planner, I want the routing sheet to show its planned total, reorder from the keyboard, and confirm a clear, so that I can sequence work safely | S | — | builds on US3; move up/down buttons beside each step (disabled at the ends), planned minutes per unit visible while editing, and an empty save asks before it removes every step |
