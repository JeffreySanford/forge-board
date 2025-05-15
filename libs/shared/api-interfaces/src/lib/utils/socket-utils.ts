import { SocketResponse } from '../socket-types';

/**
 * Create a standardized socket response
 */
export function createSocketResponse<T>(event: string, data: T): SocketResponse<T>;
export function createSocketResponse<T>(data: T): SocketResponse<T>;
export function createSocketResponse<T>(eventOrData: string | T, data?: T): SocketResponse<T> {
  if (typeof eventOrData === 'string' && data !== undefined) {
    // Called with event name and data
    return {
      event: eventOrData,
      status: 'success',
      data,
      timestamp: new Date().toISOString(),
    };
  } else {
    // Called with just data
    return {
      event: 'data', // Default event name when none provided
      status: 'success',
      data: eventOrData as T,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Create a socket error response
 */
export function createSocketErrorResponse<T>(message: string, data?: T): SocketResponse<T> {
  return {
    event: 'error',
    status: 'error',
    message,
    data: data as T,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a log-specific socket response
 * @param event The event name
 * @param data The log data
 * @returns A properly typed SocketResponse
 */
export function createLogSocketResponse<T>(event: string, data: T): SocketResponse<T> {
  return {
    event,
    status: 'success',
    data,
    timestamp: new Date().toISOString()
  };
}
