package com.loomline.order.adapter.web

import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Request body for `POST /api/orders`.
 *
 * Plain mutable class with defaults so binding does not depend on Kotlin
 * reflection configuration.
 */
class CreateOrderRequest {
    var reference: String? = null
    var clientId: UUID? = null
    var articleId: UUID? = null
    var quantity: Int? = null
    var dueDate: LocalDate? = null
}

data class OrderResponse(
    val id: UUID,
    val reference: String,
    val clientId: UUID,
    val articleId: UUID,
    val quantity: Int,
    val dueDate: LocalDate,
    val status: String,
    val createdAt: Instant,
    val updatedAt: Instant,
) {
    companion object {
        fun from(order: com.loomline.order.domain.Order) = OrderResponse(
            id = order.id,
            reference = order.reference,
            clientId = order.clientId,
            articleId = order.articleId,
            quantity = order.quantity,
            dueDate = order.dueDate,
            status = order.status.name,
            createdAt = order.createdAt,
            updatedAt = order.updatedAt,
        )
    }
}

/** Request body for `POST /api/orders/{id}/transitions`. */
class TransitionRequest {
    var to: String? = null
    var reason: String? = null
}

data class StatusHistoryResponse(
    val fromStatus: String?,
    val toStatus: String,
    val reason: String?,
    val changedAt: Instant,
    val changedBy: String,
) {
    companion object {
        fun from(entry: com.loomline.order.domain.OrderStatusHistoryEntry) = StatusHistoryResponse(
            fromStatus = entry.fromStatus?.name,
            toStatus = entry.toStatus.name,
            reason = entry.reason,
            changedAt = entry.changedAt,
            changedBy = entry.changedBy,
        )
    }
}

/** One colour/size/quantity entry in a breakdown write or read. */
data class QuantityLineResponse(
    val colourId: UUID,
    val sizeId: UUID,
    val quantity: Int,
) {
    companion object {
        fun from(line: com.loomline.order.domain.OrderQuantityLine) = QuantityLineResponse(
            colourId = line.colourId,
            sizeId = line.sizeId,
            quantity = line.quantity,
        )
    }
}

/** Request body for `PUT /api/orders/{id}/quantities` — the full breakdown. */
class SetQuantitiesRequest {
    var lines: List<QuantityLineInput>? = null
}

class QuantityLineInput {
    var colourId: UUID? = null
    var sizeId: UUID? = null
    var quantity: Int? = null
}

data class ErrorResponse(
    val code: String,
    val message: String,
    val fieldErrors: Map<String, String>? = null,
    val from: String? = null,
    val to: String? = null,
    val status: String? = null,
)

data class ClientResponse(val id: UUID, val name: String, val country: String?)

data class ArticleResponse(
    val id: UUID,
    val reference: String,
    val label: String,
    val clientId: UUID,
    val sizeType: String?,
    val unit: String,
) {
    companion object {
        fun from(article: com.loomline.order.domain.Article) = ArticleResponse(
            id = article.id,
            reference = article.reference,
            label = article.label,
            clientId = article.clientId,
            sizeType = article.sizeType,
            unit = article.unit,
        )
    }
}

/** Request bodies for the catalogue writes. Plain mutable classes for binding. */
class ArticleRequest {
    var reference: String? = null
    var label: String? = null
    var clientId: UUID? = null
    var sizeType: String? = null
    var unit: String? = null

    fun toDraft() = com.loomline.order.domain.ArticleDraft(
        reference = reference,
        label = label,
        clientId = clientId,
        sizeType = sizeType,
        unit = unit,
    )
}

class ColourRequest {
    var code: String? = null
    var label: String? = null

    fun toDraft() = com.loomline.order.domain.ColourDraft(code = code, label = label)
}

class SizeRequest {
    var code: String? = null
    var label: String? = null
    var sizeType: String? = null

    fun toDraft() = com.loomline.order.domain.SizeDraft(
        code = code,
        label = label,
        sizeType = sizeType,
    )
}

data class ColourResponse(val id: UUID, val code: String, val label: String) {
    companion object {
        fun from(colour: com.loomline.order.domain.Colour) = ColourResponse(
            id = colour.id,
            code = colour.code,
            label = colour.label,
        )
    }
}

data class SizeResponse(
    val id: UUID,
    val code: String,
    val label: String,
    val sizeType: String,
) {
    companion object {
        fun from(size: com.loomline.order.domain.Size) = SizeResponse(
            id = size.id,
            code = size.code,
            label = size.label,
            sizeType = size.sizeType,
        )
    }
}
