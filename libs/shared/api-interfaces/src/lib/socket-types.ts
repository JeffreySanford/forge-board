/**
 * Socket communication types and utilities
 */

/**
 * Socket events constant
 */
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  MESSAGE: 'message',
  // Add any other standard events here
};

/**
 * Socket communication types
 */
export interface SocketCommunication {
  id: string;
  event: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Socket message
 */
export interface SocketMessage<T = unknown> {
  event: string;
  data: T;
  id?: string;
  timestamp?: string;
}
