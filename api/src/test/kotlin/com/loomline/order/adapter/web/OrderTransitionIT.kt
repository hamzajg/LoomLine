package com.loomline.order.adapter.web

import io.quarkus.test.junit.QuarkusTest
import io.quarkus.test.security.TestSecurity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.notNullValue
import org.junit.jupiter.api.Test
import java.util.UUID

// Lifecycle behaviour assumes a signed-in user; authentication itself is covered by
// ApiAuthenticationIT, so the identity is provided rather than obtained.
@QuarkusTest
@TestSecurity(user = "tester", roles = ["administrator"])
class OrderTransitionIT {

    private val clientId = "11111111-1111-4111-8111-111111111111"
    private val articleId = "33333333-3333-4333-8333-333333333333"

    private fun uniqueReference() = "OF-${UUID.randomUUID()}"

    private fun createOrder(reference: String = uniqueReference()): String =
        given()
            .contentType(ContentType.JSON)
            .body(
                mapOf(
                    "reference" to reference,
                    "clientId" to clientId,
                    "articleId" to articleId,
                    "quantity" to 100,
                    "dueDate" to "2026-12-15",
                ),
            )
            .`when`()
            .post("/api/orders")
            .then()
            .statusCode(201)
            .extract()
            .path("id")

    private fun transition(id: String, to: String?, reason: String? = null) =
        given()
            .contentType(ContentType.JSON)
            .body(mapOf("to" to to, "reason" to reason))
            .`when`()
            .post("/api/orders/{id}/transitions", id)

    @Test
    fun `Advance an order through its lifecycle`() {
        val id = createOrder()

        transition(id, "RELEASED")
            .then()
            .statusCode(200)
            .body("status", equalTo("RELEASED"))

        transition(id, "IN_PROGRESS").then().statusCode(200).body("status", equalTo("IN_PROGRESS"))
        transition(id, "COMPLETED").then().statusCode(200).body("status", equalTo("COMPLETED"))

        given()
            .`when`()
            .get("/api/orders/{id}/history", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(3))
            .body("find { it.toStatus == 'COMPLETED' }.fromStatus", equalTo("IN_PROGRESS"))
            .body("find { it.toStatus == 'COMPLETED' }.changedAt", notNullValue())
            .body("find { it.toStatus == 'COMPLETED' }.changedBy", notNullValue())
    }

    @Test
    fun `Reject an invalid status transition`() {
        val id = createOrder()
        transition(id, "RELEASED").then().statusCode(200)
        transition(id, "IN_PROGRESS").then().statusCode(200)
        transition(id, "COMPLETED").then().statusCode(200)

        transition(id, "IN_PROGRESS")
            .then()
            .statusCode(409)
            .body("code", equalTo("ORDER_TERMINAL"))
    }

    @Test
    fun `Terminal orders cannot be cancelled`() {
        val id = createOrder()
        transition(id, "CANCELLED").then().statusCode(200)

        transition(id, "RELEASED")
            .then()
            .statusCode(409)
            .body("code", equalTo("ORDER_TERMINAL"))
            .body("status", equalTo("CANCELLED"))

        given()
            .`when`()
            .get("/api/orders/{id}", id)
            .then()
            .statusCode(200)
            .body("status", equalTo("CANCELLED"))
    }

    @Test
    fun `rejects a non-table transition with INVALID_STATUS_TRANSITION`() {
        val id = createOrder()

        transition(id, "COMPLETED")
            .then()
            .statusCode(409)
            .body("code", equalTo("INVALID_STATUS_TRANSITION"))
    }

    @Test
    fun `cancelling an order in progress requires a reason`() {
        val id = createOrder()
        transition(id, "RELEASED").then().statusCode(200)
        transition(id, "IN_PROGRESS").then().statusCode(200)

        transition(id, "CANCELLED")
            .then()
            .statusCode(400)
            .body("fieldErrors.reason", equalTo("A cancellation reason is required."))

        transition(id, "CANCELLED", reason = "customer request")
            .then()
            .statusCode(200)
            .body("status", equalTo("CANCELLED"))

        given()
            .`when`()
            .get("/api/orders/{id}/history", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(3))
            .body("findAll { it.toStatus == 'CANCELLED' }[0].reason", equalTo("customer request"))
    }

    @Test
    fun `rejects an unknown target status`() {
        val id = createOrder()
        transition(id, "SHIPPED")
            .then()
            .statusCode(400)
            .body("code", equalTo("INVALID_STATUS"))
    }

    @Test
    fun `returns not found when transitioning an unknown order`() {
        transition(UUID.randomUUID().toString(), "RELEASED")
            .then()
            .statusCode(404)
            .body("code", equalTo("ORDER_NOT_FOUND"))
    }
}
