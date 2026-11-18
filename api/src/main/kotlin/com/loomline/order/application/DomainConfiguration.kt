package com.loomline.order.application

import com.loomline.order.domain.CreateOrderUseCase
import com.loomline.order.domain.IdGenerator
import com.loomline.order.domain.OrderRepository
import com.loomline.order.domain.ReferenceCatalog
import com.loomline.order.domain.TimeSource
import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.inject.Produces
import jakarta.inject.Singleton
import java.time.Instant
import java.util.UUID

/** Wires the framework-free domain to the runtime. */
@ApplicationScoped
class DomainConfiguration {

    @Produces
    @Singleton
    fun timeSource(): TimeSource = TimeSource { Instant.now() }

    @Produces
    @Singleton
    fun idGenerator(): IdGenerator = IdGenerator { UUID.randomUUID() }

    @Produces
    @Singleton
    fun createOrderUseCase(
        orders: OrderRepository,
        catalog: ReferenceCatalog,
        time: TimeSource,
        ids: IdGenerator,
    ): CreateOrderUseCase = CreateOrderUseCase(orders, catalog, time, ids)
}
