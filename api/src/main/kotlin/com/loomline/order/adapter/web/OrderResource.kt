package com.loomline.order.adapter.web

import com.loomline.identity.adapter.web.AccessPolicy
import com.loomline.order.application.OrderApplicationService
import com.loomline.order.domain.CreateOrderResult
import com.loomline.order.domain.NewOrder
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.GET
import jakarta.ws.rs.POST
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
