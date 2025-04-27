/**
 * This is the main entry point for the shared API interfaces library.
 * All types and interfaces should be exported from here to be available to consumers.
 */

// Re-export all types from type modules
export * from './lib/api-interfaces';
export * from './lib/socket-types';
export * from './lib/metric-types';
export * from './lib/logger-types';
export * from './lib/tile-types';
export * from './lib/diagnostic-types';
export * from './lib/health-timeline';

// Export all from type-validation
export {
  ValidationResult,
  TypeValidationError,
  TypeValidator,
  typeValidators,
  registerTypeValidator,
  validateType,
  createTypeValidationError,
  isDiagnosticEvent,
  validateDiagnosticEvent,
  isMetricData,
  validateMetricData,
  isSocketResponse,
  isSuccessResponse,
  isErrorResponse,
  validateSocketResponse,
  safeStringify
} from './lib/type-validation';
