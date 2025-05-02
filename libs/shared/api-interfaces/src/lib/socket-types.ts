/**
 * Types related to socket communication
 */

/**
 * Socket status enum
 */
export enum SocketStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

/**
 * Socket event types
 */
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  ERROR: 'error'
};

/**
 * Socket event
 */
export interface SocketEvent {
  type: string;
  timestamp: Date | string;
  data?: unknown;
}

/**
 * Standard response wrapper for socket communication
 */
export interface SocketResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
  timestamp: string;
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
export function createErrorResponse<T>(message: string, data: T): SocketResponse<T> {
  return {
    status: 'error',
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

// Socket event log entry
export interface SocketLogEvent {
  socketId: string;
  namespace: string;
  eventType: string; // Changed from enum to string to allow for dynamic event types
  timestamp: string | Date;
  message: string;
  data?: Record<string, unknown>;
}

// Tracked socket information
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

// Socket metrics
export interface SocketMetrics {
  totalConnections: number;
  activeConnections: number;
  disconnections: number;
  errors: number;
  messagesSent: number;
  messagesReceived: number;
  lastError?: unknown;
}

// Socket status update
export interface SocketStatusUpdate<TData = unknown> {
  activeSockets: SocketInfo<TData>[];
  metrics: SocketMetrics;
}

// Socket connection error
export interface SocketConnectionError {
  message: string;
  type: string;
  code?: string;
  details?: unknown;
}

// Export everything from this module to ensure they're available
export const socketTypes = {
  SocketStatus,
  SOCKET_EVENTS,
  createSocketResponse,
  createErrorResponse
};

// The interfaces are already exported where they are defined
// No need for re-export here
