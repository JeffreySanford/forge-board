/**
 * Socket communication interfaces
 */

/**
 * Standard socket response format
 * NOTE: This interface is just for reference. The canonical definition is
 * in api-response.ts as both an interface (SocketResponseData) and a class (SocketResponse).
 */
export interface SocketResponse<T> {
  status: 'success' | 'error';
  data: T;
  timestamp: string;
  message?: string;
  event: string;
}

/**
 * Socket connection information
 */
export interface SocketConnectionInfo {
  id: string;
  namespace: string;
  clientIp: string;
  userAgent: string;
  connectTime: string;
  lastActivity: string;
  disconnectTime?: string;
}

/**
 * Socket event
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
 * Tracked socket information with detailed metadata
 */
export interface SocketInfo<TData = unknown> {
  id: string;
  namespace: string;
  clientIp: string;
  userAgent: string;
  query?: Record<string, unknown>;
  connectTime: string | Date;
  disconnectTime?: string | Date;
  lastActivity: string | Date;
  events: Array<{
    type: string;
    timestamp: string | Date;
    data?: Record<string, unknown> | TData;
  }>;
}

/**
 * Socket metrics for monitoring
 */
export interface SocketMetrics {
  totalConnections: number;
  activeConnections: number;
  disconnections: number;
  errors: number;
  messagesSent: number;
  messagesReceived: number;
  lastError?: unknown;
}

/**
 * Socket status update for diagnostics
 */
export interface SocketStatusUpdate<TData = unknown> {
  activeSockets: SocketInfo<TData>[];
  metrics: SocketMetrics;
}

/**
 * Socket connection error
 */
export interface SocketConnectionError {
  message: string;
  type: string;
  code?: string;
  details?: unknown;
}

/**
 * Diagnostic socket event
 */
export interface DiagnosticSocketEvent<TData = unknown> {
  type: string;
  timestamp: string | Date;
  data?: TData;
}

// Socket response functions are now centralized in api-response.ts
// and exported from the main index.ts file

// Mark this file as a Socket module
export const __socketInterfaces = true;
