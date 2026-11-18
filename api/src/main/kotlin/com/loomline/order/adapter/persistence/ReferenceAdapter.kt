package com.loomline.order.adapter.persistence

import com.loomline.order.domain.ArticleView
import com.loomline.order.domain.ClientView
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

    override fun clients(): List<ClientView> =
        ClientEntity.list("order by name").map {
            ClientView(id = it.id, name = it.name, country = it.country)
        }

    override fun articles(): List<ArticleView> =
        ArticleEntity.list("order by reference").map {
            ArticleView(
                id = it.id,
                reference = it.reference,
                label = it.label,
                clientId = it.clientId,
            )
        }
}
