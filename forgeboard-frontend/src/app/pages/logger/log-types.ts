/**
 * Log level enum (internal representation)
 */
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * Socket response for log operations
 */
export interface SocketResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
  timestamp?: string;
}

/**
 * Log socket response type
 */
export type LogSocketResponse<T> = SocketResponse<T>;