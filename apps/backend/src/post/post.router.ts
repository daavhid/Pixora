import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { PostService } from "./post.service";
import {  commentInfiniteScrollSchema, commentPaginationQuerySchema, commentSchema, createCommentSchema, createPostSchema, postInfiniteScrollSchemaQuery, postPaginationQuerySchema, postSchema, savedPostInfiniteScrollSchema } from "./schema/post.zod.schema";
import type {commentPaginationQuery, createComment, createPost, postPaginationQuery} from './schema/post.zod.schema'
import {z} from "zod";
import { TRPCAuthMiddleware } from "@/auth/auth.trpc.middleware";
import type { TRPCAuthContextType } from "../../types/auth/context.type";

@UseMiddlewares(TRPCAuthMiddleware) // No authentication required for posts, but you can add it if needed
@Router({ alias: 'post' })
export class PostRouter {
    constructor(private postService:PostService){}
    @Mutation({
        input:createPostSchema,
        output:postSchema
    })

    async createPost(@Input() createPostInput:createPost, @Ctx() {user}:TRPCAuthContextType) {
        return this.postService.createPost(createPostInput,user.id)
    }

    @Query({

        input:postPaginationQuerySchema,
        output:postInfiniteScrollSchemaQuery
    })
    async getAllPost(@Input() postQueryInput:postPaginationQuery,@Ctx() {user}:TRPCAuthContextType) {
        return this.postService.getAllPost(postQueryInput,user.id)
    }

    @Query({

        input:postPaginationQuerySchema,
        output:savedPostInfiniteScrollSchema
    })
    async getSavedPosts(@Input() postQueryInput:postPaginationQuery,@Ctx() {user}:TRPCAuthContextType) {
        return this.postService.getSavedPosts(postQueryInput,user.id)
    }

    @Mutation({
        input:z.object({
            postId:z.string()
        }),
        output:z.object({
            liked:z.boolean()
        })
    })
    async toggleLike(@Input() {postId}:{postId:string},@Ctx() {user}:TRPCAuthContextType) {
        return this.postService.toggleLike(postId,user.id)
    }

    @Mutation({
        input:z.object({
            postId:z.string()
        }),
        output:z.object({
            savedPost:z.boolean()
        })
    })
    async toggleSave(@Input() {postId}:{postId:string},@Ctx() {user}:TRPCAuthContextType) {
        return this.postService.toggleSave(postId,user.id)
    }

    @Mutation({
        input:createCommentSchema,
        output:commentSchema
    })
    async createComment(@Input() createCommentInput:createComment,@Ctx() {user}:TRPCAuthContextType) {
        return this.postService.createComment(createCommentInput,user.id)
    }

    @Mutation({
        input:z.object({
            commentId:z.string()
        }),
        output:z.object({
            liked:z.boolean()
        })
    })
    async toggleCommentlike (@Input() {commentId}:{commentId:string},@Ctx() {user}:TRPCAuthContextType) {
        return this.postService.toggleCommentLike(commentId,user.id)
    }



    @Query({
        input:commentPaginationQuerySchema,
        output:commentInfiniteScrollSchema
    })
    async getInfinteComment(@Input() commentQueryInput:commentPaginationQuery,@Ctx() {user}:TRPCAuthContextType) {
        return this.postService.getInfinteComment(commentQueryInput,user.id)
    }

    @Mutation({
        input:z.object({
            postId:z.string()
        }),
        output:z.void()
    })
    async deleteComment(@Input() {postId}:{postId:string}) {
        return this.postService.deleteComment(postId)
    }

}