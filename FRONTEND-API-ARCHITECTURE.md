# ForgeBoard: Frontend-API Architecture Documentation

## Architecture Overview

ForgeBoard implements a modern, real-time reactive architecture:

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│                 │     │                   │     │                 │
│   Backend       │────▶│    Socket.IO      │────▶│   Angular       │
│   Events        │     │    Gateway        │     │   Services      │
│                 │     │                   │     │                 │
└─────────────────┘     └───────────────────┘     └────────┬────────┘
                                                           │
                                                           │
                                                           ▼
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│                 │     │                   │     │                 │
│   Angular       │◀────┤    Observable     │◀────┤   RxJS          │
│   Components    │     │    Streams        │     │   Operators     │
│                 │     │                   │     │                 │
└─────────────────┘     └───────────────────┘     └─────────────────┘
```

## Key Components

### Frontend Services

The application features these core services:

1. **MetricsService**: Manages real-time system metrics
   - Uses Socket.IO for live metric updates
   - Implements mock data generation when backend is unavailable
   - Handles automatic reconnection

2. **KablanService**: Provides project management functionality
   - Manages board data through WebSockets
   - Implements card move operations with optimistic updates
   - Supports phase-based workflow visualization

3. **DiagnosticsService**: Monitors system health
   - Tracks WebSocket connections and status
   - Provides health metrics and timeline data
   - Surfaces connection errors and statistics

4. **LoggerService**: Manages application logs
   - Collects and categorizes log entries
   - Supports filtering and exporting capabilities
   - Allows batch sending of logs to backend

5. **BackendStatusService**: Coordinates connection management
   - Tracks status of all backend gateways
   - Manages reconnection attempts
   - Provides unified status monitoring

### Socket Connection Management

#### Socket Lifecycle
Each socket connection follows a lifecycle pattern:

1. **Initialization**: Socket connects to specific namespaces
2. **Event Subscription**: Registers event handlers for specific data
3. **Error Handling**: Connection errors trigger mock data generation
4. **Reconnection**: Automatic reconnection with backoff strategy
5. **Cleanup**: Proper disconnection and removal of event listeners

#### Mock Data Strategy
When backend connections fail:

1. Services detect disconnection events
2. Mock data generation begins at appropriate intervals
3. UI indicates simulated data status
4. Periodic reconnection attempts are made
5. Seamless transition back to real data when backend returns

#### Connection Status Monitoring
The system provides comprehensive connection status tracking:

- Real-time status indicators on the UI
- Visual differentiation between live and mock data
- Connection metrics (duration, active sessions)
- Animated status transitions

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

```
┌─────────────────┐     ┌───────────────────────────────────────┐
│                 │     │                                       │
│  Socket.IO      │────▶│  Service Layer                        │
│  Events         │     │                                       │
│                 │     │  ┌───────────────┐  ┌───────────────┐ │
└─────────────────┘     │  │ BehaviorSubj/ │  │ Public        │ │
                        │  │ Subject       │──▶ Observable    │ │
┌─────────────────┐     │  └───────────────┘  └───────────────┘ │
│                 │     │                                       │
│  HTTP           │────▶│                                       │
│  Responses      │     │                                       │
│                 │     └───────────────────────────────────────┘
└─────────────────┘                       │
                                          │
                                          ▼
                        ┌───────────────────────────────────────┐
                        │                                       │
                        │  Component Layer                      │
                        │                                       │
                        │  ┌───────────────┐  ┌───────────────┐ │
                        │  │ Subscribe to  │  │ Update UI     │ │
                        │  │ Observables   │──▶ State         │ │
                        │  └───────────────┘  └───────────────┘ │
                        │                                       │
                        └───────────────────────────────────────┘
```

### Mock Data & Reconnection Strategy

```
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│                 │     │                   │     │                 │
│  Connection     │────▶│  Error            │────▶│  Mock Data      │
│  Failure        │     │  Detection        │     │  Generation     │
│                 │     │                   │     │                 │
└─────────────────┘     └───────────────────┘     └────────┬────────┘
                                                           │
                                                           │
                                                           ▼
┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│                 │     │                   │     │                 │
│  Backend        │◀────┤  Reconnection     │◀────┤  Status         │
│  Connection     │     │  Logic            │     │  Indicator      │
│                 │     │                   │     │                 │
└─────────────────┘     └───────────────────┘     └─────────────────┘
```

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

