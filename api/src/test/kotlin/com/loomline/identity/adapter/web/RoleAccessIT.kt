package com.loomline.identity.adapter.web

import com.loomline.identity.domain.ManagedUser
import com.loomline.identity.domain.NewManagedUser
import com.loomline.identity.domain.UserAdmin
import io.quarkus.test.InjectMock
import io.quarkus.test.junit.QuarkusTest
import io.quarkus.test.security.TestSecurity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import org.hamcrest.Matchers.`is`
import org.hamcrest.Matchers.hasItem
import org.hamcrest.Matchers.not
import org.junit.jupiter.api.Test
import org.mockito.Mockito.`when`

/**
 * Wave 3 — US5/US6/US7 / scenario "API rejects an out-of-role action": the approved access matrix is enforced server-side.
 * Realm roles come from @TestSecurity; the Keycloak admin port is mocked so
 * the suite stays hermetic (the real provider is exercised on Compose).
 */
@QuarkusTest
class RoleAccessIT {

    @InjectMock
    lateinit var userAdmin: UserAdmin

    // --- navigation projection -------------------------------------------------

    @Test
    @TestSecurity(user = "supervisor", roles = ["production-supervisor"])
    fun `supervisor navigation lists only granted sections`() {
        given()
            .`when`().get("/api/navigation")
            .then().statusCode(200)
            .body("sections.find { it.id == 'production' }.view", `is`(true))
            .body("sections.find { it.id == 'production' }.manage", `is`(false))
            .body("sections.find { it.id == 'stock' }.view", `is`(true))
            .body("sections.find { it.id == 'commercial' }.view", `is`(false))
            .body("sections.find { it.id == 'access' }.view", `is`(false))
    }

    @Test
    @TestSecurity(user = "planner", roles = ["production-planner"])
    fun `planner navigation includes manage on production only`() {
        given()
            .`when`().get("/api/navigation")
            .then().statusCode(200)
            .body("sections.find { it.id == 'production' }.manage", `is`(true))
            .body("sections.find { it.id == 'stock' }.manage", `is`(false))
            .body("sections.find { it.id == 'commercial' }.view", `is`(true))
            .body("sections.find { it.id == 'access' }.view", `is`(false))
    }

    // --- API rejects out-of-role actions (US6) ---------------------------------

    @Test
    @TestSecurity(user = "supervisor", roles = ["production-supervisor"])
    fun `supervisor can read orders but cannot create one`() {
        given().`when`().get("/api/orders").then().statusCode(200)

        given().contentType(ContentType.JSON)
            .body(
                mapOf(
                    "reference" to "OF-DENIED",
                    "clientId" to "11111111-1111-4111-8111-111111111111",
                    "articleId" to "33333333-3333-4333-8333-333333333333",
                    "quantity" to 10,
                    "dueDate" to "2026-12-15",
                ),
            )
            .`when`().post("/api/orders")
            .then().statusCode(403)
            .body("code", `is`("FORBIDDEN"))
    }

    @Test
    @TestSecurity(user = "planner", roles = ["production-planner"])
    fun `planner can create orders but not administer users`() {
        // Valid body → passes the access check; the service may still reject
        // unknown references, so assert only that it is not a 403.
        given().contentType(ContentType.JSON)
            .body(
                mapOf(
                    "reference" to "OF-PLANNER",
                    "clientId" to "11111111-1111-4111-8111-111111111111",
                    "articleId" to "33333333-3333-4333-8333-333333333333",
                    "quantity" to 10,
                    "dueDate" to "2026-12-15",
                ),
            )
            .`when`().post("/api/orders")
            .then().statusCode(not(403))

        given().`when`().get("/api/users").then().statusCode(403)
        given().`when`().get("/api/roles").then().statusCode(403)
    }

    // --- administrator user creation (US7) --------------------------------------

    @Test
    @TestSecurity(user = "admin", roles = ["administrator"])
    fun `administrator lists roles and users`() {
        `when`(userAdmin.listUsers()).thenReturn(
            listOf(ManagedUser("u1", "planner", "p@x.io", true, listOf("production-planner"))),
        )

        given().`when`().get("/api/roles").then().statusCode(200)
            .body("find { it.id == 'administrator' }.id", `is`("administrator"))
            .body("find { it.id == 'production-planner' }.id", `is`("production-planner"))

        given().`when`().get("/api/users").then().statusCode(200)
            .body("find { it.username == 'planner' }.roles", hasItem("production-planner"))
    }

    @Test
    @TestSecurity(user = "admin", roles = ["administrator"])
    fun `administrator creates a user with a role`() {
        `when`(
            userAdmin.createUser(
                NewManagedUser(
                    username = "newbie",
                    email = "new@x.io",
                    firstName = null,
                    lastName = null,
                    password = "s3cret",
                    role = "production-supervisor",
                ),
            ),
        ).thenReturn("new-id")

        given().contentType(ContentType.JSON)
            .body(
                mapOf(
                    "username" to "newbie",
                    "email" to "new@x.io",
                    "password" to "s3cret",
                    "role" to "production-supervisor",
                ),
            )
            .`when`().post("/api/users")
            .then().statusCode(201)
            .body("username", `is`("newbie"))
            .body("roles", hasItem("production-supervisor"))
    }

    @Test
    @TestSecurity(user = "admin", roles = ["administrator"])
    fun `administrator cannot assign an unknown role`() {
        given().contentType(ContentType.JSON)
            .body(
                mapOf(
                    "username" to "bad",
                    "password" to "s3cret",
                    "role" to "superuser",
                ),
            )
            .`when`().post("/api/users")
            .then().statusCode(400)
            .body("code", `is`("UNKNOWN_ROLE"))
    }
}
