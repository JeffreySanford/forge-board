/**
 * This is the main entry point for all types in the library
 */

// User types
export * from './user/user.interface';

// Health related exports
export * from './health/health.interface';
// health-timeline file is missing, removing this export
export * from './health/historical.metric.interface';

// Socket related exports
export {
  SocketResponse,
  SocketResponseData,
  SocketEvent,
  createSocketResponse,
  createSocketEventResponse,
  createSocketErrorResponse,
  adaptSocketResponse,
  isSuccessResponse
} from './socket/socket.interface';

// API related exports
export * from './api/api.interface';

// Metric related exports
export * from './metric/metric.interface';
export * from './metric/metric.condenser';

// Log related exports
export * from './log/log-types';
export * from './log/log-helpers';

// Message related exports
export * from './message';

// Auth related exports
export * from './auth/auth-interfaces';

// JWT related exports - renamed exports to avoid duplicates
export { 
  JwtClaims,
  UserJwtPayload,
  RefreshTokenRequest,
  // Renamed to avoid conflict with AuthTokenResponse from auth-interfaces
  AuthTokenResponse as JwtAuthTokenResponse 
} from './jwt/jwt.interface';
export * from './jwt/jwt-diagnostics.service';

// Security related exports
export * from './security/security.interface';
// Export with rename to avoid duplicates
// Since security.event.ts and security.interface.ts have overlapping types

// Validation related exports
export {
  ValidationResult,
  TypeValidationError,
  Log,
  TypeValidator,
  ValidatedTypes,
  typeValidators,
  registerTypeValidator,
  validateType,
  createTypeValidationError,
  isDiagnosticEvent,
  validateDiagnosticEvent,
  isMetric,
  validateMetricData,
  isSocketResponse,
  isErrorResponse,
  safeStringify,
  validateSocketResponse,
  validateLogResponse,
  isHealthData,
  validateHealthData,
  isUser,
  validateUser,
  validateHistoricalMetrics,
  validateSystemPerformance
} from './validation/validation.interface';

// Tile related exports 
// Rename TileType to avoid conflict with metric.interface
export {
  // Renamed to avoid conflict with TileType from metric.interface
  TileType as TileTyEnum,
  TileDragEvent,
  TileLayoutResponse,
  TileLayoutRequest,
  TileVisibility,
  TileResponse,
  MemoryData
} from './tile/tile.interface';

// Sound related exports
export * from './sound/sound-types';

// Diagnostic related exports
export * from './diagnostic/diagnostic.interface.';

// Crypto related exports
export * from './crypto/crypto.interface';
