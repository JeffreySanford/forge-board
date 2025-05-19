// filepath: c:\repos\forge-board\libs\shared\api-interfaces\src\lib\socket\socket.interface.ts
/**
 * Socket response interfaces and utilities
 * 
 * This is the main interface file for socket-related types and utilities.
 * It consolidates functionality from previously separate files.
 */

/**
 * Standard socket response format for type safety
 */
export interface SocketResponse<T = unknown> {
  status: 'success' | 'error';
  data: T | null;
  timestamp: string;
  message?: string;
  event?: string;
}

/**
 * Legacy interface for backward compatibility
 */
export interface SocketResponseData<T> {
  status: 'success' | 'error';
  data: T;
  timestamp: string;
  message?: string;
}

/**
 * Base socket event interface
 */
export interface SocketEvent {
  type: string;
  timestamp: string | Date;
  data?: unknown;
}

/**
 * Socket event log entry - used for tracking socket communication history
 */
export interface SocketLogEvent {
  socketId: string;
  namespace: string;
  eventType: string;
  timestamp: string | Date;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Specialized socket response for log-related operations
 */
export interface LogSocketResponse<T> extends SocketResponse<T> {
  source: 'logger' | 'system';
  requestId?: string;
}

/**
 * Updates sent over socket connections for real-time log streaming
 */
export interface LogStreamUpdate {
  log?: Record<string, unknown>;
  logs?: Record<string, unknown>[];
  totalCount: number;
  append?: boolean;
  stats?: Record<string, number>;
}

/**
 * Socket metrics interface for tracking socket service performance
 */
export interface SocketMetrics {
  totalConnections: number;
  activeConnections: number;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  averageLatency: number;
  disconnections: number;
}

/**
 * Socket status update interface
 */
export interface SocketStatusUpdate<TData = unknown> {
  activeSockets: SocketInfo<TData>[];
  metrics: SocketMetrics;
}

/**
 * Socket information interface for tracking socket instances
 */
export interface SocketInfo<TMetadata = unknown> {
  id: string;
  namespace: string;
  connected: boolean;
  connectionTime: Date;
  lastActivity: Date;
  disconnectTime?: Date;
  clientIp?: string;
  userAgent?: string;
  events?: SocketEvent[];
  metadata?: TMetadata;
}

/**
 * Data transfer object for socket info
 */
export interface SocketInfoDto {
  id: string;
  namespace: string;
  connected: boolean;
  connectionTime: string;
  lastActivity?: string;
  disconnectTime?: string;
  clientIp?: string;
  userAgent?: string;
  eventCount?: number;
}

/**
 * Diagnostic socket event interface
 */
export interface DiagnosticSocketEvent<TData = unknown> {
  type: string;
  timestamp: Date;
  data?: TData;
}

/**
 * Create a standardized socket response object
 * 
 * @param event The event name
 * @param data The response data
 * @param status The response status, defaults to 'success'
 * @param message Optional message to include
 * @returns A complete socket response object
 */
export function createSocketResponse<T>(
  event: string,
  data: T,
  status: 'success' | 'error' = 'success',
  message?: string
): SocketResponse<T> {
  return {
    status,
    data,
    timestamp: new Date().toISOString(),
    event,
    message
  };
}

/**
 * Factory function for creating socket responses with event parameter
 * 
 * @param event The event name
 * @param data The response data
 * @param success Whether the response is successful
 * @param message Optional message to include
 * @returns A complete socket response object
 */
export function createSocketEventResponse<T>(
  event: string, 
  data: T | null, 
  success = true, 
  message?: string
): SocketResponse<T> {
  return {
    event,
    status: success ? 'success' : 'error',
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create an error socket response
 * 
 * @param message The error message
 * @param event The event name
 * @param data Optional data to include
 * @returns A socket response with error status
 */
export function createSocketErrorResponse<T>(
  message: string, 
  event: string, 
  data: T | null = null
): SocketResponse<T> {
  return {
    status: 'error',
    data: data,
    timestamp: new Date().toISOString(),
    message,
    event
  };
}

/**
 * Helper to check if a response is a success response
 * 
 * @param response The socket response to check
 * @returns Type guard ensuring data is non-null
 */
export function isSuccessResponse<T>(response: { status: 'success' | 'error', data: T | null }): response is { status: 'success', data: T } {
  return response.status === 'success' && response.data !== null;
}

/**
 * Helper to check if a response is an error response
 * 
 * @param response The socket response to check
 * @returns Type guard ensuring data is null
 */
export function isErrorResponse<T>(response: { status: 'success' | 'error', data: T | null }): response is { status: 'error', data: T | null } {
  return response.status === 'error';
}

/**
 * Adapts various socket response formats to a standard format
 * 
 * @param response The response to adapt
 * @returns A standardized socket response object
 */
export function adaptSocketResponse<T>(response: unknown): { status: 'success' | 'error', data: T | null, message?: string } {
  if (!response) {
    return { status: 'error', data: null, message: 'No response received' };
  }
  
  try {
    // Handle SocketResponse format (from shared interface)
    if (typeof response === 'object' && response !== null && 'status' in response) {
      const typedResponse = response as { status: unknown, data: unknown, message?: string };
      if (typedResponse.status === 'success' || typedResponse.status === 'error') {
        return {
          status: typedResponse.status as 'success' | 'error',
          data: typedResponse.data as T,
          message: typedResponse.message
        };
      }
    }
    
    // Handle { success, data, message } format
    if (typeof response === 'object' && response !== null && 'success' in response) {
      const typedResponse = response as { success: boolean, data: unknown, message?: string };
      return {
        status: typedResponse.success ? 'success' : 'error',
        data: typedResponse.data as T,
        message: typedResponse.message
      };
    }
    
    // Handle direct data objects (assume success)
    return {
      status: 'success',
      data: response as T
    };
  } catch (error) {
    console.error('Error adapting socket response', error);
    return { 
      status: 'error', 
      data: null, 
      message: error instanceof Error ? error.message : String(error) 
    };
  }
}
