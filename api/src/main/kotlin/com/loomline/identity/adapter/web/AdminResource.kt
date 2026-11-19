package com.loomline.identity.adapter.web

import com.loomline.identity.domain.AccessMap
import com.loomline.identity.domain.ManagedUser
import com.loomline.identity.domain.NewManagedUser
import com.loomline.identity.domain.UserAdmin
import io.quarkus.security.Authenticated
import jakarta.inject.Inject
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.GET
import jakarta.ws.rs.POST
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response

data class RoleResponse(val id: String)

data class UserResponse(
    val id: String,
    val username: String,
    val email: String?,
    val enabled: Boolean,
    val roles: List<String>,
)

data class CreateUserRequest(
    @field:NotBlank val username: String,
    val email: String? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    @field:NotBlank val password: String,
    @field:NotBlank val role: String,
)

/**
 * Access administration (US7): list roles/users and create a user with a
 * realm role. Reads need `access:view`, writes `access:manage` — enforced
 * here through AccessPolicy; user records live in Keycloak.
 */
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
class AdminResource {

    @Inject
    lateinit var policy: AccessPolicy

    @Inject
    lateinit var users: UserAdmin

    @GET
    @Path("/roles")
    @Authenticated
    fun roles(): List<RoleResponse> {
        policy.require("access")
        return AccessMap.ROLES.map { RoleResponse(it) }
    }

    @GET
    @Path("/users")
    @Authenticated
    fun listUsers(): List<UserResponse> {
        policy.require("access")
        return users.listUsers().map { it.toResponse() }
    }

    @POST
    @Path("/users")
    @Authenticated
    fun createUser(@Valid request: CreateUserRequest): Response {
        policy.require("access", manage = true)
        if (request.role !in AccessMap.ROLES) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(ErrorResponse(code = "UNKNOWN_ROLE", message = "Unknown role \"${request.role}\"."))
                .build()
        }
        val id = users.createUser(
            NewManagedUser(
                username = request.username,
                email = request.email,
                firstName = request.firstName,
                lastName = request.lastName,
                password = request.password,
                role = request.role,
            ),
        )
        return Response.status(Response.Status.CREATED)
            .entity(UserResponse(id, request.username, request.email, true, listOf(request.role)))
            .build()
    }

    private fun ManagedUser.toResponse() =
        UserResponse(id, username, email, enabled, roles)
}
