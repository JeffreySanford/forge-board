/** Socket metrics model */
export interface SocketMetrics {
  /** Total connections since server start */
  totalConnections: number;
  /** Currently active connections */
  activeConnections: number;
  /** Total disconnections */
  disconnections: number;
  /** Connection errors */
  errors: number;
  /** Messages sent by server */
  messagesSent: number;
  /** Messages received by server */
  messagesReceived: number;
}

/** Socket status update */
export interface SocketStatusUpdate {
  /** Active sockets information */
  activeSockets: SocketInfo[];
  /** Socket metrics */
  metrics: SocketMetrics;
}

/** Socket information */
export interface SocketInfo {
  /** Socket ID */
  id: string;
  /** Socket namespace */
  namespace: string;
  /** Connection timestamp */
  connected: string;
  /** Client IP address */
  clientIp?: string;
  /** User agent */
  userAgent?: string;
  /** Connection status */
  status: 'connected' | 'disconnected';
  /** Last activity timestamp */
  lastActivity?: string; // Ensure this is a string
  /** Disconnect timestamp */
  disconnectTime?: string; // Ensure this is a string
  /** Event history */
  events?: Array<{ type: string; timestamp: string; data?: unknown }>; // Ensure timestamps are strings
  /** Connect time */
  connectTime?: string; // Added missing property to resolve errors
}

/** Socket event names enum */
export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  METRICS_UPDATE = 'metrics-update',
  LOG = 'log',
  ERROR = 'error'
}

/** Socket event type for constant array */
export const SOCKET_EVENTS = [
  'connect',
  'disconnect',
  'metrics-update',
  'log',
  'error'
];

/** Socket status enum */
export enum SocketStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

/** Socket log event interface */
export interface SocketLogEvent {
  /** Socket ID */
  socketId: string;
  /** Socket namespace */
  namespace: string;
  /** Event type */
  type: string; // Ensure this property is included
  /** Event timestamp */
  timestamp: string; // Ensure this property is included
  /** Event message */
  message: string;
  /** Event data */
  data?: unknown;
}

/** Socket response interface */
export interface SocketResponse<T> {
  /** Response status */
  status: 'success' | 'error';
  /** Response data */
  data: T;
  /** Response timestamp */
  timestamp: string;
  /** Optional error message */
  error?: string;
}

/** Create a standard socket response */
export function createSocketResponse<T>(event: string, data: T): SocketResponse<T> {
  return {
    status: 'success',
    data,
    timestamp: new Date().toISOString()
  };
}

/** Create an error socket response */
export function createSocketErrorResponse<T>(event: string, errorMsg: string): SocketResponse<{message: string}> {
  return {
    status: 'error',
    data: { message: errorMsg },
    timestamp: new Date().toISOString(),
    error: errorMsg
  };
}

/** Type guard to check if a response is a socket response */
export function isSocketResponse<T>(obj: unknown): obj is SocketResponse<T> {
  return obj !== null &&
    typeof obj === 'object' && 
    (obj as any).status !== undefined && 
    ((obj as any).status === 'success' || (obj as any).status === 'error') && 
    'data' in (obj as any) && 
    typeof (obj as any).timestamp === 'string';
}

/** Type guard to check if a socket response is successful */
export function isSuccessResponse<T>(response: SocketResponse<T>): boolean {
  return response.status === 'success';
}

/** Type guard to check if a socket response is an error */
export function isErrorResponse<T>(response: SocketResponse<T>): boolean {
  return response.status === 'error';
}
