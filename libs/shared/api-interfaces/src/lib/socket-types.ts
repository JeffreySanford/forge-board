/**
 * Types related to socket communication
 */

/**
 * Socket status enum
 */
export enum SocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Socket event types
 */
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  ERROR: 'error',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_SUCCESS: 'reconnect_success',
  RECONNECT_FAILED: 'reconnect_failed',
};

/**
 * Standard response wrapper for socket communication
 */
export interface SocketResponse<T> {
  event: string; // The event name this response corresponds to
  status: 'success' | 'error';
  data: T;
  message?: string; // Optional message, especially for errors
  timestamp: string;
}

/**
 * Create a successful socket response
 */
export function createSocketResponse<T>(
  event: string,
  data: T,
  status: 'success' | 'error' = 'success',
  message?: string
): SocketResponse<T> {
  return {
    event,
    status,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an error socket response
 */
export function createErrorResponse<T>(
  event: string,
  message: string,
  data: T | null = null // Data can be null for errors
): SocketResponse<T | null> {
  return {
    event,
    status: 'error',
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

// Export everything from this module to ensure they're available
export const socketTypes = {
  SocketStatus,
  SOCKET_EVENTS,
  createSocketResponse,
  createErrorResponse,
};
