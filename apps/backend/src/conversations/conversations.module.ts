import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationRouter } from './conversations.router';

@Module({
    providers: [ConversationsService,ConversationRouter]
})
export class ConversationsModule {}
