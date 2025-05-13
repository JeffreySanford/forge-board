/**
 * Historical metrics data collection interval
 */
export type MetricsInterval = '1m' | '5m' | '15m' | '1h' | '6h' | '1d' | '7d' | '30d';

/**
 * Source system for historical metrics
 */
export type MetricsSource = 'system' | 'logs' | 'kanban' | 'security' | 'network' | 'database';

/**
 * Data point for historical metrics series
 */
export interface MetricsDataPoint {
  timestamp: string;
  value: number;
}

/**
 * Data series for a specific metric
 */
export interface MetricsSeries {
  name: string;
  data: MetricsDataPoint[];
  unit: string;
  color?: string;
}

/**
 * Snapshot of system performance at a point in time
 */
export interface SystemPerformanceSnapshot {
  timestamp: string;
  cpu: number;
  memory: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorsPerMinute: number;
  averageResponseTime: number;
  activeUsers: number;
}

/**
 * Log activity summary for historical tracking
 */
export interface LogActivitySummary {
  timestamp: string;
  totalLogs: number;
  totalCount: number; // Added for compatibility
  errorCount: number;
  warningCount: number;
  topSources: {source: string, count: number}[];
  byLevel?: Record<string, number>; // Added for compatibility
  bySource?: Record<string, number>; // Added for compatibility
  byTimeOfDay: Record<string, number>;
  recentTrend: 'increasing' | 'decreasing' | 'stable';
  topMessages: { message: string; count: number }[]; // Added missing property
}

/**
 * Kanban board activity summary
 */
export interface KanbanActivitySummary {
  totalCards: number;
  completedCards: number;
  cardsByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  cardMovements: number;
  activeUsers: string[];
  timestamp: string;
}

/**
 * Security metrics summary
 */
export interface SecurityMetricsSummary {
  timestamp: string;
  vulnerabilitiesDetected: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  securityEvents: number;
  complianceScore: number;
}

/**
 * Combined historical metrics package
 */
export interface HistoricalMetrics {
  id: string;
  timestamp: string;
  source: MetricsSource;
  data: Record<string, number | string>;
}

/**
 * Request for historical metrics
 */
export interface HistoricalMetricsRequest {
  startDate?: string;
  endDate?: string;
  interval?: MetricsInterval;
  sources?: MetricsSource[];
  limit?: number;
}

/**
 * Response containing historical metrics
 */
export interface HistoricalMetricsResponse {
  success: boolean;
  metrics: HistoricalMetrics[];
  series: MetricsSeries[];
  timeRange: {
    start: string;
    end: string;
  };
  startDate: string;
  endDate: string;
  interval: MetricsInterval;
  count: number;
}

/**
 * Visualization preferences for metrics display
 */
export interface MetricsVisualizationConfig {
  showAnimations: boolean;
  colorScheme: string;
  defaultInterval: MetricsInterval;
  preferredChartType: 'line' | 'bar' | 'area';
  showLegend: boolean;
  enableZoom: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}
