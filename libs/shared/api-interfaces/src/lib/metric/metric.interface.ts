/**
 * Types related to metrics collection and reporting
 */

/**
 * Base metric data interface
 */
export interface Metric {
  [key: string]: string | number | boolean | undefined | Date;
  
  /**
   * Required timestamp field
   */
  timestamp: string;
  
  /**
   * Legacy time field, maintained for compatibility
   * @deprecated Use timestamp instead
   */
  time?: string;
  
  /**
   * CPU usage percentage
   */
  cpu?: number;
  
  /**
   * Memory usage percentage
   */
  memory?: number;
  
  /**
   * Disk usage percentage
   */
  disk?: number;
  
  /**
   * Network usage percentage
   */
  network?: number;
}

/**
 * Extended version of Metric with guaranteed CPU and memory fields
 * This interface is used by components that require these fields
 */
export interface ExtendedMetric extends Metric {
  /**
   * CPU usage percentage
   */
  cpu: number;
  
  /**
   * Memory usage percentage
   */
  memory: number;
}

/**
 * Metric response from API
 */
export interface MetricResponse {
  success: boolean;
  data?: Metric | Metric[] | null; // Can be single, array, or null
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
  metrics: Metric[];
  timestamp: string;
}

/**
 * Interface for tile type
 * @deprecated Use TileType from tile-types.ts instead
 */
export type TileType = 'metrics' | 'health' | 'memory' | 'connection' | 'logs' | 'uptime' | 'activity' | 'network' | 'kanban';

/**
 * Base interface for tile components
 */
export interface Tile {
  id: string;
  title: string;
  type: TileType;
}

