/**
 * Socket response adapter utility
 * 
 * This file serves as an adapter between the different versions of the SocketResponse interface
 * used across the application:
 * - The shared interface in api-response.ts uses 'success' property
 * - Frontend components often expect a 'status' property
 */

import { SocketResponse as SharedSocketResponse } from '@forge-board/shared/api-interfaces';

/**
 * Type guard to check if response has status property (frontend format)
 */
export function hasStatusProperty(response: any): response is { status: 'success' | 'error' } {
  return response && typeof response.status === 'string';
}

/**
 * Type guard to check if response has success property (shared format)
 */
export function hasSuccessProperty(response: any): response is { success: boolean } {
  return response && typeof response.success === 'boolean';
}

/**
 * Extended socket response interface that can handle both versions
 */
export interface AdaptedSocketResponse<T> extends Partial<SharedSocketResponse<T>> {
  status?: 'success' | 'error';
  success?: boolean;
  data: T | null;
}

/**
 * Adapts a socket response to ensure it has both status and success properties
 */
export function adaptSocketResponse<T>(response: any): AdaptedSocketResponse<T> {
  const adapted: AdaptedSocketResponse<T> = {
    ...response,
    data: response.data ?? null
  };

  // Ensure both properties exist for compatibility
  if (hasStatusProperty(response) && !hasSuccessProperty(response)) {
    adapted.success = response.status === 'success';
  }
  
  if (hasSuccessProperty(response) && !hasStatusProperty(response)) {
    adapted.status = response.success ? 'success' : 'error';
  }

  return adapted;
}

/**
 * Check if a socket response indicates success
 */
export function isSuccessResponse<T>(response: any): boolean {
  const adapted = adaptSocketResponse<T>(response);
  return (adapted.status === 'success' || adapted.success === true);
}

/**
 * Get data safely from a socket response
 */
export function getResponseData<T>(response: any): T | null {
  const adapted = adaptSocketResponse<T>(response);
  return isSuccessResponse<T>(response) ? adapted.data : null;
}
