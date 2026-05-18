import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '@thallesp/nestjs-better-auth';
import { createAuth} from '../lib/auth'; 

import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { TRPCModule } from 'nestjs-trpc';
import { PostModule } from './post/post.module';
import { TRPCAuthContext } from './app.context';
import { TRPCAuthMiddleware } from './auth/auth.trpc.middleware';
import { ConversationsModule } from './conversations/conversations.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }), 
    PrismaModule,
    AuthModule.forRootAsync({
      imports:[PrismaModule],
      inject:[PrismaService],
      useFactory:(prisma:PrismaService)=>{
        return {
          auth:createAuth(prisma),
          bodyParser: {
          json: { limit: '2mb' },
          urlencoded: { limit: '2mb', extended: true },
          rawBody: true,
        },
        }
      }
    }),
    TRPCModule.forRoot({
      basePath:'/api/trpc',
      context:TRPCAuthContext,
      globalMiddlewares:[TRPCAuthMiddleware]
      
    }),
    PostModule,
    ConversationsModule,
    UserModule
  ],
  providers: [TRPCAuthContext,TRPCAuthMiddleware],
})
export class AppModule {}
