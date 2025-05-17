/**
 * Health timeline data structures
 */

export interface HealthTimelinePoint {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface HealthTimeline {
  points: HealthTimelinePoint[];
  latestStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
}

export interface HealthTimelineRequest {
  startTime?: string;
  endTime?: string;
  limit?: number;
  status?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
}

export interface HealthTimelineResponse {
  timeline: HealthTimeline;
  timespan: {
    from: string;
    to: string;
  };
  filtered: boolean;
}