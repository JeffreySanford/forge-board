/**
 * Types for metrics collection and monitoring
 */

/**
 * Metric data point
 */
export interface MetricData {
  cpu: number;
  memory: number;
  time: string;
  disk?: number;
  network?: number;
  [key: string]: number | string | undefined;
}

export interface MetricResponse {
  success: boolean;
  message?: string;
  data: MetricData | null;
  timestamp: string;
}

export const __metricsTypes = true;
