/**
 * Types related to metrics collection and reporting
 */

/**
 * Metric data interface
 */
export interface MetricData {
  cpu: number;      // CPU usage percentage
  memory: number;   // Memory usage percentage
  disk?: number;    // Optional disk usage percentage
  network?: number; // Optional network usage percentage
  time: string;     // ISO timestamp
  value?: number;   // Generic value for metrics processing
  
  // Allow additional properties for extended metrics
  [key: string]: number | string | undefined;
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
 * Individual metric data point, often used in time series.
 */
export interface MetricDataPoint { // Added from metric-types.ts
  value: number;
  timestamp: string;
}

// Mark this module for export
export const __metricsTypes = true;
