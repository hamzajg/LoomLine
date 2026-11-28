# Backlog: article-catalogue

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

## US1 — As a production planner, I want to manage articles, colours and sizes through the API, so that order pickers never depend on seed data or migrations
- Scenarios: @w1
- Size: M
- Notes: CRUD + list/search + validation + in-use delete guard for all three entities

## US2 — As a production planner, I want a catalogue screen in the app, so that I can maintain reference data without calling the API directly
- Scenarios: @w2
- Depends: US1
- Size: M
- Notes: list/search/create/edit per entity, manage-gated controls, read-only for viewers

## US3 — As a production supervisor, I want to browse the catalogue read-only, so that I can check references while planning the floor
- Scenarios: @w1, @w2
- Depends: US1
- Size: S
- Notes: covered by the view/manage split in both waves; no dedicated UI work

## US4 — As a production planner, I want a clear-search action when nothing matches, so that I can return to the full catalogue without retyping

- Scenarios: @w3
- Size: S
- Notes: builds on US2; the no-matches row offers clear search, which empties the field, refocuses it and reloads the full list

## US5 — As a keyboard or screen-reader user, I want a rejected field to be marked and described, so that I can correct it without hunting for the message

- Scenarios: @w4
- Size: S
- Notes: apply ADR 0014 to the editor — `aria-invalid` on the rejected control, `aria-describedby` pointing at its message, message announced with `role="alert"`; server field errors keep every entered value
