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
  data?: any;
  stringRepresentation?: string; // Added to ensure string representation is available
}

@Injectable({
  providedIn: 'root'
})
export class TypeDiagnosticsService {
  private diagnosticEvents: TypeDiagnosticEvent[] = [];
  private eventsSubject = new BehaviorSubject<TypeDiagnosticEvent[]>([]);
  
  // Local validators registry (extends the shared library's registry)
  private validators: Record<string, TypeValidator> = {...typeValidators};
  
  constructor() { 
    // Register built-in validators
    this.registerValidator('MetricData', validateMetricData);
    
    // Add LogResponse validator
    this.registerValidator('LogResponse', this.validateLogResponse);
  }
  
  /**
   * Register a validator for a specific type
   * @param typeName The name of the type to validate
   * @param validator The validation function
   */
  registerValidator<T>(typeName: string, validator: TypeValidator<T>): void {
    this.validators[typeName] = validator;
    
    // Also register in the shared library for backend use
    registerTypeValidator(typeName, validator);
    
    console.log(`[TypeDiagnostics] Registered validator for type: ${typeName}`);
  }
  
  /**
   * Validate an object against its expected type
   * @param obj The object to validate
   * @param typeName The expected type name
   * @param callerInfo Information about the calling context
   * @returns The validated object (for chaining)
   */
  validateType<T>(obj: any, typeName: string, callerInfo: string): T {
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
      
      return obj as T;
    } catch (error) {
      // Handle errors in the validator itself
      const event: TypeDiagnosticEvent = {
        id: uuid(),
        timestamp: new Date().toISOString(),
        typeName,
        callerInfo,
        valid: false,
        issues: [`Validator error: ${(error as Error).message}`],
        data: obj,
        stringRepresentation: safeStringify(obj)
      };
      this.recordEvent(event);
      return obj as T;
    }
  }
  
  /**
   * Get diagnostic events as an observable
   */
  getDiagnosticEvents(): Observable<TypeDiagnosticEvent[]> {
    return this.eventsSubject.asObservable();
  }
  
  /**
   * Clear all diagnostic events
   */
  clearEvents(): void {
    this.diagnosticEvents = [];
    this.eventsSubject.next(this.diagnosticEvents);
  }
  
  /**
   * Get all available type validators
   */
  getRegisteredValidators(): string[] {
    return Object.keys(this.validators);
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
      console.warn(
        `[TypeValidation] ${event.typeName} validation failed from ${event.callerInfo}:`,
        event.issues,
        event.stringRepresentation || event.data
      );
    }
  }
  
  /**
   * Validator for LogResponse type
   */
  private validateLogResponse(obj: any): ValidationResult {
    const issues: string[] = [];
    
    if (!obj || typeof obj !== 'object') {
      issues.push('Expected an object');
      return { valid: false, issues };
    }
    
    if (typeof obj.status !== 'boolean') issues.push('status must be a boolean');
    
    if (!Array.isArray(obj.logs)) {
      issues.push('logs must be an array');
    }
    
    if (typeof obj.totalCount !== 'number') issues.push('totalCount must be a number');
    
    if (typeof obj.filtered !== 'boolean' && obj.filtered !== undefined) {
      issues.push('filtered must be a boolean if present');
    }
    
    if (typeof obj.timestamp !== 'string' && obj.timestamp !== undefined) {
      issues.push('timestamp must be a string if present');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      typeName: 'LogResponse',
      stringRepresentation: safeStringify(obj)
    };
  }
}
