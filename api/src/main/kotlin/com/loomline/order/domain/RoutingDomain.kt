package com.loomline.order.domain

import java.util.UUID

/** A production phase (reference data, seeded read-only in this feature). */
data class Phase(
    val id: UUID,
    val code: String,
    val label: String,
)

/** A production machine (reference data, seeded read-only in this feature). */
data class Machine(
    val id: UUID,
    val reference: String,
    val label: String,
    val active: Boolean,
)

/** One ordered routing step on an order. */
data class RoutingStep(
    val position: Int,
    val label: String,
    val phaseId: UUID,
    val machineId: UUID?,
    val repetitions: Int,
    val minutes: Int,
)

/** A persisted routing step, including its storage id. */
data class OrderRoutingStep(
    val id: UUID,
    val orderId: UUID,
    val position: Int,
    val label: String,
    val phaseId: UUID,
    val machineId: UUID?,
    val repetitions: Int,
    val minutes: Int,
)

/** Result of replacing an order's routing sheet (replace-set semantics). */
sealed interface SetRoutingResult {
    data class Saved(val steps: List<RoutingStep>) : SetRoutingResult

    data object OrderNotFound : SetRoutingResult

    /** Routing is editable only in DRAFT and RELEASED. */
    data class Locked(val status: OrderStatus) : SetRoutingResult

    /** The request was rejected; [fieldErrors] is keyed by request field. */
    data class Invalid(val fieldErrors: Map<String, String>) : SetRoutingResult
}

/** Read access to reference data used by routing. */
interface ReferenceLookup {
    fun phaseExists(id: UUID): Boolean
    fun machineExists(id: UUID): Boolean
    fun machineActive(id: UUID): Boolean
}

/** Write access to routing steps. */
interface RoutingStepRepository {
    fun replace(orderId: UUID, steps: List<RoutingStep>)
    fun steps(orderId: UUID): List<OrderRoutingStep>
}
