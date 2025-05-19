import { Injectable, Logger } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
import {
  validateHealthData,
  validateMetricData
} from '@forge-board/shared/api-interfaces';
import { TypeDiagnosticEvent } from '@forge-board/shared/diagnostics.types';

// Define validation result interface
export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

// Type for validator functions
export type TypeValidator<T> = (obj: unknown) => ValidationResult;

// Define the CustomValidatedTypes interface
interface CustomValidatedTypes {
  HealthData: Record<string, unknown>;
  DiagnosticEvent: Record<string, unknown>;
  Metric: Record<string, unknown>;
  LogEvent: Record<string, unknown>;
}

/**
 * Service to handle type validation diagnostics
 */
@Injectable()
export class TypeDiagnosticsService {
  private readonly logger = new Logger(TypeDiagnosticsService.name);
  private validators = new Map<string, TypeValidator<unknown>>();
  private eventsSubject = new BehaviorSubject<TypeDiagnosticEvent[]>([]);
  private events: TypeDiagnosticEvent[] = [];
  private readonly maxEvents = 100;

  constructor() {
    this.initializeValidators();
  }

  /**
   * Initialize all validators
   */
  private initializeValidators(): void {
    try {
      // Register built-in validators
      this.registerValidator<'HealthData'>('HealthData', validateHealthData);
      this.registerValidator<'Metric'>('Metric', validateMetricData);
      
      // Log success after initialization
      this.logger.log(`Successfully initialized ${this.validators.size} validators`);
    } catch (error) {
      this.logger.error(`Failed to initialize validators: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Register a validator for a specific type
   * @param typeName The name of the type to validate
   * @param validator The validation function
   */
  registerValidator<K extends keyof CustomValidatedTypes>(
    typeName: K, 
    validator: TypeValidator<CustomValidatedTypes[K]>
  ): void {
    try {
      // Store the validator in our map
      this.validators.set(typeName as string, validator as TypeValidator<unknown>);
      this.logger.verbose(`Registered validator for type: ${typeName}`);
    } catch (error) {
      this.logger.error(`Failed to register validator for ${typeName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate an object against its type
   * @param obj The object to validate
   * @param typeName The name of the type to validate against
   * @returns A validation result
   */
  validate<T>(obj: unknown, typeName: string): ValidationResult & { data?: T } {
    const startTime = Date.now();
    try {
      const validator = this.validators.get(typeName);
      
      if (!validator) {
        const errorResult = {
          valid: false,
          issues: [`No validator registered for type: ${typeName}`]
        };
        this.logger.warn(`No validator found for type: ${typeName}`);
        
        // Record failed validation
        this.recordValidation(typeName, obj, errorResult);
        
        return errorResult;
      }
      
      const result = validator(obj) as ValidationResult;
      
      // Record validation result
      this.recordValidation(typeName, obj, result);
      
      // Log validation result
      const duration = Date.now() - startTime;
      if (result.valid) {
        this.logger.debug(`Validation successful for type ${typeName} in ${duration}ms`);
      } else {
        this.logger.warn(`Validation failed for type ${typeName} in ${duration}ms: ${result.issues.join(', ')}`);
      }
      
      return {
        ...result,
        data: result.valid ? obj as T : undefined
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error(`Error during validation for type ${typeName} after ${duration}ms: ${errorMessage}`);
      
      const result = {
        valid: false,
        issues: [`Validation error: ${errorMessage}`]
      };
      
      // Record failed validation
      this.recordValidation(typeName, obj, result);
      
      return result;
    }
  }

  /**
   * Record a validation event
   */
  private recordValidation(
    typeName: string,
    data: unknown,
    result: ValidationResult
  ): void {
    // Create string representation safely
    let stringRepresentation: string;
    try {
      stringRepresentation = typeof data === 'string' 
        ? data 
        : JSON.stringify(data).substring(0, 200);
      
      if (stringRepresentation.length === 200) {
        stringRepresentation += '...';
      }
    } catch (e) {
      stringRepresentation = '[Unable to stringify data]';
    }

    // Create event
    const event: TypeDiagnosticEvent = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      typeName,
      valid: result.valid,
      stringRepresentation,
      data,
      issues: result.issues
    };

    // Add to events
    this.events.unshift(event);
    
    // Limit events array size
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }
    
    // Emit update
    this.eventsSubject.next([...this.events]);
  }

  /**
   * Get diagnostic events observable
   */
  getDiagnosticEvents(): Observable<TypeDiagnosticEvent[]> {
    return this.eventsSubject.asObservable();
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
    this.eventsSubject.next([]);
    this.logger.debug('Type diagnostic events cleared');
  }

  /**
   * Get a list of all registered validator types
   * @returns Array of validator type names
   */
  getRegisteredValidators(): string[] {
    return Array.from(this.validators.keys());
  }

  /**
   * Check if a validator exists for a given type
   * @param typeName The type name to check
   * @returns True if a validator exists
   */
  hasValidator(typeName: string): boolean {
    return this.validators.has(typeName);
  }

  /**
   * Get validator count
   * @returns The number of registered validators
   */
  getValidatorCount(): number {
    return this.validators.size;
  }
}
