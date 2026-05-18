import { Injectable } from "@nestjs/common";
import { ContextOptions, TRPCContext } from "nestjs-trpc";

@Injectable()
export class TRPCAuthContext implements TRPCContext {
 create(opts: ContextOptions): Record<string, unknown> | Promise<Record<string, unknown>> {
     return {
        req: opts.req,
        res:opts.res,
     }
 }
}