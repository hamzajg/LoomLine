package com.loomline.order.domain

/**
 * Creates a production order.
 *
 * Invariants enforced here, independent of HTTP and PostgreSQL:
 * - reference is required, trimmed, at most 64 characters, unique (case-insensitive)
 * - client and article are required and must exist
 * - quantity is required and strictly positive
 * - due date is required
 * - new orders always start in [OrderStatus.DRAFT]
 */
class CreateOrderUseCase(
    private val orders: OrderRepository,
    private val catalog: ReferenceCatalog,
    private val time: TimeSource,
    private val ids: IdGenerator,
) {
    fun create(input: NewOrder): CreateOrderResult {
        val errors = linkedMapOf<String, String>()

        val reference = input.reference?.trim().orEmpty()
        when {
            reference.isEmpty() -> errors["reference"] = "Reference is required."
            reference.length > MAX_REFERENCE_LENGTH ->
                errors["reference"] = "Reference must be at most $MAX_REFERENCE_LENGTH characters."
        }

        when {
            input.clientId == null -> errors["clientId"] = "Client is required."
            !catalog.clientExists(input.clientId) -> errors["clientId"] = "Unknown client."
        }

        when {
            input.articleId == null -> errors["articleId"] = "Article is required."
            !catalog.articleExists(input.articleId) -> errors["articleId"] = "Unknown article."
        }

        when {
            input.quantity == null -> errors["quantity"] = "Quantity is required."
            input.quantity <= 0 -> errors["quantity"] = "Quantity must be greater than zero."
            input.quantity > MAX_QUANTITY ->
                errors["quantity"] = "Quantity must be at most $MAX_QUANTITY."
        }

        if (input.dueDate == null) {
            errors["dueDate"] = "Due date is required."
        }

        if (errors.isNotEmpty()) {
            return CreateOrderResult.Invalid(errors)
        }

        if (orders.existsByReference(reference)) {
            return CreateOrderResult.DuplicateReference
        }

        val now = time.now()
        val order = Order(
            id = ids.newId(),
            reference = reference,
            clientId = requireNotNull(input.clientId),
            articleId = requireNotNull(input.articleId),
            quantity = requireNotNull(input.quantity),
            dueDate = requireNotNull(input.dueDate),
            status = OrderStatus.DRAFT,
            createdAt = now,
            updatedAt = now,
            version = 0,
        )

        return CreateOrderResult.Created(orders.save(order))
    }

    private companion object {
        const val MAX_REFERENCE_LENGTH = 64
        const val MAX_QUANTITY = 1_000_000
    }
}
