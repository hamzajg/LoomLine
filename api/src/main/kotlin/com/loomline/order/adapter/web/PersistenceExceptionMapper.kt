package com.loomline.order.adapter.web

import jakarta.persistence.OptimisticLockException
import jakarta.persistence.PersistenceException
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import jakarta.ws.rs.ext.ExceptionMapper
import jakarta.ws.rs.ext.Provider
import org.hibernate.StaleObjectStateException
import org.hibernate.exception.ConstraintViolationException
import java.sql.SQLException

/**
 * Translates persistence failures into the public error shape.
 *
 * A unique-index violation on the order reference is a concurrency-safe
 * duplicate (the pre-check in the use case cannot see uncommitted rows), so it
 * maps to the same 409 the pre-check produces. Every other persistence failure
 * stays opaque and returns 500.
 */
@Provider
class PersistenceExceptionMapper : ExceptionMapper<PersistenceException> {

    override fun toResponse(exception: PersistenceException): Response {
        if (exception.isDuplicateReference()) {
            return Response
                .status(Response.Status.CONFLICT)
                .type(MediaType.APPLICATION_JSON)
                .entity(
                    ErrorResponse(
                        code = "DUPLICATE_REFERENCE",
                        message = "An order with this reference already exists.",
                    ),
                )
                .build()
        }

        if (exception.isStaleWrite()) {
            return Response
                .status(Response.Status.CONFLICT)
                .type(MediaType.APPLICATION_JSON)
                .entity(
                    ErrorResponse(
                        code = "STALE_ORDER",
                        message = "The order was modified by someone else; reload and retry.",
                    ),
                )
                .build()
        }

        return Response
            .status(Response.Status.INTERNAL_SERVER_ERROR)
            .type(MediaType.APPLICATION_JSON)
            .entity(
                ErrorResponse(
                    code = "INTERNAL_ERROR",
                    message = "The request could not be completed.",
                ),
            )
            .build()
    }
}

private fun PersistenceException.isStaleWrite(): Boolean {
    var cause: Throwable? = this
    while (cause != null) {
        if (cause is OptimisticLockException || cause is StaleObjectStateException) return true
        cause = cause.cause
    }
    return false
}

private fun PersistenceException.isDuplicateReference(): Boolean {
    var cause: Throwable? = this
    while (cause != null) {
        if (cause is ConstraintViolationException &&
            cause.constraintName == REFERENCE_UNIQUE_INDEX
        ) {
            return true
        }
        if (cause is SQLException && cause.sqlState == UNIQUE_VIOLATION) return true
        cause = cause.cause
    }
    return false
}

private const val REFERENCE_UNIQUE_INDEX = "orders_reference_lower_uq"
private const val UNIQUE_VIOLATION = "23505"
