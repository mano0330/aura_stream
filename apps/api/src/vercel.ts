import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import serverlessExpress from '@vendia/serverless-express';
import express from 'express';

let cachedServer: any;

async function bootstrap() {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    // Enable CORS
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Enable global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Swagger API Documentation
    const config = new DocumentBuilder()
      .setTitle('Aura Stream API')
      .setDescription('The Aura Stream music platform API. All music streaming routes documented here.')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT-auth',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('music', 'YouTube music search and discovery')
      .addTag('playlists', 'Playlist management')
      .addTag('library', 'User library - likes and history')
      .addTag('social', 'Social features - follow, comments, feed')
      .addTag('ai', 'AI features - playlist generation, DJ, search')
      .addTag('users', 'User profile management')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
    cachedServer = serverlessExpress({ app: expressApp });
  }
  return cachedServer;
}

export const handler = async (event: any, context: any, callback: any) => {
  // Map standard requests to swagger docs accurately in serverless environment
  if (event.path === '/api/docs' || event.path === '/api/docs/') {
    event.path = '/api/docs/index.html';
  }
  const server = await bootstrap();
  return server(event, context, callback);
};
