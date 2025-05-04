/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, LoggerService } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { shouldEnableConsoleLogging } from './bootstrap';

/**
 * Custom logger implementation with filtering capabilities
 */
class FilteredLogger implements LoggerService {
  private readonly enableConsoleOutput: boolean;
  
  constructor() {
    // Read from environment config
    this.enableConsoleOutput = shouldEnableConsoleLogging();
  }

  /**
   * Should this message be filtered out?
   */
  private shouldFilter(context: string, message: string): boolean {
    // Skip log messages about receiving log entries
    if (context === 'LogsController' && 
        message.includes('Received') && 
        message.includes('log entries')) {
      return true;
    }
    return false;
  }

  log(message: unknown, context?: string): void {
    if (!this.enableConsoleOutput) return;
    if (context && this.shouldFilter(context, String(message))) {
      return;
    }
    console.log(`[Nest] ${process.pid}  - ${new Date().toLocaleString()}     LOG [${context}] ${message}`);
  }

  error(message: unknown, trace?: string, context?: string): void {
    if (!this.enableConsoleOutput) return;
    console.error(`[Nest] ${process.pid}  - ${new Date().toLocaleString()}     ERROR [${context}] ${message}`, trace);
  }

  warn(message: unknown, context?: string): void {
    if (!this.enableConsoleOutput) return;
    console.warn(`[Nest] ${process.pid}  - ${new Date().toLocaleString()}     WARN [${context}] ${message}`);
  }

  debug(message: unknown, context?: string): void {
    if (!this.enableConsoleOutput) return;
    console.debug(`[Nest] ${process.pid}  - ${new Date().toLocaleString()}     DEBUG [${context}] ${message}`);
  }

  verbose(message: unknown, context?: string): void {
    if (!this.enableConsoleOutput) return;
    console.log(`[Nest] ${process.pid}  - ${new Date().toLocaleString()}     VERBOSE [${context}] ${message}`);
  }
}

async function bootstrap() {
  // Create a custom logger that filters out specific messages
  const app = await NestFactory.create(AppModule, {
    logger: new FilteredLogger(),
  });
  
  const logger = new Logger('Bootstrap');
  logger.log('Starting ForgeBoard API...');
  
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
