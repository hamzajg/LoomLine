package com.loomline.order.domain

import java.util.UUID

/**
 * Moves an order along the lifecycle defined by [StatusTransitions].
 *
 * Invariants enforced here, independent of HTTP and PostgreSQL:
 * - the order must exist
 * - a terminal order rejects every transition with [TransitionOrderResult.Terminal]
 * - only pairs in the transition table are accepted
 * - IN_PROGRESS -> CANCELLED requires a non-empty reason
 * - the order's status and exactly one history row are written together
 * - `changedAt` comes from [TimeSource], never the request; `changedBy` is the
 *   authenticated caller's name until per-user attribution is designed
 */
class TransitionOrderUseCase(
    private val orders: OrderRepository,
    private val time: TimeSource,
    private val ids: IdGenerator,
) {
    fun transition(
        orderId: UUID,
        to: OrderStatus,
        reason: String?,
        actor: String,
    ): TransitionOrderResult {
        val order = orders.findById(orderId) ?: return TransitionOrderResult.OrderNotFound
        val from = order.status

        if (from.isTerminal) {
            return TransitionOrderResult.Terminal(from)
        }
        if (!StatusTransitions.allows(from, to)) {
            return TransitionOrderResult.InvalidTransition(from, to)
        }
        if (StatusTransitions.requiresReason(from, to) && reason.isNullOrBlank()) {
            return TransitionOrderResult.ReasonRequired
        }

        val now = time.now()
        val entry = OrderStatusHistoryEntry(
            id = ids.newId(),
            orderId = order.id,
            fromStatus = from,
            toStatus = to,
            reason = reason?.trim()?.takeIf { it.isNotEmpty() },
            changedAt = now,
            changedBy = actor,
        )
        val updated = orders.update(
            order.copy(status = to, updatedAt = now, version = order.version),
        )
        orders.appendStatusHistory(entry)
        return TransitionOrderResult.Transitioned(updated, entry)
    }
}
