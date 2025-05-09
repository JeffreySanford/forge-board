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
  data?: MetricData | null;
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
}

/**
 * Metric update data
 */
export interface MetricUpdate {
  metrics: MetricData[];
  timestamp: string;
}

// Mark this module for export
export const __metricsTypes = true;
