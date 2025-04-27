/**
 * Type validation utilities for runtime type checking
 */
import { DiagnosticEvent } from './diagnostic-types';
import { MetricData } from './metric-types';
import { SocketResponse } from './socket-types';
import { LogResponse } from './logger-types';

/**
 * Result of a type validation
 */
export interface ValidationResult {
  valid: boolean;
  issues: string[];
  stringRepresentation?: string; // Added to ensure objects have string representation
  typeName?: string; // Added to track type name in validation result
}

/**
 * Type validation error with structured information
 */
export interface TypeValidationError extends Error {
  typeName: string;
  issues: string[];
  callerInfo: string;
  stringRepresentation?: string; // Added for string representation of invalid data
}

/**
 * Function type for validators that can be registered
 */
export type TypeValidator<T = unknown> = (obj: unknown) => ValidationResult;

// Global registry of type validators
interface TypeValidatorRegistry {
  [typeName: string]: TypeValidator<unknown>;
}

// Initialize the validator registry
export const typeValidators: TypeValidatorRegistry = {};

/**
 * Register a type validator in the global registry
 */
export function registerTypeValidator<T>(
  typeName: string, 
  validator: TypeValidator<T>
): void {
  typeValidators[typeName] = validator as TypeValidator<unknown>;
}

/**
 * Validate an object against a registered type
 */
export function validateType<T>(
  obj: unknown, 
  typeName: string, 
  callerInfo = 'unknown'
): T {
  const validator = typeValidators[typeName];
  
  if (!validator) {
    throw new Error(`No validator registered for type: ${typeName}`);
  }
  
  const result = validator(obj);
  
  if (!result.valid) {
    throw createTypeValidationError(
      typeName,
      result.issues,
      callerInfo,
      typeof obj === 'object' && obj !== null 
        ? JSON.stringify(obj, null, 2) 
        : String(obj)
    );
  }
  
  // Using T here to fix the unused type parameter warning
  return obj as T;
}

/**
 * Create a type validation error with structured information
 */
export function createTypeValidationError(
  typeName: string,
  issues: string[],
  callerInfo: string,
  stringRepresentation?: string
): TypeValidationError {
  const error = new Error(
    `Invalid ${typeName}: ${issues.join(', ')}`
  ) as TypeValidationError;
  
  error.name = 'TypeValidationError';
  error.typeName = typeName;
  error.issues = issues;
  error.callerInfo = callerInfo;
  error.stringRepresentation = stringRepresentation;
  
  return error;
}

/**
 * Check if an object is a DiagnosticEvent
 */
export function isDiagnosticEvent(obj: unknown): obj is DiagnosticEvent {
  if (!obj || typeof obj !== 'object') return false;
  
  const event = obj as Partial<DiagnosticEvent>;
  
  return (
    typeof event.id === 'string' &&
    typeof event.timestamp === 'string' &&
    typeof event.type === 'string' &&
    typeof event.eventType === 'string' &&
    typeof event.message === 'string' &&
    typeof event.source === 'string'
  );
}

/**
 * Validate a DiagnosticEvent
 */
export function validateDiagnosticEvent(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Expected an object');
    return { valid: false, issues };
  }
  
  const event = obj as Partial<DiagnosticEvent>;
  
  if (!event.id) issues.push('Missing id');
  else if (typeof event.id !== 'string') issues.push('id must be a string');
  
  if (!event.timestamp) issues.push('Missing timestamp');
  else if (typeof event.timestamp !== 'string') issues.push('timestamp must be a string');
  
  if (!event.type) issues.push('Missing type');
  else if (typeof event.type !== 'string') issues.push('type must be a string');
  
  if (!event.eventType) issues.push('Missing eventType');
  else if (typeof event.eventType !== 'string') issues.push('eventType must be a string');
  
  if (!event.message) issues.push('Missing message');
  else if (typeof event.message !== 'string') issues.push('message must be a string');
  
  if (!event.source) issues.push('Missing source');
  else if (typeof event.source !== 'string') issues.push('source must be a string');
  
  return {
    valid: issues.length === 0,
    issues,
    typeName: 'DiagnosticEvent',
    stringRepresentation: safeStringify(obj)
  };
}

/**
 * Check if an object is MetricData
 */
