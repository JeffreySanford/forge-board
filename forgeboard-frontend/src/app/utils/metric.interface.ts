import { Metric,ExtendedMetric } from '@forgeboard/shared/api-interfaces/src/lib/metric/metric.interface';
/**
 * Metric Interface Module
 * 
 * This module serves as a bridge between frontend, shared library, and backend
 * for handling metric data transformations, validations, and conversions.
 */


/**
 * Safely converts a value to number, handling null/undefined/strings
 * @param value Value to convert to number
 * @param defaultValue Default value if conversion fails
 * @returns Number or default value
 */
export function safeNumberConversion(value: string | number | boolean | Date | undefined, defaultValue = 0): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  
  if (value instanceof Date) {
    return value.getTime();
  }
  
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safely formats a number with toFixed, handling non-numbers
 * @param value Value to format
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function safeToFixed(value: string | number | boolean | Date | undefined, decimals = 2): string {
  const num = safeNumberConversion(value);
  return num.toFixed(decimals);
}

/**
 * Format a metric value for display
 * Handles various data types and ensures proper formatting
 * @param value The value to format
 * @param decimals Number of decimal places for numeric values
 * @returns Formatted string representation
 */
export function formatMetricValue(
  value: string | number | boolean | Date | undefined | null,
  decimals = 2
): string {
  if (value === undefined || value === null) {
    return '0.' + '0'.repeat(decimals);
  }
  
  if (typeof value === 'number') {
    return value.toFixed(decimals);
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num.toFixed(decimals);
    }
    return value;
  }
  
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  return String(value);
}

/**
 * Ensures a metric object has the required properties of ExtendedMetric
 * @param metrics Original metrics object
 * @returns Properly formatted ExtendedMetric
 */
export function ensureExtendedMetric(metrics: Metric | Partial<ExtendedMetric>): ExtendedMetric {
  return {
    timestamp: metrics.timestamp || new Date().toISOString(),
    time: metrics.time || new Date().toISOString(),
    cpu: safeNumberConversion(metrics.cpu),
    memory: safeNumberConversion(metrics.memory),
    disk: safeNumberConversion(metrics.disk),
    network: safeNumberConversion(metrics.network),
    ...metrics
  };
}

/**
 * Creates mock metric data for testing or when real metrics are unavailable
 */
export function createMockMetric(): ExtendedMetric {
  return {
    timestamp: new Date().toISOString(),
    time: new Date().toISOString(),
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    disk: Math.random() * 100,
    network: Math.random() * 100
  };
}
