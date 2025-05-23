import { config as configEnv } from 'dotenv';

// Load environment variables from .env file
configEnv();

/**
 * Environment configuration with sensible defaults
 */
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    // Use environment variable with fallback to development behavior (true)
    // In production environment file, this is set to false
    enableConsole: process.env.ENABLE_CONSOLE_LOGS !== 'false',
    // Enable log deduplication by default
    enableDeduplication: process.env.ENABLE_LOG_DEDUPLICATION !== 'false',
  },
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost/forgeboard',
  }
};

/**
 * Helper function to check if console logging should be enabled
 */
export function shouldEnableConsoleLogging(): boolean {
  return config.logging.enableConsole;
}
