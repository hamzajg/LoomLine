package com.loomline.order.adapter.persistence

import com.loomline.order.domain.Size
import com.loomline.order.domain.SizeStore
import jakarta.enterprise.context.ApplicationScoped
import java.util.UUID

@ApplicationScoped
class SizeStoreAdapter : SizeStore {

    override fun searchSizes(query: String?): List<Size> {
        val q = query?.trim()?.takeIf { it.isNotEmpty() }?.lowercase()
        val rows = if (q == null) {
            SizeEntity.list("order by sizeType, code")
        } else {
            SizeEntity.list(
                "lower(code) like ?1 or lower(label) like ?1 or lower(sizeType) like ?1 order by sizeType, code",
                "%$q%",
            )
        }
        return rows.map { it.toDomain() }
    }

    override fun findById(id: UUID): Size? =
        SizeEntity.find("id", id).firstResult()?.toDomain()

    override fun existsByCodeAndType(code: String, sizeType: String, excludeId: UUID?): Boolean {
        val lowerCode = code.lowercase()
        val lowerType = sizeType.lowercase()
        return if (excludeId == null) {
            SizeEntity.count(
                "lower(code) = ?1 and lower(sizeType) = ?2",
                lowerCode, lowerType,
            ) > 0
        } else {
            SizeEntity.count(
                "lower(code) = ?1 and lower(sizeType) = ?2 and id <> ?3",
                lowerCode, lowerType, excludeId,
            ) > 0
        }
    }

    override fun save(size: Size): Size {
        val existing = SizeEntity.find("id", size.id).firstResult()
        val entity = existing ?: SizeEntity().apply {
            id = size.id
            createdAt = size.createdAt
        }
        entity.code = size.code
        entity.label = size.label
        entity.sizeType = size.sizeType
        entity.persist()
        return entity.toDomain()
    }

    override fun delete(id: UUID) {
        SizeEntity.find("id", id).firstResult()?.delete()
    }

    override fun inUse(id: UUID): Boolean =
        OrderQuantityLineEntity.count("sizeId", id) > 0

    override fun sizeTypes(): List<String> =
        SizeEntity.getEntityManager()
            .createQuery("select distinct s.sizeType from SizeEntity s", String::class.java)
            .resultList
}

private fun SizeEntity.toDomain() = Size(
    id = id,
    code = code,
    label = label,
    sizeType = sizeType,
    createdAt = createdAt,
)
