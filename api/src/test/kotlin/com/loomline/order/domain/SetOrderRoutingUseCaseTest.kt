package com.loomline.order.domain

import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class SetOrderRoutingUseCaseTest {

    private val now = Instant.parse("2026-11-19T10:00:00Z")
    private val orderId = UUID.fromString("dddddddd-dddd-4ddd-8ddd-dddddddddddd")
    private val articleId = UUID.fromString("33333333-3333-4333-8333-333333333333")

    private val phaseCut = UUID.fromString("77777777-7777-4777-8777-777777777771")
    private val phaseSew = UUID.fromString("77777777-7777-4777-8777-777777777772")
    private val machineMc1 = UUID.fromString("88888888-8888-4888-8888-888888888881")
    private val machineMc2 = UUID.fromString("88888888-8888-4888-8888-888888888882")
    private val unknownPhase = UUID.randomUUID()
    private val unknownMachine = UUID.randomUUID()

    private val orders = InMemoryOrderRepository()
    private val catalog = FakeReferenceCatalog(
        setOf(UUID.fromString("11111111-1111-4111-8111-111111111111")),
        setOf(articleId),
    )

    private fun useCase() = SetOrderRoutingUseCase(orders, catalog)

    private fun seed(status: OrderStatus = OrderStatus.DRAFT) {
        orders.save(
            Order(
                id = orderId,
                reference = "OF-2026-001",
                clientId = UUID.fromString("11111111-1111-4111-8111-111111111111"),
                articleId = articleId,
                quantity = 100,
                dueDate = LocalDate.parse("2026-12-15"),
                status = status,
                createdAt = now,
                updatedAt = now,
                version = 0,
            ),
        )
    }

    private fun step(
        label: String = "Cut the panels",
        phaseId: UUID = phaseCut,
        machineId: UUID? = machineMc1,
        repetitions: Int = 1,
        minutes: Int = 4,
    ) = RoutingStep(
        position = 0,
        label = label,
        phaseId = phaseId,
        machineId = machineId,
        repetitions = repetitions,
        minutes = minutes,
    )

    @Test
    fun `stores a valid routing sheet`() {
        seed()
        val result = useCase().set(
            orderId,
            listOf(
                step("Cut the panels", phaseCut, machineMc1, 1, 4),
                step("Join the panels", phaseSew, machineMc2, 2, 6),
                step("Press and finish", phaseSew, null, 1, 3),
            ),
        )
        val saved = assertIs<SetRoutingResult.Saved>(result)
        assertEquals(3, saved.steps.size)
        assertEquals(listOf(1, 2, 3), saved.steps.map { it.position })
        assertEquals("Cut the panels", saved.steps[0].label)
        assertEquals("Join the panels", saved.steps[1].label)
        assertEquals("Press and finish", saved.steps[2].label)
    }

    @Test
    fun `clears the routing sheet with an empty list`() {
        seed()
        useCase().set(orderId, listOf(step()))
        val result = useCase().set(orderId, emptyList())
        assertIs<SetRoutingResult.Saved>(result)
        assertTrue(orders.routingSteps(orderId).isEmpty())
    }

    @Test
    fun `replace-set overwrites previous steps`() {
        seed()
        useCase().set(orderId, listOf(step("First", phaseCut, machineMc1, 1, 4)))
        val result = useCase().set(orderId, listOf(step("Second", phaseSew, machineMc2, 1, 5)))
        val saved = assertIs<SetRoutingResult.Saved>(result)
        assertEquals(1, saved.steps.size)
        assertEquals("Second", saved.steps.single().label)
    }

    @Test
    fun `rejects changes on an order in progress`() {
        seed(status = OrderStatus.IN_PROGRESS)
        val result = useCase().set(orderId, listOf(step()))
        val locked = assertIs<SetRoutingResult.Locked>(result)
        assertEquals(OrderStatus.IN_PROGRESS, locked.status)
    }

    @Test
    fun `allows changes on a released order`() {
        seed(status = OrderStatus.RELEASED)
        val result = useCase().set(orderId, listOf(step()))
        assertIs<SetRoutingResult.Saved>(result)
    }

    @Test
    fun `returns not found for an unknown order`() {
        val result = useCase().set(UUID.randomUUID(), listOf(step()))
        assertIs<SetRoutingResult.OrderNotFound>(result)
    }

    @Test
    fun `rejects an unknown phase`() {
        seed()
        val result = useCase().set(orderId, listOf(step(phaseId = unknownPhase)))
        val invalid = assertIs<SetRoutingResult.Invalid>(result)
        assertTrue("steps[0].phaseId" in invalid.fieldErrors)
        assertTrue(orders.routingSteps(orderId).isEmpty())
    }

    @Test
    fun `rejects an unknown machine`() {
        seed()
        val result = useCase().set(orderId, listOf(step(machineId = unknownMachine)))
        val invalid = assertIs<SetRoutingResult.Invalid>(result)
        assertTrue("steps[0].machineId" in invalid.fieldErrors)
        assertTrue(orders.routingSteps(orderId).isEmpty())
    }

    @Test
    fun `rejects an inactive machine`() {
        seed()
        // MC-04 is inactive (active = false)
        val inactiveMachine = UUID.fromString("88888888-8888-4888-8888-888888888884")
        val result = useCase().set(orderId, listOf(step(machineId = inactiveMachine)))
        val invalid = assertIs<SetRoutingResult.Invalid>(result)
        assertTrue("steps[0].machineId" in invalid.fieldErrors)
    }

    @Test
    fun `rejects a blank label`() {
        seed()
        val result = useCase().set(orderId, listOf(step(label = "")))
        val invalid = assertIs<SetRoutingResult.Invalid>(result)
        assertTrue("steps[0].label" in invalid.fieldErrors)
    }

    @Test
    fun `rejects zero repetitions`() {
        seed()
        val result = useCase().set(orderId, listOf(step(repetitions = 0)))
        val invalid = assertIs<SetRoutingResult.Invalid>(result)
        assertTrue("steps[0].repetitions" in invalid.fieldErrors)
    }

    @Test
    fun `rejects zero minutes`() {
        seed()
        val result = useCase().set(orderId, listOf(step(minutes = 0)))
        val invalid = assertIs<SetRoutingResult.Invalid>(result)
        assertTrue("steps[0].minutes" in invalid.fieldErrors)
    }
}
