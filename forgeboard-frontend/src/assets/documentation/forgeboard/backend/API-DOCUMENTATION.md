# 🔌 ForgeBoard NX API Documentation
*Last Updated: May 15, 2025*

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
  <div style="background-color: #002868; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>API:</strong> REST + WebSocket ✅
  </div>
  <div style="background-color: #BF0A30; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Data Provenance:</strong> Server-Managed Lifecycle 🔄
  </div>
  <div style="background-color: #F9C74F; color: #333; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>WebRTC:</strong> P2P for Ephemeral Data 🌐
  </div>
  <div style="background-color: #90BE6D; color: #333; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Status:</strong> Production-Ready 🚀
  </div>
</div>

## API Philosophy

ForgeBoard NX implements a Server-Authoritative architecture with complete, server-managed data provenance:

1. **Server is the Source of Authority**: All data and its provenance live on the server, which controls access and modifications.
2. **Complete Data Lifecycle (Server-Managed)**: All data includes server-managed provenance records from inception through disposal.
3. **P2P Communication for Ephemeral Data**: WebRTC connections can be used for direct peer exchange of non-authoritative, ephemeral data, while authoritative data is server-managed.
4. **CRDT for Conflict Resolution (Server-Side)**: Conflict-free merging, orchestrated by the server, while preserving server-managed provenance chains.
5. **Blockchain Immutability (Server-Side)**: Critical provenance records stored in a server-managed, tamper-proof blockchain.

## Data Provenance API Architecture Overview (Server-Authoritative)

```mermaid
flowchart LR
  subgraph SERVER [Server - Authoritative API & Data Store]
    direction TB
    PrimaryStore[(Primary Data Store)]:::server_store
    Chain[(SlimChain - Server Ledger)]:::chain
    CRDT[CRDT Merge Engine (Server)]:::crdt
    Prov[Provenance Engine (Server)]:::prov
    RESTAPI[REST API]:::remote
    WSAPI[WebSockets API]:::remote
  end
  
  subgraph P2P [Optional WebRTC P2P Mesh for Ephemeral Data]
    direction TB
    P2P1[Peer 1 / Client]:::p2p
    P2P2[Peer 2 / Client]:::p2p
    P2P3[Peer 3 / Client]:::p2p
  end
  
  PrimaryStore -->|"Authoritative Data"| Prov
  Prov -->|"Track & Verify"| CRDT
  CRDT -->|"Persist Provenance"| Chain
  
  P2P1 <-->|"Ephemeral Data Exchange"| P2P2
  P2P2 <-->|"Ephemeral Data Exchange"| P2P3
  
  P2P1 -->|"API Calls for Authoritative Data"| RESTAPI
  P2P1 -->|"Real-time Updates"| WSAPI
  P2P2 -->|"API Calls for Authoritative Data"| RESTAPI
  P2P2 -->|"Real-time Updates"| WSAPI
  P2P3 -->|"API Calls for Authoritative Data"| RESTAPI
  P2P3 -->|"Real-time Updates"| WSAPI

  classDef server_store fill:#002868,stroke:#BF0A30,stroke-width:3px,color:#FFFFFF;
  classDef chain fill:#BF0A30,stroke:#7D100E,stroke-width:3px,color:#FFFFFF;
  classDef crdt fill:#F9C74F,stroke:#FB8C00,stroke-width:2px;
  classDef p2p fill:#90BE6D,stroke:#43A047,stroke-width:2px;
  classDef remote fill:#CCCCCC,stroke:#666666,stroke-width:1px,color:#333333;
  classDef prov fill:#002868,stroke:#071442,stroke-width:3px,color:#FFFFFF;
```

## API Layers

### Layer 1: Server-Side Authoritative Store & Provenance Engine (Primary)

All interactions in ForgeBoard NX are ultimately authorized and processed by the server, which maintains the authoritative data store and comprehensive data provenance tracking.

### Layer 2: Server-Managed APIs (REST & WebSockets)

Clients interact with the server via REST APIs for request-response operations and WebSockets for real-time data streams. The server ensures all data access is authenticated and authorized, and all changes include provenance.

### Layer 3: Optional WebRTC P2P Mesh (For Ephemeral/Non-Authoritative Data)

Direct peer-to-peer communication can be utilized for specific features involving ephemeral data exchange (e.g., cursor positions, temporary UI states) but does not handle authoritative data changes, which must go through the server.

## API Overview

ForgeBoard uses a combination of REST APIs and WebSocket connections for real-time data exchange. This document describes both API types.

## Base URLs

- REST API: `http://localhost:3000/api`
- WebSocket: `http://localhost:3000`

## Authentication

Authentication is not yet implemented in the current version.

## WebSocket Namespaces

### Metrics Namespace

**Endpoint**: `/metrics`

This namespace provides real-time system performance metrics.

#### Events

**Server → Client (through Socket.IO namespace events):**

