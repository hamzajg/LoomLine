package com.loomline.order.adapter.web

import io.quarkus.test.junit.QuarkusTest
import io.quarkus.test.security.TestSecurity
import io.restassured.RestAssured.given
import io.restassured.http.ContentType
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import org.junit.jupiter.api.Test
import java.util.UUID

// Routing behaviour assumes a signed-in user; authentication itself is covered by
// ApiAuthenticationIT, so the identity is provided rather than obtained.
@QuarkusTest
@TestSecurity(user = "tester", roles = ["administrator"])
class OrderRoutingIT {

    private val clientId = "11111111-1111-4111-8111-111111111111"
    private val articleId = "33333333-3333-4333-8333-333333333333"
    private val phaseCut = "77777777-7777-4777-8777-777777777771"
    private val phaseSew = "77777777-7777-4777-8777-777777777772"
    private val machineMc1 = "88888888-8888-4888-8888-888888888881"
    private val machineMc2 = "88888888-8888-4888-8888-888888888882"

    private fun uniqueReference() = "OF-${UUID.randomUUID()}"

    private fun createOrder(): String =
        given()
            .contentType(ContentType.JSON)
            .body(
                mapOf(
                    "reference" to uniqueReference(),
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

    private fun setRouting(id: String, steps: List<Map<String, Any?>>) =
        given()
            .contentType(ContentType.JSON)
            .body(mapOf("steps" to steps))
            .`when`()
            .put("/api/orders/{id}/routing", id)

    private fun step(label: String, phaseId: String, machineId: String?, reps: Int, mins: Int) =
        mapOf(
            "label" to label,
            "phaseId" to phaseId,
            "machineId" to machineId,
            "repetitions" to reps,
            "minutes" to mins,
        )

    private fun routingStepResponse(
        position: Int,
        label: String,
        phaseId: String,
        machineId: String?,
        reps: Int,
        mins: Int,
    ) =
        mapOf(
            "position" to position,
            "label" to label,
            "phaseId" to phaseId,
            "machineId" to machineId,
            "repetitions" to reps,
            "minutes" to mins,
        )

    @Test
    fun `Set and read a routing sheet on a draft order`() {
        val id = createOrder()

        setRouting(
            id,
            listOf(
                step("Cut the panels", phaseCut, machineMc1, 1, 4),
                step("Join the panels", phaseSew, machineMc2, 2, 6),
            ),
        )
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(2))
            .body("[0].label", equalTo("Cut the panels"))
            .body("[0].position", equalTo(1))
            .body("[1].label", equalTo("Join the panels"))
            .body("[1].position", equalTo(2))

        given()
            .`when`()
            .get("/api/orders/{id}/routing", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(2))
            .body("[0].label", equalTo("Cut the panels"))
            .body("[1].label", equalTo("Join the panels"))
    }

    @Test
    fun `Clear the routing sheet with an empty list`() {
        val id = createOrder()

        setRouting(
            id,
            listOf(step("Cut the panels", phaseCut, machineMc1, 1, 4)),
        )
            .then()
            .statusCode(200)

        setRouting(id, emptyList())
            .then()
            .statusCode(200)

        given()
            .`when`()
            .get("/api/orders/{id}/routing", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(0))
    }

    @Test
    fun `Replace-set overwrites previous routing steps`() {
        val id = createOrder()

        setRouting(
            id,
            listOf(step("First", phaseCut, machineMc1, 1, 4)),
        )
            .then()
            .statusCode(200)

        setRouting(
            id,
            listOf(step("Second", phaseSew, machineMc2, 1, 5)),
        )
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(1))
            .body("[0].label", equalTo("Second"))
    }

    @Test
    fun `Edit routing steps on the order screen (read-modify-write)`() {
        val id = createOrder()

        // Initial: two-step routing sheet
        setRouting(
            id,
            listOf(
                step("Cut the panels", phaseCut, machineMc1, 1, 4),
                step("Join the panels", phaseSew, machineMc2, 2, 6),
            ),
        )
            .then()
            .statusCode(200)

        // Planner opens the order, reads the routing sheet
        given()
            .`when`()
            .get("/api/orders/{id}/routing", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(2))

        // Planner: removes the first step, reorders the remaining step first,
        // adds a new step, saves
        setRouting(
            id,
            listOf(
                step("Join the panels", phaseSew, machineMc2, 2, 6),
                step("Press and finish", phaseSew, null, 1, 3),
            ),
        )
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(2))
            .body("[0].label", equalTo("Join the panels"))
            .body("[0].position", equalTo(1))
            .body("[1].label", equalTo("Press and finish"))
            .body("[1].position", equalTo(2))

        // Reopening the order shows the same sequence
        given()
            .`when`()
            .get("/api/orders/{id}/routing", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(2))
            .body("[0].label", equalTo("Join the panels"))
            .body("[1].label", equalTo("Press and finish"))
    }

    @Test
    fun `Reject routing changes on an order in progress`() {
        val id = createOrder()

        setRouting(
            id,
            listOf(step("Cut the panels", phaseCut, machineMc1, 1, 4)),
        )
            .then()
            .statusCode(200)

        // Transition to IN_PROGRESS
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

        // Routing changes are locked
        setRouting(
            id,
            listOf(step("Changed", phaseSew, machineMc2, 1, 5)),
        )
            .then()
            .statusCode(409)
            .body("code", equalTo("ROUTING_LOCKED"))

        // Stored steps are unchanged
        given()
            .`when`()
            .get("/api/orders/{id}/routing", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(1))
            .body("[0].label", equalTo("Cut the panels"))
    }

    @Test
    fun `Reject routing with unknown phase`() {
        val id = createOrder()

        setRouting(
            id,
            listOf(step("Bad step", "00000000-0000-0000-0000-000000000000", null, 1, 4)),
        )
            .then()
            .statusCode(400)
            .body("code", equalTo("VALIDATION_FAILED"))
            .body("fieldErrors['steps[0].phaseId']", equalTo("Unknown phase."))

        given()
            .`when`()
            .get("/api/orders/{id}/routing", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(0))
    }

    @Test
    fun `Reject routing with inactive machine`() {
        val id = createOrder()
        val inactiveMachine = "88888888-8888-4888-8888-888888888884"

        setRouting(
            id,
            listOf(step("Bad step", phaseCut, inactiveMachine, 1, 4)),
        )
            .then()
            .statusCode(400)
            .body("code", equalTo("VALIDATION_FAILED"))
            .body("fieldErrors['steps[0].machineId']", equalTo("Machine is not active."))

        given()
            .`when`()
            .get("/api/orders/{id}/routing", id)
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(0))
    }

    @Test
    fun `Reject routing with zero minutes`() {
        val id = createOrder()

        setRouting(
            id,
            listOf(step("Bad step", phaseCut, machineMc1, 1, 0)),
        )
            .then()
            .statusCode(400)
            .body("code", equalTo("VALIDATION_FAILED"))
            .body("fieldErrors['steps[0].minutes']", equalTo("Minutes must be greater than zero."))
    }

    @Test
    fun `Expose phases and machines for pickers`() {
        given()
            .`when`()
            .get("/api/phases")
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(6))

        given()
            .`when`()
            .get("/api/machines")
            .then()
            .statusCode(200)
            .body("$", hasSize<Any>(4))
            .body("[0].reference", equalTo("MC-01"))
            .body("[3].active", equalTo(false))
    }
}
