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
  message: string,
  level: LogLevelString = 'info',
  source: string = 'app',
  data?: Record<string, unknown>
): LogEntry {
  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level,
    message,
    source,
    data
  };
}

/**
 * Create a default log filter
 */
export function createDefaultFilter(): LogFilter {
  return {
    // Use string 'info' instead of enum value to match LogLevelString type
    level: 'info',
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
      // Changed from 'loglevels' to 'level' and made it an array
      level: [logLevelEnumToString(LogLevelEnum.INFO)]
    };
  }
}
