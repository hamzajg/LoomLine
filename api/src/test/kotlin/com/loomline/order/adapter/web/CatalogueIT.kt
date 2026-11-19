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

// Catalogue behaviour assumes a signed-in planner; authentication itself is
// covered by ApiAuthenticationIT, so the identity is provided.
@QuarkusTest
@TestSecurity(user = "planner", roles = ["production-planner"])
class CatalogueIT {

    private val clientId = "11111111-1111-4111-8111-111111111111"
    private val seededArticleId = "33333333-3333-4333-8333-333333333333"
    private val noir = "55555555-5555-4555-8555-555555555551"
    private val sizeS = "66666666-6666-4666-8666-666666666661"

    private fun unique() = UUID.randomUUID().toString().take(8).uppercase()

    // --- articles -----------------------------------------------------------------

    @Test
    fun `create list update and delete an article`() {
        val reference = "CAT-${unique()}"

        val id = given()
            .contentType(ContentType.JSON)
            .body(
                mapOf(
                    "reference" to reference,
                    "label" to "Catalogue test article",
                    "clientId" to clientId,
                    "sizeType" to "Alpha",
                    "unit" to "pcs",
                ),
            )
            .`when`().post("/api/articles")
            .then().statusCode(201)
            .body("reference", equalTo(reference))
            .body("unit", equalTo("pcs"))
            .extract().path<String>("id")

        given().`when`().get("/api/articles?q=$reference")
            .then().statusCode(200)
            .body("$", hasSize<Any>(1))
            .body("[0].id", equalTo(id))

        given().contentType(ContentType.JSON)
            .body(
                mapOf(
                    "reference" to reference,
                    "label" to "Renamed article",
                    "clientId" to clientId,
                    "sizeType" to "Alpha",
                    "unit" to "dozen",
                ),
            )
            .`when`().put("/api/articles/{id}", id)
            .then().statusCode(200)
            .body("label", equalTo("Renamed article"))
            .body("unit", equalTo("dozen"))

        given().`when`().delete("/api/articles/{id}", id)
            .then().statusCode(204)

        given().`when`().get("/api/articles?q=$reference")
            .then().statusCode(200)
            .body("$", hasSize<Any>(0))
    }

    @Test
    fun `reject a duplicate article reference`() {
        given().contentType(ContentType.JSON)
            .body(
                mapOf(
                    "reference" to "art-100",
                    "label" to "Duplicate",
                    "clientId" to clientId,
                    "unit" to "pcs",
                ),
            )
            .`when`().post("/api/articles")
            .then().statusCode(409)
            .body("code", equalTo("DUPLICATE"))
    }

    @Test
    fun `reject an article with an unknown client`() {
        given().contentType(ContentType.JSON)
            .body(
                mapOf(
                    "reference" to "CAT-${unique()}",
                    "label" to "No client",
                    "clientId" to UUID.randomUUID().toString(),
                    "unit" to "pcs",
                ),
            )
            .`when`().post("/api/articles")
            .then().statusCode(400)
            .body("code", equalTo("VALIDATION_FAILED"))
            .body("fieldErrors.clientId", notNullValue())
    }

    @Test
    fun `reject deleting an article referenced by an order`() {
        given().contentType(ContentType.JSON)
            .body(
                mapOf(
                    "reference" to "OF-CAT-${unique()}",
                    "clientId" to clientId,
                    "articleId" to seededArticleId,
                    "quantity" to 10,
                    "dueDate" to "2026-12-15",
                ),
            )
            .`when`().post("/api/orders")
            .then().statusCode(201)

        given().`when`().delete("/api/articles/{id}", seededArticleId)
            .then().statusCode(409)
            .body("code", equalTo("IN_USE"))
    }

    // --- colours ------------------------------------------------------------------

