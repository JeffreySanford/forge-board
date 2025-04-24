/**
 * Log level enum
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  WARN = 'warn', // Add WARN as an alias for WARNING
  ERROR = 'error',
  FATAL = 'fatal' // Add FATAL level
}

/**
 * Log level as a string literal type for easier use in interfaces
 */
export type LogLevelType = 'debug' | 'info' | 'warning' | 'warn' | 'error' | 'fatal';

/**
 * Log entry interface
 */
export interface LogEntry {
  id: string;
  level: LogLevelType;
  message: string;
  source: string;
  timestamp: string;
  data?: Record<string, unknown>;
  // Add missing properties that are being used in the code
  context?: string;
  tags?: string[];
  stackTrace?: string;
  details?: Record<string, unknown>; // Add details property
}

/**
 * Log filter options
 */
export interface LogFilter {
  level?: LogLevelType | LogLevelType[];
  source?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  skip?: number;
  // Add missing properties that are being used in the code
  levels?: LogLevelType[];
  sources?: string[];
  contexts?: string[];
  tags?: string[];
  offset?: number;
  startTime?: string; // Add startTime property
  endTime?: string; // Add endTime property
}

/**
 * Log response from API
 */
export interface LogResponse {
  logs: LogEntry[];
  totalCount: number;
  filtered: boolean;
  success?: boolean; // Add success property
}

/**
 * Log stream update for real-time log streaming
 */
export interface LogStreamUpdate {
  log: LogEntry;
  logs?: LogEntry[]; // Add logs property for batched updates
  totalCount: number;
  append?: boolean; // Add append property
  stats?: Record<LogLevel, number>; // Add stats property
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  maxLogs?: number;
  autoFlush?: boolean;
  flushInterval?: number;
  persistToDisk?: boolean;
  logPath?: string;
}
