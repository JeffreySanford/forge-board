# ForgeBoard: Blueprint UI Dashboard

## ✨ What Is This?
ForgeBoard is a dashboard experience inspired by 1970s Boeing engineering documentation. It merges real-time metrics with visual language from vintage blueprints, including:
- Angular Material 3 UI with WebSocket metrics
- Tiles drawn like CAD schematics
- Static metadata blocks styled like callouts
- Live updates and user-authored history

## 🎨 Style Guidelines
- **Color Palette**
  - Primary background: `#0d1b2a` (blueprint blue)
  - Text and lines: `#ffffff` (white)
  - Accent elements: `#4eff91` (terminal green)
  - Error highlights: `#e74c3c` (alert red)
  - Warning elements: `#ffe066` (caution yellow)
- **Typography**
  - All fonts must be monospaced (IBM Plex Mono, Courier New)
  - Text should be uppercase for labels and headers
  - Technical data can use mixed case for readability
- **Layout Elements**
  - Grid system mimics large drafting sheets
  - Callout block uses SVG + animation to "plot" itself into place
  - Tiles have crisp outlines, no rounding, no shadows
  - Fixed margins and alignment based on technical drawing standards
  - **12-column, 4-column, small and large grid overlays** for design/debug, togglable via UI controls

## 📍 Tile Components
- **app-metrics-indicator**: Top-left cornerstone with real-time CPU and memory stats
- **app-connection-status**: Shows WebSocket connection health
- **app-recent-logs**: Displays recent system log entries
- **app-uptime-summary**: Shows system uptime statistics
- **app-activity-feed**: Displays user activity timeline
- **callout-block**: Bottom-right metadata with animated typewriter effect

## 📄 Page Components
- **Home**: Dashboard landing page with featured tiles for navigation
- **Metrics**: Real-time system metrics with visualization
- **Kablan Board**: Kanban-style board for task management
- **404/Error Pages**: Service status monitoring and error details

## 🎬 Animation Guidelines
- Use `@keyframes drawOutline` and `drawLine` for SVG path animations
- Mimic plotting machine paths with stroke-dashoffset animations
- Text animation should use character-by-character typing effects
- Different typing speeds:
  - `typeKey` animations for labels (slower, deliberate)
  - `typeVal` animations for values (faster, machine-like)
- Sound effects synchronize with animations:
  - Slow typing for line starts
  - Fast typing for character sequence
  - Ding sound at the end of completed lines

## 🔊 Sound System
- Typewriter-inspired sound effects for interactions
- Key sounds for character animations
- Terminal bell sound effects for completion events
- Volume/mute controls via persistent UI
- Fallback system for unavailable audio files

## 🧠 Architecture & Expansion

### Component Structure
- All tiles follow the non-standalone Angular component pattern
- Use NgModules for proper organization
- Maintain consistent blueprint styling across all components

### Shared Interface Types

ForgeBoard uses a centralized type system to ensure consistency between frontend and backend:

1. **Logger Types** (`libs/shared/api-interfaces/src/lib/logger-types.ts`)
   - `LogLevel`: Enum for log severity levels
   - `LogEntry`: Interface for structured log entries
   - `LogFilter`: Interface for log filtering options
   - `LogResponse`: Interface for API responses with logs

2. **Metric Types** (`libs/shared/api-interfaces/src/lib/metric-types.ts`)
   - `MetricEvent`: Enum for metric event types
   - `MetricData`: Interface for metric data points
   - `HealthData`: Interface for system health information
   - `DiagnosticEvent`: Interface for system diagnostic events

3. **Socket Types** (`libs/shared/api-interfaces/src/lib/socket-types.ts`)
   - `SocketResponse<T>`: Generic interface for standardized socket responses
   - `SocketEvent`: Enum for socket event names
   - `SocketInfo`: Interface for socket connection information
   - `SocketMetrics`: Interface for socket performance metrics

These shared types ensure type safety, self-documenting code, and prevent mismatches between frontend and backend implementations.

### Navigation Structure
- Material-based side navigation
- Consistent layout across all routes
- Persistent global controls for design overlays

### Error Handling
- Custom 404 page with system status checking
- Service availability monitoring
- Graceful degradation for API failures
- Visual status indicators

### Adding New Tiles
1. Create a component in `tiles/your-component`
2. Apply the blueprint styling
3. Add to `app.module.ts` declarations
4. Include in the grid in `app.component.html`

### Adding New Pages
1. Create a component in `pages/your-page`
2. Create a module for the component
3. Add the route to `app-routing.module.ts`
4. Ensure it follows the blueprint design language

### Technical Requirements
- Use Renderer2 for DOM manipulation instead of direct ElementRef
- Prefer hot RxJS Observables for data streams
- Follow all conventions in the [Coding Standards](./CODING-STANDARDS.md)
- **Strong typing everywhere:** Avoid `any` in TypeScript. Define and use explicit interfaces/types for all data, including WebSocket payloads and DTOs.
- **DTOs for API and Sockets:** Use Data Transfer Objects (DTOs) for all backend API and socket messages. Define DTOs in a shared or backend folder.
- **Centralized Types:** For diagnostics and metrics, define shared types (e.g., `Health`, `DiagnosticInfo`, `MetricData`) in a common location (such as a `shared` folder or a shared npm package) and import them in both frontend and backend codebases. This ensures type safety and prevents drift.
- **RxJS for Real-Time Data:** Use RxJS Observables for all real-time data streams, including WebSocket events, to ensure composability and error handling.
- **Socket Management:** Sockets should be managed at the Angular component level. Always clean up (unsubscribe/disconnect) in `ngOnDestroy` to prevent leaks.
- **No direct use of `any`:** If a type is not present, define a new interface or type. Use union types or enums for event names and payloads.
- **GraphQL and MongoDB:** When integrating GraphQL and MongoDB (even in-memory), define GraphQL schemas and MongoDB models with strong typing. Use DTOs for all mutations/queries.

