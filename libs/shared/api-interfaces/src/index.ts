/**
 * Standard socket response type for all socket operations
 */
export interface SocketResponse<T> {
  status: 'success' | 'error';
  data: T;
  timestamp: string;
  error?: string;
}

/**
 * Constants for socket event names to ensure consistency
 */
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  METRICS_UPDATE: 'metrics-update',
  HEALTH_UPDATE: 'health-update',
  LOG_STREAM: 'log-stream',
  FILTER_LOGS: 'filter-logs',
  SOCKET_STATUS: 'socket-status',
  SOCKET_LOGS: 'socket-logs',
  SET_INTERVAL: 'set-interval',
  SUBSCRIBE_METRICS: 'subscribe-metrics',
  SUBSCRIBE_LOGS: 'subscribe-logs',
  ERROR: 'error'
} as const;

/**
 * Socket event types derived from SOCKET_EVENTS constants
 */
export type SocketEventType = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

/**
 * Export all types
 */
// Socket types
export {
  SocketMetrics,
  SocketStatusUpdate,
  SocketInfo,
  SocketEvent,
  SocketStatus,
  SocketLogEvent,
  createSocketResponse,
  createSocketErrorResponse,
  isSocketResponse,
  isSuccessResponse,
  isErrorResponse
} from './lib/socket-types';

export {
  LogLevel,
  LogLevelType,
  LogEntry,
  LogFilter,
  LogResponse,
  LogStreamUpdate,
  LoggerConfig
} from './lib/logger-types';

export {
  MetricEvent,
  MetricData,
  HealthStatus,
  HealthData,
  MetricResponse,
  DiagnosticEvent
} from './lib/metric-types';

export {
  TileType,
  TileVisibility,
  TileLayoutResponse,
  TileLayoutRequest,
  TileResponse,
  Tile,
  TileDragEvent
} from './lib/tile-types';

// Helper functions
import { MetricData, HealthStatus, HealthData } from './lib/metric-types';

/**
 * Validates metric data to ensure it has all required fields
 */
export function validateMetricData(data: Partial<MetricData>): MetricData {
  const now = new Date().toISOString();
  return {
    time: data.time || now,
    cpu: data.cpu ?? 0,
    memory: data.memory ?? 0,
    disk: data.disk ?? 0,
    network: data.network ?? 0,
    details: data.details || {}
  };
}

/**
 * Creates a health data object with consistent formatting
 */
export function createHealthData(status: string, details?: Partial<Record<string, unknown>>, uptimeValue?: number): HealthData {
  // Remove or guard process.uptime usage for browser compatibility
  // const uptime = uptimeValue ?? process.uptime();
  const uptime = uptimeValue ?? 0;
  
  return {
    status: status as HealthStatus,
    uptime,
    timestamp: new Date().toISOString(),
    details: {
      services: details?.['services'] as Record<string, { status: string; message?: string }> || {},
      past: details?.['past'] as string,
      present: details?.['present'] as string,
      future: details?.['future'] as string
    }
  };
}
