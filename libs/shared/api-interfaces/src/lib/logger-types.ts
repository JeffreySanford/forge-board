/**
 * Logger types for the application
 */

/**
 * Log level types
 */
export type LogLevelType = 'debug' | 'info' | 'warning' | 'error';

/**
 * Log entry structure
 */
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevelType;
  message: string;
  source: string;
  data?: Record<string, unknown>;
}

/**
 * Log filter options
 */
export interface LogFilter {
  level?: LogLevelType;
  source?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  limit?: number;
  skip?: number;
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