## 💡 Inspiration Sources
- Boeing/NASA style sheets from the Apollo and early Space Shuttle era
- Ammonia blueprinting reproduction lines
- Font/line spacing of early 1980s mechanical engineering documents
- White-on-blue monochrome CAD terminal displays
- Typewriter-based documentation from aerospace engineering departments

## 📊 Design Theory Reference

- **12-column grid**: Modular, responsive, and flexible layouts.
- **4-column grid**: Simpler layouts and mobile breakpoints.
- **Small/Large grid overlays**: For micro/macro alignment and vertical rhythm.
- **Overlay toggles**: For design/debug, inspired by Figma/Sketch.
- **Spacing and gutters**: Consistent, readable, and visually harmonious.

## 🔧 Application Architecture

### Frontend-Backend Communication
- **WebSockets**: Used for real-time metrics and updates
- **HTTP Endpoints**: Used for CRUD operations and data fetching
- **Error Handling**: The application includes fallback patterns for API failures

### Connectivity Theory
1. **Routing vs. Data**: Angular routing works entirely client-side, so routes function even when the API server is down
2. **Observable Fallbacks**: Services use RxJS catchError to provide graceful fallbacks when API calls fail
3. **Visual Indicators**: Connection status components show server health visually
4. **Error Pages**: Service-specific error diagnostics on 404/500 error pages

### WebSocket & Real-Time Data Best Practices

- **Type Safety:** All socket events and payloads must use explicit TypeScript types or interfaces.
- **Observable Streams:** Use RxJS Observables for all socket event streams in Angular services/components.
- **Lifecycle Management:** Always disconnect sockets and unsubscribe from Observables in `ngOnDestroy` to avoid memory leaks.
- **DTO Usage:** Define DTOs for all socket messages and API payloads. Never use raw objects or `any`.
- **Backend Typing:** Use TypeScript interfaces and DTOs in NestJS gateways/controllers. Avoid `any` in backend code.
- **GraphQL Integration:** When adding GraphQL, define types and resolvers with strong typing. Use DTOs for mutations and queries.
- **MongoDB Models:** Define Mongoose schemas/models with TypeScript interfaces. Use DTOs for data transfer between layers.

### WebSocket Standard Response Format

To ensure consistency across all socket communications, ForgeBoard uses a standard response format:

```typescript
interface SocketResponse<T> {
  status: 'success' | 'error';
  data: T;
  timestamp: string;
}
```

This pattern provides:
1. Consistent error handling (check `response.status === 'success'`)
2. Type-safe payloads with generics (`T` can be any data structure)
3. Timestamps for tracking and debugging
4. Future extensibility without breaking changes

**Example Gateway Implementation:**

```typescript
@WebSocketGateway()
export class DiagnosticsGateway {
  @WebSocketServer()
  server: Server;

  emitDiagnosticEvent(eventData: DiagnosticEvent): void {
    const response = createSocketResponse('diagnostics-event', eventData);
    this.server.emit('diagnostics-event', response);
  }
}
```

**Example Client Implementation:**

```typescript
this.socket.on('diagnostics-event', (response: SocketResponse<DiagnosticEvent>) => {
  if (response.status === 'success') {
    // Handle event data in response.data
    console.log(`Event received at ${response.timestamp}`);
  } else {
    // Handle error case
  }
});
```

## 🩺 Diagnostics Module & Metrics Integration

- The Diagnostics module is responsible for registering application lifecycle events (such as start and stop) and collecting diagnostic information.
- On application/component start, it registers a "started" event and begins pulling live metrics data via the MetricsService.
- On destroy, it registers a "stopped" event for auditing and compliance.
- The MetricsService is integrated into the Diagnostics module to provide real-time system metrics, which can be used for auditing (NIST RMF, FedRAMP) and operational dashboards.
- This architecture supports scalable, centralized management of sockets and live data streams, and is suitable for compliance and auditing use cases.

### Troubleshooting & Potential Issues

- **Socket Leaks:** If sockets are not disconnected on component destroy, memory leaks and zombie connections may occur. Always manage sockets at the component/service level and clean up in `ngOnDestroy`.
- **Type Drift:** Using `any` or loosely typed objects can lead to runtime errors and hard-to-debug issues. Always define and enforce types.
- **GraphQL/MongoDB Sync:** When running GraphQL and MongoDB in-memory, ensure DTOs and models are kept in sync. Use code generation or shared types if possible.

---

_ForgeBoard is designed for developer enablement: strong typing, explicit DTOs, and RxJS everywhere. See [CODING-STANDARDS.md](./CODING-STANDARDS.md) for more._
