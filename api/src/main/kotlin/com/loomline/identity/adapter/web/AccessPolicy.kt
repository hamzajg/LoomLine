package com.loomline.identity.adapter.web

import com.loomline.identity.domain.AccessMap
import io.quarkus.security.identity.SecurityIdentity
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject

/**
 * Server-side enforcement of ACCESS-MATRIX.md. Grants come from the caller's
 * realm roles via [AccessMap] — the same map the shell's navigation payload
 * is projected from, so the two can never drift (D4).
 */
@ApplicationScoped
class AccessPolicy {

    @Inject
    lateinit var identity: SecurityIdentity

    fun grants() = AccessMap.grantsFor(identity.roles)

    /** Sections the caller may view — drives `/api/navigation` and the shell. */
    fun viewSections() = grants().filterValues { it.view }.keys.toList()

    fun canManage(section: String) = grants()[section]?.manage == true

    /** Throws [ForbiddenException] unless the caller holds `action` on `section`. */
    fun require(section: String, manage: Boolean = false) {
        val access = grants()[section]
        if (access == null || !access.view || (manage && !access.manage)) {
            throw ForbiddenException()
        }
    }
}
