package com.loomline.order.adapter.web

import io.quarkus.test.junit.QuarkusTest
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.notNullValue
import org.junit.jupiter.api.Test
import java.util.UUID

@QuarkusTest
class OrderResourceIT {

    private val clientId = "11111111-1111-4111-8111-111111111111"
    private val articleId = "33333333-3333-4333-8333-333333333333"

    private fun uniqueReference() = "OF-${UUID.randomUUID()}"

    private fun createOrder(
        reference: String? = uniqueReference(),
        client: String? = clientId,
        article: String? = articleId,
        quantity: Int? = 250,
        dueDate: String? = "2026-12-15",
    ) = given()
        .contentType(ContentType.JSON)
        .body(
            mapOf(
                "reference" to reference,
                "clientId" to client,
                "articleId" to article,
                "quantity" to quantity,
                "dueDate" to dueDate,
            ),
        )
        .`when`()
        .post("/api/orders")

    @Test
    fun `creates an order and reads it back by reference`() {
        val reference = uniqueReference()

        createOrder(reference = reference)
            .then()
            .statusCode(201)
            .body("id", notNullValue())
            .body("reference", equalTo(reference))
            .body("status", equalTo("DRAFT"))
            .body("quantity", equalTo(250))
            .body("dueDate", equalTo("2026-12-15"))

        given()
            .`when`()
            .get("/api/orders/by-reference/{reference}", reference)
            .then()
            .statusCode(200)
            .body("reference", equalTo(reference))
            .body("status", equalTo("DRAFT"))
    }

    @Test
    fun `rejects a duplicate reference with a conflict`() {
        val reference = uniqueReference()
        createOrder(reference = reference).then().statusCode(201)

        createOrder(reference = reference.lowercase())
            .then()
            .statusCode(409)
            .body("code", equalTo("DUPLICATE_REFERENCE"))
    }

    @Test
    fun `rejects a non-positive quantity and names the field`() {
        createOrder(quantity = 0)
            .then()
            .statusCode(400)
            .body("code", equalTo("VALIDATION_FAILED"))
            .body("fieldErrors.quantity", equalTo("Quantity must be greater than zero."))
    }

    @Test
    fun `rejects a missing due date and names the field`() {
        createOrder(dueDate = null)
            .then()
            .statusCode(400)
            .body("fieldErrors.dueDate", equalTo("Due date is required."))
    }

    @Test
    fun `rejects an unknown client`() {
        createOrder(client = "99999999-9999-4999-8999-999999999999")
            .then()
            .statusCode(400)
            .body("fieldErrors.clientId", equalTo("Unknown client."))
    }

    @Test
    fun `returns not found for an unknown reference`() {
        given()
            .`when`()
            .get("/api/orders/by-reference/{reference}", "does-not-exist")
            .then()
            .statusCode(404)
            .body("code", equalTo("ORDER_NOT_FOUND"))
    }

    @Test
    fun `exposes the seeded reference data`() {
        given()
            .`when`()
            .get("/api/clients")
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(2))

        given()
            .`when`()
            .get("/api/articles")
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(2))
    }
}
