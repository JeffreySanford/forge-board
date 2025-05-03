/**
 * Types related to logging system
 */

/**
 * Log level enum
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
export function stringToLogLevelEnum(level: LogLevelString): LogLevelEnum {
  switch(level.toLowerCase()) {
    case 'trace': return LogLevelEnum.TRACE;
    case 'debug': return LogLevelEnum.DEBUG;
    case 'info': return LogLevelEnum.INFO;
    case 'warn':
    case 'warning': return LogLevelEnum.WARN;
    case 'error': return LogLevelEnum.ERROR;
    case 'fatal': return LogLevelEnum.FATAL;
    default: return LogLevelEnum.INFO;
  }
}

/**
 * Convert enum log level to string
 */
export function logLevelEnumToString(level: LogLevelEnum): LogLevelString {
  switch(level) {
    case LogLevelEnum.TRACE: return 'trace';
    case LogLevelEnum.DEBUG: return 'debug';
    case LogLevelEnum.INFO: return 'info';
    case LogLevelEnum.WARN: return 'warn';
    case LogLevelEnum.ERROR: return 'error';
    case LogLevelEnum.FATAL: return 'fatal';
    default: return 'info';
  }
}

/**
 * Log entry interface
 */
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevelEnum; // Changed from LogLevelString to LogLevelEnum
  message: string;
  service?: string;
  source?: string;
  data?: Record<string, unknown>;
  // Extended display properties
  displayMessage?: string;         // Human-readable formatted message
  rawData?: string;                // JSON stringified data for expanded view
  expanded?: boolean;              // Whether this log is expanded in the UI
  categories?: string[];           // Categories for grouping logs
  eventId?: string;                // Extracted event ID for correlation
  
  // Duplicate tracking
  duplicateCount?: number;         // Number of duplicate logs
  duplicates?: LogEntry[];         // Collection of duplicate logs
  
  // Category grouping
  isCategory?: boolean;            // Whether this is a category group
  categoryName?: string;           // Name of the category
  categoryLogs?: LogEntry[];       // Logs in this category
  categoryCount?: number;          // Number of logs in this category
  
  // Additional metadata for display
  details?: Record<string, unknown>; // Additional details (backward compatibility)
}

/**
 * Log filter options
 */
export interface LogFilter {
  level?: LogLevelEnum | LogLevelEnum[];
  service?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  skip?: number;
}

/**
 * Response format for log queries
 */
export interface LogQueryResponse {
  status: boolean;
  logs: LogEntry[];
  totalCount: number;
  filtered?: boolean;
  timestamp?: string;
}

/**
 * Response format for log requests
 */
export interface LogResponse {
  logs: LogEntry[];
  totalCount: number;
  filtered: boolean;
  status: boolean;
  total: number;
  timestamp: string;
}

/**
 * Response for batch log operations
 */
export interface LogBatchResponse {
  success: boolean;
  count?: number;
  timestamp?: string;
}

/**
 * Update format for log streaming
 */
export interface LogStreamUpdate {
  log?: LogEntry;
  logs?: LogEntry[];
  totalCount: number;
  append?: boolean;
  stats?: Record<string, number>;
}

// Mark this module for export
export const __logTypes = true;
