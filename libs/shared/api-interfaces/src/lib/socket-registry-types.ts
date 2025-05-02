/**
 * Socket event interface
 */
export interface SocketEvent {
  type: string;
  timestamp: string | Date;
  data?: unknown;
}

/**
 * Socket information interface
 */
export interface SocketInfo<TData = unknown> {
  id: string;
  namespace: string;
  clientIp: string;
  userAgent: string;
  connectTime: string | Date;
  disconnectTime?: string | Date;
  lastActivity: string | Date;
  events: DiagnosticSocketEvent<TData>[];
  // For compatibility with existing code
  connected?: string | Date;
  status?: string;
}

/**
 * Socket metrics interface
 */
export interface SocketMetrics {
  totalConnections: number;
  activeConnections: number;
  disconnections: number;
  errors: number;
  messagesSent: number;
  messagesReceived: number;
  lastError?: Error | null; // Make lastError optional
}

/**
 * Socket status update containing active sockets and metrics
 */
export interface SocketStatusUpdate<TData = unknown> {
  activeSockets: SocketInfo<TData>[];
  metrics: SocketMetrics;
}

/**
 * Socket event for diagnostics purposes
 */
export interface DiagnosticSocketEvent<TData = unknown> {
  type: string;
  timestamp: string | Date;
  data?: TData;
}

/**
 * Socket connection error information
 */
export interface SocketConnectionError {
  message: string;
  type: string;
  code?: string;
  details?: unknown;
}

/**
 * Generic socket log event
 */
export interface SocketLogEvent<TData = unknown> {
  socketId: string;
  namespace: string;
  eventType: string;
  timestamp: string | Date;
  message: string;
  data?: TData;
  // For backward compatibility
  type?: string;
}
