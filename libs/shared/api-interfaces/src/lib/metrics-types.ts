/**
 * Types related to metrics collection and reporting
 */

/**
 * Base metric data interface
 */
export interface MetricData {
  id?: string;
  timestamp: string;
  time?: string | Date; // Add time as optional property to match existing usage
  [key: string]: string | number | boolean | undefined | Date; // Update index signature to include Date
}

/**
 * Extended metric data with additional system metrics
 */
export interface ExtendedMetricData extends MetricData {
  cpu: number;
  memory: number;
  disk?: number;
  network?: number;
  time: string | Date;
}

/**
 * Metric response from API
 */
export interface MetricResponse {
  success: boolean;
  data?: MetricData | MetricData[] | null; // Can be single, array, or null
  timestamp: string;
  status: string;
  message?: string;
}

/**
 * Metric filter options
 */
export interface MetricFilter {
  startTime?: string;
  endTime?: string;
  minCpu?: number;
  maxCpu?: number;
  minMemory?: number;
  maxMemory?: number;
  types?: string[];   // Added from metric-types.ts
  sources?: string[]; // Added from metric-types.ts
}

/**
 * Metric update data (for batch updates)
 */
export interface MetricUpdate {
  metrics: MetricData[];
  timestamp: string;
}

/**
 * Interface for tile type
 */
export type TileType = 'metrics' | 'health' | 'memory' | 'connection' | 'logs' | 'uptime' | 'activity' | 'kanban';

/**
 * Base interface for tile components
 */
export interface Tile {
  id: string;
  title: string;
  type: TileType;
}

// Mark this module for export
export const __metricsTypes = true;
