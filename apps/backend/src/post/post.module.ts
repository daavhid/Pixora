import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostRouter } from './post.router';

@Module({
  providers: [PostService, PostRouter],
  exports: [PostService,PostRouter],
})
export class PostModule {}
