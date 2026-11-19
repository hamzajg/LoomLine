package com.loomline.order.domain

import java.time.Instant
import java.util.UUID

/** Storage port for orders. Implemented by the persistence adapter. */
interface OrderRepository {
    fun existsByReference(reference: String): Boolean

    fun save(order: Order): Order

    fun findByReference(reference: String): Order?

    fun findById(id: UUID): Order?

    fun list(status: OrderStatus? = null, reference: String? = null): List<Order>

    /** Persists a mutated order. Optimistic-lock failures surface as 409. */
    fun update(order: Order): Order

    fun appendStatusHistory(entry: OrderStatusHistoryEntry)

    fun statusHistory(orderId: UUID): List<OrderStatusHistoryEntry>

    /** Replaces all quantity lines of an order atomically (replace-set). */
    fun replaceQuantities(orderId: UUID, lines: List<QuantityLine>)

    fun quantities(orderId: UUID): List<OrderQuantityLine>
}

/** Read-only access to the reference records an order may point at. */
interface ReferenceCatalog {
    fun clientExists(id: UUID): Boolean

    fun articleExists(id: UUID): Boolean

    fun colourExists(id: UUID): Boolean

    fun sizeExists(id: UUID): Boolean

    /** The size type of the article an order points at, if known. */
    fun articleSizeType(articleId: UUID): String?

    /** The size type a size belongs to, if known. */
    fun sizeTypeOf(sizeId: UUID): String?
}

/** Test seam for id generation, so domain tests are deterministic. */
fun interface IdGenerator {
    fun newId(): UUID
}

/** Persistence port for the reference lookups used by the order form. */
interface ReferenceQuery {
    fun clients(): List<ClientView>

    fun articles(): List<ArticleView>

    fun colours(): List<ColourView>

    fun sizes(): List<SizeView>
}

data class ClientView(val id: UUID, val name: String, val country: String?)

data class ArticleView(val id: UUID, val reference: String, val label: String, val clientId: UUID, val sizeType: String?)

/** Clock port. Kept as a plain function so the domain stays dependency-free. */
fun interface TimeSource {
    fun now(): Instant
}
