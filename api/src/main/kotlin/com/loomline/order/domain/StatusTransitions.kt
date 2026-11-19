package com.loomline.order.domain

import java.time.Instant
import java.util.UUID

/**
 * The legal order lifecycle, per STATUS-RULES.md. This is the single
 * transition table: the use case consults it and nothing else may.
 */
object StatusTransitions {

    private val allowed: Map<OrderStatus, Set<OrderStatus>> = mapOf(
        OrderStatus.DRAFT to setOf(OrderStatus.RELEASED, OrderStatus.CANCELLED),
        OrderStatus.RELEASED to setOf(OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED),
        OrderStatus.IN_PROGRESS to setOf(OrderStatus.COMPLETED, OrderStatus.CANCELLED),
        OrderStatus.COMPLETED to emptySet(),
        OrderStatus.CANCELLED to emptySet(),
    )

    fun allows(from: OrderStatus, to: OrderStatus): Boolean =
        allowed[from]?.contains(to) == true

    fun allowedTargets(from: OrderStatus): Set<OrderStatus> = allowed[from] ?: emptySet()

    /** Cancelling mid-production must carry a reason; other cancels may not. */
    fun requiresReason(from: OrderStatus, to: OrderStatus): Boolean =
        from == OrderStatus.IN_PROGRESS && to == OrderStatus.CANCELLED
}

/** One append-only row of order status history. */
data class OrderStatusHistoryEntry(
    val id: UUID,
    val orderId: UUID,
    val fromStatus: OrderStatus?,
    val toStatus: OrderStatus,
    val reason: String?,
    val changedAt: Instant,
    val changedBy: String,
)

sealed interface TransitionOrderResult {
    data class Transitioned(
        val order: Order,
        val history: OrderStatusHistoryEntry,
    ) : TransitionOrderResult

    /** [to] is not reachable from the order's current status. */
    data class InvalidTransition(val from: OrderStatus, val to: OrderStatus) :
        TransitionOrderResult

    /** The order is COMPLETED or CANCELLED; no transition leaves a terminal state. */
    data class Terminal(val status: OrderStatus) : TransitionOrderResult

    /** IN_PROGRESS -> CANCELLED requires a non-empty reason. */
    data object ReasonRequired : TransitionOrderResult

    data object OrderNotFound : TransitionOrderResult
}
