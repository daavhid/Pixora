import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaService } from "@/prisma/prisma.service";


    // console.log('DATABASE_URL:', process.env.DATABASE_URL);
    // const prisma = new PrismaClient({
    //   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
    // })

export const createAuth = (prisma:PrismaService) => betterAuth({
    emailAndPassword: { 
        enabled: true, 
    }, 
    trustedOrigins:['http://localhost:3000'],
    database: prismaAdapter(prisma, {
        provider: "postgresql", 
    }),
});


export type Auth =  ReturnType<typeof createAuth>;
export type SessionObj = Auth['$Infer']['Session']
export type Session = SessionObj['session']
export type User = SessionObj['user']
// export type session = Auth