# ForgeBoard: Frontend-API Architecture Documentation

## Overview

ForgeBoard uses a client-server architecture with a robust communication system built on both HTTP and WebSocket protocols. This document explains how the frontend and API components interact, how the build system works, and the role of the socket management system.

## Architecture Components

### 1. Frontend (Angular)

The frontend is built with Angular and communicates with the backend through:

- **HTTP Requests**: For CRUD operations, retrieving static data, and actions
- **WebSockets**: For real-time metrics, diagnostics, and live updates

The frontend implements clean resource management with proper lifecycle hooks to avoid memory leaks and zombie connections.

### 2. Backend (NestJS)

The API is built with NestJS and exposes:

- **REST Endpoints**: Standard HTTP endpoints for CRUD operations
- **WebSocket Gateways**: Socket.IO based gateways for real-time communication
- **Shared Types**: Types shared between frontend and backend for type safety

### 3. Build & Bundling

#### Frontend Bundling
- Angular CLI/Webpack bundles the frontend
- Assets, styles, and code are processed and optimized
- Core dependencies are included in bundle

#### API Bundling
- The API is bundled using Webpack via Nx tooling
- Node.js is targeted as the execution environment
- External dependencies are not bundled (nodeExternals)
- Source maps are included in development mode

## Communication Patterns

### HTTP Communication
- REST endpoints with typed responses
- Error handling with interceptors
- Backend status monitoring

### WebSocket Communication
- Namespace-based socket connections (`/metrics`, `/diagnostics`)
- Real-time data streams using Socket.IO
- RxJS Observables to manage data flow
- Standardized response format:

```typescript
interface SocketResponse<T> {
  status: 'success' | 'error';
  data: T;
  timestamp: string;
}
```

## Socket Connection Management

### Socket Lifecycle
Each socket connection follows a lifecycle pattern:

1. **Initialization**: Socket connects to specific namespaces
2. **Event Subscription**: Register event handlers for specific data
3. **Error Handling**: Connection errors trigger fallback mechanisms
4. **Reconnection**: Automatic reconnection with backoff strategy
5. **Cleanup**: Proper disconnection and removal of event listeners

### Socket Initialization Pattern
```typescript
private initSocket(): void {
  try {
    // Clean up any existing socket first
    this.cleanupSocket();
    
    // Create new socket connection with proper options
    this.socket = io(`${this.socketUrl}/namespace`, {
      withCredentials: false,
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      forceNew: true
    });
    
    // Setup socket event handlers
    this.setupSocketEvents();
  } catch (err) {
    console.error('Failed to connect to socket:', err);
    this.connectionStatusSubject.next(false);
    this.startMockDataGeneration(); // Fallback to mock data
  }
}
```

### Socket Cleanup Pattern
```typescript
private cleanupSocket(): void {
  if (this.socket) {
    // Remove all event listeners
    this.socket.off('connect');
    this.socket.off('disconnect');
    this.socket.off('data-event');
    this.socket.off('connect_error');
    
    // Disconnect if connected
    if (this.socket.connected) {
      this.socket.disconnect();
    }
    
    this.socket = null;
  }
}
```

### Reconnection Strategy
ForgeBoard implements a robust reconnection strategy that:

1. Detects when the backend becomes available
2. Performs a connection test to verify availability
3. Establishes a new socket connection
4. Requests initial data to populate UI components

```typescript
private reconnectToBackend(): void {
  // Test backend availability first
  this.http.get<{status: string}>(`${this.apiUrl}/status`)
    .pipe(catchError(() => of({ status: 'error' })))
    .subscribe(response => {
      if (response.status !== 'error') {
        // Clean up old socket and create new connection
        this.cleanupSocket();
        this.initSocket();
        
        // Request initial data
        this.socket?.emit('get-initial-data');
      }
    });
}
```

### Offline Mode / Mock Data Generation
When socket connections fail, ForgeBoard automatically switches to generating mock data:

1. Detect connection failure
2. Start mock data generation at specified intervals
3. Emit mock data through the same Subjects/Observables
4. Update UI to indicate mock data mode
5. Listen for backend availability events to reconnect

## Component Architecture

### Diagnostic Components
The diagnostics module provides comprehensive system monitoring:

- **Socket Status**: Real-time connection status monitoring
- **Health Data**: System health information with past/current/future predictions
- **Timeline**: Historical events with status indicators
- **Logs**: Event log monitoring and filtering

### Metrics Components
The metrics module visualizes system performance data:

- **Real-time Charts**: CPU and memory utilization
- **Status Indicators**: Connection quality and health
- **Mock Data Banner**: Indicates when using simulated data
- **Interactive Controls**: Adjustable refresh intervals

### Tile-based Dashboard
The dashboard uses a drag-and-drop tile system:

1. **Tile Definition**: Components are wrapped in draggable tile containers
2. **Layout Persistence**: Tile order and visibility stored via API
3. **Grid System**: Responsive layout with automatic column adjustment
4. **Visibility Toggle**: Individual tiles can be hidden/shown

## Data Flow

### Frontend Service Pattern
```
Socket Event → Socket.IO → Service Subject → Component Observable → UI Update
```

### Backend Gateway Pattern
```
System Event → Service → Gateway → Socket.IO → Client
```

## Type Safety & Shared DTOs

ForgeBoard achieves type safety through:

1. **Shared Interfaces**: DTOs defined in shared library (`@forge-board/shared/api-interfaces`)
2. **Generic Types**: Socket responses use generics (`SocketResponse<T>`)
3. **Enums**: Consistent string literals using TypeScript enums
4. **ESLint Rules**: Custom ESLint rules enforce socket cleanup and typed responses

## Testing & Debugging

### Socket Debugging
- Connection diagnostic components show real-time socket status
- Detailed error messages for CORS and connection issues
- Automatic fallback to mock data generation
- Connection quality metrics

### Backend Logging
- Comprehensive logging with different levels (debug, info, warning, error)
- Log context for easy filtering
- Real-time log streaming to frontend
- Timestamp-based log retrieval

## Best Practices

1. **Always Clean Up**: Every component with socket connections must implement `OnDestroy` pattern
2. **Fallback Mechanisms**: Services should have offline/mock data modes
3. **Typed Everything**: All data exchanges must use explicitly defined interfaces
4. **Centralized Error Handling**: Socket errors handled consistently
5. **Event Documentation**: All socket events must be documented for integrating teams

