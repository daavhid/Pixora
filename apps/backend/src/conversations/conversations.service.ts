import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Conversation, conversationQuery, CreateConversation, GetConversation, CreateMessage, InfiniteConversations, InfiniteMessage, Message, MessageQuery } from './schema/conversation.zod.schema';
import { TRPCError } from '@trpc/server';
import { ConversationStatus, Prisma } from '../../generated/prisma/client';
import { ConversationWhereUniqueInput } from '../../generated/prisma/models';

@Injectable()
export class ConversationsService {
    constructor(private prismaService:PrismaService){}
    //

    private async createPrivateConversation(tx: Prisma.TransactionClient,ismutualFollowers:boolean,{participants,avatarUrl}:CreateConversation,userId:string):Promise<Conversation>{
        
        const newConversation = await tx.conversation.create({
            data:{
                status:ismutualFollowers ? 'accepted' : 'pending',
                avatarUrl:avatarUrl,
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
                        id:true,
                        status:true,
                        user:{
                            select:{
                                id:true,
                                image:true,
                                name:true
                            }
                        }
                    }
                }
            }
        })

        return newConversation


    }

    async getConversations({cursor,limit,search}:conversationQuery,currentUserId:string):Promise<InfiniteConversations>{
        const cursorParts = cursor?.split('_')
        const updatedAtStr = cursorParts?.[0]
        const id = cursorParts?.[1]
        const cursorWhere:ConversationWhereUniqueInput  = {
            id,
            updatedAt:updatedAtStr && new Date(updatedAtStr)

        }

        if(search){
            cursorWhere.title = search
        }

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
                updatedAt:true,
                createdAt:true,
                status:true,
                conversationParticipants:{
                     where:{
                        NOT:{
                            userId:currentUserId
                        }
                    },
                    select:{
                        id:true,
                        status:true,
                        user:{
                            select:{
                                id:true,
                                image:true,
                                name:true
                            }
                        }
                    }
                },
                lastMessage:{
                    select:{
                        id:true,
                        content:true,
                        senderId:true,
                        createdAt:true
                    }
                }
            },
            orderBy: [
                {
                    createdAt:'desc',
                },
                {
                    id:'desc'
                }
            ],
            take:limit + 1,
            skip: cursor ? 1 : undefined,
            cursor:cursor && updatedAtStr && id ? cursorWhere : undefined,
        })
        const hasMore = conversations.length > limit
        const newConversations = hasMore ? conversations.slice(0,limit) : conversations
        const nextCursor = hasMore ? `${newConversations[newConversations.length - 1].updatedAt.getTime()}_${newConversations[newConversations.length - 1].id}` : null
        return { conversations: newConversations, hasNextPage: hasMore, cursor: nextCursor}
    }

    async getConversation({participants,type}:GetConversation,currentUserId:string):Promise<boolean> {
        const uniqueParticipants = Array.from(new Set(participants))

        if (type === 'dm' && uniqueParticipants.length !== 1) {
            return false
        }

        const participantConditions = uniqueParticipants.map((participantId) => ({
            conversationParticipants: {
                some: {
                    userId: participantId,
                },
            },
        }))

        const whereClause: Prisma.ConversationWhereInput = {
            type,
            conversationParticipants: {
                some: {
                    userId: currentUserId,
                },
            },
            AND: participantConditions,
        }

        const existingConversation = await this.prismaService.conversation.findFirst({
            where: whereClause,
            select: {
                id: true,
            },
        })

        return Boolean(existingConversation)
    }

    async sendMessage(
    { content, conversation, messageAttachments }: CreateMessage,
    userId: string
    ): Promise<Message> {

    if (!content && messageAttachments?.length === 0) {
        throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid message',
        })
    }

    return await this.prismaService.$transaction(async (tx) => {

        // ───────────────────────────────────────────────────────────
        // Find existing DM conversation
        // ───────────────────────────────────────────────────────────

        const existingConversation = await tx.conversation.findFirst({
        where: {
            type: 'dm',

            AND: [
            {
                conversationParticipants: {
                some: {
                    userId,
                },
                },
            },

            {
                conversationParticipants: {
                some: {
                    userId: conversation.participants[0],
                },
                },
            },
            ],
        },

        include: {
            lastMessage: true,

            conversationParticipants: {
            select: {
                id: true,
                status: true,

                user: {
                select: {
                    id: true,
                    image: true,
                    name: true,
                },
                },
            },
            },
        },
        })

        let conv: Conversation | null = null

        // ───────────────────────────────────────────────────────────
        // Existing conversation
        // ───────────────────────────────────────────────────────────

        if (existingConversation) {
        conv = existingConversation

        // Receiver cannot reply until accepting request
        const isIncomingPendingRequest =
            conv.status === 'pending' &&
            conv.lastMessage &&
            conv.lastMessage.senderId !== userId

        if (isIncomingPendingRequest) {
            throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Accept request before replying',
            })
        }

        // Prevent messaging rejected conversations
        if (conv.status === 'rejected') {
            throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This conversation was declined',
            })
        }
        }

        // ───────────────────────────────────────────────────────────
        // Create new conversation if none exists
        // ───────────────────────────────────────────────────────────

        else {
        const followList = await tx.follow.findMany({
            where: {
            OR: [
                {
                userIdWhoFollows: userId,
                userBeingFollowed: conversation.participants[0],
                },

                {
                userIdWhoFollows: conversation.participants[0],
                userBeingFollowed: userId,
                },
            ],
            },
        })

        const isMutual = followList.length >= 2

        conv = await this.createPrivateConversation(
            tx,
            isMutual,
            conversation,
            userId
        )
        }

        // ───────────────────────────────────────────────────────────
        // Create message
        // ───────────────────────────────────────────────────────────

        const newMessage = await tx.message.create({
        data: {
            content,

            conversation: {
            connect: {
                id: conv.id,
            },
            },

            messageAttachments:
            messageAttachments &&
            messageAttachments.length > 0
                ? {
                    create: messageAttachments,
                }
                : {},

            sender: {
            connect: {
                id: userId,
            },
            },
        },

        include: {
            messageAttachments: true,

            sender: {
            select: {
                id: true,
                name: true,
                image: true,
            },
            },
        },
        })

        // ───────────────────────────────────────────────────────────
        // Update conversation last message
        // ───────────────────────────────────────────────────────────

        await tx.conversation.update({
        where: {
            id: conv.id,
        },

        data: {
            lastMessageId: newMessage.id,
        },
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
                    OR:[
                        {
                            status:'pending'
                        },
                        {
                            status:'rejected'
                        }
                    ]
                    
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
            orderBy: [
                {
                    createdAt:'desc',
                },
                {
                    id:'desc'
                }
            ],
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
        const nextCursor = hasMore ? `${newMessages[newMessages.length - 1].createdAt.toISOString()}_${newMessages[newMessages.length - 1].id}` : null
        return { messages: newMessages, hasNextPage: hasMore, cursor: nextCursor }

    }

}
