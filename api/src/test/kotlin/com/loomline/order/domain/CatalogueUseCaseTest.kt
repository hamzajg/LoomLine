package com.loomline.order.domain

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNull
import kotlin.test.assertTrue
import java.time.Instant
import java.util.UUID

class CatalogueUseCaseTest {

    private val clientId = UUID.randomUUID()
    private val articleId = UUID.randomUUID()
    private val colourId = UUID.randomUUID()
    private val sizeId = UUID.randomUUID()

    private fun articleDraft(
        reference: String? = "ART-1",
        label: String? = "Shirt",
        client: UUID? = clientId,
        sizeType: String? = "Alpha",
        unit: String? = "pcs",
    ) = ArticleDraft(reference, label, client, sizeType, unit)

    private fun colourDraft(code: String? = "NV", label: String? = "Noir") =
        ColourDraft(code, label)

    private fun sizeDraft(code: String? = "S", label: String? = "S", sizeType: String? = "Alpha") =
        SizeDraft(code, label, sizeType)

    // --- articles ---------------------------------------------------------------

    @Test
    fun `creates an article with a generated id and timestamp`() {
        val store = FakeArticleStore()
        val result = ArticleCatalogue(store, FakeCatalog(setOf(clientId)), FakeSizeStore(setOf("Alpha")), time, ids)
            .save(null, articleDraft())

        val saved = assertIs<CatalogueResult.Saved<Article>>(result).value
        assertEquals("ART-1", saved.reference)
        assertEquals(clientId, saved.clientId)
        assertEquals("Alpha", saved.sizeType)
        assertEquals("pcs", saved.unit)
        assertEquals(1, store.rows.size)
    }

    @Test
    fun `updates an existing article keeping id and createdAt`() {
        val store = FakeArticleStore(articleStoreSeed())
        val result = ArticleCatalogue(store, FakeCatalog(setOf(clientId)), FakeSizeStore(setOf("Alpha")), time, ids)
            .save(articleId, articleDraft(reference = "ART-9", label = "Renamed"))

        val saved = assertIs<CatalogueResult.Saved<Article>>(result).value
        assertEquals(articleId, saved.id)
        assertEquals("ART-9", saved.reference)
        assertEquals("Renamed", saved.label)
    }

    @Test
    fun `rejects a duplicate article reference case-insensitively`() {
        val store = FakeArticleStore(articleStoreSeed())
        val result = ArticleCatalogue(store, FakeCatalog(setOf(clientId)), FakeSizeStore(setOf("Alpha")), time, ids)
            .save(null, articleDraft(reference = "art-1"))

        assertIs<CatalogueResult.Duplicate>(result)
        assertEquals(1, store.rows.size)
    }

    @Test
    fun `rejects an article with an unknown client`() {
        val result = ArticleCatalogue(FakeArticleStore(), FakeCatalog(emptySet()), FakeSizeStore(setOf("Alpha")), time, ids)
            .save(null, articleDraft())

        val invalid = assertIs<CatalogueResult.Invalid>(result)
        assertTrue("clientId" in invalid.fieldErrors)
    }

    @Test
    fun `rejects an article with an unknown size type`() {
        val result = ArticleCatalogue(FakeArticleStore(), FakeCatalog(setOf(clientId)), FakeSizeStore(setOf("Alpha")), time, ids)
            .save(null, articleDraft(sizeType = "Gamma"))

        val invalid = assertIs<CatalogueResult.Invalid>(result)
        assertTrue("sizeType" in invalid.fieldErrors)
    }

    @Test
    fun `accepts an article without a size type`() {
        val result = ArticleCatalogue(FakeArticleStore(), FakeCatalog(setOf(clientId)), FakeSizeStore(setOf("Alpha")), time, ids)
            .save(null, articleDraft(sizeType = null))

        assertIs<CatalogueResult.Saved<Article>>(result)
    }

    @Test
    fun `reports missing required fields together`() {
        val result = ArticleCatalogue(FakeArticleStore(), FakeCatalog(setOf(clientId)), FakeSizeStore(setOf("Alpha")), time, ids)
            .save(null, articleDraft(reference = null, label = " ", client = null, unit = null))

        val invalid = assertIs<CatalogueResult.Invalid>(result)
        assertTrue(setOf("reference", "label", "clientId", "unit").all { it in invalid.fieldErrors })
    }

