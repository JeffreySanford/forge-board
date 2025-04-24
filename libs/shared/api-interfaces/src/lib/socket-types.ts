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
export function createSocketResponse<T>(event: string, data: T): SocketResponse<T>;
export function createSocketResponse<T>(data: T): SocketResponse<T>;
export function createSocketResponse<T>(eventOrData: string | T, data?: T): SocketResponse<T> {
  if (typeof eventOrData === 'string' && data !== undefined) {
    // Called with event name and data
    return {
      status: 'success',
      data,
      timestamp: new Date().toISOString(),
    };
  } else {
    // Called with just data
    return {
      status: 'success',
      data: eventOrData as T,
      timestamp: new Date().toISOString(),
    };
  }
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
 * Socket connection information
 */
export interface SocketInfo {
  id: string;
  namespace: string;
  clientIp: string;
  userAgent: string;
  connectTime: string | Date;
  disconnectTime?: string | Date;
  lastActivity: string | Date;
  events: {
    type: string;
    timestamp: string | Date;
    data?: Record<string, unknown>;
  }[];
}

/**
 * Socket metrics data
 */
export interface SocketMetrics {
  totalConnections: number;
  activeConnections: number;
  disconnections: number;
  errors: number;
  messagesSent: number;
  messagesReceived: number;
}

/**
 * Socket log event interface
 */
export interface SocketLogEvent {
  socketId: string;
  namespace: string;
  eventType: string;
  timestamp: string | Date;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Socket filter for log events
 */
export interface SocketLogFilter {
  socketId?: string;
  eventType?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
}
