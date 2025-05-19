/**
 * Shared socket response interfaces for both frontend and backend
 * 
 * These are extracted from patterns observed throughout the codebase
 * to provide a consistent interface for socket communications.
 */

/**
 * Standard socket response format
 */
export interface SocketResponse<T = unknown> {
  status: 'success' | 'error';
  data: T | null;
  timestamp: string;
  message?: string;
  event?: string;
}

/**
 * Specialized socket response for log-related operations
 */
export interface LogSocketResponse<T> extends SocketResponse<T> {
  source: 'logger' | 'system';
  requestId?: string;
}

/**
 * Updates sent over socket connections for real-time log streaming
 */
export interface LogStreamUpdate {
  log?: any;
  logs?: any[];
  totalCount: number;
  append?: boolean;
  stats?: Record<string, number>;
}

/**
 * Socket event for diagnostics information
 */
export interface DiagnosticSocketEvent<T = unknown> {
  type: string;
  timestamp: string | Date;
  data?: T;
}

/**
 * Socket error response format
 */
export interface SocketErrorResponse {
  status: 'error';
  message: string;
  timestamp: string;
  code?: string | number;
  details?: Record<string, unknown>;
}

/**
 * Creates a standard socket response
 */
export function createSocketResponse<T>(event: string, data: T): SocketResponse<T> {
  return {
    status: 'success',
    data,
    timestamp: new Date().toISOString(),
    event
  };
}

/**
 * Creates a socket error response
 */
export function createSocketErrorResponse(event: string, message: string): SocketResponse<null> {
  return {
    status: 'error',
    data: null,
    timestamp: new Date().toISOString(),
    message,
    event
  };
}
