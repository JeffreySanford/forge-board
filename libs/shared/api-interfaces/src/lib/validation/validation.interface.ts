import { DiagnosticEvent, JwtDiagnosticEvent, TypeDiagnosticEvent } from '../diagnostic/diagnostic.interface';

export {
  DiagnosticEvent,
  JwtDiagnosticEvent,
  TypeDiagnosticEvent
};

/**
 * Result of a type validation operation
 */
export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

/**
 * Detailed validation error information
 */
export interface TypeValidationError {
  path: string;
  message: string;
  value?: unknown;
  code: string;
}

/**
 * Log entry for validation operations
 */
export interface Log {
  level: string;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

/**
 * Type validator function signature
 */
export interface TypeValidator<T> {
  (obj: unknown): ValidationResult & { value?: T };
}

/**
 * Supported validated types mapping
 */
export interface ValidatedTypes {
  DiagnosticEvent: DiagnosticEvent;
  HealthData: Record<string, unknown>;
  Metric: Record<string, unknown>;
  SocketResponse: Record<string, unknown>;
  User: Record<string, unknown>;
  HistoricalMetrics: Record<string, unknown>;
  SystemPerformance: Record<string, unknown>;
  LogResponse: Record<string, unknown>;
}

/**
 * Registry of available type validators
 */
export const typeValidators: Record<string, TypeValidator<unknown>> = {};

/**
 * Register a type validator function
 */
export function registerTypeValidator<K extends keyof ValidatedTypes>(
  type: K, 
  validator: TypeValidator<ValidatedTypes[K]>
): void {
  typeValidators[type] = validator as TypeValidator<unknown>;
}

/**
 * Validate a value against a registered type
 */
export function validateType<K extends keyof ValidatedTypes>(
  value: unknown, 
  type: K
): ValidatedTypes[K] {
  const validator = typeValidators[type];
  if (!validator) {
    throw new Error(`No validator registered for type: ${type}`);
  }

  const result = validator(value);
  if (!result.valid) {
    throw new Error(`Validation failed for type ${type}: ${result.issues.join(', ')}`);
  }

  return value as ValidatedTypes[K];
}

/**
 * Create a type validation error
 */
export function createTypeValidationError(
  path: string, 
  message: string, 
  value?: unknown, 
  code = 'invalid_type'
): TypeValidationError {
  return { path, message, value, code };
}

/**
 * Type guard for DiagnosticEvent
 */
export function isDiagnosticEvent(obj: unknown): obj is DiagnosticEvent {
  if (!obj || typeof obj !== 'object') return false;
  
  const event = obj as Partial<DiagnosticEvent>;
  return (
    typeof event.id === 'string' &&
    typeof event.timestamp === 'string' &&
    typeof event.type === 'string' &&
    typeof event.eventType === 'string' &&
    typeof event.source === 'string' &&
    typeof event.message === 'string'
  );
}

/**
 * Validate DiagnosticEvent
 */
export function validateDiagnosticEvent(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Object is null or not an object');
    return { valid: false, issues };
  }
  
  const event = obj as Partial<DiagnosticEvent>;
  
  if (typeof event.id !== 'string') issues.push('Missing or invalid id (string)');
  if (typeof event.timestamp !== 'string') issues.push('Missing or invalid timestamp (string)');
  if (typeof event.type !== 'string') issues.push('Missing or invalid type (string)');
  if (typeof event.eventType !== 'string') issues.push('Missing or invalid eventType (string)');
  if (typeof event.source !== 'string') issues.push('Missing or invalid source (string)');
  if (typeof event.message !== 'string') issues.push('Missing or invalid message (string)');
  
  return { valid: issues.length === 0, issues };
}

/**
 * Type guard for Metric data
 */
export function isMetric(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  const metric = obj as Record<string, unknown>;
  return (
    typeof metric.name === 'string' &&
    typeof metric.value !== 'undefined' &&
    typeof metric.timestamp === 'string'
  );
}

/**
 * Validate metric data
 */
export function validateMetricData(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Object is null or not an object');
    return { valid: false, issues };
  }
  
  const metric = obj as Record<string, unknown>;
  
  if (typeof metric.name !== 'string') issues.push('Missing or invalid name (string)');
  if (typeof metric.value === 'undefined') issues.push('Missing value');
  if (typeof metric.timestamp !== 'string') issues.push('Missing or invalid timestamp (string)');
  
  return { valid: issues.length === 0, issues };
}

