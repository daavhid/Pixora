import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    bodyParser: false
  });
  
  // Request logging middleware
  app.use((req: any, res: any, next: any) => {
    console.log(`[TRPC REQUEST] ${req.method} ${req.path}`);
    next();
  });

  app.use('/trpc', (req, _res, next) => {
  console.log('[TRPC PATH HIT]', req.method, req.originalUrl);
  next();
});

app.use('/api/trpc', (req, _res, next) => {
  console.log('[TRPC PATH HIT2]', req.method, req.originalUrl);
  next();
});
  
  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
  });
  app.useLogger(['error'])
  app.useGlobalPipes(new ValidationPipe(
    {
      whitelist: true,
      transform:true
    }
  ));
  // Global prefix removed - TRPCModule handles /api/trpc path directly
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
