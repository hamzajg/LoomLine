package com.loomline.order.application

import com.loomline.order.domain.CreateOrderResult
import com.loomline.order.domain.CreateOrderUseCase
import com.loomline.order.domain.NewOrder
import com.loomline.order.domain.Order
import com.loomline.order.domain.OrderRepository
import jakarta.enterprise.context.ApplicationScoped
import jakarta.transaction.Transactional

/**
 * Transaction boundary around the framework-free use case.
 *
 * The use case pre-checks for a duplicate reference to give a friendly error;
 * the database's unique index remains the real guarantee and is translated to
 * the same 409 by `PersistenceExceptionMapper`.
 */
@ApplicationScoped
class OrderApplicationService(
    private val createOrder: CreateOrderUseCase,
    private val orders: OrderRepository,
) {
    @Transactional
    fun create(input: NewOrder): CreateOrderResult = createOrder.create(input)

    @Transactional
    fun findByReference(reference: String): Order? =
        orders.findByReference(reference.trim())
}
