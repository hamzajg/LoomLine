package com.loomline.order.adapter.web

import com.loomline.identity.adapter.web.AccessPolicy
import com.loomline.order.domain.ReferenceQuery
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType

/** Read-only client lookup that populates the order form. */
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
}
