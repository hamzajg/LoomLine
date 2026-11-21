package com.loomline.order.adapter.persistence

import com.loomline.order.domain.ClientView
import com.loomline.order.domain.Machine
import com.loomline.order.domain.Order
import com.loomline.order.domain.OrderRoutingStep
import com.loomline.order.domain.Phase
import com.loomline.order.domain.ReferenceCatalog
import com.loomline.order.domain.ReferenceQuery
import jakarta.enterprise.context.ApplicationScoped
import java.util.UUID

@ApplicationScoped
class ReferenceAdapter : ReferenceCatalog, ReferenceQuery {

    override fun clientExists(id: UUID): Boolean =
        ClientEntity.count("id = ?1", id) > 0

    override fun articleExists(id: UUID): Boolean =
        ArticleEntity.count("id = ?1", id) > 0

    override fun colourExists(id: UUID): Boolean =
        ColourEntity.count("id = ?1", id) > 0

    override fun sizeExists(id: UUID): Boolean =
        SizeEntity.count("id = ?1", id) > 0

    override fun articleSizeType(articleId: UUID): String? =
        ArticleEntity.find("id", articleId).firstResult()?.sizeType

    override fun sizeTypeOf(sizeId: UUID): String? =
        SizeEntity.find("id", sizeId).firstResult()?.sizeType

    override fun phaseExists(id: UUID): Boolean =
        PhaseEntity.count("id = ?1", id) > 0

    override fun machineExists(id: UUID): Boolean =
        MachineEntity.count("id = ?1", id) > 0

    override fun machineActive(id: UUID): Boolean =
        MachineEntity.count("id = ?1 and active = true", id) > 0

    override fun clients(): List<ClientView> =
        ClientEntity.list("order by name").map {
            ClientView(id = it.id, name = it.name, country = it.country)
        }

    override fun phases(): List<Phase> =
        PhaseEntity.list("order by code").map { it.toDomain() }

    override fun machines(): List<Machine> =
        MachineEntity.list("order by reference").map { it.toDomain() }
}
