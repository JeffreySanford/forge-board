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
  // Add these missing properties that are used in the code
  context?: string;
  tags?: string[];
  stackTrace?: string;
}

/**
 * Log filter options
 */
export interface LogFilter {
  // Change from singular to plural forms to match actual usage in code
  levels?: LogLevelType[];
  sources?: string[];
  // Add additional properties used in code
  contexts?: string[];
  tags?: string[];
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  // Keep these for backward compatibility
  level?: LogLevelType;
  source?: string;
  fromDate?: string;
  toDate?: string;
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

/**
 * Update format for log streaming
 */
export interface LogStreamUpdate {
  log: LogEntry;
  totalCount: number;
  append?: boolean;
}
