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
export type LogLevelString = 'trace' | 'debug' | 'info' | 'warning' | 'warn' | 'error' | 'fatal';

/**
 * Convert string log level to enum
 */
export function stringToLogLevelEnum(level: LogLevelString): LogLevelEnum {
  switch (level) {
    case 'trace': return LogLevelEnum.TRACE;
    case 'debug': return LogLevelEnum.DEBUG;
    case 'info': return LogLevelEnum.INFO;
    case 'warning':
    case 'warn': return LogLevelEnum.WARN;
    case 'error': return LogLevelEnum.ERROR;
    case 'fatal': return LogLevelEnum.FATAL;
    default: return LogLevelEnum.INFO;
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
    default: return 'info';
  }
}

/**
 * Filter for fetching logs
 */
export interface LogFilter {
  level?: LogLevelEnum | LogLevelEnum[];
  service?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  skip?: number; // Added skip property
  afterTimestamp?: string; // Added afterTimestamp property
}

/**
 * Response structure for log requests
 */
export interface LogResponse {
  logs: LogEntry[];
  totalCount: number;
  filtered: boolean;
  status: boolean;
  total?: number;
  timestamp: string;
}

/**
 * Update structure for log streams
 */
export interface LogStreamUpdate {
  log?: LogEntry;
  logs?: LogEntry[];
  totalCount: number;
  append?: boolean;
  stats?: Record<string, number>;
}

/**
 * Result structure for log statistics
 */
export interface LogStatsResult {
  totalCount: number;
  byLevel: Record<string, number>;
  bySource: Record<string, number>;
}

/**
 * Response structure for log query requests
 */
export interface LogQueryResponse {
  status: boolean;
  logs: LogEntry[];
  totalCount: number;
  filtered: boolean;
  timestamp: string;
  stats?: {
    byLevel: Record<string, number>;
    bySource: Record<string, number>;
  };
}

/**
 * Log entry interface
 */
export interface LogEntry {
  id: string;
  level: LogLevelEnum;
  message: string;
  source?: string; // Made optional
  timestamp: string;
  data?: Record<string, unknown>;
  context?: string;
  details?: Record<string, unknown>;
  // Additional properties
  isLoggingLoop?: boolean;
  displayMessage?: string;
  rawData?: string;
  categories?: string[];
  expanded?: boolean;
  duplicates?: LogEntry[];
  duplicateCount?: number;
  isCategory?: boolean;
  categoryName?: string;
  categoryLogs?: LogEntry[];
  categoryCount?: number;
}

/**
 * Data Transfer Object for creating logs
 */
export interface LogDto {
  level: LogLevelEnum;
  message: string;
  source?: string;
  timestamp?: string;
  data?: Record<string, unknown>;
  context?: string;
}
