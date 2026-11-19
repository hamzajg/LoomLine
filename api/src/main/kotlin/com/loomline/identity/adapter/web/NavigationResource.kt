package com.loomline.identity.adapter.web

import com.loomline.identity.domain.AccessMap
import io.quarkus.security.Authenticated
import jakarta.inject.Inject
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType

/** One section's projected access for the signed-in user. */
data class SectionGrant(val id: String, val view: Boolean, val manage: Boolean)

/**
 * The shell's navigation contract: which sections the session may see and
 * whether each is manageable. Derived from AccessMap so the client never
 * re-implements the policy (D4/D5).
 */
@Path("/api/navigation")
@Produces(MediaType.APPLICATION_JSON)
class NavigationResource {

    @Inject
    lateinit var policy: AccessPolicy

    @GET
    @Authenticated
    fun navigation(): NavigationResponse {
        val grants = policy.grants()
        return NavigationResponse(
            sections = AccessMap.SECTIONS.map { id ->
                val access = grants[id]
                SectionGrant(
                    id = id,
                    view = access?.view == true,
                    manage = access?.manage == true,
                )
            },
        )
    }
}

data class NavigationResponse(val sections: List<SectionGrant>)
