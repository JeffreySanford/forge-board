import { SocketResponse } from '@forge-board/shared/api-interfaces';
export { SocketResponse };

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
 * Log socket response type
 */
export type LogSocketResponse<T> = SocketResponse<T>;