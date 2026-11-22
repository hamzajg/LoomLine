# Waves — stock-and-materials

Each wave IS an iteration: a time-boxed, independently shippable
increment — one branch, one PR, green tests, demoable outcome.
Do not start wave N+1 until wave N merges.

## Wave 1 — iteration 1

Scenarios proven by this wave:
- Create a material with a stable code
- List and filter materials
- Post a stock receipt
- Post a stock issue
- Reject a movement with unknown material or location
- Reject a movement with non-positive quantity

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US1 | As an inventory manager, I want to manage material masters, so that stock items have stable codes, kinds, units, and supplier references | M | — | create/list/filter only; deactivate is the delete path once movements exist |
| US2 | As an inventory manager, I want to post stock receipts, issues, and adjustments, so that the ledger reflects physical stock movement | M | — | append-only movements; typed validation; adjustment reason required |
| US3 | As a production supervisor, I want to read derived stock levels by material and location, so that availability answers come from the product | S | — | level is derived from movements, never a second write model |

## Wave 2 — iteration 2

Scenarios proven by this wave:
- Post a movement from the stock screen
- View stock levels read-only as supervisor
- Show an empty stock workspace with a create path

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US4 | As an inventory manager, I want stock screens for materials, movements, and levels, so that daily stock work does not leave the product | M | US1, US2, US3 | manage vs view grants; empty states; field-level errors |
| US5 | As a production supervisor, I want stock access to stay read-only, so that only authorized managers can change inventory truth | S | US1, US2, US3 | reuse section grant contract; no client-side authorization decisions |

## Wave 3 — iteration 3

Scenarios proven by this wave:
- Adjust stock with a required reason
- Reject an adjustment without a reason
- Reject an issue that would make the balance negative
- Keep stock levels scoped by location
- Prevent deleting a material that has movements
- Deny stock manage actions without the manage grant

| Item | Title | Size | Deps | Notes |
|------|-------|------|------|-------|
| US6 | As an inventory manager, I want stock guardrails enforced, so that corrections are explicit and balances cannot silently go negative | M | US4, US5 | adjustment reason, insufficient-stock rejection, location scoping, no delete-with-history |
