package com.loomline.order.domain

import java.time.Instant
import java.util.UUID

/** A catalogue article. Framework-free: no persistence or CDI types. */
data class Article(
    val id: UUID,
    val reference: String,
    val label: String,
    val clientId: UUID,
    val sizeType: String?,
    val unit: String,
    val createdAt: Instant,
)

data class Colour(
    val id: UUID,
    val code: String,
    val label: String,
    val createdAt: Instant,
)

data class Size(
    val id: UUID,
    val code: String,
    val label: String,
    val sizeType: String,
    val createdAt: Instant,
)

/** Raw write payloads. Every field is optional so validation reports all errors. */
data class ArticleDraft(
    val reference: String?,
    val label: String?,
    val clientId: UUID?,
    val sizeType: String?,
    val unit: String?,
)

data class ColourDraft(val code: String?, val label: String?)

data class SizeDraft(val code: String?, val label: String?, val sizeType: String?)

sealed interface CatalogueResult<out T> {
    data class Saved<T>(val value: T) : CatalogueResult<T>

    data class Deleted(val id: UUID) : CatalogueResult<Nothing>

    /** The request was rejected; [fieldErrors] is keyed by request field name. */
    data class Invalid(val fieldErrors: Map<String, String>) : CatalogueResult<Nothing>

    /** A record with the same natural key (case-insensitive) already exists. */
    data object Duplicate : CatalogueResult<Nothing>

    data object NotFound : CatalogueResult<Nothing>

    /** The record is still referenced and cannot be deleted (CATALOGUE-RULES.md). */
    data object InUse : CatalogueResult<Nothing>
}

/**
 * Creates and updates catalogue articles (CATALOGUE-RULES.md).
 *
 * Invariants enforced here, independent of HTTP and PostgreSQL:
 * - reference and label are required; reference is unique case-insensitively
 * - client must exist; size type, when provided, must be a size type in use
 * - unit is required
 * - updates keep the storage id and creation timestamp
 */
class ArticleCatalogue(
    private val articles: ArticleStore,
    private val catalog: ReferenceCatalog,
    private val sizes: SizeStore,
    private val time: TimeSource,
    private val ids: IdGenerator,
) {
    fun search(query: String?): List<Article> = articles.searchArticles(query)

    fun save(id: UUID?, input: ArticleDraft): CatalogueResult<Article> {
        val errors = linkedMapOf<String, String>()

        val reference = input.reference?.trim().orEmpty()
        when {
            reference.isEmpty() -> errors["reference"] = "Reference is required."
            reference.length > MAX_REFERENCE_LENGTH ->
                errors["reference"] = "Reference must be at most $MAX_REFERENCE_LENGTH characters."
        }

        val label = input.label?.trim().orEmpty()
        if (label.isEmpty()) {
            errors["label"] = "Label is required."
        }

        if (input.clientId == null) {
            errors["clientId"] = "Client is required."
        } else if (!catalog.clientExists(input.clientId)) {
            errors["clientId"] = "Unknown client."
        }

        val sizeType = input.sizeType?.trim()?.takeIf { it.isNotEmpty() }
        if (sizeType != null && sizes.sizeTypes().none { it.equals(sizeType, ignoreCase = true) }) {
            errors["sizeType"] = "Unknown size type."
        }

        val unit = input.unit?.trim().orEmpty()
        if (unit.isEmpty()) {
            errors["unit"] = "Unit is required."
        }

        if (errors.isNotEmpty()) {
            return CatalogueResult.Invalid(errors)
        }

        val existing = id?.let { articles.findById(it) }
        if (id != null && existing == null) {
            return CatalogueResult.NotFound
        }
        if (articles.existsByReference(reference, id)) {
            return CatalogueResult.Duplicate
        }

        val article = existing?.copy(
            reference = reference,
            label = label,
            clientId = requireNotNull(input.clientId),
            sizeType = sizeType,
            unit = unit,
        ) ?: Article(
            id = ids.newId(),
            reference = reference,
            label = label,
            clientId = requireNotNull(input.clientId),
            sizeType = sizeType,
            unit = unit,
            createdAt = time.now(),
        )
        return CatalogueResult.Saved(articles.save(article))
    }

    fun remove(id: UUID): CatalogueResult<Nothing> {
        if (articles.findById(id) == null) return CatalogueResult.NotFound
        if (articles.inUse(id)) return CatalogueResult.InUse
        articles.delete(id)
        return CatalogueResult.Deleted(id)
    }

    private companion object {
        const val MAX_REFERENCE_LENGTH = 64
    }
}

