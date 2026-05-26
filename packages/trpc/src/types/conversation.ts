export type * from "../../../../apps/backend/src/conversations/schema/conversation.zod.schema"
import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "../server";

type RouterOutput = inferRouterOutputs<AppRouter>;

export type Conversation = RouterOutput['conversation']['getConversations']['conversations'][number]