package com.loomline.order.adapter.web

import com.loomline.identity.adapter.web.AccessPolicy
import com.loomline.order.domain.ReferenceQuery
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType

/** Read-only reference lookups that populate the order form. */
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
class ReferenceResource(
    private val query: ReferenceQuery,
    private val policy: AccessPolicy,
) {

    @GET
    @Path("/clients")
    fun clients(): List<ClientResponse> {
        policy.require("production")
        return query.clients().map { ClientResponse(it.id, it.name, it.country) }
    }

    @GET
    @Path("/articles")
    fun articles(): List<ArticleResponse> {
        policy.require("production")
        return query.articles().map { ArticleResponse(it.id, it.reference, it.label, it.clientId, it.sizeType) }
    }

    @GET
    @Path("/colours")
    fun colours(): List<ColourResponse> {
        policy.require("production")
        return query.colours().map { ColourResponse(it.id, it.code, it.label) }
    }

    @GET
    @Path("/sizes")
    fun sizes(): List<SizeResponse> {
        policy.require("production")
        return query.sizes().map { SizeResponse(it.id, it.code, it.label, it.sizeType) }
    }
}
