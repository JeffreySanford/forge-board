import { Injectable, Optional } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
import {
  typeValidators,
  registerTypeValidator,
  validateMetricData,
  safeStringify,
  TypeValidator,
  ValidationResult,
  ValidatedTypes,
  validateHealthData,
  validateUser,
  User,
  LogQueryResponse,
  LogResponse
} from '@forge-board/shared/api-interfaces';
import { LoggerService } from './logger.service';

/**
 * Type validation error with detailed information
 */
export interface TypeDiagnosticEvent {
  id: string;
  timestamp: string;
  typeName: string;
  callerInfo: string;
  valid: boolean;
  issues: string[];
  data?: unknown;
  stringRepresentation?: string;
}

/**
 * Custom types that extend ValidatedTypes
 */
interface CustomValidatedTypes {
  LogQueryResponse: LogQueryResponse;
  LogResponse: LogResponse;
  User: User;
  HealthData: import('@forge-board/shared/api-interfaces').HealthData; // Add HealthData
}

/**
 * Interface for generic validation object with common properties
 */
export interface ValidationObject {
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class TypeDiagnosticsService {
  private diagnosticEvents: TypeDiagnosticEvent[] = [];
  private eventsSubject = new BehaviorSubject<TypeDiagnosticEvent[]>([]);
  
  // Local validators registry with proper generic typing
  private validators: Record<string, TypeValidator<unknown>> = {...typeValidators};
  
  constructor(@Optional() private logger?: LoggerService) { 
    // Use safe logging with optional logger
    this.safeLog('info', 'TypeDiagnosticsService initializing...', {
      service: 'TypeDiagnosticsService',
      action: 'initialize'
    });
    
    // Register built-in validators with proper type casting
    this.registerValidator<'MetricData'>('MetricData', validateMetricData);
    
    // Add HealthData validator
    this.registerValidator<'HealthData'>('HealthData', validateHealthData);
    
    // Add User validator
    this.registerValidator<'User'>('User', validateUser);
    
    // Use custom types for our validators
    this.registerValidator<'LogQueryResponse'>('LogQueryResponse', 
      this.validateLogQueryResponse.bind(this) as TypeValidator<LogQueryResponse>);
    
    // Add validator for LogResponse with proper typing
    this.registerValidator<'LogResponse'>('LogResponse', 
      this.validateLogResponse.bind(this) as TypeValidator<LogResponse>);
    
    this.safeLog('info', 'TypeDiagnosticsService initialized successfully', {
      service: 'TypeDiagnosticsService',
      action: 'initialize',
      validatorsCount: Object.keys(this.validators).length
    });
  }
  
  // Safe logging method to handle optional logger
  private safeLog(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
    if (this.logger) {
      switch (level) {
        case 'debug': this.logger.debug(message, 'TypeDiagnosticsService', meta); break;
        case 'info': this.logger.info(message, 'TypeDiagnosticsService', meta); break;
        case 'warn': this.logger.warning(message, 'TypeDiagnosticsService', meta); break;
        case 'error': this.logger.error(message, 'TypeDiagnosticsService', meta); break;
      }
    } else {
      console[level](`[TypeDiagnosticsService] ${message}`, meta);
    }
  }

  /**
   * Register a validator for a specific type
   * @param typeName The name of the type to validate
   * @param validator The validation function
   */
  registerValidator<K extends keyof ValidatedTypes>(typeName: K, validator: TypeValidator<ValidatedTypes[K]>): void;
  registerValidator<K extends keyof CustomValidatedTypes>(typeName: K, validator: TypeValidator<CustomValidatedTypes[K]>): void;
  registerValidator(typeName: string, validator: TypeValidator<unknown>): void {
    this.validators[typeName] = validator as TypeValidator<unknown>;
    
    // Only register in the shared library if it's likely a built-in type
    // This prevents errors with incompatible ValidatedTypes interfaces
    if (Object.keys(typeValidators).includes(typeName)) {
      try {
        // Create a type-safe wrapper that bypasses the constraint check
        const safeRegister = (name: string, fn: TypeValidator<unknown>) => {
          // Fix: Use a properly typed function signature instead of 'Function' type
          const typedRegisterFn: (type: string, validator: TypeValidator<unknown>) => void = 
            registerTypeValidator as unknown as (type: string, validator: TypeValidator<unknown>) => void;
          typedRegisterFn(name, fn);
        };
        
        // Register using our safe wrapper
        safeRegister(typeName, validator);
        
        this.safeLog('debug', `Validator for ${typeName} registered in shared library`, {
          service: 'TypeDiagnosticsService',
          action: 'registerValidator',
          types: {
            built_in: Object.keys(typeValidators),
            custom: Object.keys(this.validators).filter(k => !Object.keys(typeValidators).includes(k))
          }
        });
      } catch (error) {
        // If registration fails, log it but continue - the validator is still registered locally
        this.safeLog('warn', `Failed to register ${typeName} in shared library: ${error instanceof Error ? error.message : String(error)}`, {
          service: 'TypeDiagnosticsService',
          action: 'registerValidator',
          typeName
        });
      }
    } else {
      // Custom type - only register locally
      this.safeLog('debug', `Custom validator for ${typeName} registered locally only`, {
        service: 'TypeDiagnosticsService',
        action: 'registerValidator'
      });
    }
    
    this.safeLog('info', `Registered validator for type: ${typeName}`, {
      service: 'TypeDiagnosticsService',
      action: 'registerValidator',
      typeName,
      validatorsCount: Object.keys(this.validators).length
    });
  }
  
  /**
   * Validate an object against its expected type
   * @param obj The object to validate
   * @param typeName The expected type name
   * @param callerInfo Information about the calling context
   * @returns The validated object (for chaining)
   */
  validateType<T>(obj: unknown, typeName: string, callerInfo: string): T {
    this.safeLog('debug', `Validating object against type: ${typeName}`, {
      service: 'TypeDiagnosticsService',
      action: 'validateType',
      typeName,
      callerInfo
    });
    
    // Find the validator
    const validator = this.validators[typeName] || typeValidators[typeName];
    
    if (!validator) {
      const event: TypeDiagnosticEvent = {
        id: uuid(),
        timestamp: new Date().toISOString(),
        typeName,
        callerInfo,
        valid: false,
        issues: [`No validator registered for type: ${typeName}`],
        data: obj,
        stringRepresentation: safeStringify(obj)
      };
      
      this.recordEvent(event);
      this.safeLog('error', `No validator found for type: ${typeName}`, {
        service: 'TypeDiagnosticsService', 
        action: 'validateType',
        typeName,
        callerInfo,
        eventId: event.id
      });
      
      return obj as T; // Return as-is since we can't validate
    }
    
    // Run validation
    try {
      const result = validator(obj);
      
      const event: TypeDiagnosticEvent = {
        id: uuid(),
        timestamp: new Date().toISOString(),
        typeName,
        callerInfo,
        valid: result.valid,
        issues: result.issues,
        data: result.valid ? undefined : obj,
        stringRepresentation: result.stringRepresentation || safeStringify(obj)
      };
      
      this.recordEvent(event);
      
      if (result.valid) {
        this.safeLog('debug', `Successfully validated object of type: ${typeName}`, {
          service: 'TypeDiagnosticsService',
          action: 'validateType',
          typeName,
          callerInfo,
          eventId: event.id,
          valid: true
        });
      } else {
        this.safeLog('warn', `Validation failed for type: ${typeName}`, {
          service: 'TypeDiagnosticsService',
          action: 'validateType',
          typeName,
          callerInfo,
          eventId: event.id,
          issues: result.issues,
          valid: false
        });
      }
      
      return obj as T;
    } catch (error) {
      // Handle errors in the validator itself
      const errorMessage = error instanceof Error ? error.message : String(error);
      const event: TypeDiagnosticEvent = {
        id: uuid(),
        timestamp: new Date().toISOString(),
        typeName,
        callerInfo,
        valid: false,
        issues: [`Validator error: ${errorMessage}`],
        data: obj,
        stringRepresentation: safeStringify(obj)
      };
      
      this.recordEvent(event);
      
      this.safeLog('error', `Validator execution error for type: ${typeName}`, {
        service: 'TypeDiagnosticsService',
        action: 'validateType',
        typeName,
        callerInfo,
        eventId: event.id,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return obj as T;
    }
  }
  
  /**
   * Get diagnostic events as an observable
   */
  getDiagnosticEvents(): Observable<TypeDiagnosticEvent[]> {
    this.safeLog('debug', 'Getting diagnostic events', {
      service: 'TypeDiagnosticsService',
      action: 'getDiagnosticEvents',
      eventsCount: this.diagnosticEvents.length
    });
    return this.eventsSubject.asObservable();
  }
  
  /**
   * Clear all diagnostic events
   */
  clearEvents(): void {
    const previousCount = this.diagnosticEvents.length;
    this.diagnosticEvents = [];
    this.eventsSubject.next(this.diagnosticEvents);
    
    this.safeLog('info', `Cleared all diagnostic events`, {
      service: 'TypeDiagnosticsService',
      action: 'clearEvents',
      previousCount
    });
  }
  
  /**
   * Get all available type validators
   */
  getRegisteredValidators(): string[] {
    const validators = Object.keys(this.validators);
    
    this.safeLog('debug', 'Retrieved registered validators', {
      service: 'TypeDiagnosticsService',
      action: 'getRegisteredValidators',
      count: validators.length,
      validators
    });
    
    return validators;
  }
  
  /**
   * Internal method to record a diagnostic event
   */
  private recordEvent(event: TypeDiagnosticEvent): void {
    this.diagnosticEvents.unshift(event); // Add to beginning
    
    // Limit size to prevent memory issues
    if (this.diagnosticEvents.length > 100) {
      this.diagnosticEvents.pop(); // Remove oldest
    }
    
    this.eventsSubject.next([...this.diagnosticEvents]);
    
    // Log validation failures for easier debugging
    if (!event.valid) {
      this.safeLog('warn', `Validation failed for type: ${event.typeName}`, {
        service: 'TypeDiagnosticsService',
        action: 'recordEvent',
        eventId: event.id,
        typeName: event.typeName,
        callerInfo: event.callerInfo,
        issues: event.issues,
        data: event.stringRepresentation || safeStringify(event.data)
      });
    } else {
      this.safeLog('debug', `Recorded successful validation event`, {
        service: 'TypeDiagnosticsService',
        action: 'recordEvent',
        eventId: event.id,
        typeName: event.typeName
      });
    }
  }
  
  /**
   * Validator for LogQueryResponse type
   */
  private validateLogQueryResponse(obj: unknown): ValidationResult {
    const issues: string[] = [];
    
    if (!obj || typeof obj !== 'object') {
      issues.push('Expected an object');
      return { valid: false, issues };
    }
    
    const logObj = obj as ValidationObject;
    
    if (typeof logObj['status'] !== 'boolean') issues.push('status must be a boolean');
    
    if (!Array.isArray(logObj['logs'])) {
      issues.push('logs must be an array');
    }
    
    if (typeof logObj['totalCount'] !== 'number') issues.push('totalCount must be a number');
    
    if (typeof logObj['filtered'] !== 'boolean' && logObj['filtered'] !== undefined) {
      issues.push('filtered must be a boolean if present');
    }
    
    if (typeof logObj['timestamp'] !== 'string' && logObj['timestamp'] !== undefined) {
      issues.push('timestamp must be a string if present');
    }
    
    const validationResult = {
      valid: issues.length === 0,
      issues,
      typeName: 'LogQueryResponse',
      stringRepresentation: safeStringify(obj)
    };
    
    this.safeLog('debug', `LogQueryResponse validation ${validationResult.valid ? 'succeeded' : 'failed'}`, {
      service: 'TypeDiagnosticsService',
      action: 'validateLogQueryResponse',
      valid: validationResult.valid,
      issues: validationResult.issues,
      objectSummary: !validationResult.valid ? validationResult.stringRepresentation : undefined
    });
    
    return validationResult;
  }
  
  /**
   * Validator for LogResponse type
   */
  private validateLogResponse(obj: unknown): ValidationResult {
    const issues: string[] = [];
    
    if (!obj || typeof obj !== 'object') {
      issues.push('Expected an object');
      return { valid: false, issues };
    }
    
    const logObj = obj as ValidationObject;
    
    // Validate LogResponse properties
    if (typeof logObj['status'] !== 'boolean') issues.push('status must be a boolean');
    
    if (!Array.isArray(logObj['logs'])) {
      issues.push('logs must be an array');
    }
    
    if (typeof logObj['totalCount'] !== 'number') issues.push('totalCount must be a number');
    
    if (typeof logObj['filtered'] !== 'boolean' && logObj['filtered'] !== undefined) {
      issues.push('filtered must be a boolean if present');
    }
    
    if (typeof logObj['timestamp'] !== 'string' && logObj['timestamp'] !== undefined) {
      issues.push('timestamp must be a string if present');
    }
    
    const validationResult = {
      valid: issues.length === 0,
      issues,
      typeName: 'LogResponse',
      stringRepresentation: safeStringify(obj)
    };
    
    this.safeLog('debug', `LogResponse validation ${validationResult.valid ? 'succeeded' : 'failed'}`, {
      service: 'TypeDiagnosticsService',
      action: 'validateLogResponse',
      valid: validationResult.valid,
      issues: validationResult.issues,
      objectSummary: !validationResult.valid ? validationResult.stringRepresentation : undefined
    });
    
    return validationResult;
  }
}
