/**
 * Socket communication interfaces
 */

/**
 * Standard socket response format
 */
export interface SocketResponse<T> {
  status: 'success' | 'error';
  data: T;
  timestamp: string;
  message?: string;
}

/**
 * Socket connection information
 */
export interface SocketConnectionInfo {
  id: string;
  namespace: string;
  clientIp: string;
  userAgent: string;
  connectTime: string;
  lastActivity: string;
  disconnectTime?: string;
}

/**
 * Socket event
 */
export interface SocketEvent {
  type: string;
  timestamp: string | Date;
  data?: unknown;
}

/**
 * Socket event log entry - used for tracking socket communication history
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
 * Tracked socket information with detailed metadata
 */
export interface SocketInfo<TData = unknown> {
  id: string;
  namespace: string;
  clientIp: string;
  userAgent: string;
  query?: Record<string, unknown>;
  connectTime: string | Date;
  disconnectTime?: string | Date;
  lastActivity: string | Date;
  events: Array<{
    type: string;
    timestamp: string | Date;
    data?: Record<string, unknown> | TData;
  }>;
}

/**
 * Socket metrics for monitoring
 */
export interface SocketMetrics {
  totalConnections: number;
  activeConnections: number;
  disconnections: number;
  errors: number;
  messagesSent: number;
  messagesReceived: number;
  lastError?: unknown;
}

/**
 * Socket status update for diagnostics
 */
export interface SocketStatusUpdate<TData = unknown> {
  activeSockets: SocketInfo<TData>[];
  metrics: SocketMetrics;
}

/**
 * Socket connection error
 */
export interface SocketConnectionError {
  message: string;
  type: string;
  code?: string;
  details?: unknown;
}

/**
 * Diagnostic socket event
 */
export interface DiagnosticSocketEvent<TData = unknown> {
  type: string;
  timestamp: string | Date;
  data?: TData;
}

/**
 * Create a successful socket response
 */
export function createSocketResponse<T>(event: string, data: T): SocketResponse<T> {
  return {
    status: 'success',
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create an error socket response
 */
export function createSocketErrorResponse<T>(message: string, data: T): SocketResponse<T> {
  return {
    status: 'error',
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

// Mark this file as a Socket module
export const __socketInterfaces = true;
