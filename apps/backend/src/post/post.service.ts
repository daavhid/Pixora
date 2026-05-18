import { Injectable } from '@nestjs/common';
import { commentPaginationQuery, createComment, createPost, post, postInfiniteScroll, postPaginationQuery, SavedPostInfiniteScroll } from './schema/post.zod.schema';
import { PrismaService } from '@/prisma/prisma.service';
import { TRPCError } from '@trpc/server';

@Injectable()
export class PostService {
    constructor(private prismaService:PrismaService){}
    async createPost (createPostInput:createPost,userId:string) : Promise<post> {
        const createdPost = await this.prismaService.post.create({
            data:{
                caption:createPostInput.caption,
                user:{
                    connect:{
                        id:userId
                    }
                },
                location:createPostInput.location,
                medias:{
                    create: createPostInput.medias.map(media=>({
                        url:media.url,
                        type:media.type,
                        width:media.width,
                        height:media.height,
                        duration:media.duration,
                        thumbnail:media.thumbnail,
                        altText:media.altText,
                        x:media.x,
                        y:media.y,
                        aspect:media.aspect,
                        cropWidth:media.cropWidth,
                        cropHeight:media.cropHeight,
                        publicId:media.publicId,
                        version:media.version,
                        format:media.format
                    }))
                },
                tags:createPostInput.tags
            },
            include:{
                medias:true,
                user:{
                    select:{
                        id:true,
                        name:true,
                        image:true
                    }
                }
            },
            
        })

        return {
            id:createdPost.id,
            caption:createdPost.caption,
            location:createdPost.location,
            tags:createdPost.tags,
            createdAt: createdPost.createdAt,
            user:createdPost.user,
            commentsCount:0,
            likesCount:0,
            savedCount:0,
            hasLiked:false,
            hasSaved:false,
            isSelfPost:true,
            medias: createdPost.medias
        }
    }

    async getAllPost ({limit,cursor,profileUserId}:postPaginationQuery,userId:string):Promise<postInfiniteScroll> {


        const cursorParts = cursor?.split('_')
        const createdAtStr = cursorParts?.[0]
        const id = cursorParts?.[1]
        const posts = await this.prismaService.post.findMany({
            where:profileUserId ? {userId:profileUserId} : {
                // user:{
                //     followers:{
                //         some:{
                //             follower:{
                //                 id:userId
                //             }
                //         }
                //     }
                // }
            },
            take:limit +1,
            skip:cursor?1:undefined,
            cursor:cursor && createdAtStr && id ?{
                id,
                createdAt: new Date(createdAtStr)
            }:undefined,
            orderBy:[
                {
                    createdAt:'desc'
                },
                {
                    id:'desc'
                }
            ],
            include:{
                user:{
                    select:{
                        id:true,
                        name:true,
                        image:true
                    }
                },
                medias:true,
                _count:{
                    select:{
                        comments:true,
                        likes:true,
                        savedPosts:true
                    }
                },
                likes:{
                    where:{
                        userId,
                    },
                    select:{
                        id:true
                    },
                    take:1
                },
                savedPosts:{
                    where:{
                        userId
                    },
                    select:{
                        id:true
                    },
                    take:1
                }


            }
        })
        
        const hasNextPage = posts.length > limit;
        const newPosts = hasNextPage ? posts.slice(0,limit) :posts
        const nextCursor = hasNextPage ? `${newPosts[newPosts.length-1].createdAt.toISOString()}_${newPosts[newPosts.length-1].id}` : null

        return {
            posts: newPosts.map(post=>({
                id:post.id,
                caption:post.caption,
                location:post.location,
                tags:post.tags,
                createdAt: post.createdAt,
                user:post.user,
                isSelfPost:post.user.id === userId,
                commentsCount:post._count.comments,
                likesCount:post._count.likes,
                savedCount:post._count.savedPosts,
                hasLiked:post.likes.length > 0,
                hasSaved:post.savedPosts.length > 0,
                medias:post.medias
            })),
            cursor:nextCursor,
            hasNextPage
        }
    
    }

    async getSavedPosts ({limit,cursor}:postPaginationQuery,userId:string):Promise<SavedPostInfiniteScroll>{
        const cursorParts = cursor?.split('_')
        const createdAtStr = cursorParts?.[0]
        const id = cursorParts?.[1]
        const savedPosts = await this.prismaService.savedPost.findMany({
            where:{
               userId,
               post:{
                NOT:{
                    userId:userId
                }
               }
            },
            take:limit + 1,
            skip:cursor?1:undefined,
            cursor:cursor && createdAtStr && id ?{
                id,
                createdAt: new Date(createdAtStr)
            }:undefined,
            orderBy:[
                {createdAt:'desc'},
                {id:'desc'}
            ],
            select:{
                id:true,
                createdAt:true,
                post:{
                    select:{
                        id:true,
                        medias:true,
                        caption:true,
                        createdAt:true,
                        user:{
                            select:{
                                id:true,
                                name:true,
                                image:true
                            }
                        },
                        _count:{
                            select:{
                                comments:true,
                                likes:true,
                            }
                        },
                    }
                }
            }

        })
        const hasNextPage = savedPosts.length > limit
        const newSavedPosts = hasNextPage ? savedPosts.slice(0,limit) : savedPosts
        const newCursor = hasNextPage ? `${newSavedPosts[newSavedPosts.length-1].createdAt.toISOString()}_${newSavedPosts[newSavedPosts.length-1].id}` : undefined

        return {
            hasNextPage,
            cursor:newCursor,
            posts:newSavedPosts.map(savedPost=>({
                id:savedPost.id,
                createdAt:savedPost.createdAt,
                post:{
                    id:savedPost.post.id,
                    caption:savedPost.post.caption,
                    createdAt: savedPost.post.createdAt,
                    user:savedPost.post.user,
                    commentsCount:savedPost.post._count.comments,
                    likesCount:savedPost.post._count.likes,
                    medias:savedPost.post.medias
                }
            }))
        }
    }

