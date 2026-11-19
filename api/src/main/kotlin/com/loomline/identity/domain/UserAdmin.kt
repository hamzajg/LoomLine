package com.loomline.identity.domain

/** A user account as the access console needs it. */
data class ManagedUser(
    val id: String,
    val username: String,
    val email: String?,
    val enabled: Boolean,
    val roles: List<String>,
)

data class NewManagedUser(
    val username: String,
    val email: String?,
    val firstName: String?,
    val lastName: String?,
    val password: String,
    val role: String,
)

/**
 * Port for user administration. User records and credentials live in the
 * identity provider (Keycloak); the API orchestrates through this port so the
 * web layer never talks to the provider directly.
 */
interface UserAdmin {
    fun listUsers(): List<ManagedUser>

    /** Creates the user with the given realm role; returns the new user id. */
    fun createUser(user: NewManagedUser): String
}
