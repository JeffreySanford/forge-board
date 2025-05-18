/**
 * Environment configuration interface for type safety
 */
export interface Environment {
  /**
   * Production flag
   */
  production: boolean;
  
  /**
   * API URL (e.g., http://localhost:3000/api) - computed getter property
   */
  readonly apiUrl?: string;
  
  /**
   * Socket URL (e.g., http://localhost:3000) - computed getter property
   */
  readonly socketUrl?: string;
  
  /**
   * API base URL (e.g., http://localhost:3000/api)
   */
  apiBaseUrl: string;
  
  /**
   * Socket base URL (e.g., http://localhost:3000)
   */
  socketBaseUrl: string;
  
  /**
   * JWT Key for signing tokens
   * This should be kept secret and not exposed in the frontend.
   * In production, use a secure vault.
   */
  JWTKEY?: string;

  /**
   * Default JWT token for guest access
   */
  jwtGuestToken?: string;
  
  /**
   * Feature flags
   */
  features?: {
    /**
     * Enable mock data for development
     */
    enableMockData?: boolean;
    
    /**
     * Enable diagnostics tools
     */
    enableDiagnostics?: boolean;
    
    /**
     * Enable socket logging
     */
    enableSocketLogging?: boolean;
    
    /**
     * Enable type validation
     */
    enableTypeValidation?: boolean;
  };
  
  /**
   * Logging configuration
   */
  logging?: {
    /**
     * Log level ('debug', 'info', 'warn', 'error')
     */
    level?: LogLevel;
    
    /**
     * Enable console logging
     */    enableConsole?: boolean;
  };
  
  /**
   * MongoDB configuration
   */
  mongo?: {
    /**
     * MongoDB URI (e.g., mongodb://localhost:27017/forgeboard)
     */
    uri: string;
    /**
     * MongoDB connection options
     */
    options: Record<string, unknown>;
  };
  
  /**
   * Flag to use in-memory MongoDB for development
   */
  useInMemoryMongo: boolean;
  
  /**
   * MongoDB URI display value
   */
  mongoUri: string;
  
  /**
   * Path for logs endpoint (default is 'logs')
   */
  logsPath?: string;
  
  /**
   * Application version
   */
  version?: string;
  
  /**
   * Build identifier
   */
  build?: string;
}

/**
 * Log level type
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
