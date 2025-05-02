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
  AUTH: '/api/auth'
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
