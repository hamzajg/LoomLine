package com.loomline.order.domain

import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * The production lifecycle of an order.
 *
 * The set of legal transitions is intentionally not expressed here yet; wave 3
 * adds the transition table that owns it.
 */
enum class OrderStatus {
    DRAFT,
    RELEASED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED;

    val isTerminal: Boolean
        get() = this == COMPLETED || this == CANCELLED
}

/** A stored production order. Framework-free: no persistence or CDI types. */
data class Order(
    val id: UUID,
    val reference: String,
    val clientId: UUID,
    val articleId: UUID,
    val quantity: Int,
    val dueDate: LocalDate,
    val status: OrderStatus,
    val createdAt: Instant,
    val updatedAt: Instant,
    val version: Long,
)

/** Raw create request. Every field is optional so validation can report all errors. */
data class NewOrder(
    val reference: String?,
    val clientId: UUID?,
    val articleId: UUID?,
    val quantity: Int?,
    val dueDate: LocalDate?,
)

sealed interface CreateOrderResult {
    data class Created(val order: Order) : CreateOrderResult

    /** The request was rejected; [fieldErrors] is keyed by request field name. */
    data class Invalid(val fieldErrors: Map<String, String>) : CreateOrderResult

    /** An order with the same reference (case-insensitive) already exists. */
    data object DuplicateReference : CreateOrderResult
}
