package com.loomline.order.application

import com.loomline.order.domain.Article
import com.loomline.order.domain.ArticleCatalogue
import com.loomline.order.domain.ArticleDraft
import com.loomline.order.domain.CatalogueResult
import com.loomline.order.domain.Colour
import com.loomline.order.domain.ColourCatalogue
import com.loomline.order.domain.ColourDraft
import com.loomline.order.domain.Size
import com.loomline.order.domain.SizeCatalogue
import com.loomline.order.domain.SizeDraft
import jakarta.enterprise.context.ApplicationScoped
import jakarta.transaction.Transactional
import java.util.UUID

/**
 * Transaction boundary around the framework-free catalogue use cases.
 * Uniqueness is pre-checked for friendly errors; the database's unique
 * indexes remain the real guarantee.
 */
@ApplicationScoped
class CatalogueApplicationService(
    private val articleCatalogue: ArticleCatalogue,
    private val colourCatalogue: ColourCatalogue,
    private val sizeCatalogue: SizeCatalogue,
) {
    @Transactional
    fun searchArticles(query: String?): List<Article> = articleCatalogue.search(query)

    @Transactional
    fun saveArticle(id: UUID?, input: ArticleDraft): CatalogueResult<Article> =
        articleCatalogue.save(id, input)

    @Transactional
    fun removeArticle(id: UUID): CatalogueResult<Nothing> = articleCatalogue.remove(id)

    @Transactional
    fun searchColours(query: String?): List<Colour> = colourCatalogue.search(query)

    @Transactional
    fun saveColour(id: UUID?, input: ColourDraft): CatalogueResult<Colour> =
        colourCatalogue.save(id, input)

    @Transactional
    fun removeColour(id: UUID): CatalogueResult<Nothing> = colourCatalogue.remove(id)

    @Transactional
    fun searchSizes(query: String?): List<Size> = sizeCatalogue.search(query)

    @Transactional
    fun saveSize(id: UUID?, input: SizeDraft): CatalogueResult<Size> =
        sizeCatalogue.save(id, input)

    @Transactional
    fun removeSize(id: UUID): CatalogueResult<Nothing> = sizeCatalogue.remove(id)
}
