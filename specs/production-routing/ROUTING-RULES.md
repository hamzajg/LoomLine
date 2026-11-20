# Routing rules — order instruction sheet

Gate: **G3 — Routing rules agreed** (before wave 1). Owner: product owner.
**STATUS: AGREED by product owner 2026-11-20** — all four open questions
confirmed (single planned duration, optional sheet at release, seeded
read-only machines, `IN_PROGRESS` lock). This file is the authority for the
validation and locking rules below.

## Entities

- `phase` — code + label. Product-wide reference data, seeded for the demo.
- `machine` — reference + label + `active` flag. Equipment reference data,
  seeded for the demo; management ships with the equipment feature.
- Order routing step — `order_id`, `position`, `label`, `phase_id`,
  `machine_id` (nullable), `repetitions`, `minutes`.
  Unique on (`order_id`, `position`); positions are `1..n` with no gaps.

## Rules

1. **Replace-set writes.** `PUT /api/orders/{id}/routing` accepts the complete
   desired list; the server replaces all steps atomically. An empty list
   clears the routing sheet.
2. **Order is the sequence.** The submitted array order is the routing order;
   the server assigns positions `1..n`. Clients do not send positions and
   cannot create gaps or duplicates.
3. **Step validity.** Every step has a non-blank label (trimmed, at most 200
   characters), a known phase, an optional known and active machine, an
   integer `repetitions >= 1` and an integer `minutes >= 1` (planned duration
   for one unit). Any violation rejects the whole write with a field error
   naming the step index and field; nothing is stored.
4. **Optional sheet.** An order may have zero steps. The routing is not
   required to release or start an order in this feature; the outcome signal
   tracks adoption, it is not a hard gate.
5. **Edit window.** Steps may be written only while the order is `DRAFT` or
   `RELEASED`. From `IN_PROGRESS` onward the sheet is locked; attempts return
   `409 ROUTING_LOCKED` and the stored steps are unchanged.
6. **Authorization.** Writes require `production` manage (planner,
   administrator); reads require `production` view (adds supervisor).
   Unauthorized writes return `403`.
7. **No quantity coupling.** `repetitions` is per unit, not derived from the
   order quantity; the sheet does not reconcile against the colour/size
   breakdown. Batch and setup time are out of scope (one `minutes` value).
8. **Reference data.** Phases come from `GET /api/phases` and machines from
   `GET /api/machines` for form pickers; unknown or inactive ids reject the
   write.

## Open questions for the owner

- Confirm one planned duration per step (legacy `Tps`/`TpH`/`TpR` stay out
  until the shop-floor feature defines them).
- Confirm the sheet stays optional at release (adoption measured, not gated).
- Confirm machines are seeded and read-only in this feature (management with
  equipment).
- Confirm the `IN_PROGRESS` lock — a wrong route means cancel and re-create.
