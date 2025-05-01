import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
import {
  typeValidators,
  registerTypeValidator,
  validateMetricData,
  safeStringify,
  TypeValidator,
  ValidationResult
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
 * Interface for LogResponse structure used in validation
 */
export interface LogResponse {
  status: boolean;
  logs: unknown[];
  totalCount: number;
  filtered?: boolean;
  timestamp?: string;
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
  
  constructor(private logger: LoggerService) { 
    this.logger.info('TypeDiagnosticsService initializing...', {
      service: 'TypeDiagnosticsService',
      action: 'initialize'
    });
    
    // Register built-in validators
    this.registerValidator('MetricData', validateMetricData);
    
    // Add LogResponse validator
    this.registerValidator('LogResponse', this.validateLogResponse);
    
    this.logger.info('TypeDiagnosticsService initialized successfully', {
      service: 'TypeDiagnosticsService',
      action: 'initialize',
      validatorsCount: Object.keys(this.validators).length
    });
  }
  
  /**
   * Register a validator for a specific type
   * @param typeName The name of the type to validate
   * @param validator The validation function
   */
  registerValidator<T>(typeName: string, validator: TypeValidator<T>): void {
    this.validators[typeName] = validator as TypeValidator<unknown>;
    
    // Also register in the shared library for backend use
    registerTypeValidator(typeName, validator);
    
    this.logger.info(`Registered validator for type: ${typeName}`, {
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
    this.logger.debug(`Validating object against type: ${typeName}`, {
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
      this.logger.error(`No validator found for type: ${typeName}`, {
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
        this.logger.debug(`Successfully validated object of type: ${typeName}`, {
          service: 'TypeDiagnosticsService',
          action: 'validateType',
          typeName,
          callerInfo,
          eventId: event.id,
          valid: true
        });
      } else {
        this.logger.warn(`Validation failed for type: ${typeName}`, {
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
      
      this.logger.error(`Validator execution error for type: ${typeName}`, {
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
    this.logger.debug('Getting diagnostic events', {
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
    
    this.logger.info(`Cleared all diagnostic events`, {
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
    
    this.logger.debug('Retrieved registered validators', {
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
      this.logger.warn(`Validation failed for type: ${event.typeName}`, {
        service: 'TypeDiagnosticsService',
        action: 'recordEvent',
        eventId: event.id,
        typeName: event.typeName,
        callerInfo: event.callerInfo,
        issues: event.issues,
        data: event.stringRepresentation || safeStringify(event.data)
      });
    } else {
      this.logger.debug(`Recorded successful validation event`, {
        service: 'TypeDiagnosticsService',
        action: 'recordEvent',
        eventId: event.id,
        typeName: event.typeName
      });
    }
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
    
    this.logger.debug(`LogResponse validation ${validationResult.valid ? 'succeeded' : 'failed'}`, {
      service: 'TypeDiagnosticsService',
      action: 'validateLogResponse',
      valid: validationResult.valid,
      issues: validationResult.issues,
      objectSummary: !validationResult.valid ? validationResult.stringRepresentation : undefined
    });
    
    return validationResult;
  }
}
