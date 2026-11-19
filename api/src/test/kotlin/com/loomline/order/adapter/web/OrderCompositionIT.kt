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

// Composition behaviour assumes a signed-in user; authentication itself is covered by
// ApiAuthenticationIT, so the identity is provided rather than obtained.
@QuarkusTest
@TestSecurity(user = "tester", roles = ["administrator"])
class OrderCompositionIT {

    private val clientId = "11111111-1111-4111-8111-111111111111"
    private val articleId = "33333333-3333-4333-8333-333333333333"
    private val noir = "55555555-5555-4555-8555-555555555551"
    private val ecru = "55555555-5555-4555-8555-555555555552"
    private val sizeS = "66666666-6666-4666-8666-666666666661"
    private val sizeM = "66666666-6666-4666-8666-666666666662"

    private fun uniqueReference() = "OF-${UUID.randomUUID()}"

    private fun createOrder(quantity: Int = 100): String =
        given()
            .contentType(ContentType.JSON)
            .body(
                mapOf(
                    "reference" to uniqueReference(),
                    "clientId" to clientId,
                    "articleId" to articleId,
                    "quantity" to quantity,
                    "dueDate" to "2026-12-15",
                ),
            )
            .`when`()
            .post("/api/orders")
            .then()
            .statusCode(201)
            .extract()
            .path("id")

    private fun setQuantities(id: String, lines: List<Map<String, Any?>>) =
        given()
            .contentType(ContentType.JSON)
            .body(mapOf("lines" to lines))
            .`when`()
            .put("/api/orders/{id}/quantities", id)

    private fun line(colour: String, size: String, qty: Int) =
        mapOf("colourId" to colour, "sizeId" to size, "quantity" to qty)

    @Test
    fun `Set the colour-size breakdown of an order`() {
        val id = createOrder(100)

        setQuantities(
            id,
            listOf(
                line(noir, sizeS, 40),
                line(noir, sizeM, 30),
                line(ecru, sizeM, 30),
            ),
        )
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(3))

        given()
            .`when`()
            .get("/api/orders/{id}/quantities", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(3))
            .body("find { it.colourId == '$noir' && it.sizeId == '$sizeS' }.quantity", equalTo(40))
    }

    @Test
    fun `Read the breakdown of an order`() {
        val id = createOrder(50)
        setQuantities(id, listOf(line(noir, sizeS, 50)))
            .then()
            .statusCode(200)

        given()
            .`when`()
            .get("/api/orders/{id}/quantities", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(1))
            .body("[0].colourId", equalTo(noir))
            .body("[0].sizeId", equalTo(sizeS))
            .body("[0].quantity", equalTo(50))
    }

    @Test
    fun `Reject a breakdown exceeding the order quantity`() {
        val id = createOrder(100)

        setQuantities(id, listOf(line(noir, sizeS, 60), line(noir, sizeM, 60)))
            .then()
            .statusCode(400)
            .body("code", equalTo("VALIDATION_FAILED"))

        given()
            .`when`()
            .get("/api/orders/{id}/quantities", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(0))
    }

    @Test
    fun `Reject a breakdown with an unknown colour or size`() {
        val id = createOrder(100)

        setQuantities(id, listOf(line(UUID.randomUUID().toString(), sizeS, 10)))
            .then()
            .statusCode(400)
            .body("fieldErrors['lines[0].colourId']", notNullValue())
    }

    @Test
    fun `replace-set semantics overwrite previous lines`() {
        val id = createOrder(100)
        setQuantities(id, listOf(line(noir, sizeS, 50), line(ecru, sizeM, 50)))
            .then()
            .statusCode(200)

        setQuantities(id, listOf(line(noir, sizeM, 100)))
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(1))
    }

    @Test
    fun `Reject composition changes on an order in progress`() {
        val id = createOrder(100)
        setQuantities(id, listOf(line(noir, sizeS, 100))).then().statusCode(200)

        given()
            .contentType(ContentType.JSON)
            .body(mapOf("to" to "RELEASED"))
            .`when`()
            .post("/api/orders/{id}/transitions", id)
            .then()
            .statusCode(200)

        given()
            .contentType(ContentType.JSON)
            .body(mapOf("to" to "IN_PROGRESS"))
            .`when`()
            .post("/api/orders/{id}/transitions", id)
            .then()
            .statusCode(200)

        setQuantities(id, listOf(line(ecru, sizeS, 100)))
            .then()
            .statusCode(409)
            .body("code", equalTo("COMPOSITION_LOCKED"))

        given()
            .`when`()
            .get("/api/orders/{id}/quantities", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(1))
            .body("[0].colourId", equalTo(noir))
    }

    @Test
    fun `exposes colours and sizes for pickers`() {
        given()
            .`when`()
            .get("/api/colours")
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(3))

        given()
            .`when`()
            .get("/api/sizes")
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(4))
            .body("[0].sizeType", equalTo("Alpha"))
    }
}
