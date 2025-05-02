import { Injectable, Logger } from '@nestjs/common';
import {
  validateHealthData,
  TypeValidator,
  ValidationResult,
  validateDiagnosticEvent,
  validateLogResponse, // Changed from validateLogQueryResponse
  validateLogBatchResponse,
  validateMetricData
} from '@forge-board/shared/api-interfaces';

// Define the CustomValidatedTypes interface outside the class
interface CustomValidatedTypes {
  HealthData: import('@forge-board/shared/api-interfaces').HealthData;
  // Use the correct types or use Record<string, unknown> if the type isn't exported
  DiagnosticEvent: Record<string, unknown>;
  SocketLogEvent: import('@forge-board/shared/api-interfaces').SocketLogEvent;
  SocketLogEventResponse: Record<string, unknown>;
  SocketLogEventResponseBatch: Record<string, unknown>;
  SocketLogEventResponseQueryBatch: Record<string, unknown>;
  LogBatchResponse: import('@forge-board/shared/api-interfaces').LogBatchResponse;
  LogQueryResponse: import('@forge-board/shared/api-interfaces').LogQueryResponse;
  MetricData: import('@forge-board/shared/api-interfaces').MetricData;
  LogEvent: Record<string, unknown>;
  LogEventResponse: Record<string, unknown>;
  LogEventResponseBatch: Record<string, unknown>;
  LogEventResponseQueryBatch: Record<string, unknown>;
  DiagnosticEventResponse: Record<string, unknown>;
  DiagnosticEventResponseBatch: Record<string, unknown>;
  DiagnosticEventResponseQueryBatch: Record<string, unknown>;
}

/**
 * Service to handle type validation diagnostics
 */
@Injectable()
export class TypeDiagnosticsService {
  private readonly logger = new Logger(TypeDiagnosticsService.name);
  private validators = new Map<string, TypeValidator<unknown>>();

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
      this.registerValidator<'DiagnosticEvent'>('DiagnosticEvent', validateDiagnosticEvent);
      this.registerValidator<'LogBatchResponse'>('LogBatchResponse', validateLogBatchResponse);
      this.registerValidator<'LogQueryResponse'>('LogQueryResponse', validateLogResponse); // Changed from validateLogQueryResponse
      this.registerValidator<'MetricData'>('MetricData', validateMetricData);
      
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
        return errorResult;
      }
      
      const result = validator(obj) as ValidationResult;
      
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
      
      return {
        valid: false,
        issues: [`Validation error: ${errorMessage}`]
      };
    }
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