| Event | Description | Data Structure |
|-------|-------------|----------------|
| `system-metrics` | Real-time system metrics update | `MetricData` |

**Client → Server:**

| Event | Description | Expected Response |
|-------|-------------|-------------------|
| `subscribe-metrics` | Start receiving metric updates | Stream of `system-metrics` events |
| `set-interval` | Set the metrics update interval | Acknowledgment |

### Diagnostics Namespace

**Endpoint**: `/diagnostics`

This namespace provides system diagnostic information.

#### Events

**Server → Client (through Socket.IO namespace events):**

| Event | Description | Data Structure |
|-------|-------------|----------------|
| `socket-status` | Current status of socket connections | `SocketStatusUpdate` |
| `socket-logs` | Socket connection events log | `SocketLogEvent[]` |
| `health-update` | System health information | `HealthData` |

**Client → Server:**

| Event | Description | Expected Response |
|-------|-------------|-------------------|
| `get-socket-status` | Request current socket status | `socket-status` event |
| `get-socket-logs` | Request socket log history | `socket-logs` event |
| `get-health` | Request system health data | `health-update` event |

### Kanban Namespace

**Endpoint**: `/kanban`

This namespace provides project board data and interactions.

#### Events

**Server → Client (through Socket.IO namespace events):**

| Event | Description | Data Structure |
|-------|-------------|----------------|
| `boards-update` | Current state of all boards | `KanbanBoard[]` |

**Client → Server:**

| Event | Description | Expected Response |
|-------|-------------|-------------------|
| `get-boards` | Request all available boards | `boards-update` event |
| `move-card` | Move a card to a new position | Acknowledgment + `boards-update` |

## REST API Endpoints

### Status Endpoints

#### GET /api/status

Check API availability and health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2023-07-15T12:34:56Z",
  "version": "1.0.0",
  "services": {
    "metrics": { "available": true, "status": "online" },
    "diagnostics": { "available": true, "status": "online" }
  }
}
```

#### GET /api/status/service/:name

Check status of a specific service.

**Response:**
```json
{
  "available": true,
  "status": "online",
  "lastUpdated": "2023-07-15T12:34:56Z"
}
```

### Metrics Endpoints

#### GET /api/metrics/status

Check metrics service health.

**Response:**
```json
{
  "status": "online",
  "timestamp": "2023-07-15T12:34:56Z"
}
```

#### GET /api/metrics/set-interval

Set the interval for metrics updates.

**Query Parameters:**
- `interval`: Update interval in milliseconds

**Response:**
```json
{
  "success": true,
  "message": "Interval updated",
  "data": { "interval": 500 },
  "timestamp": "2023-07-15T12:34:56Z"
}
```

#### POST /api/metrics/register

Register new metrics data.

**Request Body:**
```json
{
  "cpu": 45.2,
  "memory": 62.8,
  "disk": 55.1,
  "network": 32.5,
  "time": "2023-07-15T12:34:56Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Metrics registered",
  "data": null,
  "timestamp": "2023-07-15T12:34:56Z"
}
```

### Diagnostics Endpoints

#### GET /api/diagnostics/health

Get system health information.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2023-07-15T12:34:56Z",
  "details": {
    "past": "Server started 3600 seconds ago. Initial status was 'healthy'.",
    "present": "Server is currently 'healthy' with uptime of 3600 seconds.",
    "future": "If current trends continue, the server is expected to remain 'healthy' and stable."
  }
}
```

#### GET /api/diagnostics/sockets

Get information about socket connections.

**Response:**
```json
{
  "activeSockets": [
    {
      "id": "socket123",
      "namespace": "/metrics",
      "clientIp": "127.0.0.1",
      "userAgent": "Mozilla/5.0...",
      "connectTime": "2023-07-15T12:30:00Z",
      "lastActivity": "2023-07-15T12:34:56Z"
    }
  ],
  "metrics": {
    "totalConnections": 5,
    "activeConnections": 1,
    "disconnections": 4,
    "errors": 0,
    "messagesSent": 120,
    "messagesReceived": 30
  }
}
```

### Logs Endpoints

#### GET /api/logs

Get log entries with optional filtering and complete provenance information.

**Query Parameters:**
- `level`: Filter by log level (debug, info, warning, error)
- `source`: Filter by log source
- `from`: Filter by start date/time
- `to`: Filter by end date/time
- `limit`: Maximum number of logs to return
- `includeProvenance`: Whether to include full provenance chain (default: false)

**Response:**
```json
{
  "logs": [
    {
      "id": "log123",
      "level": "info",
      "message": "Server started",
      "source": "app",
      "timestamp": "2023-07-15T12:30:00Z",
      "data": { "pid": 1234 },
      "provenance": {
        "id": "prov-abc-123",
        "stage": "storage",
        "origin": "app-server",
        "signature": "abc123xyz...",
        "previousStageId": "prov-abc-122",
        "hash": "sha256-..."
      }
    }
  ],
  "totalCount": 150,
  "filtered": true,
  "status": true,
  "timestamp": "2023-07-15T12:34:56Z"
}
```

