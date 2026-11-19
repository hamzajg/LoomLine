# Backlog: order-composition

Items are USER STORIES in the parseable format below — keep the heading
shape `## US<n> — <story>` and the field lines intact so `wave_plan` can
parse them. Write the story as: "As a <role>, I want <goal>, so that
<value>" — the title after the dash IS the story.

## US1 — As a production planner, I want to record the colour and size quantities of an order, so that production can be planned per variant
- Scenarios: Set the colour-size breakdown of an order, Read the breakdown of an order, Reject a breakdown that does not reconcile, Reject a breakdown with an unknown colour or size
- Size: M
- Notes: replace-set API; sum must equal order quantity when lines exist

## US2 — As a production planner, I want composition changes blocked once production starts, so that the breakdown stays a fact of production
- Scenarios: Reject composition changes on an order in progress
- Depends: US1
- Size: S
- Notes: editable in DRAFT/RELEASED only

## US3 — As a production supervisor, I want to see the colour/size breakdown on an order, so that I can verify what to produce
- Scenarios: View the breakdown without manage rights
- Depends: US1
- Size: S
- Notes: read-only for view-only roles; UI in order detail
