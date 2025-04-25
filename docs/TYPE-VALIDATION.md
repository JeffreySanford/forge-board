# Type Validation System

## Overview

The ForgeBoard type validation system provides runtime type checking capabilities to ensure data integrity across the application. It combines static TypeScript typing with runtime validation to catch potential issues that might occur due to:

- API responses not matching expected formats
- Data transformations producing invalid structures
- External integrations returning unexpected formats
- Serialization/deserialization errors

## Components

### 1. `type-validation.ts` 

This module in the shared API interfaces package provides the core validation utilities:

- `ValidationResult` interface for validation outcomes
- Type guard functions like `isDiagnosticEvent`
- Detailed validation functions like `validateDiagnosticEvent` 
- Error creation utility: `createTypeValidationError`

### 2. `TypeDiagnosticsService`

A service that provides centralized type validation with diagnostic capabilities:

- Register validators for different types
- Validate data against registered types
- Collect and provide access to validation results
- Stream validation events for debugging

### 3. `TypeDiagnosticsComponent`

A debug UI component that displays validation results in real-time:

- View all validation events
- Filter by success/error status
- Examine detailed error information
- Investigate invalid data structures

## Usage

### Registering Validators

```typescript
// In a service constructor or initialization method
constructor(private typeDiagnostics: TypeDiagnosticsService) {
  // Register validators for types used in this service
  this.typeDiagnostics.registerValidator('HealthData', this.validateHealthData);
  this.typeDiagnostics.registerValidator('MetricData', isMetricData);
}

// Custom validator function
private validateHealthData(obj: any): ValidationResult {
  const issues: string[] = [];
  
  if (!obj) {
    issues.push('Object is null or undefined');
    return { valid: false, issues };
  }
  
  if (typeof obj.status !== 'string') issues.push('Missing or invalid status (string)');
  if (typeof obj.uptime !== 'number') issues.push('Missing or invalid uptime (number)');
  if (typeof obj.timestamp !== 'string') issues.push('Missing or invalid timestamp (string)');
  if (!obj.details || typeof obj.details !== 'object') {
    issues.push('Missing or invalid details (object)');
  }
  
  return { valid: issues.length === 0, issues };
}
```

### Validating Data

#### Throwing Validation

```typescript
try {
  // Validate and cast data - throws if invalid
  const validatedHealth = this.typeDiagnostics.validateType<HealthData>(
    response.data, 
    'HealthData', 
    'DiagnosticsService.setupSocketEvents.health-update'
  );
  this.healthSubject.next(validatedHealth);
} catch (error) {
  console.error('Health data validation failed:', error);
  // Handle validation failure
}
```

#### Non-throwing Validation

```typescript
// Try validation without throwing
const { value, result } = this.typeDiagnostics.tryValidateType<MetricData>(
  data,
  'MetricData',
  'MetricsService.processMetrics'
);

if (result.valid) {
  // Use the validated data
  this.processValidMetrics(value);
} else {
  // Handle invalid data gracefully
  console.warn('Invalid metric data:', result.issues);
  this.handleInvalidMetrics(data, result.issues);
}
```

### Displaying Type Diagnostics

Add the diagnostics component to your application:

```html
<!-- Add to app.component.html or a diagnostics page -->
<app-type-diagnostics *ngIf="isDevelopmentMode"></app-type-diagnostics>
```

## Benefits

1. **Error Prevention**: Catch data structure issues before they cause application errors
2. **Debugging**: Detailed diagnostics make it easier to trace issues to their source
3. **Documentation**: Validation functions serve as living documentation of data structures
4. **Resilience**: Gracefully handle invalid data in production environments
5. **Type Safety**: Complement TypeScript's compile-time checking with runtime validation

## Best Practices

1. **Register validators early** in service initialization
2. **Use descriptive callerInfo** to make error sources easier to trace
3. **Include validation in API service layers** to catch issues at system boundaries
4. **Implement custom validators** for complex types and validation logic
5. **Use tryValidateType for graceful degradation** in user-facing components
6. **Enable the diagnostics UI in development environments** for easier debugging

## Example Use Cases

- Socket.IO message validation
- HTTP API response validation
- User input validation
- Configuration validation
- Plugin/extension data validation

By using this system consistently throughout the application, you can ensure data integrity and make debugging type-related issues much easier.
