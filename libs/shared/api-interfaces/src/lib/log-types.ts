/**
 * Types related to logging system
 */

// Mark file as having exports
export const __logTypes = true;

/**
 * Log level enumeration
 */
export enum LogLevelEnum {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

/**
 * Log level as string
 */
export type LogLevelString = 'trace' | 'debug' | 'info' | 'warn' | 'warning' | 'error' | 'fatal';

/**
 * Convert string log level to enum
 */
export function stringToLogLevelEnum(levelStr: LogLevelString | string | undefined): LogLevelEnum {
  if (!levelStr) return LogLevelEnum.INFO; // Default level
  switch (levelStr.toLowerCase()) {
    case 'trace': return LogLevelEnum.TRACE;
    case 'debug': return LogLevelEnum.DEBUG;
    case 'info': return LogLevelEnum.INFO;
    case 'warn':
    case 'warning': return LogLevelEnum.WARN;
    case 'error': return LogLevelEnum.ERROR;
    case 'fatal': return LogLevelEnum.FATAL;
    default: return LogLevelEnum.INFO; // Default for unrecognized strings
  }
}

/**
 * Convert enum log level to string
 */
export function logLevelEnumToString(level: LogLevelEnum): LogLevelString {
  switch (level) {
    case LogLevelEnum.TRACE: return 'trace';
    case LogLevelEnum.DEBUG: return 'debug';
    case LogLevelEnum.INFO: return 'info';
    case LogLevelEnum.WARN: return 'warn';
    case LogLevelEnum.ERROR: return 'error';
    case LogLevelEnum.FATAL: return 'fatal';
    default: return 'info'; // Should not happen with enum
  }
}

/**
 * Log entry interface
 */
export interface LogEntry {
  // Core fields that are always required
  level: LogLevelEnum;
  message: string;
  
  // Fields that might be auto-generated if not provided
  id: string;
  timestamp: string;
  
  // Optional fields
  source?: string;
  context?: string; // Optional context string
  details?: Record<string, unknown>; // For structured data, was 'data'
  data?: Record<string, unknown>; // Add data property for backward compatibility
  expanded?: boolean;
  rawData?: string;
  categories?: string[];
  isCategory?: boolean;
  categoryName?: string;
  categoryLogs?: LogEntry[];
  categoryCount?: number;
  duplicates?: LogEntry[];
  duplicateCount?: number;
  isLoggingLoop?: boolean; // Flag for loop detection
  stackTrace?: string; // Optional stack trace
  tags?: string[]; // Optional tags
  eventId?: string; // Correlation ID
}

/**
 * Data Transfer Object for creating logs
 */
export interface LogDto {
  level: LogLevelEnum;
  message: string;
  source?: string;
  details?: Record<string, unknown>;
  context?: string;
  timestamp?: string; // Optional, can be set by server
}

/**
 * Filter for fetching logs
 * All fields are optional since filters are often created empty and populated conditionally
 */
export interface LogFilter {
  // Filter by log level (single or multiple)
  level?: LogLevelEnum | LogLevelEnum[];
  
  // Filter by service/component name
  service?: string;
  
  // Date range filters
  startDate?: string;
  endDate?: string;
  afterTimestamp?: string;
  
  // Text search
  search?: string;
  
  // Pagination
  limit?: number;
  skip?: number;
}

/**
 * Response structure for log requests
 */
export interface LogResponse {
  logs: LogEntry[];
  totalCount: number;
  filtered: boolean;
  status: boolean; // General success/failure status of the response
  timestamp: string;
}

/**
 * Update structure for log streams
 */
export interface LogStreamUpdate {
  log?: LogEntry; // A single new log entry
  logs?: LogEntry[]; // A batch of new or updated logs
  totalCount?: number; // Optional: updated total count of logs matching a filter
  append?: boolean; // True if logs should be appended, false if they replace existing
  stats?: Record<string, number>; // Optional: updated log statistics
}

/**
 * Result structure for log statistics
 */
export interface LogStatsResult {
  totalCount: number;
  byLevel: Record<LogLevelEnum, number>; // Use LogLevelEnum as key
  bySource: Record<string, number>;
}

/**
 * Response for log query operations
 */
export interface LogQueryResponse {
  status: boolean; // Success/failure of the query
  logs: LogEntry[];
  totalCount: number; // Total logs matching the query (pre-pagination)
  filtered: boolean; // Indicates if the results are from a filtered query
  timestamp: string;
  total?: number; // Add total for backward compatibility
  page?: number;
  pages?: number;
  stats?: {
    byLevel: Record<string, number>;
    bySource: Record<string, number>;
  };
}