    async toggleLike(postId:string,userId:string) {
        return await this.prismaService.$transaction(async (tx)=>{
            const exsitingLike = await tx.postlike.findUnique({
                where:{
                    postId_userId:{
                        postId,
                        userId
                    }
                }
            })

            if(exsitingLike){
                await tx.postlike.delete({
                    where:{
                        id:exsitingLike.id
                    }
                })  
                return {
                    liked:false
                }
            }else{
                await tx.postlike.create({
                    data:{
                        post:{
                            connect:{
                                id:postId
                            }
                        },
                        user:{
                            connect:{
                                id:userId
                            }
                        }
                    }
                })
                return {
                    liked:true
                }
            }
        })
    }
    async toggleSave(postId:string,userId:string){
        return await this.prismaService.$transaction(async (tx)=>{
            const existingSavedPost = await tx.savedPost.findUnique({
                where:{
                    postId_userId:{
                        postId,
                        userId
                    }
                }
            })
            if(existingSavedPost){
                await tx.savedPost.delete({
                    where:{
                        id:existingSavedPost.id
                    }
                })
                return {
                    savedPost:false
                }
            }else{
                await tx.savedPost.create({
                    data:{
                        post:{
                            connect:{
                                id:postId
                            }
                        },
                        user:{
                            connect:{
                                id:userId
                            }
                        }
                    }
                })
                return {
                    savedPost:true
                }
            }
        })
    }

    async createComment({postId,content}:createComment,userId:string){
        const newComment = await this.prismaService.comment.create({
            data:{
                content,
                post:{
                    connect:{
                        id:postId
                    }     
                },
                user:{
                    connect:{
                        id:userId
                    }
                }  
            },
            include:{
                user:{
                    select:{
                        id:true,
                        name:true,
                        image:true
                    }
                },
                _count:{
                    select:{
                        likes:true
                    }
                },
                likes:{
                    where:{
                        userId
                    },
                    select:{
                        id:true
                    },
                    take:1
                }
            }
        })

        return {
            id:newComment.id,
            postId:newComment.postId,
            content:newComment.content,
            createdAt:newComment.createdAt.toISOString(),
            hasLiked:newComment.likes.length > 0,
            likesCount:newComment._count.likes || 0,
            user:{
                id:newComment.user.id,
                name:newComment.user.name,
                image:newComment.user.image
            }
        }
    }

    async getInfinteComment({limit,postId,cursor}:commentPaginationQuery,userId:string){
        const id = cursor?.split('_')[0]
        const createdAt = cursor?.split('_')[1]
        const comments = await this.prismaService.comment.findMany({
            take:limit +1,
            cursor:cursor && id && createdAt ? {
                id,
                createdAt:new Date(createdAt)
            } : undefined,
            skip:cursor ? 1 : undefined,
            orderBy:[
                {
                    createdAt:'desc'
                },
                {
                    id:'desc'
                }
            ],
            where:{
                postId:postId,
            },
            include:{
                user:{
                    select:{
                        id:true,
                        name:true,
                        image:true
                    }
                },
                _count:{
                    select:{
                        likes:true
                    }
                },
                likes:{
                    where:{
                        userId
                    },
                    select:{
                        id:true
                    },
                    take:1
                }
            }
        })

        const hasNextpage = comments.length > limit
        const newComments = hasNextpage ? comments.slice(0,limit) : comments
        const newCursor = hasNextpage ? `${newComments[newComments.length-1].id}_${newComments[newComments.length-1].createdAt.toISOString()}` : null

        return {
            comments: newComments.map(c=>(
                {
                    id:c.id,
                    postId:c.postId,
                    content:c.content,
                    createdAt:c.createdAt.toISOString(),
                    hasLiked:c.likes.length > 0,
                    likesCount:c._count.likes || 0,
                    user:{
                        id:c.user.id,
                        name:c.user.name,
                        image:c.user.image
                    }
                }
            )),
            cursor:newCursor,
            hasNextPage:hasNextpage
        }
    }

    async toggleCommentLike (commentId:string,userId:string) {
        return await this.prismaService.$transaction(async(tx)=>{

            const exsitinglike = await tx.commentLike.findUnique({
                where:{
                    commentId_userId:{
                        commentId:commentId,
                        userId
                    }
                
                }
            })
            if(exsitinglike){
                await tx.commentLike.delete({
                    where:{
                        id:exsitinglike.id
                    }
                })
                return {
                    liked:false
                }
            }else{
                await tx.commentLike.create({
                    data:{
                        comment:{
                            connect:{
                                id:commentId,
                            }
                        },
                        user:{
                            connect:{
                                id:userId
                            }
                        }
                    }
                })
                return {
                    liked:true
                }
            }
        })
    }

    async deleteComment(commentId:string) {
        const commenttoDel = await this.prismaService.comment.delete({
            where:{
                id:commentId
            }
        })
        if(!commenttoDel){
            throw new TRPCError({
                code:'NOT_FOUND',
                message:'Comment not found'
            })
        }
    }
}
