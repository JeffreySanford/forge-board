/**
 * Types related to system metrics
 */

/**
 * Standard metric data structure
 */
export interface MetricData {
  cpu: number;
  memory: number;
  time: string;
  disk: number;
  network: number;
  details?: Record<string, unknown>;
}

/**
 * Metric response structure
 */
export interface MetricResponse {
  success: boolean;
  message: string;
  data: MetricData | null;
  timestamp: string;
}

/**
 * Metrics configuration
 */
export interface MetricConfig {
  interval: number;
  retention: number;
  thresholds: {
    cpu: number;
    memory: number;
    disk: number;
  };
}
