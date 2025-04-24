/**
 * Log level enum for categorizing log messages
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
  FATAL = 'fatal'  // Add FATAL level
}

/** Log level type (string literal union type) */
export type LogLevelType = 'debug' | 'info' | 'warning' | 'error' | 'critical' | 'fatal';

/** Log entry interface */
export interface LogEntry {
  id: string;
  level: LogLevelType;
  message: string;
  source: string;
  timestamp: string;
  // Optional fields
  data?: Record<string, unknown>;
  context?: string;
  tags?: string[];
  stackTrace?: string;
  details?: Record<string, unknown>;
  totalCount?: number; // Added missing property
}

/** Log filter options */
export interface LogFilter {
  /** Filter by log levels */
  levels?: LogLevelType[];
  /** Filter by source */
  sources?: string[];
  /** Filter by context */
  contexts?: string[];
  /** Filter by tags */
  tags?: string[];
  /** Filter by start date (ISO string) */
  startDate?: string;
  /** Filter by start time (alias for startDate) */
  startTime?: string; 
  /** Filter by end date (ISO string) */
  endDate?: string;
  /** Filter by end time (alias for endDate) */
  endTime?: string;
  /** Text search term */
  search?: string;
  /** Pagination offset */
  offset?: number;
  /** Pagination limit */
  limit?: number;
}

/** Log response interface */
export interface LogResponse {
  /** Success status */
  status: boolean;
  /** Log entries */
  logs: LogEntry[];
  /** Total log count (for pagination) */
  total: number;
  /** Response timestamp */
  timestamp: string;
  /** Optional filtered status */
  filtered?: boolean; // Added missing property
}

/** Log stream update interface */
export interface LogStreamUpdate {
  /** Whether to append or replace logs */
  append: boolean; // Ensure this property is required
  /** Log entries (multiple) */
  logs?: LogEntry[];
  /** Single log entry */
  log?: LogEntry;
  /** Log statistics */
  stats?: Record<LogLevel, number>;
  /** Total count of logs */
  totalCount?: number;
}

/** Logger configuration */
export interface LoggerConfig {
  /** Maximum logs to keep in memory */
  maxLogs?: number;
  /** Default log level */
  defaultLevel?: LogLevelType;
  /** Default log source */
  defaultSource?: string;
}