#### POST /api/logs/batch

Send multiple log entries in a batch with provenance tracking.

**Request Body:**
```json
{
  "logs": [
    {
      "level": "info",
      "message": "User login",
      "source": "auth",
      "timestamp": "2023-07-15T12:34:56Z",
      "data": { "userId": "user123" },
      "provenance": {
        "origin": "auth-service",
        "purpose": "security-audit",
        "signature": "abc123xyz..."
      }
    },
    {
      "level": "error",
      "message": "API error",
      "source": "api",
      "timestamp": "2023-07-15T12:34:58Z",
      "data": { "status": 500, "path": "/api/users" },
      "provenance": {
        "origin": "api-gateway",
        "purpose": "error-tracking",
        "signature": "def456xyz..."
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "timestamp": "2023-07-15T12:34:59Z",
  "provenanceReceipts": [
    {
      "logId": "log124",
      "provenanceId": "prov-abc-124",
      "blockchainTxId": "tx-123",
      "verified": true
    },
    {
      "logId": "log125",
      "provenanceId": "prov-abc-125",
      "blockchainTxId": "tx-124",
      "verified": true
    }
  ]
}
```

### Provenance Endpoints

#### GET /api/provenance/:dataId

Get the complete provenance chain for a specific data record.

**Parameters:**
- `dataId`: The ID of the data record

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-15T12:34:56Z",
  "provenanceChain": [
    {
      "id": "prov-abc-123",
      "stage": "inception",
      "dataId": "data123",
      "timestamp": "2023-07-15T12:30:00Z",
      "source": "user-input",
      "hash": "sha256-...",
      "signature": "abc123xyz..."
    },
    {
      "id": "prov-abc-124",
      "stage": "processing",
      "dataId": "data123",
      "timestamp": "2023-07-15T12:31:00Z",
      "source": "processing-service",
      "previousStageId": "prov-abc-123",
      "previousHash": "sha256-...",
      "hash": "sha256-...",
      "signature": "def456xyz..."
    },
    {
      "id": "prov-abc-125",
      "stage": "storage",
      "dataId": "data123",
      "timestamp": "2023-07-15T12:32:00Z",
      "source": "storage-service",
      "previousStageId": "prov-abc-124",
      "previousHash": "sha256-...",
      "hash": "sha256-...",
      "signature": "ghi789xyz...",
      "blockchainTxId": "tx123"
    }
  ],
  "verified": true
}
```

#### POST /api/provenance/verify

Verify the integrity of a provenance chain.

**Request Body:**
```json
{
  "provenanceId": "prov-abc-125"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-15T12:34:56Z",
  "verified": true,
  "blockchain": {
    "txId": "tx123",
    "blockId": "block456",
    "timestamp": "2023-07-15T12:32:05Z"
  },
  "merkleProof": {
    "root": "merkle-root-hash",
    "path": ["hash1", "hash2", "hash3"]
  }
}
```

#### POST /api/provenance/export

Generate a portable proof package for provenance verification.

**Request Body:**
```json
{
  "dataId": "data123",
  "format": "pdf"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2023-07-15T12:34:56Z",
  "documentUrl": "/api/documents/proof-data123.pdf",
  "verificationUrl": "https://verify.forgeboard.io/?proof=abc123"
}
```

## Shared API Interfaces Library

The `@forge-board/shared/api-interfaces` package provides shared TypeScript types and helper functions for both frontend and backend:

### Installation
```bash
npm install @forge-board/shared/api-interfaces
```

### Exported Types
- ApiResponse<T>         — Base REST response type
- SuccessResponse<T>     — REST success wrapper
- SocketResponse<T>      — WebSocket response wrapper
- SocketEvent            — Basic socket event shape
- SocketInfo             — Connection metadata record
- SocketMetrics          — Connection metrics counters
- SocketStatusUpdate     — Combined socket info + metrics
- SocketConnectionError  — Error payload for socket streams
- AuthCredentials        — Login request payload
- AuthTokenResponse      — JWT token response shape
- User                   — Application user record
- UserRole               — `'admin' | 'user' | 'guest'`
- JwtPayload             — JWT claims interface
- AuthState              — In‑memory auth state (user, token)
- MetricData             — System metric item
- MetricResponse         — Metric REST response wrapper
- MetricFilter           — Metric query parameters
- MetricUpdate           — Metric batch format
- DiagnosticEvent        — Diagnostic event record
- HealthData             — System health snapshot
- LogEntry               — Log record
- LogFilter              — Log query parameters
- LogQueryResponse       — Log query result wrapper
- LogBatchResponse       — Batched log POST response
- TileType               — Dashboard tile identifiers
- ProvenanceMetadata     — Data provenance metadata
- ProvenanceRecord       — Complete provenance record
- ProvenanceStage        —