    @Test
    fun `update of an unknown article returns not found`() {
        val result = ArticleCatalogue(FakeArticleStore(), FakeCatalog(setOf(clientId)), FakeSizeStore(setOf("Alpha")), time, ids)
            .save(UUID.randomUUID(), articleDraft())

        assertIs<CatalogueResult.NotFound>(result)
    }

    @Test
    fun `delete of an in-use article is refused`() {
        val store = FakeArticleStore(articleStoreSeed(inUse = true))
        val result = ArticleCatalogue(store, FakeCatalog(setOf(clientId)), FakeSizeStore(setOf("Alpha")), time, ids)
            .remove(articleId)

        assertIs<CatalogueResult.InUse>(result)
        assertEquals(1, store.rows.size)
    }

    @Test
    fun `delete of an unused article removes it`() {
        val store = FakeArticleStore(articleStoreSeed())
        val result = ArticleCatalogue(store, FakeCatalog(setOf(clientId)), FakeSizeStore(setOf("Alpha")), time, ids)
            .remove(articleId)

        assertIs<CatalogueResult.Deleted>(result)
        assertTrue(store.rows.isEmpty())
    }

    // --- colours -----------------------------------------------------------------

    @Test
    fun `creates a colour`() {
        val store = FakeColourStore()
        val result = ColourCatalogue(store, time, ids).save(null, colourDraft())

        val saved = assertIs<CatalogueResult.Saved<Colour>>(result).value
        assertEquals("NV", saved.code)
        assertEquals(1, store.rows.size)
    }

    @Test
    fun `rejects a duplicate colour code case-insensitively`() {
        val store = FakeColourStore(colourStoreSeed())
        val result = ColourCatalogue(store, time, ids).save(null, colourDraft(code = "nv"))

        assertIs<CatalogueResult.Duplicate>(result)
    }

    @Test
    fun `delete of a colour used in a breakdown is refused`() {
        val store = FakeColourStore(colourStoreSeed(inUse = true))
        val result = ColourCatalogue(store, time, ids).remove(colourId)

        assertIs<CatalogueResult.InUse>(result)
    }

    // --- sizes -------------------------------------------------------------------

    @Test
    fun `creates a size`() {
        val store = FakeSizeStore(setOf("Alpha"))
        val result = SizeCatalogue(store, time, ids).save(null, sizeDraft())

        val saved = assertIs<CatalogueResult.Saved<Size>>(result).value
        assertEquals("Alpha", saved.sizeType)
    }

    @Test
    fun `rejects a duplicate size code within the same size type`() {
        val store = FakeSizeStore(setOf("Alpha"), sizeStoreSeed())
        val result = SizeCatalogue(store, time, ids).save(null, sizeDraft(code = "s"))

        assertIs<CatalogueResult.Duplicate>(result)
    }

    @Test
    fun `allows the same size code under a different size type`() {
        val store = FakeSizeStore(setOf("Alpha", "Beta"), sizeStoreSeed())
        val result = SizeCatalogue(store, time, ids)
            .save(null, sizeDraft(code = "S", sizeType = "Beta"))

        assertIs<CatalogueResult.Saved<Size>>(result)
    }

    @Test
    fun `delete of a size used in a breakdown is refused`() {
        val store = FakeSizeStore(setOf("Alpha"), sizeStoreSeed(inUse = true))
        val result = SizeCatalogue(store, time, ids).remove(sizeId)

        assertIs<CatalogueResult.InUse>(result)
    }

    @Test
    fun `search filters by query`() {
        val store = FakeArticleStore(articleStoreSeed())
        val result = ArticleCatalogue(store, FakeCatalog(setOf(clientId)), FakeSizeStore(setOf("Alpha")), time, ids)
            .search("ART")

        assertEquals(1, result.size)
        assertNull(result.singleOrNull { it.reference == "OTHER" })
    }

    private fun articleStoreSeed(inUse: Boolean = false) = Article(
        id = articleId,
        reference = "ART-1",
        label = "Shirt",
        clientId = clientId,
        sizeType = "Alpha",
        unit = "pcs",
        createdAt = Instant.now(),
    ).let { listOf(SeededArticle(it, inUse)) }

