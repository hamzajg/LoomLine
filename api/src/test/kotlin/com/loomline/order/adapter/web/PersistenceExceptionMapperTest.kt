package com.loomline.order.adapter.web

import jakarta.persistence.PersistenceException
import org.hibernate.exception.ConstraintViolationException
import org.junit.jupiter.api.Test
import java.sql.SQLException
import kotlin.test.assertEquals

class PersistenceExceptionMapperTest {

    @Test
    fun `maps a duplicate order reference to conflict`() {
        val violation = ConstraintViolationException(
            "could not execute statement",
            SQLException("duplicate key value violates unique constraint", "23505"),
            "orders_reference_lower_uq",
        )

        val response = PersistenceExceptionMapper().toResponse(violation)

        assertEquals(409, response.status)
        val body = response.entity as ErrorResponse
        assertEquals("DUPLICATE_REFERENCE", body.code)
    }

    @Test
    fun `keeps other persistence failures opaque`() {
        val response = PersistenceExceptionMapper()
            .toResponse(PersistenceException("connection lost"))

        assertEquals(500, response.status)
        val body = response.entity as ErrorResponse
        assertEquals("INTERNAL_ERROR", body.code)
    }
}
