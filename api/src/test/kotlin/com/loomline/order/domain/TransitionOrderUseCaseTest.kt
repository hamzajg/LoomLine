package com.loomline.order.domain

import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class TransitionOrderUseCaseTest {

    private val now = Instant.parse("2026-11-19T09:00:00Z")
    private val orderId = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
    private val entryId = UUID.fromString("cccccccc-cccc-4ccc-8ccc-cccccccccccc")

    private val orders = InMemoryOrderRepository()
    private val ids = IdGenerator { entryId }

    private fun useCase() = TransitionOrderUseCase(orders, { now }, ids)

    private fun seed(status: OrderStatus): Order {
        val order = Order(
            id = orderId,
            reference = "OF-2026-001",
            clientId = UUID.randomUUID(),
            articleId = UUID.randomUUID(),
            quantity = 10,
            dueDate = LocalDate.parse("2026-12-15"),
            status = status,
            createdAt = now,
            updatedAt = now,
            version = 0,
        )
        orders.save(order)
        return order
    }

    private val allowed = mapOf(
        OrderStatus.DRAFT to setOf(OrderStatus.RELEASED, OrderStatus.CANCELLED),
        OrderStatus.RELEASED to setOf(OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED),
        OrderStatus.IN_PROGRESS to setOf(OrderStatus.COMPLETED, OrderStatus.CANCELLED),
        OrderStatus.COMPLETED to emptySet<OrderStatus>(),
        OrderStatus.CANCELLED to emptySet<OrderStatus>(),
    )

    @Test
    fun `every pair in the transition table is accepted`() {
        allowed.forEach { (from, targets) ->
            targets.forEach { to ->
                val order = seed(from)
                val reason = if (StatusTransitions.requiresReason(from, to)) "because" else null
                val result = useCase().transition(order.id, to, reason = reason, actor = "planner")
                assertIs<TransitionOrderResult.Transitioned>(
                    result,
                    "expected $from -> $to to be allowed",
                )
                assertEquals(to, orders.findById(order.id)?.status)
            }
        }
    }

    @Test
    fun `every non-terminal pair outside the transition table is rejected`() {
        OrderStatus.entries.filter { !it.isTerminal }.forEach { from ->
            OrderStatus.entries.forEach { to ->
                if (allowed[from]?.contains(to) == true) return@forEach
                seed(from)
                val reason = if (StatusTransitions.requiresReason(from, to)) "because" else null
                val result = useCase().transition(orderId, to, reason, "planner")
                assertIs<TransitionOrderResult.InvalidTransition>(
                    result,
                    "expected $from -> $to to be rejected",
                )
            }
        }
    }

    @Test
    fun `terminal orders reject every target`() {
        listOf(OrderStatus.COMPLETED, OrderStatus.CANCELLED).forEach { terminal ->
            seed(terminal)
            OrderStatus.entries.forEach { to ->
                val result = useCase().transition(orderId, to, reason = null, actor = "planner")
                assertIs<TransitionOrderResult.Terminal>(
                    result,
                    "expected $terminal -> $to to be terminal",
                )
            }
        }
    }

    @Test
    fun `transition to the current status is rejected`() {
        seed(OrderStatus.DRAFT)
        val result = useCase().transition(orderId, OrderStatus.DRAFT, null, "planner")
        assertIs<TransitionOrderResult.InvalidTransition>(result)
    }

    @Test
    fun `an accepted transition writes exactly one history row`() {
        seed(OrderStatus.DRAFT)
        useCase().transition(orderId, OrderStatus.RELEASED, null, "planner")

        val history = orders.statusHistory(orderId)
        assertEquals(1, history.size)
        val entry = history.single()
        assertEquals(OrderStatus.DRAFT, entry.fromStatus)
        assertEquals(OrderStatus.RELEASED, entry.toStatus)
        assertEquals(now, entry.changedAt)
        assertEquals("planner", entry.changedBy)
    }

    @Test
    fun `cancelling in progress requires a reason`() {
        seed(OrderStatus.IN_PROGRESS)
        val result = useCase().transition(orderId, OrderStatus.CANCELLED, "  ", "planner")
        assertIs<TransitionOrderResult.ReasonRequired>(result)
        assertEquals(OrderStatus.IN_PROGRESS, orders.findById(orderId)?.status)
    }

    @Test
    fun `cancelling in progress stores the reason`() {
        seed(OrderStatus.IN_PROGRESS)
        useCase().transition(orderId, OrderStatus.CANCELLED, "customer request", "planner")
        val entry = orders.statusHistory(orderId).single()
        assertEquals("customer request", entry.reason)
    }

    @Test
    fun `unknown order is not found`() {
        val result = useCase().transition(UUID.randomUUID(), OrderStatus.RELEASED, null, "planner")
        assertIs<TransitionOrderResult.OrderNotFound>(result)
    }

    @Test
    fun `allowedTargets mirrors the table`() {
        assertEquals(setOf(OrderStatus.RELEASED, OrderStatus.CANCELLED), StatusTransitions.allowedTargets(OrderStatus.DRAFT))
        assertEquals(emptySet(), StatusTransitions.allowedTargets(OrderStatus.COMPLETED))
    }
}
