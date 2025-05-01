/**
 * Types related to logging
 */

/**
 * Log level type
 */
export type LogLevelType = 'debug' | 'info' | 'warn' | 'warning' | 'error' | 'fatal';

/**
 * Log entry structure
 */
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevelType;
  message: string;
  source: string;
  context?: string;
  details?: Record<string, unknown>;
  data?: Record<string, unknown>;
  tags?: string[];
  stackTrace?: string;
}

/**
 * Log filter options
 */
export interface LogFilter {
  level?: LogLevelType;
  levels?: LogLevelType[];
  context?: string;
  contexts?: string[];
  source?: string;
  sources?: string[];
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
  skip?: number;
  tags?: string[];
}

/**
 * Log response from the server
 */
export interface LogResponse {
  logs: LogEntry[];
  total: number;
  totalCount?: number;
  timestamp: string;
  filtered?: boolean;
  status?: boolean;
  success?: boolean; // Adding success field to match what's being used
}

/**
 * Log stream update
 */
export interface LogStreamUpdate {
  logs?: LogEntry[];
  log?: LogEntry;
  timestamp?: string;
  totalCount?: number;
  append?: boolean;
}