    @Test
    fun `create update search and delete a colour`() {
        val code = "TST${unique()}"

        val id = given().contentType(ContentType.JSON)
            .body(mapOf("code" to code, "label" to "Test colour"))
            .`when`().post("/api/colours")
            .then().statusCode(201)
            .body("code", equalTo(code))
            .extract().path<String>("id")

        given().`when`().get("/api/colours?q=$code")
            .then().statusCode(200)
            .body("$", hasSize<Any>(1))

        given().contentType(ContentType.JSON)
            .body(mapOf("code" to code, "label" to "Renamed colour"))
            .`when`().put("/api/colours/{id}", id)
            .then().statusCode(200)
            .body("label", equalTo("Renamed colour"))

        given().`when`().delete("/api/colours/{id}", id)
            .then().statusCode(204)
    }

    @Test
    fun `reject deleting a colour used in an order breakdown`() {
        // Noir is referenced once a breakdown line uses it; ensure one exists.
        val orderId = given().contentType(ContentType.JSON)
            .body(
                mapOf(
                    "reference" to "OF-CAT-${unique()}",
                    "clientId" to clientId,
                    "articleId" to seededArticleId,
                    "quantity" to 10,
                    "dueDate" to "2026-12-15",
                ),
            )
            .`when`().post("/api/orders")
            .then().statusCode(201)
            .extract().path<String>("id")

        given().contentType(ContentType.JSON)
            .body(mapOf("lines" to listOf(mapOf("colourId" to noir, "sizeId" to sizeS, "quantity" to 10))))
            .`when`().put("/api/orders/{id}/quantities", orderId)
            .then().statusCode(200)

        given().`when`().delete("/api/colours/{id}", noir)
            .then().statusCode(409)
            .body("code", equalTo("IN_USE"))
    }

    // --- sizes --------------------------------------------------------------------

    @Test
    fun `create update and delete a size`() {
        val code = "T${unique()}"

        val id = given().contentType(ContentType.JSON)
            .body(mapOf("code" to code, "label" to "Test size", "sizeType" to "Alpha"))
            .`when`().post("/api/sizes")
            .then().statusCode(201)
            .body("sizeType", equalTo("Alpha"))
            .extract().path<String>("id")

        given().`when`().get("/api/sizes?q=$code")
            .then().statusCode(200)
            .body("$", hasSize<Any>(1))

        given().contentType(ContentType.JSON)
            .body(mapOf("code" to code, "label" to "Renamed size", "sizeType" to "Alpha"))
            .`when`().put("/api/sizes/{id}", id)
            .then().statusCode(200)
            .body("label", equalTo("Renamed size"))

        given().`when`().delete("/api/sizes/{id}", id)
            .then().statusCode(204)
    }

    @Test
    fun `reject a duplicate size code within the same size type`() {
        given().contentType(ContentType.JSON)
            .body(mapOf("code" to "s", "label" to "Dup", "sizeType" to "alpha"))
            .`when`().post("/api/sizes")
            .then().statusCode(409)
            .body("code", equalTo("DUPLICATE"))
    }

    @Test
    fun `catalogue lists remain readable for a viewer`() {
        given().`when`().get("/api/articles").then().statusCode(200)
        given().`when`().get("/api/colours").then().statusCode(200)
        given().`when`().get("/api/sizes").then().statusCode(200)
    }
}

@QuarkusTest
class CatalogueAccessIT {

    @Test
    @TestSecurity(user = "supervisor", roles = ["production-supervisor"])
    fun `supervisor reads the catalogue but cannot write`() {
        given().`when`().get("/api/articles").then().statusCode(200)
        given().`when`().get("/api/colours").then().statusCode(200)
        given().`when`().get("/api/sizes").then().statusCode(200)

        given().contentType(ContentType.JSON)
            .body(mapOf("code" to "NOPE", "label" to "Denied"))
            .`when`().post("/api/colours")
            .then().statusCode(403)
            .body("code", equalTo("FORBIDDEN"))
    }
}
