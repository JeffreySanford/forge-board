/**
 * Health timeline data structures
 */

export interface HealthTimelinePoint {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
  metadata?: Record<string, unknown>;
  icon?: string; // Added optional icon
  title?: string; // Added optional title
  content?: string; // Added optional content (can be same as message or more detailed)
}

export interface HealthTimeline {
  points: HealthTimelinePoint[];
  currentStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  predictions?: {
    timestamp: string;
    predictedStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    confidence: number;
    metadata?: Record<string, unknown>;
  }[];
}

export interface HealthTimelineFilter {
  startTime?: string;
  endTime?: string;
  statuses?: Array<'healthy' | 'degraded' | 'unhealthy' | 'unknown'>;
  limit?: number;
}