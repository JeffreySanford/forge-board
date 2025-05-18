import { SocketResponse } from '@forge-board/shared/api-interfaces';

/**
 * Create a standardized socket response
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
 * Create a socket error response
 */
export function createSocketErrorResponse<T>(message: string, data?: T): SocketResponse<T> {
  return {
    status: 'error',
    data: data as T,
    message,
    timestamp: new Date().toISOString(),
  };
}
