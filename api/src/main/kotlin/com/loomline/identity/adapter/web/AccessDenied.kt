package com.loomline.identity.adapter.web

import jakarta.ws.rs.core.Response
import jakarta.ws.rs.ext.ExceptionMapper
import jakarta.ws.rs.ext.Provider

data class ErrorResponse(
    val code: String,
    val message: String,
    val fieldErrors: Map<String, String>? = null,
)

/** Authenticated but outside the caller's granted sections → 403 (D-matrix). */
class ForbiddenException(message: String = "You do not have access to this area.") :
    RuntimeException(message)

@Provider
class ForbiddenExceptionMapper : ExceptionMapper<ForbiddenException> {
    override fun toResponse(exception: ForbiddenException): Response =
        Response.status(Response.Status.FORBIDDEN)
            .entity(ErrorResponse(code = "FORBIDDEN", message = exception.message ?: "Forbidden"))
            .build()
}
