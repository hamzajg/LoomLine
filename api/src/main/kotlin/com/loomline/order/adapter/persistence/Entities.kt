package com.loomline.order.adapter.persistence

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
        fun findByReferenceIgnoreCase(reference: String): OrderEntity? =
            find("lower(reference) = ?1", reference.lowercase()).firstResult()

        fun existsByReferenceIgnoreCase(reference: String): Boolean =
            count("lower(reference) = ?1", reference.lowercase()) > 0
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

    companion object : PanacheCompanion<ArticleEntity>
}
