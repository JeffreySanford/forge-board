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
export function createSocketResponse<T>(event: string, data: T): SocketResponse<T> {
  return {
    status: 'success',
    data,
    timestamp: new Date().toISOString(),
  };
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

// Export other interfaces from their respective files
export * from './lib/api-interfaces';
export * from './lib/socket-types';
export * from './lib/tile-types';

// Explicitly re-export to resolve ambiguity issues
export { 
  MetricData, 
  MetricResponse, 
  DiagnosticEvent, 
  HealthData, 
  MetricEvent 
} from './lib/metric-types';
