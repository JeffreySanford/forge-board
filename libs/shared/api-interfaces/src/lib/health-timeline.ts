/**
 * Health timeline types for tracking system health over time
 */

/**
 * Health timeline point
 */
export interface HealthTimelinePoint {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
}

/**
 * Health timeline data structure
 */
export interface HealthTimeline {
  points: HealthTimelinePoint[];
  currentStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  predictions: {
    timestamp: string;
    predictedStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    confidence: number;
    metadata: Record<string, unknown>;
  }[];
}
