# Socket Client Service Usage Guide

## Overview

The Socket Client Service provides a standardized way to interact with Socket.IO connections in the ForgeBoard application. This service handles connections to different namespaces, event listening, and message emission.

## Namespace Standardization

All namespaces in the Socket Client Service are standardized with a leading slash. When providing a namespace to any method, the service automatically ensures it starts with a `/` character.

### Example:
```typescript
// These are equivalent:
socketClient.connect('/metrics');
socketClient.connect('metrics');

// Both will connect to "/metrics" namespace
```

## Core Methods

### Connecting to a Namespace

```typescript
// Connect to a namespace (automatically adds leading slash if missing)
const socket = socketClient.connect('metrics', { 
  // Optional options
  transports: ['websocket'],
  autoConnect: true
});
```

### Listening for Events

```typescript
// Listen for events from the server
socketClient.listen<MetricsData>('metrics-update', 'metrics')
  .subscribe(data => {
    // handle metrics data
    console.log('Received metrics:', data);
  });
```

### Emitting Events

```typescript
// Send an event to the server
socketClient.emit('request-metrics', { interval: 1000 }, 'metrics');

// With acknowledgement callback
socketClient.emit('request-metrics', { interval: 1000 }, 'metrics', (response) => {
  console.log('Server acknowledged:', response);
});
```

### Checking Connection Status

```typescript
// Get connection status as an observable
socketClient.connectionState('metrics').subscribe(isConnected => {
  if (isConnected) {
    console.log('Connected to metrics namespace');
  } else {
    console.log('Disconnected from metrics namespace');
  }
});
```

### Disconnecting

```typescript
// Disconnect from a specific namespace
socketClient.disconnect('metrics');

// Disconnect from all namespaces
socketClient.disconnectAll();
```

## Best Practices

1. **Always follow the namespace standardization pattern**
   ```typescript
   // Consistent namespace formatting is handled by the service
   socketClient.connect('diagnostics');  // Will connect to "/diagnostics"
   ```

2. **Share observable subscriptions**
   ```typescript
   // This observable is shared between multiple subscribers
   const metricsObservable = socketClient.listen<MetricsData>('metrics-update', 'metrics');
   
   // Multiple components can subscribe without creating multiple socket listeners
   metricsObservable.subscribe(data => { /* handle in component A */ });
   metricsObservable.subscribe(data => { /* handle in component B */ });
   ```

3. **Always clean up connections**
   ```typescript
   // In component OnDestroy or when done using a connection
   ngOnDestroy() {
     // Disconnect specific namespace
     this.socketClient.disconnect('metrics');
     
     // Unsubscribe from observables
     this.subscription.unsubscribe();
   }
   ```

4. **Handle connection errors gracefully**
   ```typescript
   socketClient.connectionState('metrics').subscribe(isConnected => {
     this.isConnected = isConnected;
     
     if (!isConnected) {
       // Attempt reconnection or show error state
       this.showReconnectionUI();
     }
   });
   ```

5. **Use namespace constants for consistency**
   ```typescript
   // Define constants for namespaces
   export const SOCKET_NAMESPACES = {
     METRICS: 'metrics',
     DIAGNOSTICS: 'diagnostics',
     DEFAULT: '/'
   };
   
   // Use the constants
   socketClient.connect(SOCKET_NAMESPACES.METRICS);
   ```
