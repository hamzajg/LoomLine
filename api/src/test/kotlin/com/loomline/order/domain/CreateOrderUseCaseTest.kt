package com.loomline.order.domain

import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class CreateOrderUseCaseTest {

    private val clientId = UUID.fromString("11111111-1111-4111-8111-111111111111")
    private val articleId = UUID.fromString("33333333-3333-4333-8333-333333333333")
    private val orderId = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
    private val now = Instant.parse("2026-11-18T08:00:00Z")

    private val orders = InMemoryOrderRepository()
    private val catalog = FakeReferenceCatalog(setOf(clientId), setOf(articleId))

    private fun useCase() = CreateOrderUseCase(
        orders = orders,
        catalog = catalog,
        time = { now },
        ids = { orderId },
    )

    private fun newOrder(
        reference: String? = "OF-2026-001",
        client: UUID? = clientId,
        article: UUID? = articleId,
        quantity: Int? = 250,
        dueDate: LocalDate? = LocalDate.parse("2026-12-15"),
    ) = NewOrder(reference, client, article, quantity, dueDate)

    @Test
    fun `creates a draft order with a trimmed reference`() {
        val result = useCase().create(newOrder(reference = "  OF-2026-001  "))

        val created = assertIs<CreateOrderResult.Created>(result)
        assertEquals("OF-2026-001", created.order.reference)
        assertEquals(OrderStatus.DRAFT, created.order.status)
        assertEquals(250, created.order.quantity)
        assertEquals(now, created.order.createdAt)
        assertEquals(now, created.order.updatedAt)
        assertEquals(0, created.order.version)
    }

    @Test
    fun `rejects a blank reference`() {
        val result = useCase().create(newOrder(reference = "   "))

        val invalid = assertIs<CreateOrderResult.Invalid>(result)
        assertTrue("reference" in invalid.fieldErrors)
    }

    @Test
    fun `rejects a reference longer than 64 characters`() {
        val result = useCase().create(newOrder(reference = "R".repeat(65)))

        val invalid = assertIs<CreateOrderResult.Invalid>(result)
        assertEquals(
            "Reference must be at most 64 characters.",
            invalid.fieldErrors["reference"],
        )
    }

    @Test
    fun `rejects a non-positive quantity`() {
        val result = useCase().create(newOrder(quantity = 0))

        val invalid = assertIs<CreateOrderResult.Invalid>(result)
        assertEquals("Quantity must be greater than zero.", invalid.fieldErrors["quantity"])
    }

    @Test
    fun `rejects a missing due date`() {
        val result = useCase().create(newOrder(dueDate = null))

        val invalid = assertIs<CreateOrderResult.Invalid>(result)
        assertEquals("Due date is required.", invalid.fieldErrors["dueDate"])
    }

    @Test
    fun `rejects an unknown client`() {
        val unknown = UUID.fromString("99999999-9999-4999-8999-999999999999")

        val result = useCase().create(newOrder(client = unknown))

        val invalid = assertIs<CreateOrderResult.Invalid>(result)
        assertEquals("Unknown client.", invalid.fieldErrors["clientId"])
    }

    @Test
    fun `rejects an unknown article`() {
        val unknown = UUID.fromString("99999999-9999-4999-8999-999999999999")

        val result = useCase().create(newOrder(article = unknown))

        val invalid = assertIs<CreateOrderResult.Invalid>(result)
        assertEquals("Unknown article.", invalid.fieldErrors["articleId"])
    }

    @Test
    fun `rejects a duplicate reference regardless of case`() {
        useCase().create(newOrder(reference = "OF-2026-001"))

        val result = useCase().create(newOrder(reference = "of-2026-001"))

        assertIs<CreateOrderResult.DuplicateReference>(result)
    }
}

class InMemoryOrderRepository : OrderRepository {
    private val byReference = mutableMapOf<String, Order>()
    private val byId = mutableMapOf<UUID, Order>()

    override fun existsByReference(reference: String): Boolean =
        byReference.containsKey(reference.lowercase())

    override fun save(order: Order): Order {
        byReference[order.reference.lowercase()] = order
        byId[order.id] = order
        return order
    }

    override fun findByReference(reference: String): Order? =
        byReference[reference.lowercase()]

    override fun findById(id: UUID): Order? =
        byId[id]

    override fun list(status: OrderStatus?, reference: String?): List<Order> {
        return byId.values
            .filter { status == null || it.status == status }
            .filter { reference.isNullOrBlank() || it.reference.contains(reference.trim(), ignoreCase = true) }
    }

    override fun update(order: Order): Order {
        byId[order.id] = order
        byReference[order.reference.lowercase()] = order
        return order
    }

    val history = mutableListOf<OrderStatusHistoryEntry>()

    override fun appendStatusHistory(entry: OrderStatusHistoryEntry) {
        history += entry
    }

    override fun statusHistory(orderId: UUID): List<OrderStatusHistoryEntry> =
        history.filter { it.orderId == orderId }

    private val quantitiesByOrder = mutableMapOf<UUID, MutableList<OrderQuantityLine>>()

    override fun replaceQuantities(orderId: UUID, lines: List<QuantityLine>) {
        quantitiesByOrder[orderId] = lines.map {
            OrderQuantityLine(
                id = UUID.randomUUID(),
                orderId = orderId,
                colourId = it.colourId,
                sizeId = it.sizeId,
                quantity = it.quantity,
            )
        }.toMutableList()
    }

    override fun quantities(orderId: UUID): List<OrderQuantityLine> =
        quantitiesByOrder[orderId] ?: emptyList()

    private val routingByOrder = mutableMapOf<UUID, MutableList<RoutingStep>>()

    override fun replaceRouting(orderId: UUID, steps: List<RoutingStep>) {
        routingByOrder[orderId] = steps.mapIndexed { index, step ->
            step.copy(position = index + 1)
        }.toMutableList()
    }

    override fun routingSteps(orderId: UUID): List<RoutingStep> =
        routingByOrder[orderId] ?: emptyList()
}

internal class FakeReferenceCatalog(
    private val clients: Set<UUID>,
    private val articles: Set<UUID>,
) : ReferenceCatalog {
    override fun clientExists(id: UUID): Boolean = id in clients

    override fun articleExists(id: UUID): Boolean = id in articles

    override fun colourExists(id: UUID): Boolean = id in colours

    override fun sizeExists(id: UUID): Boolean = id in sizes

    override fun articleSizeType(articleId: UUID): String? = "Alpha"

    override fun sizeTypeOf(sizeId: UUID): String? = "Alpha"

    override fun phaseExists(id: UUID): Boolean = id in phases

    override fun machineExists(id: UUID): Boolean = id in machines

    override fun machineActive(id: UUID): Boolean = id in activeMachines

    companion object {
        val colours = setOf(UUID.fromString("55555555-5555-4555-8555-555555555551"))
        val sizes = setOf(UUID.fromString("66666666-6666-4666-8666-666666666661"))

        val phases = setOf(
            UUID.fromString("77777777-7777-4777-8777-777777777771"),
            UUID.fromString("77777777-7777-4777-8777-777777777772"),
        )
        val machines = setOf(
            UUID.fromString("88888888-8888-4888-8888-888888888881"),
            UUID.fromString("88888888-8888-4888-8888-888888888882"),
        )
        val activeMachines = machines
    }
}
