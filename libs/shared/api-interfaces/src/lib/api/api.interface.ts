/**
 * Consolidated API interfaces for HTTP and Socket responses
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

// =========== HTTP API Response Types ===========

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

/**
 * Legacy API response interface (for backward compatibility)
 */
export interface LegacyApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp?: string;
  statusCode?: number;
}

/**
 * User data interface for authentication and user info
 */
export interface UserData {
  id: string;
  name: string;
  username: string;
  title?: string;
  email?: string;
  created: string;
  modified: string;
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
}

/**
 * Environment configuration interface
 */
export interface Environment {
  production: boolean;
  apiUrl: string;
  apiKey?: string;
  jwtGuestToken?: string;
  encryptedJwtToken?: string;
  jwt: JwtClaims;
}

// Import needed interfaces
import { JwtClaims } from '../jwt/jwt.interface';

// Re-export socket response interface for easier imports
export { SocketResponse } from '../socket/socket.interface';
