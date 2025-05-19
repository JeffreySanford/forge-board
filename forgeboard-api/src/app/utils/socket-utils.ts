import { SocketResponse } from '@forge-board/shared/api-interfaces';

/**
 * Creates a socket response with standardized format
 * @param event The event type/name
 * @param data The payload data 
 * @returns A standardized socket response
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
 * @param event The event type/name
 * @param message Error message
 * @returns A standardized socket error response
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
