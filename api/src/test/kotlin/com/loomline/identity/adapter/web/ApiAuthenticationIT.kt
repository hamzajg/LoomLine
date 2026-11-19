package com.loomline.identity.adapter.web

import io.quarkus.test.junit.QuarkusTest
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import org.hamcrest.Matchers.equalTo
import org.junit.jupiter.api.Test

/**
 * Wave 2 — US4 / scenario "API rejects a request without a session": every API request requires a session.
 *
 * No @TestSecurity here on purpose: these checks exercise the real, enforced
 * behaviour of an anonymous caller. The OIDC provider is not contacted (tests
 * disable discovery), so the assertions are hermetic.
 */
@QuarkusTest
class ApiAuthenticationIT {

    @Test
    fun `API rejects a request without a session`() {
        given()
            .header("X-Requested-With", "JavaScript")
            .`when`()
            .get("/api/orders")
            .then()
            .statusCode(401)
    }

    @Test
    fun `API rejects a write without a session and performs no work`() {
        given()
            .header("X-Requested-With", "JavaScript")
            .contentType(ContentType.JSON)
            .body(
                mapOf(
                    "reference" to "OF-NO-SESSION",
                    "clientId" to "11111111-1111-4111-8111-111111111111",
                    "articleId" to "33333333-3333-4333-8333-333333333333",
                    "quantity" to 10,
                    "dueDate" to "2026-12-15",
                ),
            )
            .`when`()
            .post("/api/orders")
            .then()
            .statusCode(401)
    }

    @Test
    fun `the session endpoint requires a session`() {
        given()
            .header("X-Requested-With", "JavaScript")
            .`when`()
            .get("/api/auth/session")
            .then()
            .statusCode(401)
    }

    @Test
    fun `health stays open without a session`() {
        given()
            .`when`()
            .get("/q/health")
            .then()
            .statusCode(200)
            .body("status", equalTo("UP"))
    }
}
