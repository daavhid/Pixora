export type * from '../../../../apps/backend/src/user/schema/user.zod.schema'
import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "../server";

type RouterOutput = inferRouterOutputs<AppRouter>;
export type Story = RouterOutput['user']['getStories'][number]
export type UserProfile = RouterOutput["user"]["getUserById"]
export type Follower = RouterOutput["user"]["getInfiniteFollowers"]['followers'][number]
export type Following = RouterOutput["user"]["getInfiniteFollowing"]['following'][number]