/**
 * This is the main entry point for the shared API interfaces library.
 * All types and interfaces should be exported from here to be available to consumers.
 */

// Export everything from lib/index.ts
export * from './lib/index';

// Re-export specific types that are being directly imported
export {
  // From diagnostic-types.ts
  DiagnosticEvent,
  HealthData,
  DiagnosticSocketEvent,
  SocketLogEvent,
  SocketInfo,
  SocketMetrics,
  SocketStatusUpdate,
  SocketConnectionError,

  // From logger-types.ts
  LogLevelType,
  LogEntry,
  LogFilter,
  LogResponse,
  LogStreamUpdate,

  // From metric-types.ts
  MetricData,
  MetricResponse,
  MetricConfig
} from './lib/index';
