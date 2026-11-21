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

    /** Replaces all routing steps of an order atomically (replace-set). */
    fun replaceRouting(orderId: UUID, steps: List<RoutingStep>)

    fun routingSteps(orderId: UUID): List<RoutingStep>
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

    /** True if a phase with [id] exists. */
    fun phaseExists(id: UUID): Boolean

    /** True if a machine with [id] exists. */
    fun machineExists(id: UUID): Boolean

    /** True if a machine with [id] exists and is active. */
    fun machineActive(id: UUID): Boolean
}

/** Storage port for catalogue articles. Implemented by the persistence adapter. */
interface ArticleStore {
    fun searchArticles(query: String?): List<Article>

    fun findById(id: UUID): Article?

    /** Case-insensitive natural-key check; [excludeId] skips the record being updated. */
    fun existsByReference(reference: String, excludeId: UUID? = null): Boolean

    fun save(article: Article): Article

    fun delete(id: UUID)

    /** True while any order references the article. */
    fun inUse(id: UUID): Boolean
}

/** Storage port for catalogue colours. */
interface ColourStore {
    fun searchColours(query: String?): List<Colour>

    fun findById(id: UUID): Colour?

    fun existsByCode(code: String, excludeId: UUID? = null): Boolean

    fun save(colour: Colour): Colour

    fun delete(id: UUID)

    /** True while any order quantity line references the colour. */
    fun inUse(id: UUID): Boolean
}

/** Storage port for catalogue sizes. */
interface SizeStore {
    fun searchSizes(query: String?): List<Size>

    fun findById(id: UUID): Size?

    fun existsByCodeAndType(code: String, sizeType: String, excludeId: UUID? = null): Boolean

    fun save(size: Size): Size

    fun delete(id: UUID)

    /** True while any order quantity line references the size. */
    fun inUse(id: UUID): Boolean

    /** Every size type currently in use — validates `article.size_type`. */
    fun sizeTypes(): List<String>
}

/** Test seam for id generation, so domain tests are deterministic. */
fun interface IdGenerator {
    fun newId(): UUID
}

/** Persistence port for the reference lookups used by the order form. */
interface ReferenceQuery {
    fun clients(): List<ClientView>

    fun phases(): List<Phase>

    fun machines(): List<Machine>
}

data class ClientView(val id: UUID, val name: String, val country: String?)

/** Clock port. Kept as a plain function so the domain stays dependency-free. */
fun interface TimeSource {
    fun now(): Instant
}
