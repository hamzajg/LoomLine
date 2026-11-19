package com.loomline.identity.adapter.keycloak

import com.loomline.identity.domain.ManagedUser
import com.loomline.identity.domain.NewManagedUser
import com.loomline.identity.domain.UserAdmin
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import jakarta.enterprise.context.ApplicationScoped
import org.eclipse.microprofile.config.inject.ConfigProperty
import java.net.URI
import java.net.URLEncoder
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

/**
 * Thin client over the Keycloak Admin REST API — user lifecycle stays in the
 * identity provider (D-identity); the API only orchestrates.
 *
 * Authenticates with the bootstrap admin account against the `master` realm
 * (`KC_BOOTSTRAP_ADMIN_*`), then manages users in the application realm.
 */
@ApplicationScoped
class KeycloakUserAdmin : UserAdmin {

    @ConfigProperty(name = "loomline.keycloak.admin-url")
    lateinit var adminUrl: String

    @ConfigProperty(name = "loomline.keycloak.admin-username")
    lateinit var adminUsername: String

    @ConfigProperty(name = "loomline.keycloak.admin-password")
    lateinit var adminPassword: String

    @ConfigProperty(name = "loomline.keycloak.realm")
    lateinit var realm: String

    private val http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build()
    private val mapper: ObjectMapper = jacksonObjectMapper()

    override fun listUsers(): List<ManagedUser> {
        val raw = get("/admin/realms/$realm/users?max=200") as List<Map<String, Any?>>
        val rolesByUser = raw.associate { it["id"] as String to realmRolesOf(it["id"] as String) }
        return raw.map {
            ManagedUser(
                id = it["id"] as String,
                username = it["username"] as String,
                email = it["email"] as? String,
                enabled = it["enabled"] as? Boolean ?: true,
                roles = rolesByUser[it["id"]] ?: emptyList(),
            )
        }
    }

    /** Creates the user and assigns the realm role. Returns the new user id. */
    override fun createUser(user: NewManagedUser): String {
        val body = mapOf(
            "username" to user.username,
            "email" to user.email,
            "firstName" to user.firstName,
            "lastName" to user.lastName,
            "enabled" to true,
            // Admin-provisioned accounts are trusted: don't force the
            // verify-profile required action on first sign-in.
            "emailVerified" to true,
            "credentials" to listOf(
                mapOf("type" to "password", "value" to user.password, "temporary" to false),
            ),
        )
        val location = send(
            "POST",
            "/admin/realms/$realm/users",
            mapper.writeValueAsString(body),
        ) ?: error("Keycloak user creation returned no Location header")
        val id = location.substringAfterLast('/')
        assignRealmRole(id, user.role)
        return id
    }

    private fun realmRolesOf(userId: String): List<String> {
        val roles = get("/admin/realms/$realm/users/$userId/role-mappings/realm") as List<Map<String, Any?>>
        return roles.mapNotNull { it["name"] as? String }.sorted()
    }

    private fun assignRealmRole(userId: String, role: String) {
        val roleRep = get("/admin/realms/$realm/roles/$role") as Map<String, Any?>
        send(
            "POST",
            "/admin/realms/$realm/users/$userId/role-mappings/realm",
            mapper.writeValueAsString(listOf(roleRep)),
        )
    }

    private fun token(): String {
        val form = listOf(
            "grant_type" to "password",
            "client_id" to "admin-cli",
            "username" to adminUsername,
            "password" to adminPassword,
        ).joinToString("&") { (k, v) -> "$k=${URLEncoder.encode(v, Charsets.UTF_8)}" }
        val request = HttpRequest.newBuilder()
            .uri(URI.create("$adminUrl/realms/master/protocol/openid-connect/token"))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString(form))
            .build()
        val response = http.send(request, HttpResponse.BodyHandlers.ofString())
        check(response.statusCode() == 200) { "Keycloak admin token request failed: ${response.statusCode()}" }
        return mapper.readValue<Map<String, Any>>(response.body())["access_token"] as String
    }

    private fun get(path: String): Any =
        send("GET", path, null)?.let { mapper.readValue<Any>(it) }
            ?: error("Keycloak admin GET $path returned no body")

    private fun send(method: String, path: String, body: String?): String? {
        val builder = HttpRequest.newBuilder()
            .uri(URI.create("$adminUrl$path"))
            .header("Authorization", "Bearer ${token()}")
        when (method) {
            "GET" -> builder.GET()
            "POST" -> builder.header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body ?: "{}"))
            else -> error("unsupported method $method")
        }
        val response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString())
        check(response.statusCode() in 200..299) {
            "Keycloak admin $method $path failed: ${response.statusCode()} ${response.body()}"
        }
        return response.headers().firstValue("Location").orElse(response.body())
            .takeIf { it.isNotBlank() }
    }

}
