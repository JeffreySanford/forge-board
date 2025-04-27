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
export interface SocketInfo {
  id: string;
  namespace: string;
  clientIp: string;
  userAgent: string;
  connectTime: string | Date;
  disconnectTime?: string | Date;
  lastActivity: string | Date;
  events: {
    type: string;
    timestamp: string | Date;
    data?: unknown;
  }[];
}

export interface SocketMetrics {
  totalConnections: number;
  activeConnections: number;
  disconnections: number;
  errors: number;
  messagesSent: number;
  messagesReceived: number;
}

export interface SocketStatusUpdate {
  activeSockets: SocketInfo[];
  metrics: SocketMetrics;
}

export interface SocketLogEvent {
  socketId: string;
  namespace: string;
  eventType: string;
  timestamp: string | Date;
  message: string;
  data?: unknown;
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
