# ForgeBoard Coding Standards

## Angular

- Use Renderer2 for DOM manipulation.
- Always use explicit Angular decorators.
- Organize imports: Angular, third-party, internal, local.
- Use snake-case for services, kebab-case for components.
- No direct DOM access.
- Keep functions small and focused.
- Avoid unnecessary comments.
- Use Angular CLI for scaffolding.
- Components: `standalone: false` for module structure.
- **Do not use inline styles in HTML templates.**  
  *Reason: Inline styles make code harder to maintain, override, and audit. Use SCSS/CSS classes for all styling to ensure separation of concerns, theming consistency, and easier refactoring.*
- Use proper route management with the RouterModule.
- Apply lazy loading for feature modules when possible.
- **Never use `any`.**  
  *Reason: All data, including socket payloads, API responses, and DTOs, must use explicit TypeScript types or interfaces. If a type is missing, define it.*

## RxJS

- Prefer hot observables for real-time data.
- Avoid Promises/async-await unless necessary.
- Always handle errors in observables with catchError.
- Implement retry strategies for API calls.
- Clean up subscriptions with ngOnDestroy.
- **Always unsubscribe from Observables and disconnect sockets in ngOnDestroy.**
- Use appropriate operators:
  - switchMap for requests that should cancel previous ones
  - mergeMap for concurrent operations
  - concatMap for sequential operations

## Error Handling

- Services should never throw uncaught errors.
- API errors must be caught and transformed into user-friendly messages.
- Implement retry mechanisms for transient failures.
- Log detailed error information for debugging.
- Use the ErrorService for centralized error management.

## Sound System

- All audio elements must include fallbacks for unavailable files.
- Respect user preferences for audio settings.
- Never autoplay sounds without explicit user action.
- Keep audio files small and optimized.
- Include volume controls for all audio features.

## Styling

- Follow the blueprint design language.
- Use SCSS for all styling.
- Maintain the color scheme defined in LAYOUT.md.
- Implement responsive designs using flexible layouts.
- Use BEM methodology for CSS class naming.

## Documentation

- Document all public methods and properties.
- Add JSDoc comments for complex functions.
- Keep README.md and other documentation updated.
- Include examples for non-obvious code patterns.
- Document error handling strategies in services.

## General

- No "crap code": prioritize clarity, performance, security, testability.
- All code must be maintainable and consistent.
- Ensure accessibility compliance.
- Write unit tests for critical functionality.
- Optimize for performance where needed.

## WebSockets & Real-Time

- All socket events and payloads must use explicit TypeScript types or interfaces.
- Never use `any` for socket data or events.
- Use RxJS Observables for all socket event streams.
- Always disconnect sockets and unsubscribe in `ngOnDestroy`.
- Define DTOs for all socket messages and API payloads.
- Use enums or string literal types for event names.
- **Centralize shared types:** For diagnostics and metrics, define interfaces (e.g., `Health`, `DiagnosticInfo`, `MetricData`) in a shared location and import them in both frontend and backend.
- **Use standard response format:** All socket responses should follow the `SocketResponse<T>` pattern:
  ```typescript
  interface SocketResponse<T> {
    status: 'success' | 'error';
    data: T;
    timestamp: string;
  }
  ```
- **Utility functions:** Use the `createSocketResponse` helper to standardize response creation:
  ```typescript
  function createSocketResponse<T>(event: string, data: T): SocketResponse<T> {
    return {
      status: 'success',
      data,
      timestamp: new Date().toISOString(),
    };
  }
  ```
- **Error handling:** Check `response.status === 'success'` before accessing data to ensure proper error handling.

## GraphQL & MongoDB

- Define GraphQL schemas and resolvers with strong typing.
- Use DTOs for all mutations and queries.
- Define Mongoose models with TypeScript interfaces.
- Keep DTOs and models in sync.

---
