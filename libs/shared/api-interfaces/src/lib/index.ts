/**
 * Library internal index file
 * 
 * This file re-exports all type definitions from the library's internal modules.
 * The main index.ts in the parent directory selectively re-exports these for consumers.
 */

// Core API interfaces
export * from './api-interfaces';

// Socket related types
export { 
  SocketStatus,
  SOCKET_EVENTS,
  SocketEvent,
  SocketResponse,
  createSocketResponse,
  createErrorResponse,
  socketTypes
} from './socket-types';

// Socket registry types
export { 
  SocketInfo,
  SocketMetrics, 
  SocketLogEvent,
  SocketStatusUpdate,
  SocketConnectionError,
  DiagnosticSocketEvent
} from './socket-registry-types';

// Logging types
export * from './log-types';

// Metrics and diagnostics
export {  
  MetricData, 
  MetricUpdate,
  MetricFilter,
  MetricResponse
} from './metrics-types';

export * from './diagnostic-types';

// Tile UI components
export * from './tile-types';

// Type validation utilities
export * from './type-validation';

// User and authentication - exported explicitly to avoid conflicts
export { 
  User,
  UserRole,
  JwtPayload,
  AuthState 
} from './user.interface';

export * from './user-types';

// Health monitoring - fix the path to use health-timeline instead of health-time
export * from './health-timeline';

export * from './diagnostic-types';
export * from './log-types';
export * from './metrics-types';
export * from './socket-types';
