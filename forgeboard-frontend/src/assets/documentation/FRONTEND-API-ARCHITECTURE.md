# ForgeBoard: Frontend-API Architecture Documentation

## Architecture Overview

ForgeBoard implements a modern, real-time reactive architecture:

```mermaid
flowchart LR
  subgraph Backend [Backend]
    direction TB
    BE[Backend Events]
  end
  subgraph Gateway [Socket.IO Gateway]
    direction TB
    GW[Socket.IO Server]
  end
  subgraph Frontend [Angular Frontend]
    direction TB
    AS[Angular Services]
    AC[Angular Components]
  end

  BE -->|Socket.IOevents| GW
  GW -->|Observable streams| AS
  AS -->|subscribe| AC

  style BE fill:#FFDDC1,stroke:#E67E22,stroke-width:2px
  style GW fill:#D1E8E4,stroke:#16A085,stroke-width:2px
  style AS fill:#E8D1E8,stroke:#8E44AD,stroke-width:2px
  style AC fill:#D1E8FF,stroke:#2980B9,stroke-width:2px
```

## Key Components

- **MetricsService**: Manages real-time system metrics with live charts, mock fallback, automatic reconnection.
- **KablanService**: Handles Kanban board state via WebSockets, supports optimistic updates and phase workflows.
- **DiagnosticsService**: Tracks health data and socket metrics, surfaces timeline, error logs, and connection stats.
- **LoggerService**: Collects, filters, and exports logs in real time, with CSV export capability.
- **BackendStatusService**: Monitors gateway states, coordinates reconnection, and signals UI indicators.

### Socket Connection Management

```mermaid
sequenceDiagram
  participant C as Component
  participant S as Service
  participant G as Gateway
  participant B as Backend

  Note over C,S: Initialization
  C->>S: initSocket()
  S->>G: connect(namespace)
  G-->>S: connect_ack
  S->>S: next(dataSubject)
  S-->>C: Observable emits

  Note over S: on error -> fallback
  G-->>S: connection_error
  S->>S: startMockDataGeneration()
  S-->>C: mock data stream

  Note over S: reconnect when backend available
  S->>B: GET /status
  B-->>S: {status: success}
  S->>G: reconnect(forceNew)
```

### Mock Data & Reconnection

Elegant fallback to simulated data ensures the UI remains vibrant even if the backend is offline. Seamless transition back to real data occurs automatically upon reconnection.

## Module Structure

### Metrics Module

Provides real-time system performance monitoring with:

- Live metric charts for CPU, memory, disk, and network
- Customizable refresh rates
- Automatic fallback to simulated data
- Visual indicators for connection status

### Kablan Board Module

Implements a Kanban-style project management system with:

- Phase-based workflow visualization
- Drag-and-drop card management
- Visual indicators for task priority
- Timeline-based phase progression

### Diagnostics Module

Offers comprehensive system monitoring tools:

- Health timeline with past, present, and future status
- Socket connection metrics and active session monitoring
- Event logging with filtering capabilities
- Status indicators with visual differentiation

### Logger Module

Provides detailed logging functionality:

- Log collection and categorization
- Filtering by level, source, and content
- Statistics and visualization
- CSV export capability

## Data Flow Patterns

### Service Pattern

```mermaid
flowchart TD
  subgraph Backend [Backend]
    direction TB
    BE[Socket.IO Gateway]:::backend
    BH[HTTP Controller]:::backend
  end
  subgraph ServiceLayer [Angular Service Layer]
    direction TB
    S1[BehaviorSubject/Subject]:::service
    S2[Public Observable API]:::service
  end
  subgraph ComponentLayer [Component Layer]
    direction TB
    C1[Subscribe to Observables]:::component
    C2[Update UI State]:::component
  end

  BE -- WebSocket Events --> S1
  BH -- HTTP Responses --> S1
  S1 -- next() --> S2
  S2 -- subscribe() --> C1
  C1 --> C2

  classDef backend fill:#FFEBEE,stroke:#C62828,stroke-width:2px;
  classDef service fill:#E8D1E8,stroke:#8E44AD,stroke-width:2px;
  classDef component fill:#D1E8FF,stroke:#2980B9,stroke-width:2px;
```

**Explanation:**
- The backend emits events via Socket.IO and responds to HTTP requests.
- The Angular service layer receives both, updates its BehaviorSubject/Subject, and exposes a public Observable API.
- Components subscribe to these Observables and update their UI state reactively.

### Mock Data & Reconnection Strategy

```mermaid
flowchart TD
  CF[Connection Failure]:::error --> ED[Error Detection]:::error --> MD[Mock Data Generation]:::mock
  MD --> SI[Status Indicator]:::status
  SI --> RL[Reconnection Logic]:::reconnect
  RL --> BC[Backend Connection]:::backend
  BC -- success --> SVC[Service Layer]:::service
  RL -- fail --> MD

  classDef error fill:#FFCDD2,stroke:#C62828,stroke-width:2px;
  classDef mock fill:#FFF9C4,stroke:#FBC02D,stroke-width:2px;
  classDef status fill:#E1F5FE,stroke:#0288D1,stroke-width:2px;
  classDef reconnect fill:#E8F5E9,stroke:#43A047,stroke-width:2px;
  classDef backend fill:#FFEBEE,stroke:#C62828,stroke-width:2px;
  classDef service fill:#E8D1E8,stroke:#8E44AD,stroke-width:2px;
```

**Explanation:**
- On connection failure, the service detects the error and starts mock data generation.
- A status indicator is updated for the UI.
- Reconnection logic periodically checks backend availability.
- On successful reconnection, the service resumes real data; otherwise, mock data continues.

## API Integration

### Socket Namespaces

- `/metrics`: Real-time system performance metrics
- `/diagnostics`: System health and connection monitoring
- `/kablan`: Project management board updates and interactions
- `/logger`: Log events and statistics

### REST Endpoints

- `/api/metrics`: Configuration and initial metrics
- `/api/diagnostics`: System diagnostics and health checks
- `/api/kablan`: Board configuration and card management
- `/api/logs`: Log retrieval, filtering, and management
- `/api/status`: System status and availability checks

