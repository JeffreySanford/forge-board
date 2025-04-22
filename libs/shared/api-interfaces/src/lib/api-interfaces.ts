/**
 * Base API response interface
 */
export interface ApiResponse<T> {
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
