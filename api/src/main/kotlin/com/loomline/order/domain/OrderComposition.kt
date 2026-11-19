package com.loomline.order.domain

import java.util.UUID

/** One colour × size × quantity entry in an order's breakdown. */
data class QuantityLine(
    val colourId: UUID,
    val sizeId: UUID,
    val quantity: Int,
)

/** A persisted quantity line, including its storage id. */
data class OrderQuantityLine(
    val id: UUID,
    val orderId: UUID,
    val colourId: UUID,
    val sizeId: UUID,
    val quantity: Int,
)

/** Reference rows for the composition pickers. */
data class ColourView(val id: UUID, val code: String, val label: String)

data class SizeView(val id: UUID, val code: String, val label: String, val sizeType: String)

sealed interface SetQuantitiesResult {
    data class Saved(val lines: List<OrderQuantityLine>) : SetQuantitiesResult

    data object OrderNotFound : SetQuantitiesResult

    /** Composition is editable only in DRAFT and RELEASED (COMPOSITION-RULES.md). */
    data class Locked(val status: OrderStatus) : SetQuantitiesResult

    /** The request was rejected; [fieldErrors] is keyed by request field. */
    data class Invalid(val fieldErrors: Map<String, String>) : SetQuantitiesResult
}

/**
 * Replaces an order's colour/size breakdown (replace-set semantics).
 *
 * Invariants enforced here, independent of HTTP and PostgreSQL:
 * - the order must exist and be DRAFT or RELEASED
 * - every quantity is a positive integer; colour+size pairs are unique
 * - every colour and size must exist; the size's type must match the
 *   order article's size type
 * - the sum of line quantities may not exceed the order quantity
 *   (partial breakdowns are allowed — COMPOSITION-RULES.md rule 2)
 * - an empty list clears the breakdown
 */
class SetOrderQuantitiesUseCase(
    private val orders: OrderRepository,
    private val catalog: ReferenceCatalog,
) {
    fun set(orderId: UUID, input: List<QuantityLine>): SetQuantitiesResult {
        val order = orders.findById(orderId) ?: return SetQuantitiesResult.OrderNotFound
        if (order.status != OrderStatus.DRAFT && order.status != OrderStatus.RELEASED) {
            return SetQuantitiesResult.Locked(order.status)
        }

        val errors = linkedMapOf<String, String>()
        val seen = mutableSetOf<Pair<UUID, UUID>>()
        input.forEachIndexed { i, line ->
            when {
                line.quantity <= 0 ->
                    errors["lines[$i].quantity"] = "Quantity must be greater than zero."
                !seen.add(line.colourId to line.sizeId) ->
                    errors["lines[$i]"] = "Duplicate colour/size pair."
            }
            if (!catalog.colourExists(line.colourId)) {
                errors["lines[$i].colourId"] = "Unknown colour."
            }
            if (!catalog.sizeExists(line.sizeId)) {
                errors["lines[$i].sizeId"] = "Unknown size."
            } else {
                val articleType = catalog.articleSizeType(order.articleId)
                val sizeType = catalog.sizeTypeOf(line.sizeId)
                if (articleType != null && sizeType != null &&
                    !articleType.equals(sizeType, ignoreCase = true)
                ) {
                    errors["lines[$i].sizeId"] = "Size does not belong to the article's size type."
                }
            }
        }
        val total = input.sumOf { it.quantity }
        if (total > order.quantity) {
            errors["lines"] = "Total $total exceeds the order quantity ${order.quantity}."
        }
        if (errors.isNotEmpty()) {
            return SetQuantitiesResult.Invalid(errors)
        }

        orders.replaceQuantities(
            orderId,
            input.map { QuantityLine(it.colourId, it.sizeId, it.quantity) },
        )
        return SetQuantitiesResult.Saved(orders.quantities(orderId))
    }
}
