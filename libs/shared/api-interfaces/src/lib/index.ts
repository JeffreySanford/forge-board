/**
 * This is the main entry point for all types in the library
 */

// User types
export { UserRole } from './user/user.interface';
export { User, UserPreferences } from './user/user.interface';

// Health related exports
export { HealthStatus } from './health/health.interface';
export { Health, HealthData } from './health/health.interface';

// Metric related exports
export { Metric, ExtendedMetric, MetricResponse, MetricFilter, MetricUpdate } from './metric/metric.interface';
// Import and re-export historical metric interfaces
import { HistoricalHealthMetrics } from './health/historical.metric.interface';
export { 
  SystemPerformanceSnapshot, 
  MetricsDataPoint, 
  MetricsSeries, 
  MetricsInterval,
  MetricsSource,
  ExtendedHealthData,
  LogActivitySummary,
  KanbanActivitySummary,
  SecurityMetricsSummary
} from './health/historical.metric.interface';
export { HistoricalHealthMetrics };
export type HistoricalMetrics = HistoricalHealthMetrics;

// Log related exports
export { 
  LogLevelEnum, 
  stringToLogLevelEnum, 
  logLevelEnumToString,
  LogLevelString, 
  LogEntry, 
  LogDto, 
  LogFilter, 
  LogQueryResponse, 
  LogStatsResult,
  LogResponse,
  LogStreamUpdate,
  ExtendedLogFilter,
  DisplayLogEntry,
  DisplayLogEntryExtended
} from './log/log.interface';

// Message related exports
export type { Message } from './message';

// Auth related exports
export { AuthCredentials, AuthTokenResponse, AuthState } from './auth/auth-interfaces';
export { AuthTokenResponse as AuthTokenResponseJwt } from './auth/auth-interfaces';

// JWT related exports
export { JwtClaims, UserJwtPayload, RefreshTokenRequest, JwtVerificationResult, TokenVerificationOptions } from './jwt/jwt.interface';

// Security related exports
export { SecurityEventSeverity, SecurityEventStatus, SecurityEventType, SecurityEvent, SbomEvent, ScaEvent, ZapEvent, SupplyChainEvent, FedRampEvent } from './security/security.interface';

// Socket related exports
export { 
  SocketResponse, 
  SocketResponseData, 
  SocketEvent, 
  SocketLogEvent, 
  SocketInfo, 
  SocketInfoDto, 
  SocketMetrics, 
  SocketStatusUpdate, 
  DiagnosticSocketEvent,
  LogSocketResponse,
  createSocketResponse,
  createSocketErrorResponse,
  createSocketEventResponse,
  isSuccessResponse,
  isErrorResponse,
  adaptSocketResponse
} from './socket/socket.interface';

// Diagnostic related exports
export { 
  DiagnosticEvent,
  DiagnosticTimelineEvent,
  DiagnosticEventResponse,
  JwtDiagnosticEvent,
  AuthStats, 
  AuthDiagnosticEvent,
  TypeDiagnosticEvent
} from './diagnostic/diagnostic.interface';

// Crypto related exports
export type { HashResult, RandomBytesResult, CryptoService } from './crypto/crypto.interface';

// Validation related exports
export { 
  validateHealthData, 
  validateMetricData, 
  validateSocketResponse, 
  validateLogResponse, 
  isHealthData, 
  isUser,
  validateDiagnosticEvent,
  validateHistoricalMetrics,
  validateSystemPerformance,
  validateType,
  validateUser,
  isDiagnosticEvent,
  isMetric,
  isSocketResponse,
  createTypeValidationError,
  typeValidators,
  registerTypeValidator,
  safeStringify,
  ValidationResult,
  TypeValidator,
  TypeValidationError
} from './validation/validation.interface';

// Constants
export { API_ENDPOINTS, SOCKET_NAMESPACES, TILE_TYPES, FALLBACK_ENDPOINTS } from './constants';

// Tile related exports
export { 
  TileType,
  TileLayoutResponse,
  Tile,
  TileDragEvent
} from './tile/tile.interface';

// API related exports
export { ApiResponse } from './api/api-response.interface';

/**
 * Internal exports for the API interfaces library
 */

export * from './diagnostic/diagnostic.interface';
export * from './jwt/jwt-diagnostics.service';
export * from './validation/validation.interface';
