import { ConversationStatus } from '../../../generated/prisma/enums'
import {z} from 'zod'

export const  createConversationSchema = z.object({
    participants:z.array(z.string()),
    title:z.string().nullable().optional(),
    avatarUrl:z.string().nullable().optional(),
    type:z.enum(['dm','group']).default('dm')
})

export const conversationSchema = z.object({
    id:z.string(),
    type:z.string().nullable().optional(),
    avatarUrl:z.string().nullable().optional(),
    title:z.string().nullable().optional(),
    conversationParticipants:z.array(z.object({
        id:z.string()
    })),
    createdById:z.string().nullable().optional(),
    lastMessage:z.object({
        id:z.string(),
        content:z.string(),
        createdAt:z.coerce.date(),
        senderId:z.string(),
    }).nullable().optional()
})

export const conversationParticipantSchema = z.object({
    id:z.string(),
    conversationId:z.string(),
    user:z.object({
        id:z.string(),
        name:z.string().nullable().optional(),
        image:z.url().nullable().optional(),
    }),
    role:z.enum(['admin','member','owner']).default('member'),
    lastReadMessage:z.object({
        id:z.string(),
        content:z.string(),
        senderId:z.string(),
        createdAt:z.iso.datetime()
    }).nullable().optional(),
    lastReadAt:z.iso.datetime().nullable().optional(),
    leftAt:z.iso.datetime().nullable().optional(),
    createdAt:z.iso.datetime()
    
})


export const messageAttachment = z.object({
    id:z.string(),
    url:z.url(),
    type:z.enum([ "video", "image" , "raw"]),
    width:z.number().positive().nullable().optional(),
    height:z.number().positive().nullable().optional(),
    duration:z.number().positive().nullable().optional(),
    thumbnail:z.url().nullable().optional(),
    createdAt:z.coerce.date(),
    messageId:z.string().optional()
})

export const messageSchema = z.object({
    id:z.string(),
    content:z.string(),
    createdAt:z.coerce.date(),
    senderId:z.string(),
    conversationId:z.string(),
    messageAttachments:z.array(messageAttachment)
})

export const createMessageSchema = z.object({
    content:z.string(),
    messageAttachments:z.array(z.object({
        url:z.url(),
    type:z.enum([ "video", "image" , "raw"]),
    width:z.number().positive().nullable().optional(),
    height:z.number().positive().nullable().optional(),
    duration:z.number().positive().nullable().optional(),
    thumbnail:z.url().nullable().optional(),
    createdAt:z.iso.datetime(),
    messageId:z.string().optional()
    })),
    conversation:createConversationSchema
})

export const createToggleConversationRequestSchema = z.object({
    conversationId:z.string(),
    userId:z.string(),
    action:z.enum(ConversationStatus)
})

export const messageQuerySchema = z.object({
    cursor:z.string().nullable().optional(),
    conversationId:z.string(),
    limit:z.number().int().default(10),
    search:z.string().nullable().optional()
})

export const infiniteMessageSchema = z.object({
    messages:z.array(messageSchema),
    cursor:z.string().nullable().optional(),
    hasNextPage:z.boolean()
})

export type CreateConversation = z.infer<typeof createConversationSchema>
export type Conversation = z.infer<typeof conversationSchema>
export type ConversationParticipants = z.infer<typeof conversationParticipantSchema>


export type Message = z.infer<typeof messageSchema>
export type CreateMessage = z.infer<typeof createMessageSchema>
export type MessageQuery = z.infer<typeof messageQuerySchema>
export type InfiniteMessage = z.infer<typeof infiniteMessageSchema>
export type ToggleConversationRequest = z.infer<typeof createToggleConversationRequestSchema>

