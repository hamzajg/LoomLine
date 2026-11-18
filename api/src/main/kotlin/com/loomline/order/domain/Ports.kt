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
}

/** Read-only access to the reference records an order may point at. */
interface ReferenceCatalog {
    fun clientExists(id: UUID): Boolean

    fun articleExists(id: UUID): Boolean
}

/** Test seam for id generation, so domain tests are deterministic. */
fun interface IdGenerator {
    fun newId(): UUID
}

/** Persistence port for the reference lookups used by the order form. */
interface ReferenceQuery {
    fun clients(): List<ClientView>

    fun articles(): List<ArticleView>
}

data class ClientView(val id: UUID, val name: String, val country: String?)

data class ArticleView(val id: UUID, val reference: String, val label: String, val clientId: UUID)

/** Clock port. Kept as a plain function so the domain stays dependency-free. */
fun interface TimeSource {
    fun now(): Instant
}
