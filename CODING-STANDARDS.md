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
- Components: `standalone: false` for NgModule-based architecture.
  *Reason: This project uses traditional NgModule architecture - never create standalone components as they cannot be declared in NgModules.*
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
- **Always disconnect sockets and unsubscribe in `ngOnDestroy` by:**
  1. Removing all event listeners with `socket.off()` for each event
  2. Disconnecting with `socket.disconnect()` if connected
  3. Setting the socket reference to null
  4. Completing any related subjects
  5. Unsubscribing from all subscriptions
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
- **Socket cleanup example:**
  ```typescript
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();
    
    // Clean up socket connections
    if (this.socket) {
      // Remove all event listeners
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('metrics-update');
      
      // Disconnect if connected
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      this.socket = null;
    }
    
    // Complete any subjects
    this.metricsSubject.complete();
  }
  ```
- **Socket reconnection pattern:** All socket-enabled services should:
  1. Listen for the `backend-available` custom event
  2. Implement a `reconnectToBackend` method to attempt reconnection
  3. Properly handle transitioning from mock data to live data
  4. Update the `BackendStatusService` on connection status changes
  
  Example:

  ```typescript
  // Add reconnection properties
  private reconnecting = false;
  private backendAvailableListener: () => void;
  
  constructor() {
    // Listen for backend availability to reconnect
    this.backendAvailableListener = () => {
      if (this.mockDataActive && !this.reconnecting) {
        this.reconnectToBackend();
      }
    };
    
    window.addEventListener('backend-available', this.backendAvailableListener);
  }

  ngOnDestroy(): void {
    // Remove event listener
    window.removeEventListener('backend-available', this.backendAvailableListener);
    
    // ... other cleanup
  }
  
  private reconnectToBackend(): void {
    // Implement reconnection logic
  }
  ```

### Socket Reconnection Pattern

All socket-enabled services should implement a robust reconnection pattern:

1. **Detect Connection Loss**:
   - Handle socket disconnect and connect_error events
   - Update connection status via BackendStatusService
   - Implement fallback to mock data generation

2. **Listen for Backend Availability**:
   ```typescript
   // Add reconnection properties
   private reconnecting = false;
   private backendAvailableListener: () => void;
   
   constructor() {
     // Listen for backend availability to reconnect
     this.backendAvailableListener = () => {
       if (this.mockDataActive && !this.reconnecting) {
         this.reconnectToBackend();
       }
     };
     
     window.addEventListener('backend-available', this.backendAvailableListener);
   }
   
   ngOnDestroy(): void {
     // Remove event listener
     window.removeEventListener('backend-available', this.backendAvailableListener);
     
     // ... other cleanup
   }
   ```

3. **Implement Reconnection Logic**:
   ```typescript
   private reconnectToBackend(): void {
     if (this.reconnecting) return;
     this.reconnecting = true;
     
     // Validate backend is truly available with direct health check
     this.http.get(`${this.apiUrl}/status`)
       .pipe(catchError(() => of({ status: 'error' })))
       .subscribe(response => {
         if (response?.status !== 'error') {
           // Clean up existing socket connection
           this.cleanupSocket();
           
           // Create new socket with proper error handling
           this.initializeNewSocket();
           
           // Stop mock data when real data is flowing
           this.stopMockDataGeneration();
           
           // Update status via BackendStatusService
           this.backendStatusService.updateGatewayStatus('serviceName', true, false);
         }
         
         // Reset reconnection flag after delay
         setTimeout(() => {
           this.reconnecting = false;
         }, 5000);
       });
   }
   ```

4. **Proper Socket Cleanup**:
   ```typescript
   private cleanupSocket(): void {
     if (this.socket) {
       // Remove all event listeners
       this.socket.off('connect');
       this.socket.off('disconnect');
       this.socket.off('your-event-name');
       
       // Disconnect if connected
       if (this.socket.connected) {
         this.socket.disconnect();
       }
       this.socket = null;
     }
   }
   ```

5. **Mock Data Management**:
   ```typescript
   private startMockDataGeneration(): void {
     if (this.mockDataInterval) return;
     
     this.mockDataInterval = setInterval(() => {
       // Generate mock data
       const mockData = this.generateMockData();
       
       // Push to same subject as real data
       this.dataSubject.next(mockData);
     }, this.intervalMs);
     
     // Update BackendStatusService
     this.backendStatusService.updateGatewayStatus('serviceName', false, true);
   }
   
   private stopMockDataGeneration(): void {
     if (this.mockDataInterval) {
       clearInterval(this.mockDataInterval);
       this.mockDataInterval = null;
       
       // Update BackendStatusService
       this.backendStatusService.updateGatewayStatus('serviceName', true, false);
     }
   }
   ```

This pattern ensures robust handling of:
- Socket disconnection and reconnection
- Automatic fallback to mock data
- Clear indication of connection status to users
- Smooth transition from mock data back to real-time data
- Proper resource cleanup to prevent memory leaks
