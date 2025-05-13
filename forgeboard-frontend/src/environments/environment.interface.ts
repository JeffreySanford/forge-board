/**
 * Environment configuration interface for type safety
 */
export interface Environment {
  /**
   * Production flag
   */
  production: boolean;
  
  /**
   * API URL (e.g., http://localhost:3000/api)
   */
  apiUrl?: string;
  
  /**
   * Socket URL (e.g., http://localhost:3000)
   */
  socketUrl?: string;
  
  /**
   * API base URL (e.g., http://localhost:3000/api)
   */
  apiBaseUrl: string;
  
  /**
   * Socket base URL (e.g., http://localhost:3000)
   */
  socketBaseUrl: string;
  
  /**
   * JWT token for current user (set at runtime)
   */
  encryptedJwtToken?: string;
  
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
    options: Record<string, any>;
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
  logsPath: string;
}

/**
 * Log level type
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
