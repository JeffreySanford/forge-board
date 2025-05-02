/**
 * Standard API response interfaces for REST endpoints
 */

// Import the basic ApiResponse from api-interfaces to extend it
import { ApiResponse } from './api-interfaces';

/**
 * Success response
 */
export interface SuccessResponse<T> extends ApiResponse<T> {
  success: true;
}

/**
 * Extended error response
 * Note: We're not exporting ErrorResponse to avoid conflict with api-interfaces.ts
 */
interface ExtendedErrorResponse extends ApiResponse<null> {
  success: false;
  error: string;
  statusCode?: number;
}

// Mark this file as an API module
export const __apiResponse = true;
