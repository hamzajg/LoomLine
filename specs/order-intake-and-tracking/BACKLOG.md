# Backlog: Order intake and tracking

Items are USER STORIES in the parseable format below — keep the heading
shape `## US<n> — <story>` and the field lines intact so `wave_plan` can
parse them. Write the story as: "As a <role>, I want <goal>, so that
<value>" — the title after the dash IS the story.

```
## US<n> — As a <role>, I want <goal>, so that <value>
- Scenarios: @w1, @w2
- Depends: US1, US3        (optional; omit for wave-1 items)
- Size: S|M|L
- Notes: <one line>
```

Order stories by user value; dependencies express technical order only.

## US1 — As a production planner, I want to create a production order with its article, client, quantity and due date, so that the work is recorded once and can be planned

- Scenarios: @w1
- Size: M
- Notes: includes required-field, positive-quantity and unique-reference validation; persists in DRAFT

## US2 — As a production planner, I want to list orders and filter them by status or reference, so that I can find what needs attention

- Scenarios: @w2
- Depends: US1
- Size: M
- Notes: server-side filter and search; paged list

## US3 — As a production supervisor, I want an order detail view, so that I can verify article, client, quantity and dates before releasing work

- Scenarios: @w2
- Depends: US1
- Size: S
- Notes: read-only detail for the first cut

## US4 — As a production planner, I want to advance an order through valid statuses only and see when each change happened, so that the production state reflects reality

- Scenarios: @w3
- Depends: US1
- Size: M
- Notes: server-enforced transition table; append-only status history; terminal states are final

## US5 — As a planner, I want the order list to remember my filter and the form to point at the first problem, so that I do not repeat work after opening an order

- Scenarios: @w4
- Size: S
- Notes: builds on US2 and US1; the status/reference filter survives a detail round trip and a reload in the same session; a failed save focuses the first invalid field while every missing field is explained
