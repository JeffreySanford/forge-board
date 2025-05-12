/**
 * Helper functions for working with logs
 */
import { 
  LogEntry, 
  LogFilter, 
  LogLevelEnum, 
  LogLevelString,
  logLevelEnumToString,
  stringToLogLevelEnum
} from './log-types';

/**
 * Helper to create a log entry
 */
export function createLogEntry(
  level: LogLevelEnum,
  message: string,
  source: string,
  details?: Record<string, unknown>
): LogEntry {
  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level,
    message,
    source,
    details // Use details instead of data
  };
}

/**
 * Create a default log filter
 */
export function createDefaultFilter(): LogFilter {
  return {
    level: LogLevelEnum.INFO,  // Use enum value directly
    service: undefined,
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    limit: 100
  };
}

/**
 * Generate a simple ID for logs
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Helper class for log level operations
 */
export class LogLevelHelper {
  /**
   * Convert a string log level to its enum representation
   */
  static stringToEnum(level: LogLevelString): LogLevelEnum {
    return stringToLogLevelEnum(level);
  }
  
  /**
   * Convert a log level enum to its string representation
   */
  static enumToString(level: LogLevelEnum): LogLevelString {
    return logLevelEnumToString(level);
  }
  
  /**
   * Create an empty default filter
   */
  static createFilter(): LogFilter {
    return {
      // Use LogLevelEnum array directly
      level: [LogLevelEnum.INFO]
    };
  }
}
