import { DiagnosticEvent} from './diagnostic-types';
import { SocketResponse } from './socket-types';
import { LogQueryResponse, LogBatchResponse, LogResponse, LogFilter, LogEntry, LogLevelString, LogLevelEnum } from './log-types';
import { User } from './user-types';
import { HealthData } from './health.type';
import { MetricData } from './metrics-types';

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  stringRepresentation?: string;
  typeName?: string;
}

export interface TypeValidationError extends Error {
  typeName: string;
  issues: string[];
  callerInfo: string;
  stringRepresentation?: string;
}

export interface Log {
  level: LogLevelEnum;
  filter: LogFilter | null;
  log(message: string, level?: LogLevelString): LogEntry;
  debug(message: string): LogEntry;
  info(message: string): LogEntry;
  warn(message: string): LogEntry;
  error(message: string, error?: Error): LogEntry;
  fatal(message: string, error?: Error): LogEntry;
  setLevel(level: LogLevelEnum): void;
  getEntries(filter?: LogFilter): LogEntry[];
  clear(): void;
}

export type TypeValidator<T = unknown> = (obj: unknown) => ValidationResult & { 
  _typeInfo?: T
};

export interface ValidatedTypes {
  DiagnosticEvent: DiagnosticEvent;
  MetricData: MetricData;
  User: User;
  SocketResponse: SocketResponse<unknown>;
  LogQueryResponse: LogQueryResponse;
  LogBatchResponse: LogBatchResponse;
  LogResponse: LogResponse;
  [key: string]: unknown;
}

interface TypeValidatorRegistry {
  [typeName: string]: TypeValidator<unknown>;
}

export const typeValidators: TypeValidatorRegistry = {};

export function registerTypeValidator<K extends keyof ValidatedTypes>(
  typeName: K, 
  validator: TypeValidator<ValidatedTypes[K]>
): void {
  typeValidators[typeName] = validator as TypeValidator<unknown>;
}

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
  
  return obj as T;
}

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

export function isSocketResponse<T>(obj: unknown): obj is SocketResponse<T> {
  if (!obj || typeof obj !== 'object') return false;
  
  const response = obj as Partial<SocketResponse<unknown>>;
  
  return (
    (response.status === 'success' || response.status === 'error') &&
    'data' in response &&
    typeof response.timestamp === 'string'
  );
}

export function isSuccessResponse<T>(obj: unknown): obj is SocketResponse<T> {
  return isSocketResponse(obj) && obj.status === 'success';
}

export function isErrorResponse<T>(obj: unknown): obj is SocketResponse<T> {
  return isSocketResponse(obj) && obj.status === 'error';
}

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
    for (const log of response.logs) {
      if (typeof log !== 'object' || log === null) {
        issues.push('Each log entry must be an object');
        break;
      }
    }
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

export function validateLogBatchResponse(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Expected an object');
    return { valid: false, issues };
  }
  
  const response = obj as Partial<LogBatchResponse>;
  
  if (typeof response.success !== 'boolean') {
    issues.push('success must be a boolean');
  }
  
  if (response.count !== undefined && typeof response.count !== 'number') {
    issues.push('count must be a number if present');
  }
  
  if (response.timestamp !== undefined && typeof response.timestamp !== 'string') {
    issues.push('timestamp must be a string if present');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    typeName: 'LogBatchResponse',
    stringRepresentation: safeStringify(obj)
  };
}

export function isHealthData(obj: unknown): obj is HealthData {
  if (!obj || typeof obj !== 'object') return false;
  
  const health = obj as Partial<HealthData>;
  
  return (
    typeof health.status === 'string' &&
    typeof health.uptime === 'number' &&
    typeof health.timestamp === 'string' &&
    typeof health.details === 'object' &&
    health.details !== null
  );
}

export function validateHealthData(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Expected an object');
    return { valid: false, issues };
  }
  
  const health = obj as Partial<HealthData>;
  
  if (!health.status) issues.push('Missing status');
  else if (typeof health.status !== 'string') issues.push('status must be a string');
  else if (!['healthy', 'degraded', 'unhealthy', 'unknown', 'simulated'].includes(health.status)) {
    issues.push('status must be one of: healthy, degraded, unhealthy, unknown, simulated');
  }
  
  if (health.uptime === undefined) issues.push('Missing uptime');
  else if (typeof health.uptime !== 'number') issues.push('uptime must be a number');
  
  if (!health.timestamp) issues.push('Missing timestamp');
  else if (typeof health.timestamp !== 'string') issues.push('timestamp must be a string');
  
  if (!health.details) issues.push('Missing details');
  else if (typeof health.details !== 'object') issues.push('details must be an object');
  
  return {
    valid: issues.length === 0,
    issues,
    typeName: 'HealthData',
    stringRepresentation: safeStringify(obj)
  };
}

export function isUser(obj: unknown): obj is User {
  if (!obj || typeof obj !== 'object') return false;
  
  const user = obj as Partial<User>;
  
  return (
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    (user.role === 'admin' || user.role === 'user' || user.role === 'guest')
  );
}

export function validateUser(obj: unknown): ValidationResult {
  const issues: string[] = [];
  
  if (!obj || typeof obj !== 'object') {
    issues.push('Expected an object');
    return { valid: false, issues };
  }
  
  const user = obj as Partial<User>;
  
  if (!user.id) issues.push('Missing id');
  else if (typeof user.id !== 'string') issues.push('id must be a string');
  
  if (!user.username) issues.push('Missing username');
  else if (typeof user.username !== 'string') issues.push('username must be a string');
  
  if (!user.role) issues.push('Missing role');
  else if (typeof user.role !== 'string') issues.push('role must be a string');
  else if (!['admin', 'user', 'guest'].includes(user.role)) {
    issues.push('role must be one of: admin, user, guest');
  }
  
  if (user.email !== undefined && typeof user.email !== 'string') {
    issues.push('email must be a string if present');
  }
  
  if (user.lastLogin !== undefined && typeof user.lastLogin !== 'string') {
    issues.push('lastLogin must be a string if present');
  }
  
  if (user.guestExpiry !== undefined && typeof user.guestExpiry !== 'string') {
    issues.push('guestExpiry must be a string if present');
  }
  
  if (user.preferences !== undefined && (typeof user.preferences !== 'object' || user.preferences === null)) {
    issues.push('preferences must be an object if present');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    typeName: 'User',
    stringRepresentation: safeStringify(obj)
  };
}

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

export const validators = {
  typeValidators,
  registerTypeValidator,
  validateType,
  createTypeValidationError,
  isDiagnosticEvent,
  validateDiagnosticEvent,
  isMetricData,
  validateMetricData,
  isHealthData,
  validateHealthData,
  isUser,
  validateUser,
  isSocketResponse,
  isSuccessResponse,
  isErrorResponse,
  validateSocketResponse,
  validateLogResponse,
  validateLogBatchResponse,
  safeStringify
};
