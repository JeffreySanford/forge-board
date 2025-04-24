/**
 * Create a standardized socket response
 */
export function createSocketResponse<T>(event: string, data: T): { status: string; data: T; timestamp: string };
export function createSocketResponse<T>(data: T): { status: string; data: T; timestamp: string };
export function createSocketResponse<T>(eventOrData: string | T, data?: T): { status: string; data: T; timestamp: string } {
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
export function createSocketErrorResponse<T>(message: string, data?: T): { status: string; message: string; data?: T; timestamp: string } {
  return {
    status: 'error',
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}
