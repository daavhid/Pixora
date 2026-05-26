import { Injectable } from "@nestjs/common";
import { ConversationsService } from "./conversations.service";
import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { type conversationQuery, conversationQuerySchema, conversationSchema, type GetConversation, getConversationSchema, type CreateMessage, createMessageSchema, createToggleConversationRequestSchema, InfiniteConversationSchema, infiniteMessageSchema, type MessageQuery, messageQuerySchema, messageSchema,type ToggleConversationRequest } from "./schema/conversation.zod.schema";
import type { TRPCAuthContextType } from "../../types/auth/context.type";
import z from "zod";
import { TRPCAuthMiddleware } from "@/auth/auth.trpc.middleware";

@UseMiddlewares(TRPCAuthMiddleware)
@Router({alias:"conversation"})
export class ConversationRouter {
    constructor(private conversationService:ConversationsService){}

    @Query({
        input:conversationQuerySchema,
        output:InfiniteConversationSchema
    })
    async getConversations(@Input() input:conversationQuery,@Ctx() {user}:TRPCAuthContextType){
        return this.conversationService.getConversations(input,user.id)
    }

    @Query({
        input:getConversationSchema,
        output:z.boolean()
    })
    async getConversation(@Input() input:GetConversation,@Ctx() {user}:TRPCAuthContextType){
        return this.conversationService.getConversation(input,user.id)
    }

    @Mutation({
        input:createMessageSchema,
        output:messageSchema        
    })
    async sendMessage(@Input() sendMessageInput:CreateMessage, @Ctx() {user}:TRPCAuthContextType){
        return this.conversationService.sendMessage(sendMessageInput,user.id)
    }

    @Query({
        input:messageQuerySchema,
        output:infiniteMessageSchema
    })
    async getInfiniteMessages(@Input() messageQuery:MessageQuery, @Ctx() {user}:TRPCAuthContextType){
        return this.conversationService.getInfiniteMessages(messageQuery)
    }

    @Mutation({
        input:createToggleConversationRequestSchema,
        output:z.boolean().nullable().optional()
    })
    async toggleConversationRequest(@Input() toggleRequest:ToggleConversationRequest, @Ctx() {user}:TRPCAuthContextType){
        return this.conversationService.toggleConversationRequest(toggleRequest.conversationId, user.id, toggleRequest.action)
    }

}