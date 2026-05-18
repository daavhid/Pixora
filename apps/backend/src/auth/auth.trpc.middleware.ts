import { Injectable } from "@nestjs/common";
import { AuthService } from "@thallesp/nestjs-better-auth";
import { MiddlewareOptions, MiddlewareResponse, TRPCMiddleware } from "nestjs-trpc";
import { fromNodeHeaders } from "better-auth/node";

@Injectable()
export class TRPCAuthMiddleware implements TRPCMiddleware {
    constructor(private authService:AuthService) {}
    async use(opts: MiddlewareOptions<{req:any,res:any}>): Promise<MiddlewareResponse> {
        const {ctx,next} = opts
        try {
            
            const session = await this.authService.api.getSession({
                headers: fromNodeHeaders(ctx.req.headers)
            })


    
            if(!session?.user || !session?.session) {
                throw new Error("Unauthorised")
            }

    
            return next({
                ctx:{
                    ...ctx,
                    session:session.session,
                    user:session.user
                }
            })
            
        } catch (error) {
           throw new Error("Unauthorised")
        
        }
        
    }
}