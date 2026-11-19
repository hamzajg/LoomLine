# Composition rules — order quantity breakdown

Gate: **G3 — Composition rules agreed** (before wave 1). Owner: product
owner. **STATUS: PROPOSED — awaiting owner sign-off.** This file is the
authority for the validation and locking rules below.

## Entities

- `colour` — code + label. Colours are product-wide reference data.
- `size` — code + label + `size_type`. Sizes belong to a size type.
- Order quantity line — `order_id`, `colour_id`, `size_id`, `quantity`.
  Unique on (`order_id`, `colour_id`, `size_id`).

## Rules

1. **Replace-set writes.** `PUT /api/orders/{id}/quantities` accepts the
   complete desired list; the server replaces all lines atomically. An
   empty list clears the breakdown.
2. **Optional but reconciling.** An order may have zero lines. When at
   least one line exists, every quantity must be a positive integer and
   `sum(quantity) == order.quantity`. A mismatch rejects the whole write —
   partial breakdowns are never stored.
3. **Edit window.** Lines may be written only while the order is `DRAFT` or
   `RELEASED`. From `IN_PROGRESS` onward the breakdown is locked; attempts
   return `409 COMPOSITION_LOCKED`.
4. **Size compatibility.** A line's size must belong to the same
   `size_type` as the order's article. Mismatches reject with a field error
   naming the line index.
5. **Authorization.** Writes require `production` manage (planner,
   administrator); reads require `production` view (adds supervisor).
6. **Reference data.** Colours and sizes come from `GET /api/colours` and
   `GET /api/sizes` for form pickers; unknown ids reject the write.

## Open questions for the owner

- Should clearing all lines be allowed on a RELEASED order (returns the
  order to "no breakdown")? Proposed: yes — the lock, not emptiness, is the
  guard.
- Do partial (non-reconciling) breakdowns have a legitimate use? Proposed:
  no for v1; revisit if planners need progressive entry.
