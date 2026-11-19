package com.loomline.order.adapter.web

import com.loomline.identity.adapter.web.AccessPolicy
import com.loomline.order.application.OrderApplicationService
import com.loomline.order.domain.CreateOrderResult
import com.loomline.order.domain.NewOrder
import com.loomline.order.domain.OrderStatus
import com.loomline.order.domain.QuantityLine
import com.loomline.order.domain.SetQuantitiesResult
import com.loomline.order.domain.TransitionOrderResult
import io.quarkus.security.identity.SecurityIdentity
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.GET
import jakarta.ws.rs.POST
import jakarta.ws.rs.PUT
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.QueryParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import java.util.UUID

@Path("/api/orders")
@Produces(MediaType.APPLICATION_JSON)
class OrderResource(
    private val service: OrderApplicationService,
    private val policy: AccessPolicy,
    private val identity: SecurityIdentity,
) {

    @GET
    fun list(
        @QueryParam("status") statusStr: String?,
        @QueryParam("reference") reference: String?,
    ): Response {
        policy.require("production")
        val status = statusStr?.trim()?.takeIf { it.isNotEmpty() }?.let {
            try {
                com.loomline.order.domain.OrderStatus.valueOf(it.uppercase())
            } catch (e: IllegalArgumentException) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(
                        ErrorResponse(
                            code = "INVALID_STATUS",
                            message = "Unknown status: $it",
                        ),
                    )
                    .build()
            }
        }
        val orders = service.list(status, reference?.trim()?.takeIf { it.isNotEmpty() })
        return Response.ok(orders.map { OrderResponse.from(it) }).build()
    }

    @GET
    @Path("/{id}")
    fun getById(@PathParam("id") id: UUID): Response {
        policy.require("production")
        val order = service.findById(id)
            ?: return Response.status(Response.Status.NOT_FOUND)
                .entity(
                    ErrorResponse(
                        code = "ORDER_NOT_FOUND",
                        message = "No order with id \"$id\".",
                    ),
                )
                .build()

        return Response.ok(OrderResponse.from(order)).build()
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    fun create(request: CreateOrderRequest): Response {
        policy.require("production", manage = true)
        val result = service.create(
            NewOrder(
                reference = request.reference,
                clientId = request.clientId,
                articleId = request.articleId,
                quantity = request.quantity,
                dueDate = request.dueDate,
            ),
        )
        return when (result) {
            is CreateOrderResult.Created -> Response
                .status(Response.Status.CREATED)
                .entity(OrderResponse.from(result.order))
                .build()

            is CreateOrderResult.Invalid -> Response
                .status(Response.Status.BAD_REQUEST)
                .entity(
                    ErrorResponse(
                        code = "VALIDATION_FAILED",
                        message = "The order could not be created.",
                        fieldErrors = result.fieldErrors,
                    ),
                )
                .build()

            CreateOrderResult.DuplicateReference -> Response
                .status(Response.Status.CONFLICT)
                .entity(
                    ErrorResponse(
                        code = "DUPLICATE_REFERENCE",
                        message = "An order with this reference already exists.",
                    ),
                )
                .build()
        }
    }

    @POST
    @Path("/{id}/transitions")
    @Consumes(MediaType.APPLICATION_JSON)
    fun transition(@PathParam("id") id: UUID, request: TransitionRequest): Response {
        policy.require("production", manage = true)
        val to = request.to?.trim()?.uppercase()?.let {
            try {
                OrderStatus.valueOf(it)
            } catch (e: IllegalArgumentException) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(
                        ErrorResponse(
                            code = "INVALID_STATUS",
                            message = "Unknown status: ${request.to}",
                        ),
                    )
                    .build()
            }
        } ?: return Response.status(Response.Status.BAD_REQUEST)
            .entity(
                ErrorResponse(
                    code = "VALIDATION_FAILED",
                    message = "The transition could not be applied.",
                    fieldErrors = mapOf("to" to "Target status is required."),
                ),
            )
            .build()

        return when (
            val result = service.transition(id, to, request.reason, identity.principal.name)
        ) {
            is TransitionOrderResult.Transitioned ->
                Response.ok(OrderResponse.from(result.order)).build()

            TransitionOrderResult.OrderNotFound -> notFound(id)

            is TransitionOrderResult.InvalidTransition -> Response
                .status(Response.Status.CONFLICT)
                .entity(
                    ErrorResponse(
                        code = "INVALID_STATUS_TRANSITION",
                        message = "Cannot move an order from ${result.from} to ${result.to}.",
                        from = result.from.name,
                        to = result.to.name,
                    ),
                )
                .build()

            is TransitionOrderResult.Terminal -> Response
                .status(Response.Status.CONFLICT)
                .entity(
                    ErrorResponse(
                        code = "ORDER_TERMINAL",
                        message = "Order is in terminal status ${result.status}; no transitions are allowed.",
                        status = result.status.name,
                    ),
                )
                .build()

            TransitionOrderResult.ReasonRequired -> Response
                .status(Response.Status.BAD_REQUEST)
                .entity(
                    ErrorResponse(
                        code = "VALIDATION_FAILED",
                        message = "Cancelling an order in progress requires a reason.",
                        fieldErrors = mapOf("reason" to "A cancellation reason is required."),
                    ),
                )
                .build()
        }
    }

    @GET
    @Path("/{id}/history")
    fun history(@PathParam("id") id: UUID): Response {
        policy.require("production")
        if (service.findById(id) == null) return notFound(id)
        return Response.ok(service.history(id).map { StatusHistoryResponse.from(it) }).build()
    }

    @GET
    @Path("/{id}/quantities")
    fun quantities(@PathParam("id") id: UUID): Response {
        policy.require("production")
        if (service.findById(id) == null) return notFound(id)
        return Response.ok(service.quantities(id).map { QuantityLineResponse.from(it) }).build()
    }

    @PUT
    @Path("/{id}/quantities")
    @Consumes(MediaType.APPLICATION_JSON)
    fun setQuantities(@PathParam("id") id: UUID, request: SetQuantitiesRequest): Response {
        policy.require("production", manage = true)
        val raw = request.lines ?: emptyList()
        val lines = raw.map { line ->
            QuantityLine(
                colourId = line.colourId ?: java.util.UUID(0, 0),
                sizeId = line.sizeId ?: java.util.UUID(0, 0),
                quantity = line.quantity ?: 0,
            )
        }
        return when (val result = service.setQuantities(id, lines)) {
            is SetQuantitiesResult.Saved ->
                Response.ok(result.lines.map { QuantityLineResponse.from(it) }).build()

            SetQuantitiesResult.OrderNotFound -> notFound(id)

            is SetQuantitiesResult.Locked -> Response
                .status(Response.Status.CONFLICT)
                .entity(
                    ErrorResponse(
                        code = "COMPOSITION_LOCKED",
                        message = "The order is ${result.status}; its breakdown can no longer change.",
                        status = result.status.name,
                    ),
                )
                .build()

            is SetQuantitiesResult.Invalid -> Response
                .status(Response.Status.BAD_REQUEST)
                .entity(
                    ErrorResponse(
                        code = "VALIDATION_FAILED",
                        message = "The breakdown could not be stored.",
                        fieldErrors = result.fieldErrors,
                    ),
                )
                .build()
        }
    }

    private fun notFound(id: UUID): Response =
        Response.status(Response.Status.NOT_FOUND)
            .entity(
                ErrorResponse(
                    code = "ORDER_NOT_FOUND",
                    message = "No order with id \"$id\".",
                ),
            )
            .build()

    @GET
    @Path("/by-reference/{reference}")
    fun byReference(@PathParam("reference") reference: String): Response {
        policy.require("production")
        val order = service.findByReference(reference)
            ?: return Response
                .status(Response.Status.NOT_FOUND)
                .entity(
                    ErrorResponse(
                        code = "ORDER_NOT_FOUND",
                        message = "No order with reference \"$reference\".",
                    ),
                )
                .build()

        return Response.ok(OrderResponse.from(order)).build()
    }
}
