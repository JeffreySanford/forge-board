# Shared API Interfaces (`@forge-board/api-interfaces`)

This library provides a centralized collection of TypeScript interfaces and types designed for consistent data structures across the ForgeBoard frontend (`forgeboard-frontend`) and backend (`forgeboard-api`) applications. Utilizing these shared types helps prevent data contract mismatches and ensures type safety throughout the platform.

## <span style="color: #4CAF50;">Purpose</span>

- **Consistency**: Ensures that both client and server applications expect and send data in the same shape.
- **Type Safety**: Leverages TypeScript's static typing to catch errors at compile-time rather than runtime.
- **Maintainability**: Simplifies updates to data structures, as changes are made in one central location.
- **Developer Experience**: Provides clear and discoverable data contracts for developers working on either end of the application.

## <span style="color: #2196F3;">Library Structure</span>

- **`src/index.ts`**: The main entry point for the library. It selectively exports types from the `src/lib` directory, providing a curated API for consumers.
- **`src/lib/`**: Contains the individual TypeScript files where interfaces and types are defined. These are typically grouped by domain or functionality (e.g., `user-types.ts`, `socket-types.ts`, `metrics-types.ts`).
  - **`src/lib/index.ts`**: An internal index file that re-exports all type definitions from the library's internal modules. This is then used by the main `src/index.ts`.

## <span style="color: #FF9800;">How to Use</span>

1.  **Installation**: This library is typically part of the Nx monorepo and managed as an internal workspace library. Ensure your `tsconfig.json` paths are configured correctly to resolve `@forge-board/api-interfaces`.

2.  **Importing Types**: In your frontend or backend TypeScript files, you can import the necessary types directly from the library's entry point:

    ```typescript
    import type { User, ApiResponse, MetricData } from '@forge-board/api-interfaces';
    import { Injectable, OnDestroy } from '@angular/core';
    import { BehaviorSubject, Observable } from 'rxjs';

    @Injectable()
    export class UserService implements OnDestroy {
      private userSubject = new BehaviorSubject<ApiResponse<User> | null>(null);

      // Public hot observable API
      public user$: Observable<ApiResponse<User> | null> = this.userSubject.asObservable();

      fetchUserData(userId: string): void {
        // ... fetch logic (e.g., HTTP request) ...
        // this.userSubject.next(fetchedUser);
      }

      ngOnDestroy(): void {
        this.userSubject.complete();
      }
    }

    // Example usage for metrics
    export class MetricsService implements OnDestroy {
      private metricsSubject = new BehaviorSubject<MetricData | null>(null);
      public metrics$: Observable<MetricData | null> = this.metricsSubject.asObservable();

      updateMetrics(data: MetricData): void {
        this.metricsSubject.next(data);
      }

      ngOnDestroy(): void {
        this.metricsSubject.complete();
      }
    }
    ```

## <span style="color: #9C27B0;">Key Type Categories</span>

This library covers a wide range of data structures, including but not limited to:

- **Core API**: Base response structures (`ApiResponse`, `SuccessResponse`).
- **Authentication**: Credentials, tokens, and authentication states (`AuthCredentials`, `User`, `JwtPayload`).
- **Sockets**: Real-time communication event types and payloads (`SocketResponse`, `SocketEvent`, `SocketInfo`, `SocketMetrics`, `SocketStatusUpdate`).
- **Metrics & Diagnostics**: System health, performance metrics, and diagnostic event data (`MetricData`, `MetricResponse`, `HealthTimelinePoint`, `DiagnosticEvent`, `HealthData`).
- **Logging**: Log entry structures and filtering options (`LogEntry`, `LogFilter`, `LogLevelEnum`, `LogStatsResult`, `LogStreamUpdate`).
- **User Management**: User profiles and roles (`User`, `UserRole`).
- **Messages**: System and user message types (`Message`, `SystemBroadcast`, `UserMessage`, `ActionMessage`).
- **Other**: Utility types for validation, dashboard tiles, and more.

For a more detailed breakdown of available types, please refer to the [`TYPE_DEFINITIONS.md`](./TYPE_DEFINITIONS.md) file.

## <span style="color: #F44336;">Contributing</span>

When adding or modifying types:

- Ensure new types are added to an appropriate file within the `src/lib/` directory.
- Export new types from `src/lib/index.ts`.
- Update the main `src/index.ts` if the new types should be part of the public API of this library.
- Strive for clarity and consistency with existing type definitions.
- Consider if any existing types can be reused or extended.
- Update the [`TYPE_DEFINITIONS.md`](./TYPE_DEFINITIONS.md) file if you add or significantly change a major type.

---

_ForgeBoard Platform - Building with Consistency and Precision._
