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

/**
 * Utility function to create a standardized socket response.
 * This definition is a source of conflict with the one in socket-types.ts / socket-utils.ts.
 * The main index.ts exports the version from socket-types.ts.
 * Removing this to avoid confusion and centralize the definition.
 */
/*
export function createSocketResponse<T>(
  type: string,
  payload: T,
  success = true,
  message?: string
): SocketResponse<T> {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    success,
    message,
  };
}
*/

/**
 * Represents a single point in the health timeline.
 * Canonical definition exists in health-timeline.ts. Removing this.
 */
/*
export interface HealthTimelinePoint {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
  metadata?: Record<string, unknown>; // Changed from any
}
*/

/**
 * Represents health data of the system.
 * Canonical definition exists in health.type.ts. Removing this.
 */
/*
export interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  uptime: number; // in seconds
  timestamp: string;
  details?: Record<string, unknown>; // Changed from any
  // Optional: Add components array if needed for detailed status
  // components?: Array<{ name: string; status: 'healthy' | 'degraded' | 'unhealthy'; message?: string }>;
}
*/

/**
 * Represents a log event for sockets.
 * Canonical definition exists in socket-registry-types.ts. Removing this.
 */
/*
export interface SocketLogEvent {
  id: string; // Unique ID for the log event
  timestamp: string;
  socketId: string;
  namespace: string;
  event: 'connect' | 'disconnect' | 'error' | string; // Common events or custom
  message: string;
  data?: unknown; // Changed from any
}
*/

/**
 * Represents status update for sockets.
 * Canonical definition exists in socket-registry-types.ts. Removing this.
 */
/*
export interface SocketStatusUpdate {
  activeSockets: unknown; // Changed from any, ideally should be SocketInfo[]
  metrics: unknown; // Changed from any, ideally should be SocketMetrics
}
*/

/**
 * Represents metric data.
 * Canonical definition exists in metrics-types.ts. Removing this.
 */
/*
export interface MetricData {
  // Define structure based on actual metrics
  [key: string]: unknown; // Changed from any
}
*/
