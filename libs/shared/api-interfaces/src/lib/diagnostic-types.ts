/**
 * Types for system diagnostics and health monitoring
 */

/**
 * Represents a diagnostic event in the system
 */
export interface DiagnosticEvent {
  id: string;
  timestamp: string;
  type: string;
  eventType: string;
  message: string;
  source: string;
  details?: Record<string, unknown>;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * System health data structure
 */
export interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' | 'simulated';
  uptime: number;
  timestamp: string;
  details: Record<string, string>;
}

/**
 * Socket information types
 */
// Generic event entry for socket events
export interface DiagnosticSocketEvent<TData = unknown> {
  type: string;
  timestamp: string | Date;
  data?: TData;
}

// Generic log event for socket logs
export interface SocketLogEvent<TData = unknown> {
  socketId: string;
  namespace: string;
  eventType: string;
  timestamp: string | Date;
  message: string;
  data?: TData;
  // Add type property for backward compatibility
  type?: string;
}

export interface SocketInfo<TData = unknown> {
  id: string;
  namespace: string;
  clientIp: string;
  userAgent: string;
  connectTime: string | Date;
  disconnectTime?: string | Date;
  lastActivity: string | Date;
  events: DiagnosticSocketEvent<TData>[];
  // Add these properties for compatibility with existing code
  connected?: string | Date;
  status?: string;
}

export interface SocketMetrics {
  totalConnections: number;
  activeConnections: number;
  disconnections: number;
  errors: number;
  messagesSent: number;
  messagesReceived: number;
}

export interface SocketStatusUpdate<TData = unknown> {
  activeSockets: SocketInfo<TData>[];
  metrics: SocketMetrics;
}

/**
 * Type for socket connection errors
 */
export interface SocketConnectionError {
  message: string;
  type: string;
  code?: string;
  details?: unknown;
}
