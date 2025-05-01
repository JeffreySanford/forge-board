/**
 * Types related to validation functionality
 * Re-export from type-validation.ts to avoid duplication
 */

// Import and re-export the types from type-validation.ts instead of defining them again
import { ValidationResult, TypeValidationError, TypeValidator } from './type-validation';

// Re-export the imported types
export { ValidationResult, TypeValidationError, TypeValidator };

// You can add validation-specific types that aren't in type-validation.ts here
