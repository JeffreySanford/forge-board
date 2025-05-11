# Type Definitions for `@forge-board/api-interfaces`

This document provides an overview of the key interfaces and types defined within the `@forge-board/api-interfaces` library. For the most accurate and detailed information, please refer directly to the source TypeScript files.

## <span style="color: #4CAF50;">Core API Structures</span>

Located primarily in `api-interfaces.ts` and `api-response.ts`.

-   **`ApiResponse<T>`**: The fundamental wrapper for all API responses.
    -   `success: boolean`
    -   `data?: T` (The actual payload)
    -   `message?: string`
    -   `timestamp?: string`
    -   `statusCode?: number`
-   **`SuccessResponse<T>`**: Extends `ApiResponse` for successful operations.
-   **`ErrorResponse`**: A specialized `ApiResponse` for error reporting.
-   **`UserData`**: Standardized user information.
    -   `id: string`
    -   `name: string`
    -   `username: string`
    -   `title?: string`
    -   `email?: string`
    -   `created: string`
    -   `modified: string`

## <span style="color: #2196F3;">Socket Communication</span>

Defined across `socket-types.ts` and `socket-registry-types.ts`.

-   **`SocketStatus` (enum)**: Represents the state of a socket connection (e.g., `CONNECTED`, `DISCONNECTED`).
-   **`SOCKET_EVENTS` (const object)**: Defines standard socket event names (e.g., `CONNECT`, `MESSAGE`).
-   **`SocketResponse<T>`**: Wrapper for data sent over sockets.
    -   `event: string`
    -   `status: 'success' | 'error'`
    -   `data: T`
    -   `message?: string`
    -   `timestamp: string`
-   **`SocketEvent`**: Generic socket event structure.
-   **`SocketLogEvent`**: Specific event type for socket logs.
-   **`SocketInfo<TData = unknown>`**: Information about a connected socket.
-   **`SocketMetrics`**: Metrics related to socket activity.
-   **`SocketStatusUpdate<TData = unknown>`**: Payload for socket status changes.
-   **`SocketConnectionError`**: Details about a socket connection error.
-   **`DiagnosticSocketEvent<TData = unknown>`**: Socket events related to diagnostics.
-   **`SocketInfoDto<TData = unknown>`**: Data Transfer Object for socket information, often used with Swagger.

## <span style="color: #FF9800;">User & Authentication</span>

Found in `auth-interfaces.ts` and `user-types.ts`.

-   **`AuthCredentials`**: For username/password authentication.
-   **`AuthTokenResponse`**: Response containing JWT and expiration.
-   **`UserRole` (enum)**: Defines user roles (e.g., `ADMIN`, `USER`, `GUEST`).
-   **`User`**: The primary user object structure.
    -   `id: string`
    -   `username: string`
    -   `role: UserRole`
    -   `email?: string`
    -   `lastLogin?: string`
    -   `preferences?: Record<string, unknown>`
-   **`JwtPayload`**: Structure of the JWT token payload.
-   **`AuthState`**: Represents the authentication state in the application.

## <span style="color: #9C27B0;">Metrics & Diagnostics</span>

Located in `metrics-types.ts`, `diagnostic-types.ts`, `health.type.ts`, `health-timeline.ts`.

-   **`MetricData`**: Interface for individual metric data points.
    -   `cpu: number`
    -   `memory: number`
    -   `disk?: number`
    -   `network?: number`
    -   `time: string` (ISO timestamp)
    -   `[key: string]: number | string | undefined` (for extensibility)
-   **`MetricResponse`**: API response for metric queries.
-   **`MetricFilter`**: Options for filtering metric data.
-   **`DiagnosticEvent`**: Structure for diagnostic events.
    -   `id: string`
    -   `timestamp: string`
    -   `type: string` (e.g., 'error', 'warning', 'info')
    -   `eventType: string` (e.g., 'SystemError', 'UserAction')
    -   `source: string` (e.g., 'BackendService', 'FrontendComponent')
    -   `message: string`
    -   `data?: Record<string, unknown>`
-   **`Health`**: Represents the overall health status of a service/application.
    -   `status: 'up' | 'down' | 'degraded'`
    -   `timestamp: string`
    -   `details?: Record<string, HealthDetail>`
-   **`HealthTimelinePoint`**: A single point in the health history of the application.
    -   `timestamp: string`
    -   `status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'`
    -   `message: string`
    -   `metadata?: Record<string, unknown>`

## <span style="color: #009688;">Logging</span>

Defined in `log-types.ts` and `log-helpers.ts`.

-   **`LogLevelEnum` (enum)**: Defines log severity levels (e.g., `INFO`, `WARN`, `ERROR`).
-   **`LogLevelString` (type alias)**: String representation of log levels.
-   **`LogEntry`**: Structure for a single log entry.
    -   `id: string`
    -   `timestamp: string`
    -   `level: LogLevelEnum`
    -   `message: string`
    -   `source?: string`
    -   `data?: Record<string, unknown>`
-   **`LogFilter`**: Criteria for filtering logs.
-   **`LogResponse`**: API response for log queries.

## <span style="color: #795548;">UI & Tiles</span>

Found in `tile-types.ts`.

-   **`TileType` (type alias)**: Defines the types of dashboard tiles (e.g., 'health', 'metrics').
-   **`Tile`**: Represents a dashboard tile with its configuration.

## <span style="color: #607D8B;">Historical Data & Others</span>

-   **`HistoricalMetrics`**: (`historical-metrics.ts`) For time-series metric data.
-   **`SecurityEvent`**: (`security-event.ts`) For security-related events.
-   **`TypeValidator` & `ValidationResult`**: (`type-validation.ts`) Utilities for runtime type checking.

---
This document is a high-level guide. Always refer to the source code for the most precise definitions.
