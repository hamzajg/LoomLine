package com.loomline.identity.domain

/**
 * The single role → section/action map approved as ACCESS-MATRIX.md (G3).
 * Server authorization and shell navigation both derive from this map (D4);
 * anything not granted here is denied.
 */
object AccessMap {

    data class SectionAccess(val view: Boolean, val manage: Boolean)

    val SECTIONS = listOf("production", "stock", "commercial", "quality", "equipment", "hr", "access")

    val ROLES = listOf("administrator", "production-planner", "production-supervisor")

    private val view = SectionAccess(view = true, manage = false)
    private val manage = SectionAccess(view = true, manage = true)
    private val none = SectionAccess(view = false, manage = false)

    private val byRole: Map<String, Map<String, SectionAccess>> = mapOf(
        "administrator" to SECTIONS.associateWith { manage },
        "production-planner" to mapOf(
            "production" to manage,
            "stock" to view,
            "commercial" to view,
        ),
        "production-supervisor" to mapOf(
            "production" to view,
            "stock" to view,
        ),
    )

    /** Union of every granted section across the caller's realm roles. */
    fun grantsFor(roles: Collection<String>): Map<String, SectionAccess> {
        val merged = mutableMapOf<String, SectionAccess>()
        for (role in roles) {
            for ((section, access) in byRole[role] ?: emptyMap()) {
                val current = merged[section] ?: none
                merged[section] = SectionAccess(
                    view = current.view || access.view,
                    manage = current.manage || access.manage,
                )
            }
        }
        return merged
    }
}
