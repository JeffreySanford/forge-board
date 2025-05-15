import { MetricsDataPoint, SystemPerformanceSnapshot, LogActivitySummary, MetricsInterval } from './historical-metrics';
import { MetricData } from './metrics-types';
import { LogEntry, LogLevelEnum } from './log-types';

/**
 * Utility class for condensing metrics data for historical storage
 */
export class MetricsCondenser {
  private metricsStack: MetricData[] = [];
  private readonly maxStack = 100;
  private readonly minValue = 0;
  private readonly maxValue = 100;

  /**
   * Add a metric data point to the stack
   */
  addMetric(metric: MetricData): void {
    // Add to beginning for chronological order
    this.metricsStack.unshift(metric);

    // Limit stack size
    if (this.metricsStack.length > this.maxStack) {
      this.metricsStack.pop();
    }
  }

  /**
   * Get numeric value from a metric
   */
  private extractValue(m: MetricData, key: string): number {
    const value = m[key];
    return typeof value === 'number' ? value :
      parseFloat(value as string) || 0;
  }

  /**
   * Calculate average for a specific metric over the stack
   */
  getAverage(key: string): number {
    if (this.metricsStack.length === 0) return 0;

    const sum = this.metricsStack.reduce((total, m) => 
      total + this.extractValue(m, key), 0);
    
    return sum / this.metricsStack.length;
  }

  /**
   * Get the minimum value for a metric
   */
  getMin(key: string): number {
    if (this.metricsStack.length === 0) return 0;

    return this.metricsStack.reduce((min, m) => {
      const val = this.extractValue(m, key);
      return val < min ? val : min;
    }, Infinity);
  }

  /**
   * Get the maximum value for a metric
   */
  getMax(key: string): number {
    if (this.metricsStack.length === 0) return 0;

    return this.metricsStack.reduce((max, m) => {
      const val = this.extractValue(m, key);
      return val > max ? val : max;
    }, -Infinity);
  }

  /**
   * Process log entries into condensed metrics
   */
  processLogs(logs: LogEntry[]): MetricData {
    if (!logs || logs.length === 0) {
      return {
        cpu: 0,
        memory: 0,
        time: new Date().toISOString()
      };
    }

    // Count entries by level
    const byLevel: Record<LogLevelEnum, number> = {
      [LogLevelEnum.TRACE]: 0,
      [LogLevelEnum.DEBUG]: 0,
      [LogLevelEnum.INFO]: 0,
      [LogLevelEnum.WARN]: 0,
      [LogLevelEnum.ERROR]: 0,
      [LogLevelEnum.FATAL]: 0
    };

    // Count by source
    const bySources: Record<string, number> = {};

    // Process all logs
    logs.forEach(log => {
      // Increment level counter
      byLevel[log.level]++;

      // Increment source counter
      if (log.source) {
        bySources[log.source] = (bySources[log.source] || 0) + 1;
      }
    });

    // Find the most frequent source
    let topSource = '';
    let topCount = 0;
    Object.entries(bySources).forEach(([source, count]) => {
      if (count > topCount) {
        topSource = source;
        topCount = count;
      }
    });

    // Create metric data
    return {
      cpu: 0,
      memory: 0,
      time: new Date().toISOString(),
      totalLogs: logs.length,
      errorCount: byLevel[LogLevelEnum.ERROR] + byLevel[LogLevelEnum.FATAL],
      warnCount: byLevel[LogLevelEnum.WARN],
      infoCount: byLevel[LogLevelEnum.INFO],
      debugCount: byLevel[LogLevelEnum.DEBUG] + byLevel[LogLevelEnum.TRACE],
      topSource,
      topSourceCount: topCount
    };
  }

  /**
   * Condenses an array of metrics into a single data point
   * using specified statistical method
   */
  static condenseMetricData(
    metricData: MetricData[], 
    method: 'average' | 'sum' | 'max' | 'min' | 'last' = 'average'
  ): number {
    if (!metricData || metricData.length === 0) {
      return 0;
    }

    const values = metricData.map(m => {
      // Check for explicit value property first
      if (typeof m.value === 'number') {
        return m.value;
      }
      // Otherwise use the first numeric property we find
      for (const key of Object.keys(m)) {
        if (typeof m[key] === 'number') {
          return m[key] as number;
        }
      }
      return 0; // Default to 0 if no numeric value found
    });

    switch (method) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      case 'last':
        return values[values.length - 1];
      case 'average':
      default:
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
  }

  /**
   * Creates a system performance snapshot from raw metrics
   */
  static createPerformanceSnapshot(
    cpuMetrics: MetricData[],
    memoryMetrics: MetricData[],
    connectionMetrics: MetricData[],
    requestMetrics: MetricData[],
    errorMetrics: MetricData[],
    responseTimeMetrics: MetricData[],
    userMetrics: MetricData[]
  ): SystemPerformanceSnapshot {
    return {
      timestamp: new Date().toISOString(),
      cpu: this.condenseMetricData(cpuMetrics, 'average'),
      memory: this.condenseMetricData(memoryMetrics, 'average'),
      activeConnections: this.condenseMetricData(connectionMetrics, 'last'),
      requestsPerMinute: this.condenseMetricData(requestMetrics, 'sum'),
      errorsPerMinute: this.condenseMetricData(errorMetrics, 'sum'),
      averageResponseTime: this.condenseMetricData(responseTimeMetrics, 'average'),
      activeUsers: this.condenseMetricData(userMetrics, 'last')
    };
  }

