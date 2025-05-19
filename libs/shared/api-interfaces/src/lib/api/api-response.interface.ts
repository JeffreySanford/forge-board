/**
 * API response wrapper interfaces
 */

/**
 * General API response format
 */
export interface ApiResponse<T = unknown> {
    status: boolean;
    data?: T;
    message?: string;
    timestamp?: string;
    errors?: string[];
}
