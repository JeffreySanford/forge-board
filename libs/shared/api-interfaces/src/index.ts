/**
 * Standard socket response type for all socket operations
 */
export interface SocketResponse<T> {
  status: 'success' | 'error';
  data: T;
  timestamp: string;
}

/**
 * Create a standardized response object
 */
export function createSocketResponse<T>(event: string, data: T): SocketResponse<T>;
export function createSocketResponse<T>(data: T): SocketResponse<T>;
export function createSocketResponse<T>(eventOrData: string | T, data?: T): SocketResponse<T> {
  if (typeof eventOrData === 'string' && data !== undefined) {
    // Called with event name and data
    return {
      status: 'success',
      data,
      timestamp: new Date().toISOString(),
    };
  } else {
    // Called with just data
    return {
      status: 'success',
      data: eventOrData as T,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Tile interface for dashboard components
 */
export interface Tile {
  id: string;
  type: TileType;
  title: string;
  order: number;
  visible: boolean;
}

/**
 * Available tile types
 */
export type TileType = 'uptime' | 'metrics' | 'connection' | 'logs' | 'activity';

/**
 * Drag event for tile reordering
 */
export interface TileDragEvent {
  previousIndex: number;
  currentIndex: number;
}

// Export directly from socket-types and tile-types (these don't have conflicts)
export * from './lib/api-interfaces';
export * from './lib/tile-types';

// Logger-related exports
export { 
  LogLevel,
  LogLevelType,
  LogEntry,
  LogFilter,
  LogResponse,
  LogStreamUpdate,
  LoggerConfig
} from './lib/logger-types';

// Socket-related exports
export {
  SocketEvent,
  SocketInfo,
  SocketMetrics,
  SocketLogEvent,
  SocketLogFilter,
  createSocketErrorResponse
} from './lib/socket-types';

// Metrics-related exports
export {
  MetricData,
  MetricResponse,
  MetricUpdateResponse,
  DiagnosticEvent,
  HealthData,
  MetricEvent
} from './lib/metric-types';
