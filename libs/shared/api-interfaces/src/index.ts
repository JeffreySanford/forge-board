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
export type { SocketResponse, SocketEvent, SocketLogEvent, SocketInfo, SocketMetrics, SocketStatusUpdate, SocketConnectionError } from './lib/socket-types';
export type * from './lib/socket-registry-types';

// Authentication helpers (credentials and token responses)
export { __authInterfaces } from './lib/auth-interfaces';
export type { AuthCredentials, AuthTokenResponse } from './lib/auth-interfaces';

// User and auth state definitions
export { UserRole } from './lib/user-types'; // Changed from type export to direct export
export type { User, JwtPayload, AuthState } from './lib/user-types';

// Tile interfaces
export type * from './lib/tile-types';

// Health interfaces
export type * from './lib/health.type';

// Diagnostic interfaces
export type { DiagnosticEvent, DiagnosticEventResponse } from './lib/diagnostic-types';

// Export log-related types and interfaces
export type {
  LogLevelString,
  LogEntry,
  LogDto,
  LogFilter,
  LogQueryResponse,
  LogResponse,
  LogStreamUpdate,
  LogStatsResult
} from './lib/log-types';

// Export security event types and interfaces
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

// Re-export all type definitions so they can be imported from the library's root
export * from './lib/api-response';
export * from './lib/metric-types';
export * from './lib/socket-types';
export * from './lib/user-types';
export * from './lib/tile-types';
export * from './lib/log-types';
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
  safeStringify
} from './lib/type-validation';

// Export additional type validation types
export type { ValidationResult, TypeValidator } from './lib/type-validation';

// Export ValidatedTypes
export type { ValidatedTypes } from './lib/type-validation';
