/**
 * Types for metrics collection and monitoring
 */

/**
 * Metric data point
 */
export interface MetricData {
  // Required properties
  time: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: number;
  
  // Allow additional dynamic properties
  [key: string]: number | string | undefined;
}

// Additional metric-related types
export interface MetricUpdate {
  type: string;
  value: number | string;
  timestamp: string;
  source?: string;
}

export interface MetricFilter {
  startTime?: string;
  endTime?: string;
  types?: string[];
  sources?: string[];
}

export interface MetricResponse {
  success: boolean;
  status: string;
  data: MetricData | null;
  timestamp: string;
  message?: string;
}

// For metrics series data
export interface MetricDataPoint {
  value: number;
  timestamp: string;
}

export const __metricsTypes = true;
