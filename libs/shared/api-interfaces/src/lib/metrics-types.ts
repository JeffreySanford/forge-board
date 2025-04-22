/**
 * Metric data interface for system metrics
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
 * Diagnostic event data
 */
export interface DiagnosticEvent {
  eventType: 'info' | 'warning' | 'error';
  message: string;
  source: string;
  timestamp: string;
  details?: Record<string, any>;
}

/**
 * Health status data
 */
export interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  services: {
    [key: string]: {
      status: 'up' | 'down';
      responseTime?: number;
    };
  };
}
