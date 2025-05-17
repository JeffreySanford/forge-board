/**
 * API response utilities for standardizing API responses
 */

/**
 * Status codes for API responses
 */
export enum StatusCode {
  SUCCESS = '10000',
  FAILURE = '10001',
  RETRY = '10002',
  INVALID_ACCESS_TOKEN = '10003'
}

/**
 * Interface for API response data structure
 */
export interface ApiResponseData<T> {
  status: StatusCode;
  message: string;
  data: T | null;
  timestamp: string;
}

/**
 * Base class for API response
 */
export class ApiResponse<T> {
  status: StatusCode;
  message: string;
  data: T | null;
  timestamp: string;

  constructor(status: StatusCode, message: string, data: T | null) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
  
  /**
   * Create a success response
   * @param data - Data payload
   * @param message - Success message
   * @returns ApiResponse instance with success status
   */
  static success<T>(data: T, message = 'Success'): ApiResponse<T> {
    return new ApiResponse<T>(StatusCode.SUCCESS, message, data);
  }
  
  /**
   * Create a failure response
   * @param message - Error message
   * @returns ApiResponse instance with failure status
   */
  static failure<T>(message = 'Failure'): ApiResponse<T> {
    return new ApiResponse<T>(StatusCode.FAILURE, message, null);
  }
  
  /**
   * Create a retry response
   * @param message - Retry message
   * @returns ApiResponse instance with retry status
   */
  static retry<T>(message = 'Retry'): ApiResponse<T> {
    return new ApiResponse<T>(StatusCode.RETRY, message, null);
  }
  
  /**
   * Create an invalid token response
   * @param message - Invalid token message
   * @returns ApiResponse instance with invalid token status
   */
  static invalidToken<T>(message = 'Invalid access token'): ApiResponse<T> {
    return new ApiResponse<T>(StatusCode.INVALID_ACCESS_TOKEN, message, null);
  }
}

/**
 * Interface for socket response data structure
 */
export interface SocketResponseData<T> {
  event: string;
  success: boolean;
  message?: string;
  data: T | null;
  timestamp: string;
}

/**
 * Class for socket response
 */
export class SocketResponse<T> implements SocketResponseData<T> {
  event: string;
  success: boolean;
  message?: string;
  data: T | null;
  timestamp: string;

  constructor(event: string, success: boolean, data: T | null, message?: string) {
    this.event = event;
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
  
  /**
   * Create a success socket response
   * @param event - Event name
   * @param data - Response data
   * @param message - Optional success message
   * @returns SocketResponse instance with success flag
   */
  static success<T>(event: string, data: T, message?: string): SocketResponse<T> {
    return new SocketResponse<T>(event, true, data, message);
  }
  
  /**
   * Create a failure socket response
   * @param event - Event name
   * @param message - Error message
   * @returns SocketResponse instance with failure flag
   */
  static failure<T>(event: string, message = 'Error'): SocketResponse<T> {
    return new SocketResponse<T>(event, false, null, message);
  }
}

// Define separate type for the createSocketResponse function
export type SocketResponseType<T> = {
  event: string;
  success: boolean;
  message?: string;
  data: T | null;
  timestamp: string;
};

/**
 * Factory function for creating socket responses
 */
export function createSocketResponse<T>(event: string, data: T | null, success = true, message?: string): SocketResponseType<T> {
  return {
    event,
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Factory function for creating socket error responses
 */
export function createSocketErrorResponse<T>(event: string, message: string, data: T | null = null): SocketResponseType<T> {
  return createSocketResponse(event, data, false, message);
}

/**
 * Options for creating an API response
 */
export interface ApiResponseOptions {
  status?: StatusCode;
  message?: string;
  timestamp?: string;
}

/**
 * Success response type
 */
export type SuccessResponse<T> = ApiResponseData<T> & {
  status: StatusCode.SUCCESS;
};

// Mark this module for export
export const __apiResponse = true;