export function isMetricData(obj: unknown): obj is MetricData {
  if (!obj || typeof obj !== 'object') return false;
  
  const metric = obj as Partial<MetricData>;
  
  return (
    typeof metric.cpu === 'number' &&
    typeof metric.memory === 'number' &&
    typeof metric.time === 'string' &&
    typeof metric.disk === 'number' &&
    typeof metric.network === 'number'
  );
}

/**
 * Validate MetricData
 */
export function validateMetricData(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Expected an object');
    return { valid: false, issues };
  }
  
  const metric = obj as Partial<MetricData>;
  
  if (metric.cpu === undefined) issues.push('Missing cpu');
  else if (typeof metric.cpu !== 'number') issues.push('cpu must be a number');
  
  if (metric.memory === undefined) issues.push('Missing memory');
  else if (typeof metric.memory !== 'number') issues.push('memory must be a number');
  
  if (!metric.time) issues.push('Missing time');
  else if (typeof metric.time !== 'string') issues.push('time must be a string');
  
  if (metric.disk === undefined) issues.push('Missing disk');
  else if (typeof metric.disk !== 'number') issues.push('disk must be a number');
  
  if (metric.network === undefined) issues.push('Missing network');
  else if (typeof metric.network !== 'number') issues.push('network must be a number');
  
  return {
    valid: issues.length === 0,
    issues,
    typeName: 'MetricData',
    stringRepresentation: safeStringify(obj)
  };
}

/**
 * Check if an object is a socket response
 */
export function isSocketResponse<T>(obj: unknown): obj is SocketResponse<T> {
  if (!obj || typeof obj !== 'object') return false;
  
  const response = obj as Partial<SocketResponse<unknown>>;
  
  return (
    (response.status === 'success' || response.status === 'error') &&
    'data' in response &&
    typeof response.timestamp === 'string'
  );
}

/**
 * Check if an object is a success response
 */
export function isSuccessResponse<T>(obj: unknown): obj is SocketResponse<T> {
  return isSocketResponse(obj) && obj.status === 'success';
}

/**
 * Check if an object is an error response
 */
export function isErrorResponse<T>(obj: unknown): obj is SocketResponse<T> {
  return isSocketResponse(obj) && obj.status === 'error';
}

/**
 * Validate SocketResponse
 */
export function validateSocketResponse<T>(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Expected an object');
    return { valid: false, issues };
  }
  
  const response = obj as Partial<SocketResponse<T>>;
  
  if (!response.status) {
    issues.push('Missing status');
  } else if (response.status !== 'success' && response.status !== 'error') {
    issues.push('status must be "success" or "error"');
  }
  
  if (!('data' in response)) {
    issues.push('Missing data property');
  }
  
  if (!response.timestamp) issues.push('Missing timestamp');
  else if (typeof response.timestamp !== 'string') issues.push('timestamp must be a string');
  
  return {
    valid: issues.length === 0,
    issues,
    typeName: 'SocketResponse',
    stringRepresentation: safeStringify(obj)
  };
}

/**
 * Validate LogResponse
 */
export function validateLogResponse(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Expected an object');
    return { valid: false, issues };
  }
  
  const response = obj as Partial<LogResponse>;
  
  if (typeof response.status !== 'boolean') {
    issues.push('status must be a boolean');
  }
  
  if (!Array.isArray(response.logs)) {
    issues.push('logs must be an array');
  } else {
    // Optional: validate each log entry in the array
  }
  
  if (typeof response.totalCount !== 'number') {
    issues.push('totalCount must be a number');
  }
  
  if (typeof response.filtered !== 'boolean' && response.filtered !== undefined) {
    issues.push('filtered must be a boolean if present');
  }
  
  if (typeof response.timestamp !== 'string' && response.timestamp !== undefined) {
    issues.push('timestamp must be a string if present');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    typeName: 'LogResponse',
    stringRepresentation: safeStringify(obj)
  };
}

/**
 * Safely stringify an object for logging, handling circular references
 */
export function safeStringify(obj: unknown): string {
  try {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular Reference]';
        }
        cache.add(value);
      }
      return value;
    }, 2);
  } catch (e) {
    return String(obj);
  }
}

// Make sure this is exported properly
export const validators = {
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
  validateLogResponse,
  safeStringify
};