    private fun colourStoreSeed(inUse: Boolean = false) = SeededColour(
        Colour(colourId, "NV", "Noir", Instant.now()), inUse,
    ).let { listOf(it) }

    private fun sizeStoreSeed(inUse: Boolean = false) = SeededSize(
        Size(sizeId, "S", "S", "Alpha", Instant.now()), inUse,
    ).let { listOf(it) }

    private val time = TimeSource { Instant.parse("2026-01-01T00:00:00Z") }
    private val ids = IdGenerator { UUID.randomUUID() }
}

private class FakeCatalog(private val clients: Set<UUID>) : ReferenceCatalog {
    override fun clientExists(id: UUID) = id in clients
    override fun articleExists(id: UUID) = true
    override fun colourExists(id: UUID) = true
    override fun sizeExists(id: UUID) = true
    override fun articleSizeType(articleId: UUID) = "Alpha"
    override fun sizeTypeOf(sizeId: UUID) = "Alpha"
    override fun phaseExists(id: UUID) = true
    override fun machineExists(id: UUID) = true
    override fun machineActive(id: UUID) = true
}

private data class SeededArticle(val article: Article, val inUse: Boolean)

private class FakeArticleStore(
    private val seeded: List<SeededArticle> = emptyList(),
) : ArticleStore {
    val rows = seeded.map { it.article }.toMutableList()
    private val inUseIds = seeded.filter { it.inUse }.map { it.article.id }.toSet()

    override fun searchArticles(query: String?) =
        rows.filter {
            query.isNullOrBlank() ||
                it.reference.contains(query, true) || it.label.contains(query, true)
        }

    override fun findById(id: UUID) = rows.firstOrNull { it.id == id }

    override fun existsByReference(reference: String, excludeId: UUID?) =
        rows.any { it.reference.equals(reference, true) && it.id != excludeId }

    override fun save(article: Article): Article {
        rows.removeAll { it.id == article.id }
        rows.add(article)
        return article
    }

    override fun delete(id: UUID) {
        rows.removeAll { it.id == id }
    }

    override fun inUse(id: UUID) = id in inUseIds
}

private data class SeededColour(val colour: Colour, val inUse: Boolean)

private class FakeColourStore(
    private val seeded: List<SeededColour> = emptyList(),
) : ColourStore {
    val rows = seeded.map { it.colour }.toMutableList()
    private val inUseIds = seeded.filter { it.inUse }.map { it.colour.id }.toSet()

    override fun searchColours(query: String?) =
        rows.filter {
            query.isNullOrBlank() || it.code.contains(query, true) || it.label.contains(query, true)
        }

    override fun findById(id: UUID) = rows.firstOrNull { it.id == id }

    override fun existsByCode(code: String, excludeId: UUID?) =
        rows.any { it.code.equals(code, true) && it.id != excludeId }

    override fun save(colour: Colour): Colour {
        rows.removeAll { it.id == colour.id }
        rows.add(colour)
        return colour
    }

    override fun delete(id: UUID) {
        rows.removeAll { it.id == id }
    }

    override fun inUse(id: UUID) = id in inUseIds
}

private data class SeededSize(val size: Size, val inUse: Boolean)

private class FakeSizeStore(
    private val types: Set<String>,
    private val seeded: List<SeededSize> = emptyList(),
) : SizeStore {
    val rows = seeded.map { it.size }.toMutableList()
    private val inUseIds = seeded.filter { it.inUse }.map { it.size.id }.toSet()

    override fun searchSizes(query: String?) =
        rows.filter {
            query.isNullOrBlank() ||
                it.code.contains(query, true) || it.label.contains(query, true) ||
                it.sizeType.contains(query, true)
        }

    override fun findById(id: UUID) = rows.firstOrNull { it.id == id }

    override fun existsByCodeAndType(code: String, sizeType: String, excludeId: UUID?) =
        rows.any {
            it.code.equals(code, true) && it.sizeType.equals(sizeType, true) && it.id != excludeId
        }

    override fun save(size: Size): Size {
        rows.removeAll { it.id == size.id }
        rows.add(size)
        return size
    }

    override fun delete(id: UUID) {
        rows.removeAll { it.id == id }
    }

    override fun inUse(id: UUID) = id in inUseIds

    override fun sizeTypes() = types.toList()
}
