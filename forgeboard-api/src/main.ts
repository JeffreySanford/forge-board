/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting ForgeBoard API...');
  
  const app = await NestFactory.create(AppModule);
  
  // Configure CORS for HTTP requests
  app.enableCors({
    origin: '*', // In production, specify the actual origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });
  
  // Add API prefix to all routes
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`ForgeBoard API is running on: http://localhost:${port}`);
  logger.log('WebSocket server is available at:');
  logger.log(`  - http://localhost:${port}/metrics`);
  logger.log(`  - http://localhost:${port}/diagnostics`);
}

bootstrap().catch(err => {
  const logger = new Logger('Bootstrap');
  logger.error(`Error starting application: ${err.message}`);
});
