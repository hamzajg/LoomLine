package com.loomline.order.adapter.persistence

import com.loomline.order.domain.Colour
import com.loomline.order.domain.ColourStore
import jakarta.enterprise.context.ApplicationScoped
import java.util.UUID

@ApplicationScoped
class ColourStoreAdapter : ColourStore {

    override fun searchColours(query: String?): List<Colour> {
        val q = query?.trim()?.takeIf { it.isNotEmpty() }?.lowercase()
        val rows = if (q == null) {
            ColourEntity.list("order by code")
        } else {
            ColourEntity.list(
                "lower(code) like ?1 or lower(label) like ?1 order by code",
                "%$q%",
            )
        }
        return rows.map { it.toDomain() }
    }

    override fun findById(id: UUID): Colour? =
        ColourEntity.find("id", id).firstResult()?.toDomain()

    override fun existsByCode(code: String, excludeId: UUID?): Boolean {
        val lower = code.lowercase()
        return if (excludeId == null) {
            ColourEntity.count("lower(code) = ?1", lower) > 0
        } else {
            ColourEntity.count("lower(code) = ?1 and id <> ?2", lower, excludeId) > 0
        }
    }

    override fun save(colour: Colour): Colour {
        val existing = ColourEntity.find("id", colour.id).firstResult()
        val entity = existing ?: ColourEntity().apply {
            id = colour.id
            createdAt = colour.createdAt
        }
        entity.code = colour.code
        entity.label = colour.label
        entity.persist()
        return entity.toDomain()
    }

    override fun delete(id: UUID) {
        ColourEntity.find("id", id).firstResult()?.delete()
    }

    override fun inUse(id: UUID): Boolean =
        OrderQuantityLineEntity.count("colourId", id) > 0
}

private fun ColourEntity.toDomain() = Colour(
    id = id,
    code = code,
    label = label,
    createdAt = createdAt,
)
