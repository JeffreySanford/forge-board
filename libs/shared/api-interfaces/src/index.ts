/**
 * Shared API interfaces library that provides types and interfaces used across frontend and backend.
 * This can be used with Swagger by referencing these types in API controllers with @ApiProperty decorators.
 */

// Base API interfaces
export type { ApiResponse, UserData, ErrorResponse } from './lib/api-interfaces';

// API response helpers
export { __apiResponse } from './lib/api-response';
export type { SuccessResponse } from './lib/api-response';

// Socket interfaces and helpers
export { createSocketResponse, createErrorResponse as createSocketErrorResponse } from './lib/socket-types';
export type { SocketResponse } from './lib/socket-types'; // SocketResponse is unique to socket-types.ts

// Types from socket-registry-types.ts - these are considered the canonical definitions
export type { 
  SocketEvent,
  SocketInfo,
  SocketMetrics,
  SocketStatusUpdate,
  SocketConnectionError,
  SocketLogEvent,
  DiagnosticSocketEvent
} from './lib/socket-registry-types';

export * from './lib/socket-info.dto'; // Added export for SocketInfoDto

// Authentication helpers (credentials and token responses)
export { __authInterfaces } from './lib/auth-interfaces';
export type { AuthCredentials, AuthTokenResponse } from './lib/auth-interfaces';

// User and auth state definitions
export { UserRole } from './lib/user-types'; // Changed from type export to direct export
export type { User, JwtPayload, AuthState } from './lib/user-types';
export type * from './lib/tile-types';
export type * from './lib/health.type';
export type { DiagnosticEvent, DiagnosticEventResponse } from './lib/diagnostic-types';
export * from './lib/health-timeline'; // Export HealthTimelinePoint and related types
// Removed invalid user-interfaces import
// Export enums and functions from log-types
export { 
  LogLevelEnum, 
  stringToLogLevelEnum, 
  logLevelEnumToString,
  // __logTypes // This specific export might be removed if individual exports are preferred
} from './lib/log-types';
export type { 
  LogLevelString,  
  LogResponse, 
  LogStreamUpdate, // Ensure LogStreamUpdate is exported
  LogStatsResult, 
  LogQueryResponse, 
  LogEntry, 
  LogDto,
  LogFilter // Export LogFilter from log-types
} from './lib/log-types';

export type {
  SecurityEventSeverity,
  SecurityEventStatus,
  SecurityEvent,
  SbomEvent,
  ScaEvent,
  ZapEvent,
  SupplyChainEvent,
  FedRampEvent
} from './lib/security-event';

// Export historical metrics types
export type {
  MetricsInterval,
  MetricsSource,
  MetricsDataPoint,
  MetricsSeries,
  SystemPerformanceSnapshot,
  LogActivitySummary,
  KanbanActivitySummary,  // Changed from KablanActivitySummary
  SecurityMetricsSummary,
  HistoricalMetrics,
  HistoricalMetricsRequest,
  HistoricalMetricsResponse,
  MetricsVisualizationConfig
} from './lib/historical-metrics';

// Export metrics condenser
export { MetricsCondenser } from './lib/metrics-condenser';

// Re-export all type definitions so they can be imported from the library's root
export * from './lib/api-response';
export type { MetricData } from './lib/metrics-types'; // Explicit re-export
export * from './lib/metrics-types'; // Ensure new metrics-types.ts is exported
export * from './lib/socket-types';
export * from './lib/user-types';
export * from './lib/tile-types';
export * from './lib/security-event';

// Import and re-export log-helpers
export * from './lib/log-helpers';

// Export type validation utilities
export {
  validateMetricData,
  validateHealthData,
  validateUser,
  typeValidators,
  registerTypeValidator,
  safeStringify,
  validateHistoricalMetrics,
  validateSystemPerformance
} from './lib/type-validation';

// Export additional type validation types
export type { ValidationResult, TypeValidator } from './lib/type-validation';

// Export ValidatedTypes
export type { ValidatedTypes } from './lib/type-validation';
