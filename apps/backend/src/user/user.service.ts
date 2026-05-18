import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
// import { PrismaService } from 'src/prisma/prisma.service';
import { AddStory, FollowersInfiniteScroll, FollowingInfiniteScroll, Story, StoryMedia, User, UserPaginationQuery, UserProfileQuery, UserSchema, UsersInfiniteScroll, UserToFollow } from './schema/user.zod.schema';
import { PrismaService } from '@/prisma/prisma.service';
import { UserProfile } from '../../generated/prisma/browser';

@Injectable()
export class UserService {
    constructor(private prismaService: PrismaService){}
    async  getUserById(id:string,currentUserId:string):Promise<User>{
        const isSelf = id === currentUserId;
        const user = await  this.prismaService.user.findUnique({
            where:{
                id:id
            },
            select:{
                _count:{
                    select:{
                        followers:true,
                        following:true,
                        posts:true,
                    }
                },
                followers:isSelf ?false :{
                    where:{
                        userIdWhoFollows:currentUserId
                    },
                    select:{
                        userIdWhoFollows:true,
                        createdAt:true
                    }
                },
                following:isSelf ?false :{
                    where:{
                        userBeingFollowed:currentUserId
                    },
                    select:{
                        userBeingFollowed:true,
                        createdAt:true
                    }
                },
                id:true,
                image:true,
                email:true,
                createdAt:true,
                name:true,
                emailVerified:true,
                userProfile:true

            }
        })
        if(!user){
            throw new TRPCError({
                code:"NOT_FOUND",
                message:"User does not Exist"
            })
        }
        const [followersList,followingList] = await Promise.all([
            this.prismaService.follow.findMany({
                where:{
                    userBeingFollowed:id
                },
                take:5,
                orderBy:{
                    createdAt:'desc'
                },
                include:{
                    follower:{
                        select:{
                            id:true,
                            name:true,
                            image:true,
                            emailVerified:true,
                            email:true,
                            followers:{
                                where:{
                                    userIdWhoFollows:currentUserId
                                },
                                select:{
                                    userIdWhoFollows:true
                                },
                                take:1
                            }
                        }
                    }
                }
            }),
            this.prismaService.follow.findMany({
                where:{
                    userIdWhoFollows:id
                },
                take:5,
                orderBy:{
                    createdAt:'desc'
                },
                include:{
                    followed:{
                        select:{
                            id:true,
                            name:true,
                            image:true,
                            emailVerified:true,
                            email:true,
                            followers:{
                                where:{
                                    userIdWhoFollows:currentUserId
                                },
                                select:{
                                    userIdWhoFollows:true
                                },
                                take:1
                            }
                        }
                    }
                }
            }),
        ])
        return {
            ...user,
            followers: followersList.map(follow => ({
                follower: follow.follower,
                followedAt: follow.createdAt,
                isFollowing: follow.follower.followers.length > 0,
                isSelf: follow.follower.id === currentUserId
            })),
            following: followingList.map(follow => ({
                following: follow.followed,
                followedAt: follow.createdAt,
                isFollowing: follow.followed.followers.length > 0,
                isSelf:follow.followed.id === currentUserId
            })),
            followersCount:user._count.followers,
            followingCount:user._count.following,
            postsCount:user._count.posts,
            isFollowing:isSelf ? false : user.followers.length > 0,
            isFollowed:isSelf ? false : user.following.length > 0,
            isSelf:isSelf,
            bio:user.userProfile?.bio,
            website:user.userProfile?.website,
            location:user.userProfile?.location
        }
    }

    async editProfile(input:UserProfileQuery,currentUserId:string){
        let updatedUser : any = null
        let updatedProfile:UserProfile| null = null
        return await this.prismaService.$transaction(async (tx) => {
            const userData = {
                ...(input.image && {image:input.image}),
                ...(input.name && {name:input.name}),
            }
            const profileData = {
                ...(input.bio && {bio:input.bio}),
                ...(input.website && {website:input.website}),
                ...(input.location && {location:input.location})
            }
            // only update user if needed
            if (Object.keys(userData).length > 0) {
                updatedUser = await tx.user.update({
                    where: {
                        id: currentUserId,
                    },
                    data: userData,
                })
            }



            if(Object.keys(profileData).length > 0){

                updatedProfile = await tx.userProfile.upsert({
                    where:{
                        userId:currentUserId
                    },
                    create:{
                        userId:currentUserId,
                        ...profileData
                    },
                    update:profileData
                })
            }

            return {
               id:updatedProfile?.id
            }
        })
    }

