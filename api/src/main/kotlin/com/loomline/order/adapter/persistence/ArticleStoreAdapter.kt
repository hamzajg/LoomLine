package com.loomline.order.adapter.persistence

import com.loomline.order.domain.Article
import com.loomline.order.domain.ArticleStore
import jakarta.enterprise.context.ApplicationScoped
import java.util.UUID

@ApplicationScoped
class ArticleStoreAdapter : ArticleStore {

    override fun searchArticles(query: String?): List<Article> {
        val q = query?.trim()?.takeIf { it.isNotEmpty() }?.lowercase()
        val rows = if (q == null) {
            ArticleEntity.list("order by reference")
        } else {
            ArticleEntity.list(
                "lower(reference) like ?1 or lower(label) like ?1 order by reference",
                "%$q%",
            )
        }
        return rows.map { it.toDomain() }
    }

    override fun findById(id: UUID): Article? =
        ArticleEntity.find("id", id).firstResult()?.toDomain()

    override fun existsByReference(reference: String, excludeId: UUID?): Boolean {
        val lower = reference.lowercase()
        return if (excludeId == null) {
            ArticleEntity.count("lower(reference) = ?1", lower) > 0
        } else {
            ArticleEntity.count("lower(reference) = ?1 and id <> ?2", lower, excludeId) > 0
        }
    }

    override fun save(article: Article): Article {
        val existing = ArticleEntity.find("id", article.id).firstResult()
        val entity = existing ?: ArticleEntity().apply {
            id = article.id
            createdAt = article.createdAt
        }
        entity.reference = article.reference
        entity.label = article.label
        entity.clientId = article.clientId
        entity.sizeType = article.sizeType
        entity.unit = article.unit
        entity.persist()
        return entity.toDomain()
    }

    override fun delete(id: UUID) {
        ArticleEntity.find("id", id).firstResult()?.delete()
    }

    override fun inUse(id: UUID): Boolean =
        OrderEntity.count("articleId", id) > 0
}

private fun ArticleEntity.toDomain() = Article(
    id = id,
    reference = reference,
    label = label,
    clientId = clientId,
    sizeType = sizeType,
    unit = unit,
    createdAt = createdAt,
)
