package com.loomline.order.adapter.persistence

import com.loomline.order.domain.Order
import com.loomline.order.domain.OrderRepository
import com.loomline.order.domain.OrderStatus
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class OrderRepositoryAdapter : OrderRepository {

    override fun existsByReference(reference: String): Boolean =
        OrderEntity.existsByReferenceIgnoreCase(reference)

    override fun save(order: Order): Order {
        val entity = order.toEntity()
        entity.persist()
        return entity.toDomain()
    }

    override fun findByReference(reference: String): Order? =
        OrderEntity.findByReferenceIgnoreCase(reference)?.toDomain()
}

private fun Order.toEntity() = OrderEntity().apply {
    id = this@toEntity.id
    reference = this@toEntity.reference
    clientId = this@toEntity.clientId
    articleId = this@toEntity.articleId
    quantity = this@toEntity.quantity
    dueDate = this@toEntity.dueDate
    status = this@toEntity.status.name
    version = this@toEntity.version
    createdAt = this@toEntity.createdAt
    updatedAt = this@toEntity.updatedAt
}

private fun OrderEntity.toDomain() = Order(
    id = id,
    reference = reference,
    clientId = clientId,
    articleId = articleId,
    quantity = quantity,
    dueDate = dueDate,
    status = OrderStatus.valueOf(status),
    createdAt = createdAt,
    updatedAt = updatedAt,
    version = version,
)
