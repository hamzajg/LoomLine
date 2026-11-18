package com.loomline.order.adapter.web

import com.loomline.order.application.OrderApplicationService
import com.loomline.order.domain.CreateOrderResult
import com.loomline.order.domain.NewOrder
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.GET
import jakarta.ws.rs.POST
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response

@Path("/api/orders")
@Produces(MediaType.APPLICATION_JSON)
class OrderResource(private val service: OrderApplicationService) {

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    fun create(request: CreateOrderRequest): Response {
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
