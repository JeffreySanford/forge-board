/**
 * This is the main entry point for all types in the library
 */

// Export user and authentication types
export * from './user-types';

// Export health-related types
export * from './health.type';

// Export socket-related types
export {
  SOCKET_EVENTS,
  SocketCommunication,
  SocketMessage
} from './socket-types';

// Export socket interfaces with explicit selections to avoid conflicts
export {
  SocketConnectionInfo,
  SocketEvent,
  SocketMetrics,
  DiagnosticSocketEvent,
  SocketInfo,
  SocketLogEvent,
  SocketStatusUpdate,
  SocketConnectionError
} from './socket-interfaces';

// Export socket registry types
export * from './socket-registry-types';

// Export socket utilities
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
} from './utils/socket-utils';

// Export socket response type from api-response.ts (this is our canonical implementation)
export {
  SocketResponse,
  SocketResponseData,
  SocketResponseType,
  createSocketResponse,
  createSocketErrorResponse
} from './api-response';

// Export metrics-related types
export * from './metrics-types';
export * from './metrics-condenser';
export * from './historical-metrics';

// Export log types
export * from './log-types';

// Export API interfaces
export * from './api-interfaces';

// Selectively export from auth-interfaces to avoid AuthState conflict
export {
  AuthCredentials,
  AuthTokenResponse,
  // Rename AuthState from auth-interfaces to avoid conflict
  AuthState as AuthStateInterface
} from './auth-interfaces';

// Export validation utilities
export * from './type-validation';
