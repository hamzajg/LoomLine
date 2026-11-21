package com.loomline.order.domain

import java.util.UUID

/**
 * Replaces an order's routing sheet (replace-set semantics).
 *
 * Invariants enforced here, independent of HTTP and PostgreSQL:
 * - the order must exist and be DRAFT or RELEASED
 * - every step has a non-blank label (trimmed, at most 200 characters)
 * - every step references a known phase
 * - every step references a known, active machine (machine is optional)
 * - repetitions >= 1 and minutes >= 1
 * - an empty list clears the routing sheet
 *
 * All validation runs before any write; on failure nothing is stored.
 */
class SetOrderRoutingUseCase(
    private val orders: OrderRepository,
    private val reference: ReferenceCatalog,
) {
    fun set(orderId: UUID, input: List<RoutingStep>): SetRoutingResult {
        val order = orders.findById(orderId) ?: return SetRoutingResult.OrderNotFound
        if (order.status != OrderStatus.DRAFT && order.status != OrderStatus.RELEASED) {
            return SetRoutingResult.Locked(order.status)
        }

        val errors = linkedMapOf<String, String>()
        input.forEachIndexed { i, step ->
            val label = step.label.trim()
            if (label.isEmpty()) {
                errors["steps[$i].label"] = "Label must not be blank."
            } else if (label.length > 200) {
                errors["steps[$i].label"] = "Label must be at most 200 characters."
            }
            if (!reference.phaseExists(step.phaseId)) {
                errors["steps[$i].phaseId"] = "Unknown phase."
            }
            step.machineId?.let { machineId ->
                if (!reference.machineExists(machineId)) {
                    errors["steps[$i].machineId"] = "Unknown machine."
                } else if (!reference.machineActive(machineId)) {
                    errors["steps[$i].machineId"] = "Machine is not active."
                }
            }
            if (step.repetitions < 1) {
                errors["steps[$i].repetitions"] = "Repetitions must be greater than zero."
            }
            if (step.minutes < 1) {
                errors["steps[$i].minutes"] = "Minutes must be greater than zero."
            }
        }
        if (errors.isNotEmpty()) {
            return SetRoutingResult.Invalid(errors)
        }

        orders.replaceRouting(orderId, input)
        return SetRoutingResult.Saved(orders.routingSteps(orderId))
    }
}
