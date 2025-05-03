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
export type { DiagnosticEvent, DiagnosticEventResponse, HealthData } from './lib/diagnostic-types';

// Log interfaces
export { LogLevelEnum } from './lib/log-types';
export type { LogLevelString, LogEntry, LogFilter, LogQueryResponse, LogResponse, LogBatchResponse, LogStreamUpdate } from './lib/log-types';
export { stringToLogLevelEnum, logLevelEnumToString } from './lib/log-types';

// Metric interfaces
export type { MetricData, MetricResponse, MetricFilter, MetricUpdate } from './lib/metrics-types';

// Timeline interfaces
export type * from './lib/health-timeline';

// Validation types and functions
export * from './lib/type-validation';

// Constants
export * from './lib/constants';
