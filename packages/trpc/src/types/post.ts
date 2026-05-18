export type * from "../../../../apps/backend/src/post/schema/post.zod.schema"
import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "../server";

type RouterOutput = inferRouterOutputs<AppRouter>;
// export type Post = RouterOutput['post']['getAllPost']
export type Post = RouterOutput['post']['createPost']
export type Comment = RouterOutput['post']['createComment']
export type PostMedia = Post['medias'][number]
export type SavedPost = RouterOutput['post']['getSavedPosts']['posts'][number]['post']