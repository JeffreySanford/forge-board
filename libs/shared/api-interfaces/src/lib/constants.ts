/**
 * Shared constants
 */

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  METRICS: '/api/metrics',
  DIAGNOSTICS: '/api/diagnostics',
  LOGS: '/api/logs',
  STATUS: '/api/status',
  TILES: '/api/tiles',
  KABLAN: '/api/kablan',
  AUTH: '/api/auth',
  HISTORICAL_METRICS: '/api/historical-metrics',
  HISTORICAL_METRICS_PERFORMANCE: '/api/historical-metrics/performance',
  HISTORICAL_METRICS_LOGS: '/api/historical-metrics/logs',
  HISTORICAL_METRICS_KABLAN: '/api/historical-metrics/kablan',
  HISTORICAL_METRICS_SECURITY: '/api/historical-metrics/security',
  HISTORICAL_METRICS_SUMMARY: '/api/historical-metrics/summary'
};

/**
 * Socket namespaces
 */
export const SOCKET_NAMESPACES = {
  METRICS: '/metrics',
  DIAGNOSTICS: '/diagnostics',
  LOGS: '/logs',
  KABLAN: '/kablan'
};

/**
 * Tile types
 */
export const TILE_TYPES = {
  METRICS: 'metrics',
  CONNECTION: 'connection',
  LOGS: 'logs',
  UPTIME: 'uptime',
  ACTIVITY: 'activity',
  KABLAN: 'kablan'
};

// Mark this file as a Constants module
export const __constants = true;
