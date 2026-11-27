# Backlog: order-composition

Items are USER STORIES in the parseable format below — keep the heading
shape `## US<n> — <story>` and the field lines intact so `wave_plan` can
parse them. Write the story as: "As a <role>, I want <goal>, so that
<value>" — the title after the dash IS the story.

## US1 — As a production planner, I want to record the colour and size quantities of an order, so that production can be planned per variant
- Scenarios: @w1
- Size: M
- Notes: replace-set API; sum may not exceed order quantity (partial allowed)

## US2 — As a production planner, I want composition changes blocked once production starts, so that the breakdown stays a fact of production
- Scenarios: @w2
- Depends: US1
- Size: S
- Notes: editable in DRAFT/RELEASED only

## US3 — As a production supervisor, I want to see the colour/size breakdown on an order, so that I can verify what to produce
- Scenarios: @w2
- Depends: US1
- Size: S
- Notes: read-only for view-only roles; UI in order detail

## US4 — As a production planner, I want to see the planned and remaining quantities while editing, so that I catch an over-total before saving

- Scenarios: @w3
- Size: S
- Notes: builds on US1; the editor shows planned total and remaining against the order, and warns as soon as the draft goes over; saving still replaces the whole set
