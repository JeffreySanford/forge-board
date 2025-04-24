/**
 * Represents a point in time with health information
 */
export interface HealthTimePoint {
  status: string;
  timestamp: string;
  message: string;
  metrics?: Record<string, number>;
  events?: HealthEvent[];
}

/**
 * Represents a health-related event
 */
export interface HealthEvent {
  type: 'info' | 'warning' | 'error';
  timestamp: string;
  message: string;
  details?: any;
}

/**
 * Complete health timeline data structure
 */
export interface HealthTimelineData {
  past: HealthTimePoint;
  present: HealthTimePoint;
  future: HealthTimePoint;
  trend: 'improving' | 'stable' | 'degrading';
  predictedUptime: number; // in seconds
}
