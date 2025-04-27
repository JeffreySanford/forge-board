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
