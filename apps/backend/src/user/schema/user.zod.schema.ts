// import { Mediatype } from "../../generated/prisma/enums";
import z from "zod";
import { Mediatype } from "../../../generated/prisma/enums";

export const FollowerSchema = z.object({
    follower:z.object({
        id:z.string(),
        name:z.string().nullable().optional(),
        image:z.url().nullable().optional(),
        emailVerified:z.boolean().default(false),
        email:z.email().nullable().optional(),
    }),
    followedAt:z.coerce.date(),
    isFollowing:z.boolean().nullable().optional().default(false),
    isSelf:z.boolean().nullable().optional().default(false),
})

export const FollowingSchema = z.object({
    following:z.object({
        id:z.string(),
        name:z.string().nullable().optional(),
        image:z.url().nullable().optional(),
        emailVerified:z.boolean().default(false),
        email:z.email().nullable().optional(),
    }),
    followedAt:z.coerce.date(),
    isFollowing:z.boolean().nullable().optional().default(false),
    isSelf:z.boolean().nullable().optional().default(false),
})


export const UserSchema = z.object({
    id:z.string(),
    name:z.string().nullable().optional(),
    image:z.url().nullable().optional(),
    emailVerified:z.boolean().default(false),
    followersCount:z.number().default(0),
    followingCount:z.number().default(0),
    isFollowing:z.boolean(),
    isFollowed:z.boolean(),
    isSelf:z.boolean(),
    postsCount:z.number().default(0),
    email:z.email().nullable().optional(),
    createdAt:z.coerce.date(),
    followers:z.array(FollowerSchema),
    following:z.array(FollowingSchema),
    bio:z.string().nullable().optional(),
    website:z.string().nullable().optional(),
    location:z.string().nullable().optional()
})

export const UserProfileQuerySchema = z.object({
        name:z.string().optional(),
        image:z.string().optional(),
        bio:z.string().optional(),
        website:z.string().optional(),
        location:z.string().optional()
    })

export const UserPaginationQuerySchema = z.object({
    cursor:z.string().nullable().optional(),
    userId:z.string().nullable(),
    limit:z.number().int().default(10)
})

export const UserToFollowSchema = z.object({
    id:z.string(),
    name:z.string().nullable().optional(),
    image:z.url().nullable().optional(),
    emailVerified:z.boolean().default(false),
    createdAt:z.coerce.date(),
})

export const usersInfiniteScrollSchema = z.object({
    cursor:z.string().nullable(),
    hasNextPage:z.boolean(),
    users:z.array(UserToFollowSchema)
})


export const FollowersInfiniteScrollSchema = z.object({
    cursor:z.string().nullable(),
    hasNextPage:z.boolean(),
    followers:z.array(FollowerSchema)
})

export const FollowingInfiniteScrollSchema = z.object({
    cursor:z.string().nullable(),
    hasNextPage:z.boolean(),
    following:z.array(FollowingSchema)
})

export const storyViewSchema = z.object({
    id:z.string(),
    userId:z.string(),
    storyMediaId:z.string(),
    createdAt:z.coerce.date()
})

export const storyMediaSchema = z.object({
    
    id: z.string(),
    url: z.url().nullable(),
    type: z.enum(Mediatype),
    duration: z.number().nonnegative().default(500),
    caption: z.string().nullable(),
    viewed: z.boolean().default(false),
    viewCount:z.number().nonnegative(),
    createdAt:z.coerce.date(),
})

export const storySchema = z.object({
    id: z.string(),
    name:z.string().nullable(),
    image:z.url().nullable(),
    emailVerified:z.boolean().default(false),
    stories:z.array(storyMediaSchema),
    isMyStory:z.boolean().default(false),
    lastUpdatedAt: z.coerce.date(),
})

export const addStorySchema = z.object({
    medias:z.array(z.object({
        url: z.url(),
        type: z.enum(Mediatype),
        duration: z.number().nonnegative().default(500),
        // caption: z.string().nullable(),
    })),
})



export type User= z.infer<typeof UserSchema>
export type UserToFollow = z.infer<typeof UserToFollowSchema>
export type UserProfileQuery = z.infer<typeof UserProfileQuerySchema>
export type UsersInfiniteScroll = z.infer<typeof usersInfiniteScrollSchema>
export type Follower = z.infer<typeof FollowerSchema>
export type Following = z.infer<typeof FollowingSchema>
export type UserPaginationQuery = z.infer<typeof UserPaginationQuerySchema>
export type FollowersInfiniteScroll = z.infer<typeof FollowersInfiniteScrollSchema>
export type FollowingInfiniteScroll = z.infer<typeof FollowingInfiniteScrollSchema>
export type StoryMedia = z.infer<typeof storyMediaSchema>
export type Story = z.infer<typeof storySchema>
export type StoryView = z.infer<typeof storyViewSchema>
export type AddStory = z.infer<typeof addStorySchema>
