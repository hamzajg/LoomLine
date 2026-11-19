package com.loomline.order.adapter.persistence

import com.loomline.order.domain.OrderStatus
import com.loomline.order.domain.OrderStatusHistoryEntry
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanion
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "order_status_history")
class OrderStatusHistoryEntity : PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    lateinit var id: UUID

    @Column(name = "order_id", nullable = false, updatable = false)
    lateinit var orderId: UUID

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status")
    var fromStatus: OrderStatus? = null

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false)
    lateinit var toStatus: OrderStatus

    @Column(name = "reason")
    var reason: String? = null

    @Column(name = "changed_at", nullable = false, updatable = false)
    lateinit var changedAt: Instant

    @Column(name = "changed_by", nullable = false, updatable = false)
    lateinit var changedBy: String

    companion object : PanacheCompanion<OrderStatusHistoryEntity> {
        fun forOrder(orderId: UUID): List<OrderStatusHistoryEntity> =
            find("orderId = ?1 order by changedAt", orderId).list()
    }
}

fun OrderStatusHistoryEntry.toEntity() = OrderStatusHistoryEntity().apply {
    id = this@toEntity.id
    orderId = this@toEntity.orderId
    fromStatus = this@toEntity.fromStatus
    toStatus = this@toEntity.toStatus
    reason = this@toEntity.reason
    changedAt = this@toEntity.changedAt
    changedBy = this@toEntity.changedBy
}

fun OrderStatusHistoryEntity.toDomain() = OrderStatusHistoryEntry(
    id = id,
    orderId = orderId,
    fromStatus = fromStatus,
    toStatus = toStatus,
    reason = reason,
    changedAt = changedAt,
    changedBy = changedBy,
)
