import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Conversation, CreateConversation, CreateMessage, InfiniteMessage, Message, MessageQuery } from './schema/conversation.zod.schema';
import { TRPCError } from '@trpc/server';
import { ConversationStatus, Prisma } from '../../generated/prisma/client';

@Injectable()
export class ConversationsService {
    constructor(private prismaService:PrismaService){}
    //

    private async createPrivateConversation(tx: Prisma.TransactionClient,ismutualFollowers:boolean,{participants}:CreateConversation,userId:string):Promise<Conversation>{
        
        const newConversation = await tx.conversation.create({
            data:{
                status:ismutualFollowers ? 'accepted' : 'pending',
                conversationParticipants:{
                   create:[...participants,userId].map(id=>(
                        {
                            userId:id,
                            status:(ismutualFollowers || id === userId) ? 'accepted' : 'pending'
                        }
                   ))
                }
            },
            include:{
                conversationParticipants:{
                    select:{
                        id:true
                    }
                }
            }
        })

        return newConversation


    }

    async getConversations(currentUserId:string):Promise<Conversation[]>{
        const conversations = await this.prismaService.conversation.findMany({
            where:{
                conversationParticipants:{
                    some:{
                        userId:currentUserId
                    }
                }
            },
            select:{
                id:true,
                type:true,
                avatarUrl:true,
                title:true,
                conversationParticipants:{
                    select:{
                        id:true
                    }
                },
                status:true,
                lastMessage:{
                    select:{
                        id:true,
                        content:true,
                        senderId:true,
                        createdAt:true
                    }
                }
            }
        })
        return conversations
    }

    async sendMessage({ content,conversation,messageAttachments}:CreateMessage,userId:string):Promise<Message> {

        if(!content && messageAttachments.length===0){
            throw new TRPCError({
                code:'BAD_REQUEST',
                message:'Invalid message'
            })
        }
        return await this.prismaService.$transaction(async (tx)=>{
            // find if participants follow each other 
        
            const exisitingConversation = await tx.conversation.findFirst({
            where:{
                AND: [
                        {
                            conversationParticipants:{every:{userId:{in:[...conversation.participants,userId]}}}
                        },
                        {
                            conversationParticipants:{some:{userId}}
                        },
                    ],
            },
            include:{
                    conversationParticipants:{
                        select:{
                            id:true
                        }
                    },
                    
                }
        },
            )

            let conv : null | Conversation = null

            if(exisitingConversation){
                conv = exisitingConversation
            }else{

                const followList = await tx.follow.findMany({
                where:{
                    OR:[
                        {userIdWhoFollows:userId,userBeingFollowed:conversation.participants[0]},
                        {userIdWhoFollows:conversation.participants[0],userBeingFollowed:userId}
                    ]
                }
                })
                const isMutual = followList.length >=2 
                conv = await this.createPrivateConversation(tx,isMutual,conversation,userId)
                }

        const newMessage = await tx.message.create({
            data:{
                content,
                conversation:{
                    connect:{
                        id:conv.id,
                    }
                },
                messageAttachments:{
                    create:messageAttachments
                },
                sender:{
                    connect:{
                        id:userId
                    }
                }
            },
            include:{
                messageAttachments:true
            }
        })
        
        return newMessage


        })
        

        
    }

    async toggleConversationRequest(conversationId:string,userId:string,action:ConversationStatus):Promise<boolean | undefined>{
        return await this.prismaService.$transaction(async (tx)=>{
            const existingParticipant = await tx.conversationParticipant.findUnique({
                where:{
                    conversationId_userId :{
                        conversationId:conversationId,
                        userId:userId
                    },
                    status:'pending'
                    
                }
            })
            if(!existingParticipant){
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'No pending request found for this user in this conversation.',
                });
                
            }

            switch(action) {
                case 'accepted':
                    await tx.conversationParticipant.update({
                        where:{
                            conversationId_userId: {
                                conversationId,
                                userId,
                            },
                        },
                        data:{
                            status:'accepted'
                        }
                    })

                    await tx.conversation.update({
                        where:{
                            id:conversationId,
                        },
                        data:{
                            status:'accepted'
                        }
                    })
                    return true
                case 'rejected':
                    await tx.conversationParticipant.update({
                        where:{
                            conversationId_userId: {
                                conversationId,
                                userId,
                            },
                        },
                        data:{
                            status:'rejected'
                        }
                    })

                    await tx.conversation.update({
                        where:{
                            id:conversationId,
                        },
                        data:{
                            status:'rejected'
                        }
                    })
                    return false
            
            }
        })
                
    }

    async getInfiniteMessages({conversationId,limit,cursor}:MessageQuery,):Promise<InfiniteMessage> {
        const cursorParts = cursor?.split('_')
        const createdAtStr = cursorParts?.[0]
        const id = cursorParts?.[1]
        const messages = await this.prismaService.message.findMany({
            take:limit + 1,
            cursor:cursor && createdAtStr && id ? {
                id,
                createdAt:new Date(createdAtStr)

            } : undefined,
            where:{
                conversationId,
            },
            skip:cursor ? 1 : 0,
            orderBy: {
                createdAt:'desc',
                id:'desc'
            },
            include:{
                messageAttachments:true,
                sender:{
                    select:{
                        id:true,
                        name:true,
                        image:true
                    }
                }

            }
        })
        const hasMore = messages.length > limit
        const newMessages = hasMore ? messages.slice(0,limit) : messages
        const nextCursor = hasMore ? `${newMessages[newMessages.length - 1].createdAt.getTime()}_${newMessages[newMessages.length - 1].id}` : null
        return { messages: newMessages, hasNextPage: hasMore, cursor: nextCursor }

    }

}