  /**
   * Creates a log activity summary from log entries
   */
  static createLogActivitySummary(logs: LogEntry[]): LogActivitySummary {
    const byLevel: Record<LogLevelEnum, number> = createEmptyLogCounts();

    const bySource: Record<string, number> = {};
    const messageCount: Record<string, number> = {};

    logs.forEach(log => {
      // Count by level
      if (log.level) {
        byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      }

      // Count by source
      if (log.source) {
        bySource[log.source] = (bySource[log.source] || 0) + 1;
      }

      // Count message occurrences
      const message = log.message || '';
      messageCount[message] = (messageCount[message] || 0) + 1;
    });

    // Get top messages
    const topMessages = Object.entries(messageCount)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get top sources
    const topSources = Object.entries(bySource)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate error and warning counts
    const errorCount = byLevel[LogLevelEnum.ERROR] + byLevel[LogLevelEnum.FATAL];
    const warningCount = byLevel[LogLevelEnum.WARN];

    // Group by hour of day (0-23)
    const byTimeOfDay: Record<number, number> = {};
    logs.forEach(log => {
      if (log.timestamp) {
        const hour = new Date(log.timestamp).getHours();
        byTimeOfDay[hour] = (byTimeOfDay[hour] || 0) + 1;
      }
    });

    // Calculate a simple trend
    // Calculate a simple trend
    const recentTrend = {
      direction: 'stable' as 'up' | 'down' | 'stable',
      percentage: 0
    };

    // Split logs into two time periods to compare
    if (logs.length >= 10) {
      const midPoint = Math.floor(logs.length / 2);
      const olderLogs = logs.slice(0, midPoint);
      const newerLogs = logs.slice(midPoint);
      
      const olderCount = olderLogs.length;
      const newerCount = newerLogs.length;
      
      // Calculate percentage change
      const percentChange = olderCount > 0 ? 
        ((newerCount - olderCount) / olderCount) * 100 : 0;
      
      recentTrend.percentage = Math.abs(Math.round(percentChange));
      recentTrend.direction = percentChange > 5 ? 'up' : 
                     percentChange < -5 ? 'down' : 'stable';
    }

    return {
      timestamp: new Date().toISOString(),
      totalCount: logs.length,
      totalLogs: logs.length,
      byLevel,
      bySource,
      topMessages,
      errorCount,
      warningCount,
      topSources,
      byTimeOfDay,
      recentTrend: 'stable' as 'stable' | 'increasing' | 'decreasing' // Replace the object with a string literal
    };
  }

  /**
   * Downsamples time series data for efficient storage and transmission
   * Uses the Largest-Triangle-Three-Buckets algorithm for visually
   * representative downsampling
   */
  static downsampleTimeSeries(
    data: MetricsDataPoint[], 
    targetPoints: number
  ): MetricsDataPoint[] {
    if (data.length <= targetPoints) {
      return [...data];
    }

    const result: MetricsDataPoint[] = [];
    // Always include the first point
    result.push(data[0]);
    
    const bucketSize = (data.length - 2) / (targetPoints - 2);
    
    for (let i = 1; i < targetPoints - 1; i++) {
      const bucketStart = Math.floor((i - 1) * bucketSize) + 1;
      const bucketEnd = Math.floor(i * bucketSize) + 1;
      let maxArea = 0;
      let maxAreaIndex = bucketStart;
      
      const a = result[result.length - 1]; // Last point in result
      const aTime = new Date(a.timestamp).getTime();
      
      for (let j = bucketStart; j < bucketEnd; j++) {
        const b = data[j];
        const bTime = new Date(b.timestamp).getTime();
        
        // Last point in the current bucket
        const c = data[Math.min(bucketEnd, data.length - 1)];
        const cTime = new Date(c.timestamp).getTime();
        
        // Calculate triangle area
        const area = Math.abs(
          (aTime - cTime) * (b.value - a.value) -
          (aTime - bTime) * (c.value - a.value)
        ) * 0.5;
        
        if (area > maxArea) {
          maxArea = area;
          maxAreaIndex = j;
        }
      }
      
      result.push(data[maxAreaIndex]);
    }
    
    // Always include the last point
    result.push(data[data.length - 1]);
    
    return result;
  }

  /**
   * Determine appropriate interval based on date range
   */
  static recommendInterval(startDate: Date, endDate: Date): MetricsInterval {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours <= 1) return '1m';
    if (diffHours <= 6) return '5m';
    if (diffHours <= 24) return '15m';
    if (diffHours <= 72) return '1h';
    if (diffHours <= 168) return '6h'; // 7 days
    if (diffHours <= 720) return '1d'; // 30 days
    return '7d';
  }
}

