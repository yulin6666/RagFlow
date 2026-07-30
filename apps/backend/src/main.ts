import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded files as static assets
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Railway assigns PORT dynamically; BACKEND_PORT is used locally
  const port = process.env.PORT || process.env.BACKEND_PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 RagFlow Backend running on http://localhost:${port}`);
  console.log(`📚 API endpoints: http://localhost:${port}/api`);
  console.log(`📁 File uploads served at http://localhost:${port}/uploads`);
}

bootstrap();
