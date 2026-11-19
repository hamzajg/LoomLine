package com.loomline.identity.adapter.web

import io.quarkus.oidc.IdToken
import io.quarkus.security.Authenticated
import io.quarkus.security.identity.SecurityIdentity
import jakarta.inject.Inject
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import org.eclipse.microprofile.jwt.JsonWebToken

/**
 * The current session, as the shell needs it: who the user is and which roles
 * they hold.
 */
data class SessionResponse(
    val username: String,
    val displayName: String,
    val roles: List<String>,
)

/**
 * Session endpoints for the browser.
 *
 * Sign-in and sign-out themselves are handled by Quarkus OIDC's authorization
 * code flow (`quarkus.oidc.authentication.redirect-path` and
 * `quarkus.oidc.logout.path`): an unauthenticated request to `/api/auth/login`
 * is redirected to Keycloak, and `/api/auth/logout` clears the session. This
 * resource only describes the resulting session and gives the login path a
 * target once the user is back and authenticated.
 *
 * Every API path requires a session (see `application.properties`), so an
 * unauthenticated XHR to `/api/auth/session` is rejected with 401 rather than a
 * redirect, which is what the web client keys off.
 */
@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
class AuthResource {

    @Inject
    lateinit var identity: SecurityIdentity

    @Inject
    @IdToken
    lateinit var idToken: JsonWebToken

    @GET
    @Path("/session")
    @Authenticated
    fun session(): SessionResponse {
        val username = claim("preferred_username") ?: identity.principal?.name ?: "unknown"
        val displayName = claim("name") ?: username
        return SessionResponse(
            username = username,
            displayName = displayName,
            roles = identity.roles.toList().sorted(),
        )
    }

    /**
     * Entry point for the browser's sign-in. Unauthenticated callers never
     * reach this method — the OIDC challenge redirects them to Keycloak first.
     * Once authenticated the user is sent back to the application root.
     */
    @GET
    @Path("/login")
    @Authenticated
    fun login(): Response =
        Response.status(Response.Status.FOUND).header("Location", "/").build()

    private fun claim(name: String): String? =
        runCatching { idToken.getClaim<String>(name) }.getOrNull()?.takeIf { it.isNotBlank() }
}
