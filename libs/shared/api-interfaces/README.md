# Shared API Interfaces (`@forge-board/api-interfaces`)

This library provides a centralized collection of TypeScript interfaces and types designed for consistent data structures across the ForgeBoard frontend (`forgeboard-frontend`) and backend (`forgeboard-api`) applications. Utilizing these shared types helps prevent data contract mismatches and ensures type safety throughout the platform.

## <span style="color: #4CAF50;">Purpose</span>

- **Consistency**: Ensures that both client and server applications expect and send data in the same shape.
- **Type Safety**: Leverages TypeScript's static typing to catch errors at compile-time rather than runtime.
- **Maintainability**: Simplifies updates to data structures, as changes are made in one central location.
- **Developer Experience**: Provides clear and discoverable data contracts for developers working on either end of the application.

## <span style="color: #2196F3;">Library Structure</span>

- **`src/index.ts`**: The main entry point for the library. It selectively exports types from the `src/lib` directory, providing a curated API for consumers.
- **`src/lib/`**: Contains the individual TypeScript files where interfaces and types are defined. These are typically grouped by domain or functionality (e.g., `user-types.ts`, `socket-types.ts`, `metrics-types.ts`).
  - **`src/lib/index.ts`**: An internal index file that re-exports all type definitions from the library's internal modules. This is then used by the main `src/index.ts`.

## <span style="color: #FF9800;">How to Use</span>

1.  **Installation**: This library is typically part of the Nx monorepo and managed as an internal workspace library. Ensure your `tsconfig.json` paths are configured correctly to resolve `@forge-board/api-interfaces`.

2.  **Importing Types**: In your frontend or backend TypeScript files, you can import the necessary types directly from the library's entry point:

    ```typescript
    import type { User, ApiResponse, Metric } from '@forge-board/api-interfaces';

    // Example usage in a service
    async function fetchUserData(userId: string): Promise<ApiResponse<User>> {
      // ... implementation ...
    }

    function processMetrics(data: Metric): void {
      // ... implementation ...
    }
    ```

## <span style="color: #9C27B0;">Key Type Categories</span>

This library covers a wide range of data structures, including but not limited to:

-   **Core API**: Base response structures (`ApiResponse`, `SuccessResponse`).
-   **Authentication**: Credentials, tokens, and authentication states (`AuthCredentials`, `User`, `JwtPayload`).
-   **Sockets**: Real-time communication event types and payloads (`SocketResponse`, `SocketEvent`, `SocketInfo`).
-   **Metrics & Diagnostics**: System health, performance metrics, and diagnostic event data (`Metric`, `HealthTimelinePoint`, `DiagnosticEvent`).
-   **Logging**: Log entry structures and filtering options (`LogEntry`, `LogFilter`).
-   **User Management**: User profiles and roles (`User`, `UserRole`).

For a more detailed breakdown of available types, please refer to the [`TYPE_DEFINITIONS.md`](./TYPE_DEFINITIONS.md) file.

## <span style="color: #F44336;">Contributing</span>

When adding or modifying types:

-   Ensure new types are added to an appropriate file within the `src/lib/` directory.
-   Export new types from `src/lib/index.ts`.
-   Update the main `src/index.ts` if the new types should be part of the public API of this library.
-   Strive for clarity and consistency with existing type definitions.
-   Consider if any existing types can be reused or extended.
-   Update the [`TYPE_DEFINITIONS.md`](./TYPE_DEFINITIONS.md) file if you add or significantly change a major type.

# Shared API Interfaces Library

This library provides shared TypeScript interfaces, types, and validation utilities for ForgeBoard projects. It is designed for use across both backend and frontend codebases to ensure type safety and consistent data validation.

## Validation System

The validation system provides runtime type checking and validation utilities, including:

### Core Interfaces & Types

- **ValidationResult**: Describes the result of a type validation operation.
- **TypeValidationError**: Detailed validation error information (path, message, value, code).
- **Log**: Log entry structure for validation operations.
- **TypeValidator<T>**: Function signature for type validator functions.
- **ValidatedTypes**: Mapping of supported validated types.

### Validation Utilities & Registry

- **typeValidators**: Registry of available type validators (by type name).
- **registerTypeValidator**: Register a type validator for a given type.
- **validateType**: Validate a value against a registered type (throws on failure).
- **createTypeValidationError**: Utility to create a validation error object.

### Type Guards & Validation Helpers

- **isDiagnosticEvent**: Type guard for DiagnosticEvent.
- **validateDiagnosticEvent**: Validation function for DiagnosticEvent.
- **isMetric**: Type guard for Metric.
- **validateMetricData**: Validation function for Metric.
- **isSocketResponse**: Type guard for SocketResponse.
- **isErrorResponse**: Type guard for error responses.
- **safeStringify**: Utility for safe object stringification.
- **validateLogResponse, validateHealthData, validateUser, validateHistoricalMetrics, validateSystemPerformance**: Validation helpers for common types.

### Example Usage

```typescript
import {
  ValidationResult,
  TypeValidator,
  registerTypeValidator,
  validateType,
  ValidatedTypes
} from '@forge-board/shared/api-interfaces';

// Register a validator
typeValidators['HealthData'] = (obj) => {
  const issues: string[] = [];
  if (!obj || typeof obj !== 'object') issues.push('Not an object');
  // ... more checks ...
  return { valid: issues.length === 0, issues };
};

// Or use the helper:
registerTypeValidator('HealthData', typeValidators['HealthData']);

// Validate a value
try {
  const health = validateType(someValue, 'HealthData');
  // health is now typed as ValidatedTypes['HealthData']
} catch (e) {
  // Handle validation error
}
```

### Best Practices

- Register validators early in your application lifecycle.
- Use the provided type guards and validation helpers for common types.
- Handle validation errors gracefully and log issues for diagnostics.
- Keep your custom validators in sync with the interfaces they validate.
- Update documentation and type exports when adding new types or validators.

### Exports Summary

All validation-related interfaces and helpers are located in `src/lib/validation/validation.interface.ts` and re-exported from the main entry point. See the source for the full list of available types and functions.

---
*ForgeBoard Platform - Building with Consistency and Precision.*
