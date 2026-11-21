package com.loomline.order.adapter.persistence

import com.loomline.order.domain.Machine
import com.loomline.order.domain.Order
import com.loomline.order.domain.OrderQuantityLine
import com.loomline.order.domain.OrderRepository
import com.loomline.order.domain.OrderRoutingStep
import com.loomline.order.domain.OrderStatus
import com.loomline.order.domain.OrderStatusHistoryEntry
import com.loomline.order.domain.Phase
import com.loomline.order.domain.QuantityLine
import com.loomline.order.domain.RoutingStep
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

    override fun findById(id: java.util.UUID): Order? =
        OrderEntity.findById(id)?.toDomain()

    override fun list(status: OrderStatus?, reference: String?): List<Order> =
        OrderEntity.listFiltered(status?.name, reference).map { it.toDomain() }

    override fun update(order: Order): Order {
        val entity = OrderEntity.findById(order.id)
            ?: error("Order ${order.id} disappeared during update")
        entity.status = order.status.name
        entity.updatedAt = order.updatedAt
        return entity.toDomain()
    }

    override fun appendStatusHistory(entry: OrderStatusHistoryEntry) {
        entry.toEntity().persist()
    }

    override fun statusHistory(orderId: java.util.UUID): List<OrderStatusHistoryEntry> =
        OrderStatusHistoryEntity.forOrder(orderId).map { it.toDomain() }

    override fun replaceQuantities(orderId: java.util.UUID, lines: List<QuantityLine>) {
        OrderQuantityLineEntity.deleteForOrder(orderId)
        lines.forEach { line ->
            OrderQuantityLineEntity().apply {
                id = java.util.UUID.randomUUID()
                this.orderId = orderId
                colourId = line.colourId
                sizeId = line.sizeId
                quantity = line.quantity
            }.persist()
        }
    }

    override fun quantities(orderId: java.util.UUID): List<OrderQuantityLine> =
        OrderQuantityLineEntity.forOrder(orderId)
            .sortedWith(compareBy({ it.colourId.toString() }, { it.sizeId.toString() }))
            .map {
                OrderQuantityLine(
                    id = it.id,
                    orderId = it.orderId,
                    colourId = it.colourId,
                    sizeId = it.sizeId,
                    quantity = it.quantity,
                )
            }

    override fun replaceRouting(orderId: java.util.UUID, steps: List<RoutingStep>) {
        OrderRoutingStepEntity.deleteForOrder(orderId)
        steps.forEachIndexed { index, step ->
            OrderRoutingStepEntity().apply {
                id = java.util.UUID.randomUUID()
                this.orderId = orderId
                position = index + 1
                label = step.label
                phaseId = step.phaseId
                machineId = step.machineId
                repetitions = step.repetitions
                minutes = step.minutes
                createdAt = java.time.Instant.now()
            }.persist()
        }
    }

    override fun routingSteps(orderId: java.util.UUID): List<RoutingStep> =
        OrderRoutingStepEntity.forOrder(orderId)
            .sortedBy { it.position }
            .map { it.toDomain() }
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
