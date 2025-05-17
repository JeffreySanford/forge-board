/**
 * This is the main entry point for the shared-api-interfaces library
 */

// Export user and authentication types
export { 
  User, 
  UserRole, 
  JwtPayload,
  AuthState
} from './lib/user-types';

// Health types
export { 
  Health, 
  HealthData, 
  HealthDetail, 
  HealthStatus
} from './lib/health.type';

// Socket types
export {
  SOCKET_EVENTS,
  SocketCommunication,
  SocketMessage
} from './lib/socket-types';

// Socket interface types
export {
  SocketConnectionError,
  SocketLogEvent,
  SocketConnectionInfo,
  SocketEvent,
  SocketMetrics,
  DiagnosticSocketEvent,
  SocketInfo,
  SocketStatusUpdate
} from './lib/socket-interfaces';

// Socket response types
export {
  SocketResponse,
  SocketResponseData,
  SocketResponseType,
  createSocketResponse,
  createSocketErrorResponse
} from './lib/api-response';

// Socket registry types
export {
  SocketRegistry,
  SocketRegistryOptions,
  SocketRegistryEntry,
  RegistryEventTypes
} from './lib/socket-registry-types';

// Metric types
export {
  MetricData,
  ExtendedMetricData,
  MetricResponse,
  MetricFilter,
  MetricUpdate,
  TileType,
  Tile
} from './lib/metrics-types';

// Tile types
export {
  TileLayoutResponse,
  TileLayoutRequest,
  TileVisibility,
  TileResponse,
  TileDragEvent,
  MemoryData
} from './lib/tile-types';

// API interfaces
export {
  ApiResponse,
  UserData,
  ErrorResponse
} from './lib/api-interfaces';

// Auth interfaces
export {
  AuthCredentials,
  AuthTokenResponse,
  AuthState as AuthStateInterface
} from './lib/auth-interfaces';

// Socket utilities
export {
  SocketEventData,
  SocketClientOptions,
  SocketHandler,
  SocketEventRegistry,
  SocketConnectionStatus,
  SocketClient,
  SocketMessageHandler,
  createSocketEventPayload,
  parseSocketResponse,
  isSocketConnected,
  parseSocketError,
  formatSocketError,
  createLogSocketResponse
} from './lib/utils/socket-utils';

// Log types
export {
  LogLevelEnum,
  LogLevelString,
  LogEntry,
  DisplayLogEntry,
  DisplayLogEntryExtended,
  LogDto,
  LogFilter,
  ExtendedLogFilter,
  LogResponse,
  LogStreamUpdate,
  LogStatsResult,
  LogQueryResponse,
  stringToLogLevelEnum,
  logLevelEnumToString
} from './lib/log-types';

// Type validation utilities
export {
  ValidationResult,
  TypeValidationError,
  TypeValidator,
  validateType,
  isSocketResponse,
  isSuccessResponse,
  isErrorResponse,
  validateSocketResponse,
  // Add the missing validation functions
  validateHealthData,
  validateMetricData,
  validateHistoricalMetrics,
  validateDiagnosticEvent,
  validateLogResponse,
  validateUser
} from './lib/type-validation';

// Diagnostic types
export {
  DiagnosticEvent,
  DiagnosticEventResponse
} from './lib/diagnostic-types';

// Historical metrics
export {
  MetricsInterval,
  MetricsSource,
  MetricsDataPoint,
  MetricsSeries,
  SystemPerformanceSnapshot,
  LogActivitySummary,
  KanbanActivitySummary,
  SecurityMetricsSummary,
  HistoricalMetrics,
  HistoricalMetricsRequest,
  HistoricalMetricsResponse,
  MetricsVisualizationConfig
} from './lib/historical-metrics';

// Health timeline
export {
  HealthTimelinePoint,
  HealthTimeline,
  HealthTimelineRequest,
  HealthTimelineResponse
} from './lib/health-timeline';

// Message types
export {
  Message,
  SystemBroadcast,
  UserMessage,
  ActionMessage
} from './lib/message';

// Socket info DTOs
export {
  SocketInfoDto,
  DiagnosticSocketEventDto
} from './lib/socket-info.dto';

// Security event types
export {
  SecurityEvent,
  SecurityEventSeverity,
  SecurityEventStatus,
  SecurityEventType,
  SbomEvent,
  ScaEvent,
  ZapEvent,
  SupplyChainEvent,
  FedRampEvent
} from './lib/security-types';
