/** Metric event types */
export enum MetricEvent {
  HEALTH_UPDATE = 'health-update',
  CPU_UPDATE = 'cpu-update',
  MEMORY_UPDATE = 'memory-update',
  DISK_UPDATE = 'disk-update',
  NETWORK_UPDATE = 'network-update'
}

/** Metric data interface */
export interface MetricData {
  /** ISO timestamp */
  time: string;
  /** CPU usage percentage */
  cpu: number;
  /** Memory usage percentage */
  memory: number;
  /** Disk usage percentage */
  disk: number;
  /** Network usage percentage */
  network: number;
  /** Additional details */
  details?: Record<string, unknown>;
}

/** Health status type */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/** Health data interface */
export interface HealthData {
  /** System status */
  status: HealthStatus;
  /** Uptime in seconds */
  uptime: number;
  /** ISO timestamp */
  timestamp: string;
  /** Additional health details */
  details?: {
    /** Past health status description */
    past?: string;
    /** Present health status description */
    present?: string;
    /** Future health prediction */
    future?: string;
    /** Service-specific health status */
    services?: Record<string, { status: string; message?: string }>;
  };
}

/** Diagnostic event interface */
export interface DiagnosticEvent {
  /** Event ID */
  id?: string;
  /** Event type */
  type?: string;
  /** Event type (alternative name) */
  eventType?: string;
  /** Event message */
  message: string;
  /** ISO timestamp */
  timestamp?: string;
  /** Event severity */
  severity?: 'info' | 'warning' | 'error' | 'critical';
  /** Event source */
  source?: string;
  /** Additional details */
  details?: Record<string, unknown>;
}

/** Metric response interface */
export interface MetricResponse {
  /** Success status */
  success: boolean;
  /** Metric data */
  data: MetricData | null; // Ensure this property is included and nullable
  /** Response timestamp */
  timestamp: string; // Ensure this property is included
  /** Optional message providing more information */
  message?: string;
}
