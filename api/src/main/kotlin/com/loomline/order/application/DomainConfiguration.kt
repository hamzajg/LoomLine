package com.loomline.order.application

import com.loomline.order.domain.ArticleCatalogue
import com.loomline.order.domain.ArticleStore
import com.loomline.order.domain.ColourCatalogue
import com.loomline.order.domain.ColourStore
import com.loomline.order.domain.CreateOrderUseCase
import com.loomline.order.domain.IdGenerator
import com.loomline.order.domain.OrderRepository
import com.loomline.order.domain.ReferenceCatalog
import com.loomline.order.domain.ReferenceQuery
import com.loomline.order.domain.SetOrderQuantitiesUseCase
import com.loomline.order.domain.SetOrderRoutingUseCase
import com.loomline.order.domain.SizeCatalogue
import com.loomline.order.domain.SizeStore
import com.loomline.order.domain.TimeSource
import com.loomline.order.domain.TransitionOrderUseCase
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

    @Produces
    @Singleton
    fun transitionOrderUseCase(
        orders: OrderRepository,
        time: TimeSource,
        ids: IdGenerator,
    ): TransitionOrderUseCase = TransitionOrderUseCase(orders, time, ids)

    @Produces
    @Singleton
    fun setOrderQuantitiesUseCase(
        orders: OrderRepository,
        catalog: ReferenceCatalog,
    ): SetOrderQuantitiesUseCase = SetOrderQuantitiesUseCase(orders, catalog)

    @Produces
    @Singleton
    fun setOrderRoutingUseCase(
        orders: OrderRepository,
        reference: ReferenceCatalog,
    ): SetOrderRoutingUseCase = SetOrderRoutingUseCase(orders, reference)

    @Produces
    @Singleton
    fun articleCatalogue(
        articles: ArticleStore,
        catalog: ReferenceCatalog,
        sizes: SizeStore,
        time: TimeSource,
        ids: IdGenerator,
    ): ArticleCatalogue = ArticleCatalogue(articles, catalog, sizes, time, ids)

    @Produces
    @Singleton
    fun colourCatalogue(
        colours: ColourStore,
        time: TimeSource,
        ids: IdGenerator,
    ): ColourCatalogue = ColourCatalogue(colours, time, ids)

    @Produces
    @Singleton
    fun sizeCatalogue(
        sizes: SizeStore,
        time: TimeSource,
        ids: IdGenerator,
    ): SizeCatalogue = SizeCatalogue(sizes, time, ids)
}