/**
 * Type guard for socket response
 */
export function isSocketResponse(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  const response = obj as Record<string, unknown>;
  return (
    typeof response.status === 'string' &&
    ['success', 'error'].includes(response.status as string) &&
    typeof response.data !== 'undefined' &&
    typeof response.timestamp === 'string'
  );
}

/**
 * Type guard for error response
 */
export function isErrorResponse(obj: unknown): boolean {
  if (!isSocketResponse(obj)) return false;
  
  const response = obj as Record<string, unknown>;
  return response.status === 'error';
}

/**
 * Safely stringify an object
 */
export function safeStringify(obj: unknown, maxLength = 1000): string {
  try {
    const str = JSON.stringify(obj);
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '...';
    }
    return str;
  } catch (e) {
    return '[Unable to stringify]';
  }
}

/**
 * Validate socket response
 */
export function validateSocketResponse(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Object is null or not an object');
    return { valid: false, issues };
  }
  
  const response = obj as Record<string, unknown>;
  
  if (typeof response.status !== 'string') issues.push('Missing or invalid status (string)');
  else if (!['success', 'error'].includes(response.status as string)) {
    issues.push('Status must be either "success" or "error"');
  }
  
  if (typeof response.data === 'undefined') issues.push('Missing data property');
  if (typeof response.timestamp !== 'string') issues.push('Missing or invalid timestamp (string)');
  
  return { valid: issues.length === 0, issues };
}

/**
 * Validate log response
 */
export function validateLogResponse(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Object is null or not an object');
    return { valid: false, issues };
  }
  
  const response = obj as Record<string, unknown>;
  
  if (!Array.isArray(response.logs)) issues.push('Missing or invalid logs (array)');
  if (typeof response.totalCount !== 'number') issues.push('Missing or invalid totalCount (number)');
  if (typeof response.timestamp !== 'string') issues.push('Missing or invalid timestamp (string)');
  
  return { valid: issues.length === 0, issues };
}

/**
 * Type guard for health data
 */
export function isHealthData(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  const health = obj as Record<string, unknown>;
  return (
    typeof health.status === 'string' &&
    typeof health.uptime === 'number' &&
    typeof health.timestamp === 'string'
  );
}

/**
 * Validate health data
 */
export function validateHealthData(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Object is null or not an object');
    return { valid: false, issues };
  }
  
  const health = obj as Record<string, unknown>;
  
  if (typeof health.status !== 'string') issues.push('Missing or invalid status (string)');
  if (typeof health.uptime !== 'number') issues.push('Missing or invalid uptime (number)');
  if (typeof health.timestamp !== 'string') issues.push('Missing or invalid timestamp (string)');
  
  return { valid: issues.length === 0, issues };
}

/**
 * Type guard for user data
 */
export function isUser(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  const user = obj as Record<string, unknown>;
  return (
    typeof user.id === 'string' &&
    typeof user.username === 'string'
  );
}

/**
 * Validate user data
 */
export function validateUser(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Object is null or not an object');
    return { valid: false, issues };
  }
  
  const user = obj as Record<string, unknown>;
  
  if (typeof user.id !== 'string') issues.push('Missing or invalid id (string)');
  if (typeof user.username !== 'string') issues.push('Missing or invalid username (string)');
  
  return { valid: issues.length === 0, issues };
}

/**
 * Validate historical metrics
 */
export function validateHistoricalMetrics(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Object is null or not an object');
    return { valid: false, issues };
  }
  
  const metrics = obj as Record<string, unknown>;
  
  if (!Array.isArray(metrics.data)) issues.push('Missing or invalid data (array)');
  if (typeof metrics.timeRange !== 'object') issues.push('Missing or invalid timeRange (object)');
  
  return { valid: issues.length === 0, issues };
}

/**
 * Validate system performance data
 */
export function validateSystemPerformance(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Object is null or not an object');
    return { valid: false, issues };
  }
  
  const perf = obj as Record<string, unknown>;
  
  if (typeof perf.cpu !== 'number') issues.push('Missing or invalid cpu (number)');
  if (typeof perf.memory !== 'number') issues.push('Missing or invalid memory (number)');
  if (typeof perf.timestamp !== 'string') issues.push('Missing or invalid timestamp (string)');
  
  return { valid: issues.length === 0, issues };
}
