/**
 * Core metric data interface for system metrics
 */
export interface MetricData {
  cpu: number;
  memory: number;
  time: string;
  disk?: number;
  network?: number;
  [key: string]: number | string | undefined;
}

/**
 * Metric response interface for API calls
 */
export interface MetricResponse {
  success: boolean;
  message?: string;
}

/**
 * Metric update response with included data
 */
export interface MetricUpdateResponse {
  success: boolean;
  data?: MetricData;
  message?: string;
}

/**
 * Diagnostic event data
 */
export interface DiagnosticEvent {
  eventType: 'info' | 'warning' | 'error';
  message: string;
  source: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

/**
 * Health status data
 */
export interface HealthData {
  status: string;
  uptime: number;
  timestamp: string;
  details: Record<string, string>;
}

/**
 * Socket event names for metrics
 */
export enum MetricEvent {
  SUBSCRIBE = 'subscribe-metrics',
  UPDATE = 'metrics-update',
  SYSTEM = 'system-metrics',
  DIAGNOSTICS = 'diagnostics-event',
  HEALTH = 'health-status'
}
