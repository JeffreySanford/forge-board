# 🔐 ForgeBoard NX: Authentication & Authorization
*Last Updated: May 7, 2025*

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
  <div style="background-color: #002868; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Security:</strong> Zero Trust 🔒
  </div>
  <div style="background-color: #BF0A30; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>MFA:</strong> FIDO2 Required 🔑
  </div>
  <div style="background-color: #F9C74F; color: #333; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>JWT:</strong> ES256 Signed 🪙
  </div>
  <div style="background-color: #90BE6D; color: #333; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Status:</strong> FedRAMP 20X ✅
  </div>
</div>

## Overview

ForgeBoard uses a unified authentication and authorization system for both HTTP and WebSocket (Socket.IO) connections. Every socket is tied to a user session, and can be disabled or revoked at any time. All user and session data is persisted in the database.

## Features

- **Reactive Architecture**: Uses RxJS Observables throughout
- **MongoDB Integration**: Stores user data in MongoDB
- **WebSocket Support**: Real-time authentication via Socket.IO
- **JWT Authentication**: Secure token-based authentication
- **Guest User Support**: Temporary user accounts with expiration

## Installation

### Prerequisites

- Node.js 14+
- MongoDB 4.4+

### Setup

1. Install MongoDB and start the service
2. Install dependencies:
   ```bash
   npm install @nestjs/jwt @nestjs/mongoose mongoose
   ```

3. Configure environment variables in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/forgeboard
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=7d
   ```

## Usage

### REST API Authentication

```typescript
// Login
POST /api/auth/login
Body: { "username": "user", "password": "password" }

// Guest login
POST /api/auth/guest

// Verify token
POST /api/auth/verify
Body: { "token": "your-jwt-token" }

// Logout (requires Authorization header)
POST /api/auth/logout
Headers: { "Authorization": "Bearer your-jwt-token" }
```

### WebSocket Authentication

```typescript
// Connect to auth namespace
const socket = io('http://localhost:3000/auth');

// Login
socket.emit('login', { username: 'user', password: 'password' });

// Guest login
socket.emit('guest-login');

// Verify token
socket.emit('verify-token', { token: 'your-jwt-token' });

// Logout (requires authenticated socket)
socket.emit('logout');

// Listen for authentication state
socket.on('auth-state', (response) => {
  if (response.status === 'success') {
    // Authentication successful
    console.log('User:', response.data.user);
    console.log('Token:', response.data.token);
  } else {
    // Authentication failed
    console.error(response.message);
  }
});
```

## Authorization Flow (with Database & Socket Control)

```mermaid
flowchart TD
  subgraph Frontend [Angular Frontend]
    direction TB
    C1[Login/Logout/Token]:::client
    C2[Socket Connect/Disconnect]:::client
  end
  subgraph API [NestJS Backend]
    direction TB
    AC[AuthController (REST)]:::rest
    AG[AuthGateway (WebSocket)]:::ws
    AS[AuthService]:::service
    US[UserService]:::service
    DB[(MongoDB)]:::db
    SR[SocketRegistry]:::service
  end

  C1 -- POST /api/auth/login /logout /verify --> AC
  C2 -- socket.emit('login','logout','verify') --> AG
  AC -->|validate| AS
  AG -->|validate| AS
  AS -->|find user| US
  US --> DB
  AS -->|session| DB
  AS -->|register socket| SR
  SR --> DB
  SR -- disable/revoke --> AG
  AG -- disconnect --> C2

  classDef client fill:#D1E8E4,stroke:#16A085,stroke-width:2px;
  classDef rest fill:#FFEBEE,stroke:#C62828,stroke-width:2px;
  classDef ws fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px;
  classDef service fill:#E8D1E8,stroke:#8E44AD,stroke-width:2px;
  classDef db fill:#FFF3E0,stroke:#FB8C00,stroke-width:2px;
```

### Key Concepts

- **Every socket connection is authenticated**: On connect, the client must provide a valid JWT or credentials. The backend validates and ties the socket to a user session.
- **SocketRegistry**: Tracks all active sockets, their user, and session state. Can forcibly disconnect or disable sockets (e.g., on logout, ban, or session expiry).
- **Database-backed**: All user, session, and socket state is persisted in MongoDB. Revoking a user disables all their sockets in real time.
- **Disabling/Revoking**: Admins or the system can disable a user or session, which immediately disconnects all associated sockets and invalidates tokens.

### Example: Disabling a User

1. Admin disables a user in the database.
2. AuthService detects the change (via polling, event, or direct call).
3. SocketRegistry finds all sockets for that user and disconnects them.
4. All future requests (HTTP or WebSocket) for that user are rejected until re-enabled.

---

## Implementation Notes

- **Guards**: Both HTTP and WebSocket routes use guards to enforce authentication and authorization.
- **Session Expiry**: Guest and regular sessions have different expiry logic; expired sessions are cleaned up and sockets disconnected.
- **Audit Trail**: All login, logout, and socket events are logged for diagnostics and security.

---

For more, see the API docs and the source code in `auth/`, `user/`, and `socket/` modules.

## Development

To extend the authentication system:

1. Add new methods to AuthService
2. Add corresponding endpoints in AuthController or events in AuthGateway
3. Create DTOs for new request types
4. Update MongoDB schema as needed

## Testing

```bash
# Unit tests for auth components
npm run test:auth

# E2E tests for authentication flow
npm run test:e2e:auth
```
