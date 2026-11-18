# Status rules — order lifecycle

Gate: **G4 — Status transition rules agreed** (before wave 3). Owner: product
owner. This file is the authority for AC-6, AC-7, and AC-8.

## States

| Status | Meaning | Terminal |
|--------|---------|:--------:|
| `DRAFT` | Captured, not yet released for production | no |
| `RELEASED` | Released; work may be scheduled | no |
| `IN_PROGRESS` | Work has started on the shop floor | no |
| `COMPLETED` | Work finished successfully | yes |
| `CANCELLED` | Order abandoned; kept for the record | yes |

## Allowed transitions

| From | To | Trigger |
|------|----|---------|
| `DRAFT` | `RELEASED` | Planner releases the order |
| `DRAFT` | `CANCELLED` | Planner cancels before release |
| `RELEASED` | `IN_PROGRESS` | Supervisor starts work |
| `RELEASED` | `CANCELLED` | Planner cancels before work starts |
| `IN_PROGRESS` | `COMPLETED` | Supervisor completes the order |
| `IN_PROGRESS` | `CANCELLED` | Planner cancels mid-production (with note) |
| `COMPLETED` | — | none (terminal) |
| `CANCELLED` | — | none (terminal) |

Any pair not listed above is rejected. There is no "reopen" in v1.

## Rules

1. **Server-enforced.** The transition table lives in the domain layer and is
   applied inside the same transaction that writes the order and its history
   row. The client may hide impossible buttons, but that is a convenience, not
   the rule.
2. **History is append-only.** Every accepted transition inserts one
   `order_status_history` row with `order_id`, `from_status`, `to_status`,
   `changed_at` (UTC), and `changed_by` (a placeholder actor until the
   authentication feature lands; never null).
3. **Timestamps are server-side.** `changed_at` comes from an injected `Clock`,
   never from the request payload.
4. **Rejections are typed.** An illegal transition returns
   `409 Conflict` with `{code: "INVALID_STATUS_TRANSITION", message, from, to}`;
   a terminal-state attempt returns `409` with
   `{code: "ORDER_TERMINAL", message, status}`. Neither changes the order.
5. **Cancellation reason.** Cancelling from `IN_PROGRESS` requires a non-empty
   reason (stored on the history row); other cancels keep the reason optional.
6. **No implicit transitions.** Creating an order always produces `DRAFT`; no
   other status may be set on create, even if supplied in the payload.
7. **Idempotence guard.** A transition to the current status is rejected as
   invalid (it is not in the table), not silently accepted.
8. **Concurrency.** The order row is versioned (`@Version` / `updated_at`
   check); a stale transition returns `409` with `code: "STALE_ORDER"` rather
   than overwriting a newer status.

## Test obligations (wave 3)

- Table-driven unit tests over the full 5×5 matrix: every allowed pair passes,
  every other pair rejects, both terminal rows reject all targets.
- Integration test: transition writes exactly one history row with the
  `from`/`to` pair and a server timestamp.
- Contract test: rejection shapes for `INVALID_STATUS_TRANSITION`,
  `ORDER_TERMINAL`, and `STALE_ORDER`.
