package com.loomline.order.adapter.persistence

import com.loomline.order.domain.Machine
import com.loomline.order.domain.OrderQuantityLine
import com.loomline.order.domain.Phase
import io.quarkus.hibernate.orm.panache.kotlin.PanacheCompanion
import io.quarkus.hibernate.orm.panache.kotlin.PanacheEntityBase
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.Version
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "orders")
class OrderEntity : PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    lateinit var id: UUID

    @Column(name = "reference", nullable = false)
    lateinit var reference: String

    @Column(name = "client_id", nullable = false)
    lateinit var clientId: UUID

    @Column(name = "article_id", nullable = false)
    lateinit var articleId: UUID

    @Column(name = "quantity", nullable = false)
    var quantity: Int = 0

    @Column(name = "due_date", nullable = false)
    lateinit var dueDate: LocalDate

    @Column(name = "status", nullable = false)
    lateinit var status: String

    @Version
    @Column(name = "version", nullable = false)
    var version: Long = 0

    @Column(name = "created_at", nullable = false)
    lateinit var createdAt: Instant

    @Column(name = "updated_at", nullable = false)
    lateinit var updatedAt: Instant

    companion object : PanacheCompanion<OrderEntity> {
        fun findById(id: UUID): OrderEntity? = find("id", id).firstResult()

        fun findByReferenceIgnoreCase(reference: String): OrderEntity? =
            find("lower(reference) = ?1", reference.lowercase()).firstResult()

        fun existsByReferenceIgnoreCase(reference: String): Boolean =
            count("lower(reference) = ?1", reference.lowercase()) > 0

        fun listFiltered(status: String?, reference: String?): List<OrderEntity> {
            val cleanRef = reference?.trim()?.takeIf { it.isNotEmpty() }?.lowercase()
            val cleanStatus = status?.trim()?.takeIf { it.isNotEmpty() }
            return when {
                cleanStatus != null && cleanRef != null ->
                    find("status = ?1 and lower(reference) like ?2 order by createdAt desc", cleanStatus, "%$cleanRef%").list()
                cleanStatus != null ->
                    find("status = ?1 order by createdAt desc", cleanStatus).list()
                cleanRef != null ->
                    find("lower(reference) like ?1 order by createdAt desc", "%$cleanRef%").list()
                else ->
                    list("order by createdAt desc")
            }
        }
    }
}

@Entity
@Table(name = "client")
class ClientEntity : PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    lateinit var id: UUID

    @Column(name = "name", nullable = false)
    lateinit var name: String

    @Column(name = "country")
    var country: String? = null

    companion object : PanacheCompanion<ClientEntity>
}

@Entity
@Table(name = "article")
class ArticleEntity : PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    lateinit var id: UUID

    @Column(name = "reference", nullable = false)
    lateinit var reference: String

    @Column(name = "label", nullable = false)
    lateinit var label: String

    @Column(name = "client_id", nullable = false)
    lateinit var clientId: UUID

    @Column(name = "size_type")
    var sizeType: String? = null

    @Column(name = "unit", nullable = false)
    lateinit var unit: String

    @Column(name = "created_at", nullable = false)
    lateinit var createdAt: Instant

    companion object : PanacheCompanion<ArticleEntity>
}

@Entity
@Table(name = "colour")
class ColourEntity : PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    lateinit var id: UUID

    @Column(name = "code", nullable = false)
    lateinit var code: String

    @Column(name = "label", nullable = false)
    lateinit var label: String

    @Column(name = "created_at", nullable = false)
    lateinit var createdAt: Instant

    companion object : PanacheCompanion<ColourEntity>
}

@Entity
@Table(name = "size")
class SizeEntity : PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    lateinit var id: UUID

    @Column(name = "code", nullable = false)
    lateinit var code: String

    @Column(name = "label", nullable = false)
    lateinit var label: String

    @Column(name = "size_type", nullable = false)
    lateinit var sizeType: String

    @Column(name = "created_at", nullable = false)
    lateinit var createdAt: Instant

    companion object : PanacheCompanion<SizeEntity>
}

@Entity
@Table(name = "order_quantity_line")
class OrderQuantityLineEntity : PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    lateinit var id: UUID

    @Column(name = "order_id", nullable = false, updatable = false)
    lateinit var orderId: UUID

    @Column(name = "colour_id", nullable = false, updatable = false)
    lateinit var colourId: UUID

    @Column(name = "size_id", nullable = false, updatable = false)
    lateinit var sizeId: UUID

    @Column(name = "quantity", nullable = false)
    var quantity: Int = 0

    companion object : PanacheCompanion<OrderQuantityLineEntity> {
        fun forOrder(orderId: UUID): List<OrderQuantityLineEntity> =
            find("orderId", orderId).list()

        fun deleteForOrder(orderId: UUID) {
            delete("orderId", orderId)
        }
    }
}

@Entity
@Table(name = "phase")
class PhaseEntity : PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    lateinit var id: UUID

    @Column(name = "code", nullable = false)
    lateinit var code: String

    @Column(name = "label", nullable = false)
    lateinit var label: String

    @Column(name = "created_at", nullable = false)
    lateinit var createdAt: Instant

    companion object : PanacheCompanion<PhaseEntity> {
        fun findById(id: UUID): PhaseEntity? = find("id", id).firstResult()
    }
}

@Entity
@Table(name = "machine")
class MachineEntity : PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    lateinit var id: UUID

    @Column(name = "reference", nullable = false)
    lateinit var reference: String

    @Column(name = "label", nullable = false)
    lateinit var label: String

    @Column(name = "active", nullable = false)
    var active: Boolean = true

    @Column(name = "created_at", nullable = false)
    lateinit var createdAt: Instant

    companion object : PanacheCompanion<MachineEntity> {
        fun findById(id: UUID): MachineEntity? = find("id", id).firstResult()
    }
}

@Entity
@Table(name = "order_routing_step")
class OrderRoutingStepEntity : PanacheEntityBase {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    lateinit var id: UUID

    @Column(name = "order_id", nullable = false, updatable = false)
    lateinit var orderId: UUID

    @Column(name = "position", nullable = false)
    var position: Int = 0

    @Column(name = "label", nullable = false)
    lateinit var label: String

    @Column(name = "phase_id", nullable = false, updatable = false)
    lateinit var phaseId: UUID

    @Column(name = "machine_id", updatable = false)
    var machineId: UUID? = null

    @Column(name = "repetitions", nullable = false)
    var repetitions: Int = 0

    @Column(name = "minutes", nullable = false)
    var minutes: Int = 0

    @Column(name = "created_at", nullable = false)
    lateinit var createdAt: Instant

    companion object : PanacheCompanion<OrderRoutingStepEntity> {
        fun forOrder(orderId: UUID): List<OrderRoutingStepEntity> =
            find("orderId", orderId).list()

        fun deleteForOrder(orderId: UUID) {
            delete("orderId", orderId)
        }
    }
}

internal fun OrderRoutingStepEntity.toDomain() = com.loomline.order.domain.RoutingStep(
    position = position,
    label = label,
    phaseId = phaseId,
    machineId = machineId,
    repetitions = repetitions,
    minutes = minutes,
)

internal fun PhaseEntity.toDomain() =
    com.loomline.order.domain.Phase(id = id, code = code, label = label)

internal fun MachineEntity.toDomain() =
    com.loomline.order.domain.Machine(
        id = id,
        reference = reference,
        label = label,
        active = active,
    )
