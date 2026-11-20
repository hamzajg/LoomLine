# Backlog: production-routing

Items are USER STORIES in the parseable format below — keep the heading
shape `## US<n> — <story>` and the field lines intact so `wave_plan` can
parse them. Write the story as: "As a <role>, I want <goal>, so that
<value>" — the title after the dash IS the story.

## US1 — As a production planner, I want to record an ordered routing sheet on an order, so that the shop floor has a sequence of steps to execute
- Scenarios: @w1
- Size: M
- Notes: replace-set API; server assigns positions 1..n; empty list clears

## US2 — As a production planner, I want invalid routing steps refused atomically, so that a partial or contradictory sheet never reaches the floor
- Scenarios: @w1
- Size: S
- Notes: unknown phase/machine, blank label, non-positive minutes or repetitions

## US3 — As a production planner, I want to edit the routing on the order screen, so that I can correct the sequence without leaving the order
- Scenarios: @w2
- Depends: US1
- Size: M
- Notes: add/remove/reorder in the order detail; save replaces the sheet

## US4 — As a production supervisor, I want to read the routing sheet and see locked orders, so that I can work from the same sequence without changing it
- Scenarios: @w3
- Depends: US3
- Size: S
- Notes: read-only for production view; locked message from IN_PROGRESS