// Fix the error with accessing 'value' property on MetricData
export function processMetricData(data: MetricData & { value?: number }): number {
  // Check if 'value' exists directly on the data
  if (data.value !== undefined) {
    return data.value;
  }
  
  // Fallback to other properties if value doesn't exist
  // For example, use cpu, memory, or other numeric properties
  if (typeof data.cpu === 'number') {
    return data.cpu;
  }
  
  if (typeof data.memory === 'number') {
    return data.memory;
  }
  
  // Return 0 if no suitable numeric value is found
  return 0;
}

// Fix the missing LogLevelEnum.TRACE property
export function createEmptyLogCounts(): Record<LogLevelEnum, number> {
  return {
    [LogLevelEnum.DEBUG]: 0,
    [LogLevelEnum.INFO]: 0,
    [LogLevelEnum.WARN]: 0,
    [LogLevelEnum.ERROR]: 0,
    [LogLevelEnum.FATAL]: 0,
    [LogLevelEnum.TRACE]: 0
  };
}

/**
 * Condenses multiple metric data points into a single summarized data point
 * @param metrics Array of metric data objects to condense
 * @returns A single condensed metric data object
 */
export function condenseMetrics(metrics: MetricData[]): MetricData {
  if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
    return {
      time: new Date().toISOString(),
      cpu: 0,
      memory: 0
    };
  }
  
  // Use the most recent timestamp
  const timestamps = metrics
    .map(m => new Date(m.time).getTime())
    .filter(t => !isNaN(t));
  
  const mostRecentTimestamp = timestamps.length > 0 
    ? new Date(Math.max(...timestamps)).toISOString()
    : new Date().toISOString();
  
  // Initialize result with the timestamp
  const result: MetricData = {
    time: mostRecentTimestamp,
    cpu: 0,
    memory: 0
  };
  
  // Get all unique keys from all metrics
  const allKeys = new Set<string>();
  metrics.forEach(m => {
    Object.keys(m).forEach(key => {
      if (key !== 'time') { // Skip the timestamp
        allKeys.add(key);
      }
    });
  });
  
  // Process each key
  allKeys.forEach(key => {
    const validMetrics = metrics.filter(m => 
      key in m && 
      (typeof m[key] === 'number' || 
       (typeof m[key] === 'string' && !isNaN(parseFloat(m[key] as string))))
    );
    
    if (validMetrics.length === 0) {
      return; // Skip this key if no valid values
    }
    
    // Calculate average for this metric
    const numericValues = validMetrics.map(m => {
      const value = m[key];
      return typeof value === 'number' ? value : parseFloat(value as string);
    });
    
    const sum = numericValues.reduce((acc, val) => acc + val, 0);
    result[key] = Math.round((sum / validMetrics.length) * 10) / 10; // Round to 1 decimal place
  });
  
  return result;
}

/**
 * Process raw metrics data to extract trends and aggregations
 * @param logs Array of log entries that may contain metrics
 * @returns Processed metrics with trends and aggregations
 */
export function processMetricsData(logs: MetricData[]): Record<string, unknown> {
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return { metrics: [], aggregates: {} };
  }

  try {
    // Group metrics by minute for trend analysis
    const metricsByMinute = groupByMinute(logs);
    
    // Calculate aggregates
    const aggregates = {
      count: logs.length,
      timeRange: {
        start: new Date(Math.min(...logs.map(l => new Date(l.time).getTime()))).toISOString(),
        end: new Date(Math.max(...logs.map(l => new Date(l.time).getTime()))).toISOString()
      }
    };
    
    return {
      metrics: metricsByMinute,
      aggregates
    };
  } catch (error) {
    console.error('Error processing metrics data:', error);
    return { 
      metrics: [],
      aggregates: { 
        count: logs.length,
        error: (error instanceof Error) ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Helper function to group metrics by minute
 */
function groupByMinute(metrics: MetricData[]): MetricData[] {
  if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
    return [];
  }
  
  const groupedByMinute: Record<string, MetricData[]> = {};
  
  metrics.forEach(metric => {
    if (!metric.time) return;
    
    // Group by minute
    const date = new Date(metric.time);
    const minuteKey = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes()
    ).toISOString();
    
    if (!groupedByMinute[minuteKey]) {
      groupedByMinute[minuteKey] = [];
    }
    
    groupedByMinute[minuteKey].push(metric);
  });
  
  // Condense each minute's metrics
  return Object.entries(groupedByMinute)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([minute, minuteMetrics]) => {
      const condensed = condenseMetrics(minuteMetrics);
      return {
        ...condensed,
        time: minute // Use the minute key as the timestamp
      };
    });
}

/**
 * Calculate average value from metrics
 */
export function calculateAverage(metrics: MetricData[], key: string): number {
  if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
    return 0;
  }
  
  const values = metrics
    .filter(m => key in m)
    .map(m => {
      const value = m[key];
      return typeof value === 'number' ? value :
        parseFloat(value as string) || 0;
    });
  
  if (values.length === 0) return 0;
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}
