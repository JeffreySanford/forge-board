/**
 * Shared services index
 * 
 * This file exports all shared services and utilities for reuse across 
 * both front-end and back-end components of the ForgeBoard application.
 */

// Core service exports
export * from '@forge-board/shared/api-interfaces';

// Browser compatibility layer
export * from '../../../forgeboard-frontend/src/app/utils/browser-compat';

// Socket services
export * from '../../../forgeboard-frontend/src/app/core/services/socket';

// Crypto utilities 
export * from '../../../forgeboard-frontend/src/app/utils/token-encryption';

// Core services
export * from './core';

// Socket response types
export * from '../../../shared/types/socket-responses';

/**
 * Reexport shared types specifically for services 
 * This provides better discoverability for service-related types
 */
export {
  // Socket-related types
  SocketInfo,
  SocketStatusUpdate,
  SocketMetrics,
  SocketResponse,
  SocketLogEvent,
  
  // Auth-related types
  User,
  UserRole,
  
  // Metrics and health types
  Metric,
  HealthData,
  HistoricalMetrics,
  SystemPerformanceSnapshot,
  
  // Type validation
  TypeValidator,
  ValidationResult,
  
  // Crypto related types
  HashResult,
  RandomBytesResult,
  CryptoService as ICryptoService
} from '@forge-board/shared/api-interfaces';

/**
 * Service status for tracking health of service connections
 */
export interface ServiceStatus {
  connected: boolean;
  mockMode: boolean;
  lastConnection?: string;
  errors?: number;
}