/**
 * Creates, updates and deletes catalogue colours.
 * Code is unique case-insensitively; deletes are refused while an order
 * quantity line references the colour.
 */
class ColourCatalogue(
    private val colours: ColourStore,
    private val time: TimeSource,
    private val ids: IdGenerator,
) {
    fun search(query: String?): List<Colour> = colours.searchColours(query)

    fun save(id: UUID?, input: ColourDraft): CatalogueResult<Colour> {
        val errors = linkedMapOf<String, String>()

        val code = input.code?.trim().orEmpty()
        when {
            code.isEmpty() -> errors["code"] = "Code is required."
            code.length > MAX_CODE_LENGTH ->
                errors["code"] = "Code must be at most $MAX_CODE_LENGTH characters."
        }

        val label = input.label?.trim().orEmpty()
        if (label.isEmpty()) {
            errors["label"] = "Label is required."
        }

        if (errors.isNotEmpty()) {
            return CatalogueResult.Invalid(errors)
        }

        val existing = id?.let { colours.findById(it) }
        if (id != null && existing == null) {
            return CatalogueResult.NotFound
        }
        if (colours.existsByCode(code, id)) {
            return CatalogueResult.Duplicate
        }

        val colour = existing?.copy(code = code, label = label)
            ?: Colour(id = ids.newId(), code = code, label = label, createdAt = time.now())
        return CatalogueResult.Saved(colours.save(colour))
    }

    fun remove(id: UUID): CatalogueResult<Nothing> {
        if (colours.findById(id) == null) return CatalogueResult.NotFound
        if (colours.inUse(id)) return CatalogueResult.InUse
        colours.delete(id)
        return CatalogueResult.Deleted(id)
    }

    private companion object {
        const val MAX_CODE_LENGTH = 64
    }
}

/**
 * Creates, updates and deletes catalogue sizes.
 * `(code, size_type)` is unique case-insensitively; deletes are refused
 * while an order quantity line references the size.
 */
class SizeCatalogue(
    private val sizes: SizeStore,
    private val time: TimeSource,
    private val ids: IdGenerator,
) {
    fun search(query: String?): List<Size> = sizes.searchSizes(query)

    fun save(id: UUID?, input: SizeDraft): CatalogueResult<Size> {
        val errors = linkedMapOf<String, String>()

        val code = input.code?.trim().orEmpty()
        when {
            code.isEmpty() -> errors["code"] = "Code is required."
            code.length > MAX_CODE_LENGTH ->
                errors["code"] = "Code must be at most $MAX_CODE_LENGTH characters."
        }

        val label = input.label?.trim().orEmpty()
        if (label.isEmpty()) {
            errors["label"] = "Label is required."
        }

        val sizeType = input.sizeType?.trim().orEmpty()
        if (sizeType.isEmpty()) {
            errors["sizeType"] = "Size type is required."
        }

        if (errors.isNotEmpty()) {
            return CatalogueResult.Invalid(errors)
        }

        val existing = id?.let { sizes.findById(it) }
        if (id != null && existing == null) {
            return CatalogueResult.NotFound
        }
        if (sizes.existsByCodeAndType(code, sizeType, id)) {
            return CatalogueResult.Duplicate
        }

        val size = existing?.copy(code = code, label = label, sizeType = sizeType)
            ?: Size(id = ids.newId(), code = code, label = label, sizeType = sizeType, createdAt = time.now())
        return CatalogueResult.Saved(sizes.save(size))
    }

    fun remove(id: UUID): CatalogueResult<Nothing> {
        if (sizes.findById(id) == null) return CatalogueResult.NotFound
        if (sizes.inUse(id)) return CatalogueResult.InUse
        sizes.delete(id)
        return CatalogueResult.Deleted(id)
    }

    private companion object {
        const val MAX_CODE_LENGTH = 64
    }
}
