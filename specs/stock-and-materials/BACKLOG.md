# Backlog: stock-and-materials

Items are USER STORIES in the parseable format below — keep the heading
shape `## US<n> — <story>` and the field lines intact so `wave_plan` can
parse them. Write the story as: "As a <role>, I want <goal>, so that
<value>" — the title after the dash IS the story.

## US1 — As an inventory manager, I want to manage material masters, so that stock items have stable codes, kinds, units, and supplier references
- Scenarios: @w1
- Size: M
- Notes: create/list/filter only; deactivate is the delete path once movements exist

## US2 — As an inventory manager, I want to post stock receipts, issues, and adjustments, so that the ledger reflects physical stock movement
- Scenarios: @w1
- Size: M
- Notes: append-only movements; typed validation; adjustment reason required

## US3 — As a production supervisor, I want to read derived stock levels by material and location, so that availability answers come from the product
- Scenarios: @w1
- Size: S
- Notes: level is derived from movements, never a second write model

## US4 — As an inventory manager, I want stock screens for materials, movements, and levels, so that daily stock work does not leave the product
- Scenarios: @w2
- Depends: US1, US2, US3
- Size: M
- Notes: manage vs view grants; empty states; field-level errors

## US5 — As a production supervisor, I want stock access to stay read-only, so that only authorized managers can change inventory truth
- Scenarios: @w2
- Depends: US1, US2, US3
- Size: S
- Notes: reuse section grant contract; no client-side authorization decisions

## US6 — As an inventory manager, I want stock guardrails enforced, so that corrections are explicit and balances cannot silently go negative
- Scenarios: @w3
- Depends: US4, US5
- Size: M
- Notes: adjustment reason, insufficient-stock rejection, location scoping, no delete-with-history
