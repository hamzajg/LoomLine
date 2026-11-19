package com.loomline.order.domain

import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class SetOrderQuantitiesUseCaseTest {

    private val now = Instant.parse("2026-11-19T10:00:00Z")
    private val orderId = UUID.fromString("dddddddd-dddd-4ddd-8ddd-dddddddddddd")
    private val articleId = UUID.fromString("33333333-3333-4333-8333-333333333333")

    private val noir = UUID.fromString("55555555-5555-4555-8555-555555555551")
    private val ecru = UUID.fromString("55555555-5555-4555-8555-555555555552")
    private val sizeS = UUID.fromString("66666666-6666-4666-8666-666666666661")
    private val sizeM = UUID.fromString("66666666-6666-4666-8666-666666666662")
    private val foreignSize = UUID.fromString("99999999-9999-4999-8999-999999999999")

    private val orders = InMemoryOrderRepository()
    private val catalog = FakeCompositionCatalog()

    private fun useCase() = SetOrderQuantitiesUseCase(orders, catalog)

    private fun seed(status: OrderStatus = OrderStatus.DRAFT, quantity: Int = 100) {
        orders.save(
            Order(
                id = orderId,
                reference = "OF-2026-001",
                clientId = UUID.randomUUID(),
                articleId = articleId,
                quantity = quantity,
                dueDate = LocalDate.parse("2026-12-15"),
                status = status,
                createdAt = now,
                updatedAt = now,
                version = 0,
            ),
        )
    }

    private fun line(colour: UUID = noir, size: UUID = sizeS, qty: Int = 10) =
        QuantityLine(colour, size, qty)

    @Test
    fun `stores a valid partial breakdown`() {
        seed()
        val result = useCase().set(
            orderId,
            listOf(line(size = sizeS, qty = 40), line(colour = noir, size = sizeM, qty = 30), line(colour = ecru, size = sizeM, qty = 30)),
        )
        val saved = assertIs<SetQuantitiesResult.Saved>(result)
        assertEquals(3, saved.lines.size)
        assertEquals(
            listOf(40, 30, 30).sorted(),
            saved.lines.map { it.quantity }.sorted(),
        )
    }

    @Test
    fun `clears the breakdown with an empty list`() {
        seed()
        useCase().set(orderId, listOf(line()))
        val result = useCase().set(orderId, emptyList())
        assertIs<SetQuantitiesResult.Saved>(result)
        assertTrue(orders.quantities(orderId).isEmpty())
    }

    @Test
    fun `replace-set overwrites previous lines`() {
        seed()
        useCase().set(orderId, listOf(line(noir, sizeS, 50), line(ecru, sizeM, 50)))
        val result = useCase().set(orderId, listOf(line(noir, sizeM, 100)))
        val saved = assertIs<SetQuantitiesResult.Saved>(result)
        assertEquals(1, saved.lines.size)
        assertEquals(sizeM, saved.lines.single().sizeId)
    }

    @Test
    fun `rejects a breakdown exceeding the order quantity`() {
        seed(quantity = 100)
        val result = useCase().set(
            orderId,
            listOf(line(size = sizeS, qty = 60), line(size = sizeM, qty = 60)),
        )
        val invalid = assertIs<SetQuantitiesResult.Invalid>(result)
        assertTrue(invalid.fieldErrors["lines"]!!.contains("exceeds"))
        assertTrue(orders.quantities(orderId).isEmpty())
    }

    @Test
    fun `rejects a non-positive quantity`() {
        seed()
        val result = useCase().set(orderId, listOf(line(qty = 0)))
        val invalid = assertIs<SetQuantitiesResult.Invalid>(result)
        assertTrue("lines[0].quantity" in invalid.fieldErrors)
    }

    @Test
    fun `rejects a duplicate colour-size pair`() {
        seed()
        val result = useCase().set(orderId, listOf(line(), line(qty = 5)))
        val invalid = assertIs<SetQuantitiesResult.Invalid>(result)
        assertTrue("lines[1]" in invalid.fieldErrors)
    }

    @Test
    fun `rejects an unknown colour and names the field`() {
        seed()
        val result = useCase().set(orderId, listOf(line(colour = UUID.randomUUID())))
        val invalid = assertIs<SetQuantitiesResult.Invalid>(result)
        assertTrue("lines[0].colourId" in invalid.fieldErrors)
    }

    @Test
    fun `rejects a size outside the article's size type`() {
        seed()
        val result = useCase().set(orderId, listOf(line(size = foreignSize)))
        val invalid = assertIs<SetQuantitiesResult.Invalid>(result)
        assertTrue("lines[0].sizeId" in invalid.fieldErrors)
    }

    @Test
    fun `rejects changes on an order in progress`() {
        seed(status = OrderStatus.IN_PROGRESS)
        val result = useCase().set(orderId, listOf(line()))
        val locked = assertIs<SetQuantitiesResult.Locked>(result)
        assertEquals(OrderStatus.IN_PROGRESS, locked.status)
    }

    @Test
    fun `allows changes on a released order`() {
        seed(status = OrderStatus.RELEASED)
        val result = useCase().set(orderId, listOf(line()))
        assertIs<SetQuantitiesResult.Saved>(result)
    }

    @Test
    fun `returns not found for an unknown order`() {
        val result = useCase().set(UUID.randomUUID(), listOf(line()))
        assertIs<SetQuantitiesResult.OrderNotFound>(result)
    }
}

private class FakeCompositionCatalog : ReferenceCatalog {
    private val articleSizeType = "Alpha"

    override fun clientExists(id: UUID) = true
    override fun articleExists(id: UUID) = true

    private val colours = setOf(
        UUID.fromString("55555555-5555-4555-8555-555555555551"),
        UUID.fromString("55555555-5555-4555-8555-555555555552"),
    )
    private val alphaSizes = setOf(
        UUID.fromString("66666666-6666-4666-8666-666666666661"),
        UUID.fromString("66666666-6666-4666-8666-666666666662"),
    )

    override fun colourExists(id: UUID) = id in colours
    override fun sizeExists(id: UUID) = id in alphaSizes || id == UUID.fromString("99999999-9999-4999-8999-999999999999")
    override fun articleSizeType(articleId: UUID) = articleSizeType
    override fun sizeTypeOf(sizeId: UUID) =
        if (sizeId in alphaSizes) "Alpha" else "Beta"
}
