# Socket.IO Troubleshooting Guide

This guide addresses common Socket.IO connection issues in ForgeBoard and provides solutions for common problems.

## Common Connection Issues

### Connection Closed Before Handshake

Error message: `WebSocket connection failed: Connection closed before receiving a handshake response`

Potential causes:
- Socket.IO path mismatch between client and server
- CORS issues
- Transport configuration mismatch

#### Solutions:

1. **Path Configuration**:
   - Ensure client is using the same path as server (default is `/socket.io`)
   - Check server configuration in NestJS WebSocketGateway decorators

```typescript
@WebSocketGateway({
  namespace: '/your-namespace',
  path: '/socket.io', // This must match client
  cors: {
    origin: '*', // For development
    methods: ['GET', 'POST']
  }
})
```

2. **Transport Configuration**:
   - Enable both WebSocket and polling transports:
   ```typescript
   const options = {
     path: '/socket.io',
     transports: ['websocket', 'polling'], // Enable both
     autoConnect: true
   };
   ```

3. **CORS Configuration**: 
   - Ensure server allows requests from client origin
   - For development, you can use `origin: '*'`

### Reconnection Issues

Socket.IO's default reconnection settings might not be sufficient. Adjust these settings:

```typescript
const options = {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
};
```

## Socket.IO Client Service Design

ForgeBoard uses three Socket.IO client service implementations:

1. **SocketClientService**: Standard implementation
2. **ModernSocketClientService**: Uses modern RxJS patterns
3. **BrowserSocketClientService**: Optimized for browser compatibility

Use the `SocketClientFactoryService` to get the appropriate client:

```typescript
import { SocketClientFactoryService } from '@core/services/socket';

@Component({/*...*/})
export class YourComponent {
  constructor(private socketFactory: SocketClientFactoryService) {
    const socket = this.socketFactory.connect('/your-namespace');
    socket.on('event', (data) => console.log(data));
  }
}
```

## Server-Side Configuration

Ensure your NestJS WebSocketGateway is properly configured:

```typescript
@WebSocketGateway({
  namespace: '/your-namespace',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
export class YourGateway implements OnGatewayConnection {
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }
}
```

## Debugging

Enable Socket.IO debug logs in the browser:

```javascript
localStorage.debug = '*'; // Enable all debug logs
// or
localStorage.debug = 'socket.io-client:*'; // Enable only Socket.IO client logs
```

Then reload the page to see detailed Socket.IO logs in the browser console.
