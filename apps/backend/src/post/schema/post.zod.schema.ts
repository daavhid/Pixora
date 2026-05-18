import { Mediatype } from '../../../generated/prisma/enums'
import {z} from 'zod'


//basic shape for what the trpc server is going to output

export const postMediaSchema = z.object({
    id:z.string(),
    url:z.url(),
    type:z.enum([ "video", "image" , "raw"]),
    width:z.number().positive().nullable().optional(),
    height:z.number().positive().nullable().optional(),
    duration:z.number().positive().nullable().optional(),
    thumbnail:z.url().nullable().optional(),
    altText:z.string().nullable().optional(),
    createdAt:z.coerce.date(),
    postId:z.string().optional(),
    x: z.coerce.number().min(0),
    y: z.coerce.number().min(0),
    aspect:z.number().positive().nullable().optional(),
    cropWidth:z.number().positive().nullable().optional(),
    cropHeight:z.number().positive().nullable().optional(),
    publicId:z.string().nullable().optional(),
    format:z.string().nullable().optional(),
    version:z.number().positive().nullable().optional(),
})

export const postSchema = z.object({
    id: z.string(),
    caption:z.string(),
    location:z.string().nullable().optional(),
    medias:z.array(postMediaSchema),
    hasLiked:z.boolean().default(false),
    hasSaved:z.boolean().default(false),
    isSelfPost:z.boolean().default(false),
    likesCount:z.number().default(0),
    commentsCount:z.number().default(0),
    savedCount:z.number().default(0),
    createdAt:z.coerce.date(),
    tags:z.array(z.string()),
    user:z.object({
        id:z.string(),
        name:z.string().nullable().optional(),
        image:z.url().nullable().optional(),
        // isVerified:z.boolean()
    }),
})

export const createPostSchema = z.object({
    caption:z.string().min(1).max(2200),
    location:z.string().max(120).optional(),
    medias:z.array(z.object({
        url:z.url(),
        type:z.enum(Mediatype),
        width:z.number().positive().optional(),
        height:z.number().positive().optional(),
        duration:z.number().positive().optional(),
        thumbnail:z.url().optional(),
        altText:z.string().max(300).optional(),
        x: z.coerce.number().min(0).default(0),
        y: z.coerce.number().min(0).default(0),
        aspect:z.coerce.number().default(1.0),
        cropWidth:z.coerce.number().min(0).default(1024),
        cropHeight:z.coerce.number().min(0).default(1024),
        publicId:z.string().nullable().optional(),
        format:z.string().nullable().optional(),
        version:z.number().positive().nullable().optional(),
    })),
    tags:z.array(z.string()).default([]),
})

export const postPaginationQuerySchema = z.object({
    limit:z.number().int().default(10),
    profileUserId:z.string().nullable().optional(),
    cursor:z.string().optional()
})

export const postInfiniteScrollSchemaQuery = z.object({
    posts:z.array(postSchema),
    cursor: z.string().nullable(),
    hasNextPage:z.boolean()
})

export const savedPostSchema = z.object({
    id:z.string(),
    createdAt:z.coerce.date(),
    post:z.object({
        id:z.string(),
        createdAt:z.coerce.date(),
        caption:z.string(),
        likesCount:z.number().default(0),
        commentsCount:z.number().default(0),
        user:z.object({
            id:z.string(),
            name:z.string().nullable().optional(),
            image:z.url().nullable().optional(),
            // isVerified:z.boolean()
        }),
        medias:z.array(postMediaSchema),
    })
})
export const savedPostInfiniteScrollSchema = z.object({
    posts:z.array(savedPostSchema),
    hasNextPage:z.boolean(),
    cursor:z.string().nullable().optional()
})

export const createCommentSchema = z.object({
    postId:z.string(),
    content:z.string()
})

export const commentSchema = z.object({
    id:z.string(),
    postId:z.string(),
    user:z.object({
        id:z.string(),
        name:z.string().nullable().optional(),
        image:z.url().nullable().optional(),
    }),
    content:z.string(),
    hasLiked:z.boolean(),
    likesCount:z.number(),
    createdAt:z.coerce.date()
})

export const commentPaginationQuerySchema = z.object({
    cursor:z.string().nullable().optional(),
    postId:z.string(),
    limit:z.number().int().default(10)
})

export const commentInfiniteScrollSchema = z.object({
    cursor:z.string().nullable(),
    hasNextPage:z.boolean(),
    comments:z.array(commentSchema)
})

export type createPost = z.infer<typeof createPostSchema>
export type post = z.infer<typeof postSchema>
export type postMedia = z.infer<typeof postMediaSchema>
export type postPaginationQuery = z.infer<typeof postPaginationQuerySchema>
export type savedPost = z.infer<typeof savedPostSchema>
export type SavedPostInfiniteScroll = z.infer<typeof savedPostInfiniteScrollSchema>

export type createComment = z.infer<typeof createCommentSchema>
export type comment = z.infer<typeof commentSchema>
export type commentPaginationQuery = z.infer<typeof commentPaginationQuerySchema>
export type commentInfiniteScroll = z.infer<typeof commentInfiniteScrollSchema>


export type postInfiniteScroll = z.infer<typeof postInfiniteScrollSchemaQuery>