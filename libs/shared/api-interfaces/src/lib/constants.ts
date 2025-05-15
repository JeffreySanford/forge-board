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
  KANBAN: '/api/kanban',  // API endpoint for Kanban
  AUTH: '/api/auth',
  HISTORICAL_METRICS: '/api/historical-metrics',
  HISTORICAL_METRICS_PERFORMANCE: '/api/historical-metrics/performance',
  HISTORICAL_METRICS_LOGS: '/api/historical-metrics/logs',
  HISTORICAL_METRICS_SECURITY: '/api/historical-metrics/security',
  HISTORICAL_METRICS_SUMMARY: '/api/historical-metrics/summary',
  HISTORICAL_METRICS_KANBAN: '/api/historical-metrics/kanban'  // Only keep this one, remove duplicate KANBAN entry
};

/**
 * Socket namespaces
 */
export const SOCKET_NAMESPACES = {
  METRICS: '/metrics',
  DIAGNOSTICS: '/diagnostics',
  LOGS: '/logs',
  KANBAN: '/kanban'  // Socket namespace for Kanban
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
  KANBAN: 'kanban'  // Tile type for Kanban
};

// Add new fallback endpoints with full URLs
export const FALLBACK_ENDPOINTS = {
  // Use relative paths instead of hardcoded localhost URLs
  LOGS: '/api/logs',
  LOGS_MOCK: '/api/mock-data/logs', 
  LOGS_V2: '/api/v2/logs'
};

// Mark this file as a Constants module
export const __constants = true;
