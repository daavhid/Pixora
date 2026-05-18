import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { UserService } from "./user.service";
import {z} from "zod";
import { addStorySchema, FollowersInfiniteScrollSchema, FollowingInfiniteScrollSchema, storySchema, type UserPaginationQuery, UserPaginationQuerySchema, UserSchema, usersInfiniteScrollSchema, UserToFollowSchema,type AddStory, UserProfileQuerySchema, type UserProfileQuery } from "./schema/user.zod.schema";
// import type { TRPCAuthContextType } from "types/auth/context.type";
import { TRPCAuthMiddleware } from "@/auth/auth.trpc.middleware";
import type { TRPCAuthContextType } from "../../types/auth/context.type";

@UseMiddlewares(TRPCAuthMiddleware)
@Router({alias:"user"})
export class UserRouter {
    constructor(private userService: UserService){}
    @Query({
        input:z.object({
            userId:z.string()
        }),
        output:UserSchema
    })
    async getUserById(@Input() input: { userId: string }, @Ctx() {user}: TRPCAuthContextType) {
        return this.userService.getUserById(input.userId, user.id);
    }

    @Mutation({
        input:UserProfileQuerySchema,
        output:z.object({
            id:z.string()
        })
    })
    async editProfile(@Input() input: UserProfileQuery, @Ctx() {user}: TRPCAuthContextType) {
        return this.userService.editProfile(input, user.id);
    }


    @Mutation({
        input:z.object({
            targetUserId:z.string()
        }),
        output:z.object({
            isFollowing:z.boolean()
        })
    })
    async toggleFollow(@Input() input: { targetUserId: string }, @Ctx() {user}: TRPCAuthContextType) {
        return this.userService.toggleFollow(user.id, input.targetUserId);
    }

    @Query({
        input:UserPaginationQuerySchema,
        output:FollowersInfiniteScrollSchema
    })
    async getInfiniteFollowers(@Input() input: UserPaginationQuery,@Ctx() {user}:TRPCAuthContextType) {
        return this.userService.getInfiniteFollowers(input,user.id);
    }

    @Query({
        input:UserPaginationQuerySchema,
        output:usersInfiniteScrollSchema})
    async getInfiniteUsersToFollow(@Input() input: UserPaginationQuery,@Ctx() {user}:TRPCAuthContextType){
        return this.userService.getInfiniteUsersToFollow(input,user.id)
    }

    @Query({
        input:UserPaginationQuerySchema,
        output:FollowingInfiniteScrollSchema
    })
    async getInfiniteFollowing(@Input() input: UserPaginationQuery,@Ctx() {user}:TRPCAuthContextType) {
        return this.userService.getInfiniteFollowing(input,user.id);
    }

    @Query({
        output:z.array(storySchema)
    })
    async getStories(@Ctx() {user}:TRPCAuthContextType){
        return this.userService.getStories(user.id)
    }

    @Mutation({
        input:addStorySchema,
        output:storySchema
    })
    async addStory(@Input() input:AddStory,@Ctx() {user}:TRPCAuthContextType){
        return this.userService.addStory(input,user.id)
    }
}