    async getInfiniteUsersToFollow({userId, cursor, limit}:UserPaginationQuery,currentUserId:string): Promise<UsersInfiniteScroll>{
        const userIdToFollow = cursor?.split("_")[0]
        const createdAt = cursor?.split("_")[1];

        const users = await this.prismaService.user.findMany({
            where:{
                id: {not:currentUserId},
                followers:{
                    none:{
                        userIdWhoFollows:currentUserId
                    }
                }

            },
            take:limit + 1,
            orderBy:[{
                createdAt:'desc'
            }],
            skip:cursor ? 1 : undefined,
            cursor:cursor && createdAt && userIdToFollow ? {
                id:userIdToFollow,
                createdAt:new Date(createdAt)
            } : undefined,
            select: {
                id: true,
                name: true,
                image: true,
                emailVerified: true,
                createdAt:true
            }
        })

        const hasNextPage = users.length > limit
        const newUsersToFollow = users.slice(0, limit)
        const newCursor = hasNextPage ? `${users[users.length - 1].id}_${users[users.length - 1].createdAt.toISOString()}` : null

        return {
            cursor:newCursor,
            hasNextPage,
            users:newUsersToFollow
        }
    }

    async toggleFollow(currentUserId: string, targetUserId: string):Promise<{isFollowing:boolean}> {
        if (currentUserId === targetUserId) {
            throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You cannot follow yourself.',
            });
        }

        return await this.prismaService.$transaction(async (tx) => {
            // 1. Check if the follow relationship already exists
            const existingFollow = await tx.follow.findUnique({
            where: {
                userIdWhoFollows_userBeingFollowed: {
                userIdWhoFollows: currentUserId,
                userBeingFollowed: targetUserId,
                },
            },
            });

            if (existingFollow) {
            // 2. UNFOLLOW: If it exists, delete it
            await tx.follow.delete({
                where: {
                userIdWhoFollows_userBeingFollowed: {
                    userIdWhoFollows: currentUserId,
                    userBeingFollowed: targetUserId,
                },
                },
            });
            return { isFollowing: false };
            } else {
            // 3. FOLLOW: If it doesn't exist, create it
            await tx.follow.create({
                data: {
                userIdWhoFollows: currentUserId,
                userBeingFollowed: targetUserId,
                },
            });
            return { isFollowing: true };
            }
        });
    }

    async getInfiniteFollowers({userId, cursor, limit}:UserPaginationQuery,currentUserId:string):Promise<FollowersInfiniteScroll>{
        const userIdWhoFollows = cursor?.split("_")[0];
        const createdAt = cursor?.split("_")[1];
        const followers = await this.prismaService.follow.findMany({
            where:{
                userBeingFollowed:userId!,
            },
            take:limit + 1,
            skip: cursor ? 1 : 0,
            cursor: cursor && userIdWhoFollows && createdAt ? {
                userIdWhoFollows_userBeingFollowed:{
                    userIdWhoFollows: userIdWhoFollows,
                    userBeingFollowed: userId!
                }
            } : undefined,
            orderBy:[
                {createdAt:'desc'},
                {userIdWhoFollows:'desc'}
            ],
            select:{
                follower:{
                    select:{
                        id:true,
                        name:true,
                        image:true,
                        emailVerified:true,
                        email:true,
                        followers:{
                            where:{
                                userIdWhoFollows:currentUserId
                            },
                            select:{
                                userIdWhoFollows:true
                            },
                            take:1
                        },
                        
                    }
                },
                createdAt:true
            }
        })
        const hasNextPage = followers.length > limit;
        const newFollowers = followers.slice(0,limit).map(follow => ({
            follower: follow.follower,
            followedAt: follow.createdAt,
            isFollowing: follow.follower.followers.length > 0,
            isSelf:follow.follower.id === currentUserId
        }))
        const nextCursor = hasNextPage ? `${followers[followers.length - 1].follower.id}_${followers[followers.length - 1].createdAt.toISOString()}` : null;
        return { followers: newFollowers, hasNextPage, cursor:nextCursor };
    }

    async getInfiniteFollowing({userId, cursor, limit}:UserPaginationQuery,currentUserId:string):Promise<FollowingInfiniteScroll>{
        const userBeingFollowed = cursor?.split("_")[0];
        const createdAt = cursor?.split("_")[1];
        const following = await this.prismaService.follow.findMany({
            where:{
                userIdWhoFollows:userId!
            },
            take: limit + 1,
            cursor:cursor && userBeingFollowed && createdAt ? {
                userIdWhoFollows_userBeingFollowed:{
                    userIdWhoFollows: userId!,
                    userBeingFollowed: userBeingFollowed
                },
                createdAt: new Date(createdAt)
            } : undefined,
            skip: cursor ? 1 : 0,
            orderBy:[
                {createdAt:'desc'},
                {userBeingFollowed:'desc'}
            ],
            select:{
                followed:{
                    select:{
                        id:true,
                        name:true,
                        image:true,
                        emailVerified:true,
                        email:true,
                        followers:{
                            where:{
                                userIdWhoFollows:currentUserId
                            },
                            select:{
                                userIdWhoFollows:true
                            },
                            take:1
                        }
                    }
                },
            
                
                createdAt:true
            }
        })

        const hasNextPage = following.length > limit;
        const newFollowing = following.slice(0,limit).map(follow => ({
            following: follow.followed,
            followedAt: follow.createdAt,
            isFollowing: follow.followed.followers.length > 0,
            isSelf:follow.followed.id === currentUserId
        }))
        const nextCursor = hasNextPage ? `${following[following.length - 1].followed.id}_${following[following.length - 1].createdAt.toISOString()}` : null;
        return { following:newFollowing, hasNextPage,cursor: nextCursor };

    }

    async getStories(userId:string):Promise<Story[]>{
        //get stories of people i am following 
        const ONE_DAY_AGO = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const currentUserStories =await this.prismaService.user.findUnique({
            where: {
                id: userId,
                stories:{
                    some:{
                        createdAt:{
                            gte:ONE_DAY_AGO
                        }
                    }
                }
            },

            select: {
                id: true,
                name: true,
                image: true,
                emailVerified: true,

                stories: {
                    where: {
                        createdAt: {
                            gte: ONE_DAY_AGO
                        }
                    },

                    orderBy: {
                        createdAt: "asc"
                    },

                    select: {
                        id: true,
                        url: true,
                        type: true,
                        duration: true,
                        caption: true,
                        createdAt: true,

                        _count: {
                            select: {
                            storyViews: true
                            }
                        }
                        }
                    },
                    storyViews:{
                        where:{
                            userId:userId
                        },

                        select:{
                            storyMediaId:true,
                            userId:true
                        }
                        }
            }
            });
        const followings = await this.prismaService.follow.findMany({
            where:{
                userIdWhoFollows:userId,
                followed:{
                    stories:{
                        some:{
                            createdAt:{gte:ONE_DAY_AGO}
                        }
                    }
                }
            },
            select:{
                followed:{
                    select:{
                        id:true,
                        name:true,
                        image:true,
                        emailVerified:true,
                        stories:{
                            where:{
                                createdAt:{
                                    gte: ONE_DAY_AGO
                                }
                            },
                            select:{
                                _count:{
                                    select:{
                                        storyViews:true
                                    }
                                },
                                id:true,
                                url:true,
                                type:true,
                                duration:true,
                                caption:true,
                                createdAt:true,
                            },
                            orderBy:{
                                createdAt:'asc'
                            },
                        },
                        storyViews:{
                            where:{
                                userId:userId
                            },
                            select:{
                                storyMediaId:true,
                                userId:true
                            }
                        }
                        
                        
                    }
                }
            }
        })
        if (!currentUserStories && followings.length ===0 ) return [];

        const newStoryArr = [...(currentUserStories ? [{ followed: currentUserStories }] : []),...followings].map(following => {
            const storyDates = following.followed.stories.map(story => story.createdAt.getTime());
            const latestStoryDate = storyDates.length > 0 ? new Date(Math.max(...storyDates)) : new Date();

            const viewedStoryIds = new Set(
                following.followed.storyViews
                    .map(view => view.storyMediaId)
            );
            return {
                id:following.followed.id,
                isMyStory:following.followed.id === userId,
                name:following.followed.name,
                image:following.followed.image,
                emailVerified:following.followed.emailVerified,
                stories:following.followed.stories.map(story => (
                    {
                            id:story.id,
                            url:story.url,
                            type:story.type,
                            duration:story.duration,
                            caption:story.caption,
                            viewed:viewedStoryIds.has(story.id),
                            viewCount:story._count.storyViews,
                            createdAt:story.createdAt,
                            
                    }
                )),
                lastUpdatedAt:latestStoryDate
            }
        })
        newStoryArr.sort(
            (a,b)=>
                new Date(b.lastUpdatedAt).getTime() -
                new Date(a.lastUpdatedAt).getTime()
            )
            return newStoryArr

    }

    async getStoryById(storyId:string,userId:string): Promise<StoryMedia> {
        const story = await this.prismaService.storyMedia.findUnique({
            where:{
                id:storyId
            },
            include:{
                storyViews:true,
                _count:{
                    select:{
                        storyViews:true
                    }
                }
            }
        })
        if(!story){
            throw new TRPCError({
                code:'NOT_FOUND',
                message:'Story not found'
            })
        }
        
        return {
            id:story.id,
            url:story.url,
            caption:story.caption,
            type:story.type,
            duration:story.duration,
            createdAt:story.createdAt,
            viewCount:story._count.storyViews,
            viewed:story.storyViews.some(view=> view.userId === userId)
        }
        
    }

    async addStory({ medias }: AddStory,userId: string): Promise<Story> {

        try {
            const user = await this.prismaService.user.findUnique({
                where: { id: userId },
                select:{
                    id:true,
                    name:true,
                    image:true,
                    emailVerified:true,
                }
            });

            const stories = await this.prismaService.$transaction(
            medias.map(media =>
                this.prismaService.storyMedia.create({
                    data: {
                        url: media.url,
                        type: media.type,
                        duration: media.duration,
                        caption: '',
                        userId
                    }
                })
            )
            );

            return {
                ...user!,
                lastUpdatedAt: new Date(),
                isMyStory:true,
                stories:stories.map(story => ({
                    id: story.id,
                    url: story.url,
                    type: story.type,
                    duration: story.duration,
                    caption: story.caption,
                    createdAt: story.createdAt,
                    viewed: false,
                    viewCount: 0
                }))
        }


        } catch (error) {
            console.error(error);

            throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to upload stories"
            });
        }
    }
}
