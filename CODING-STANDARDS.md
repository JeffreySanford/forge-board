# ForgeBoard Coding Standards

This document defines the core architectural, coding, and workflow standards for the ForgeBoard project. All code, whether backend or frontend, should follow these principles for maintainability, clarity, and real-time robustness.

---

## Angular Architecture

### Smart & Presentational Components

```mermaid
flowchart LR
  Smart[Smart Component]:::smart -->|Inputs/Outputs| Presentational[Presentational Component]:::present
  Smart -->|Service Injection| Service[Service]:::service
  Presentational -->|@Input/@Output| Smart
  classDef smart fill:#E3F2FD,stroke:#1976D2,stroke-width:2px;
  classDef present fill:#FFF3E0,stroke:#FB8C00,stroke-width:2px;
  classDef service fill:#E8F5E9,stroke:#43A047,stroke-width:2px;
```

- **Smart components**: Handle data, inject services, manage state.
- **Presentational components**: Render UI, receive data via `@Input`, emit events via `@Output`.

### Service Design & State Management

```mermaid
flowchart TD
  Service[Service]:::service -->|BehaviorSubject/Subject| State[State Stream]:::state
  State -->|asObservable()| Component[Component]:::component
  Component -->|subscribe| State
  classDef service fill:#E8F5E9,stroke:#43A047,stroke-width:2px;
  classDef state fill:#E1F5FE,stroke:#0288D1,stroke-width:2px;
  classDef component fill:#FFF3E0,stroke:#FB8C00,stroke-width:2px;
```

- Use RxJS `BehaviorSubject` or `Subject` for service state.
- Expose state as `Observable` for components to subscribe.

---

## WebSockets & Real-Time Patterns

### Data Flow: Backend to UI

```mermaid
flowchart TD
  subgraph Backend
    GW[Socket.IO Gateway]:::backend
    HC[HTTP Controller]:::backend
  end
  subgraph ServiceLayer
    S1[BehaviorSubject/Subject]:::service
    S2[Public Observable API]:::service
  end
  subgraph ComponentLayer
    C1[Subscribe to Observables]:::component
    C2[Update UI State]:::component
  end
  GW -- WebSocket Events --> S1
  HC -- HTTP Responses --> S1
  S1 -- next() --> S2
  S2 -- subscribe() --> C1
  C1 --> C2
  classDef backend fill:#FFEBEE,stroke:#C62828,stroke-width:2px;
  classDef service fill:#E8D1E8,stroke:#8E44AD,stroke-width:2px;
  classDef component fill:#D1E8FF,stroke:#2980B9,stroke-width:2px;
```

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

---

## RxJS Guidelines

- Always clean up subscriptions (`ngOnDestroy`, `takeUntil`).
- Use `catchError`, `retry`, and `finalize` for robust error handling.
- Prefer `BehaviorSubject` for state with a current value, `Subject` for event streams.

---

## CSS/SCSS Standards

- **BEM-inspired naming** for all classes.
- **Color variables** for consistency and theme support.
- **Mobile-first** responsive design.

---

## Testing Guidelines

- **Component tests**: Use Angular TestBed, mock services, and DOM queries.
- **Service tests**: Use HttpClientTestingModule, test Observables and error handling.
- **E2E tests**: Use Playwright or Cypress for real user flows.

---

## Documentation & Git Workflow

- All public classes, interfaces, and services must have JSDoc comments.
- Use clear, descriptive commit messages:
  - `feat(scope): Add new feature`
  - `fix(scope): Fix bug`
  - `docs(scope): Update documentation`
- Branch naming: `feature/`, `bugfix/`, `chore/` prefixes.

---

## Summary Diagram: End-to-End Flow

```mermaid
flowchart LR
  FE[Frontend Component]:::component -->|subscribe| SVC[Angular Service]:::service
  SVC -->|WebSocket/HTTP| GW[Socket.IO Gateway/REST]:::backend
  GW -->|DB/Cache| DB[(MongoDB/Cache)]:::db
  classDef component fill:#FFF3E0,stroke:#FB8C00,stroke-width:2px;
  classDef service fill:#E8D1E8,stroke:#8E44AD,stroke-width:2px;
  classDef backend fill:#FFEBEE,stroke:#C62828,stroke-width:2px;
  classDef db fill:#E0F7FA,stroke:#00838F,stroke-width:2px;
```

---

For more details, see the API, Authentication, and Frontend-API-Architecture docs.
