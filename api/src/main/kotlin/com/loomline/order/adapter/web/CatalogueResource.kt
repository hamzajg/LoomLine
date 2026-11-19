package com.loomline.order.adapter.web

import com.loomline.identity.adapter.web.AccessPolicy
import com.loomline.order.application.CatalogueApplicationService
import com.loomline.order.domain.Article
import com.loomline.order.domain.ArticleDraft
import com.loomline.order.domain.CatalogueResult
import com.loomline.order.domain.Colour
import com.loomline.order.domain.ColourDraft
import com.loomline.order.domain.Size
import com.loomline.order.domain.SizeDraft
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.DELETE
import jakarta.ws.rs.GET
import jakarta.ws.rs.POST
import jakarta.ws.rs.PUT
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.QueryParam
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import java.util.UUID

/**
 * Catalogue CRUD for articles, colours and sizes (article-catalogue).
 * Reads need `production` view; writes need `production` manage.
 */
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
class CatalogueResource(
    private val service: CatalogueApplicationService,
    private val policy: AccessPolicy,
) {

    // --- articles ---------------------------------------------------------------

    @GET
    @Path("/articles")
    fun articles(@QueryParam("q") q: String?): List<ArticleResponse> {
        policy.require("production")
        return service.searchArticles(q).map { ArticleResponse.from(it) }
    }

    @POST
    @Path("/articles")
    @Consumes(MediaType.APPLICATION_JSON)
    fun createArticle(request: ArticleRequest): Response {
        policy.require("production", manage = true)
        return saveArticle(
            id = null,
            draft = request.toDraft(),
            created = true,
        )
    }

    @PUT
    @Path("/articles/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    fun updateArticle(@PathParam("id") id: UUID, request: ArticleRequest): Response =
        saveArticle(id, request.toDraft(), created = false)

    @DELETE
    @Path("/articles/{id}")
    fun deleteArticle(@PathParam("id") id: UUID): Response {
        policy.require("production", manage = true)
        return when (val result = service.removeArticle(id)) {
            is CatalogueResult.Deleted -> Response.noContent().build()
            CatalogueResult.NotFound -> notFound("ARTICLE_NOT_FOUND", "article", id)
            CatalogueResult.InUse -> inUse("article")
            else -> unexpected(result)
        }
    }

    private fun saveArticle(id: UUID?, draft: ArticleDraft, created: Boolean): Response {
        return when (val result = service.saveArticle(id, draft)) {
            is CatalogueResult.Saved -> {
                val response = Response.ok(ArticleResponse.from(result.value))
                if (created) response.status(Response.Status.CREATED) else response
                response.build()
            }
            CatalogueResult.NotFound -> notFound("ARTICLE_NOT_FOUND", "article", id)
            CatalogueResult.Duplicate -> conflict(
                "DUPLICATE",
                "An article with this reference already exists.",
            )
            is CatalogueResult.Invalid -> invalid("The article could not be saved.", result.fieldErrors)
            else -> unexpected(result)
        }
    }

    // --- colours -----------------------------------------------------------------

    @GET
    @Path("/colours")
    fun colours(@QueryParam("q") q: String?): List<ColourResponse> {
        policy.require("production")
        return service.searchColours(q).map { ColourResponse.from(it) }
    }

    @POST
    @Path("/colours")
    @Consumes(MediaType.APPLICATION_JSON)
    fun createColour(request: ColourRequest): Response {
        policy.require("production", manage = true)
        return saveColour(null, request.toDraft(), created = true)
    }

    @PUT
    @Path("/colours/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    fun updateColour(@PathParam("id") id: UUID, request: ColourRequest): Response =
        saveColour(id, request.toDraft(), created = false)

    @DELETE
    @Path("/colours/{id}")
    fun deleteColour(@PathParam("id") id: UUID): Response {
        policy.require("production", manage = true)
        return when (val result = service.removeColour(id)) {
            is CatalogueResult.Deleted -> Response.noContent().build()
            CatalogueResult.NotFound -> notFound("COLOUR_NOT_FOUND", "colour", id)
            CatalogueResult.InUse -> inUse("colour")
            else -> unexpected(result)
        }
    }

    private fun saveColour(id: UUID?, draft: ColourDraft, created: Boolean): Response {
        return when (val result = service.saveColour(id, draft)) {
            is CatalogueResult.Saved -> {
                val response = Response.ok(ColourResponse.from(result.value))
                if (created) response.status(Response.Status.CREATED) else response
                response.build()
            }
            CatalogueResult.NotFound -> notFound("COLOUR_NOT_FOUND", "colour", id)
            CatalogueResult.Duplicate -> conflict(
                "DUPLICATE",
                "A colour with this code already exists.",
            )
            is CatalogueResult.Invalid -> invalid("The colour could not be saved.", result.fieldErrors)
            else -> unexpected(result)
        }
    }

    // --- sizes -------------------------------------------------------------------

    @GET
    @Path("/sizes")
    fun sizes(@QueryParam("q") q: String?): List<SizeResponse> {
        policy.require("production")
        return service.searchSizes(q).map { SizeResponse.from(it) }
    }

    @POST
    @Path("/sizes")
    @Consumes(MediaType.APPLICATION_JSON)
    fun createSize(request: SizeRequest): Response {
        policy.require("production", manage = true)
        return saveSize(null, request.toDraft(), created = true)
    }

    @PUT
    @Path("/sizes/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    fun updateSize(@PathParam("id") id: UUID, request: SizeRequest): Response =
        saveSize(id, request.toDraft(), created = false)

    @DELETE
    @Path("/sizes/{id}")
    fun deleteSize(@PathParam("id") id: UUID): Response {
        policy.require("production", manage = true)
        return when (val result = service.removeSize(id)) {
            is CatalogueResult.Deleted -> Response.noContent().build()
            CatalogueResult.NotFound -> notFound("SIZE_NOT_FOUND", "size", id)
            CatalogueResult.InUse -> inUse("size")
            else -> unexpected(result)
        }
    }

    private fun saveSize(id: UUID?, draft: SizeDraft, created: Boolean): Response {
        return when (val result = service.saveSize(id, draft)) {
            is CatalogueResult.Saved -> {
                val response = Response.ok(SizeResponse.from(result.value))
                if (created) response.status(Response.Status.CREATED) else response
                response.build()
            }
            CatalogueResult.NotFound -> notFound("SIZE_NOT_FOUND", "size", id)
            CatalogueResult.Duplicate -> conflict(
                "DUPLICATE",
                "A size with this code and size type already exists.",
            )
            is CatalogueResult.Invalid -> invalid("The size could not be saved.", result.fieldErrors)
            else -> unexpected(result)
        }
    }

    // --- shared error mapping ----------------------------------------------------

    private fun invalid(message: String, fieldErrors: Map<String, String>) =
        Response.status(Response.Status.BAD_REQUEST)
            .entity(ErrorResponse(code = "VALIDATION_FAILED", message = message, fieldErrors = fieldErrors))
            .build()

    private fun conflict(code: String, message: String) =
        Response.status(Response.Status.CONFLICT)
            .entity(ErrorResponse(code = code, message = message))
            .build()

    private fun notFound(code: String, kind: String, id: UUID?) =
        Response.status(Response.Status.NOT_FOUND)
            .entity(ErrorResponse(code = code, message = "No $kind with id \"$id\"."))
            .build()

    private fun inUse(kind: String) =
        Response.status(Response.Status.CONFLICT)
            .entity(
                ErrorResponse(
                    code = "IN_USE",
                    message = "The $kind is still referenced and cannot be deleted.",
                ),
            )
            .build()

    private fun unexpected(result: CatalogueResult<*>) =
        Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(ErrorResponse(code = "UNEXPECTED", message = "Unexpected result: $result"))
            .build()
}
