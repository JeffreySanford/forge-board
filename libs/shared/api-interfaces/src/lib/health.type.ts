/**
 * Health-related interfaces
 */

/**
 * Health status types
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Base health interface
 */
export interface Health {
  status: HealthStatus;
  timestamp: string;
  components?: HealthData[];
}

/**
 * Health data interface
 */
export interface HealthData {
  status: HealthStatus;
  uptime: number; // in seconds
  timestamp: string;
  details?: Record<string, unknown>;
}

/**
 * Health detail interface
 */
export interface HealthDetail {
  name: string;
  status: HealthStatus;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Health timeline point interface
 * @deprecated Use HealthTimelinePoint from './health-timeline' instead to avoid duplication
 */
export interface HealthTimelinePoint {
  timestamp: string;
  status: HealthStatus;
  message: string;
  metadata?: Record<string, unknown>;
}

// Module marker removed, types are now exported individually
