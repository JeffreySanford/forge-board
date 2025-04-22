/**
 * Standard socket response type for all socket operations
 */
export interface SocketResponse<T> {
  status: 'success' | 'error';
  data: T;
  timestamp: string;
}

/**
 * Create a standardized response object
 */
export function createSocketResponse<T>(data: T): SocketResponse<T> {
  return {
    status: 'success',
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an error response object
 */
export function createSocketErrorResponse<T>(error: string, data?: T): SocketResponse<T | null> {
  return {
    status: 'error',
    data: data || null as unknown as T,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Socket event names enum to ensure consistency
 */
export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  METRICS_UPDATE = 'metrics-update',
  DIAGNOSTICS_EVENT = 'diagnostics-event',
  SYSTEM_METRICS = 'system-metrics',
  SUBSCRIBE_METRICS = 'subscribe-metrics',
  CONNECTION_STATUS = 'connection-status',
  LOG_ENTRY = 'log-entry'
}

/**
 * Metrics data interface
 */
export interface MetricData {
  cpu: number;
  memory: number;
  time: string;
  [key: string]: number | string; // Allow for extension
}

/**
 * HTTP API response for metrics operations
 */
export interface MetricResponse {
  success: boolean;
  message?: string;
}
