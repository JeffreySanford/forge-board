# ForgeBoard Dashboard

## Overview
ForgeBoard is a real-time metrics dashboard inspired by 1970s engineering blueprints and technical drawings. It provides a unique user experience by combining modern Angular components with the visual language of vintage aerospace documentation.

## Features
- Real-time system monitoring with WebSocket connections
- Blueprint-inspired UI with animated components
- Typewriter-style animations and sound effects
- Multiple dashboard tiles for various metrics
- Interactive components that maintain the blueprint aesthetic

## Documentation
- [Coding Standards](./CODING-STANDARDS.md) - Development guidelines and best practices
- [Layout Specification](./LAYOUT.md) - Blueprint UI design specifications
- [API Documentation](./forgeboard-api/README.md) - API endpoints and usage

## Getting Started

### Prerequisites
- Node.js 14+
- npm or yarn
- Angular CLI

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/forge-board.git

# Install dependencies for both frontend and API
cd forge-board
npm install

# Start the development server
npm run start
```

## Architecture
ForgeBoard consists of two main components:
1. **forgeboard-frontend**: Angular application with Material design
2. **forgeboard-api**: NestJS backend with WebSockets for real-time metrics

### WebSocket Communication
ForgeBoard uses a standardized WebSocket communication pattern:

- All socket messages follow a consistent response structure:
  ```typescript
  interface SocketResponse<T> {
    status: 'success' | 'error';
    data: T;
    timestamp: string;
  }
  ```
- Each service has a corresponding gateway in the backend
- TypeScript interfaces ensure type safety across frontend and backend
- Socket connections are automatically cleaned up in component destroy lifecycle hooks

### Usage Example

**Backend Gateway:**
```typescript
@WebSocketGateway()
export class MetricsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit() {
    setInterval(() => {
      const metrics = {
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        time: new Date().toLocaleTimeString(),
      };
      
      const response = createSocketResponse('system-metrics', metrics);
      this.server.emit('system-metrics', response);
    }, 1000);
  }
}
```

**Frontend Service:**
```typescript
@Injectable()
export class MetricsService implements OnDestroy {
  private socket: Socket | null = null;
  private metricsSubject = new Subject<MetricData>();

  constructor() {
    this.initSocket();
  }

  initSocket() {
    this.socket = io('http://localhost:3000');
    this.socket.on('system-metrics', (response: SocketResponse<MetricData>) => {
      if (response.status === 'success') {
        this.metricsSubject.next(response.data);
      }
    });
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.metricsSubject.complete();
  }
}
```

## Type Safety and Shared DTOs

- All diagnostics and metrics data structures use explicit TypeScript interfaces.
- DTOs (Data Transfer Objects) are defined for all API and WebSocket payloads.
- Shared types are centralized (see `LAYOUT.md` and code comments) to ensure consistency between frontend and backend.
- This approach prevents type drift and runtime errors, and supports scalable, maintainable real-time features.

For more details, see the [Architecture & Expansion](./LAYOUT.md#🧠-architecture--expansion) and [Coding Standards](./CODING-STANDARDS.md) documents.

## Blueprint UI Philosophy
ForgeBoard's UI is built upon the visual language of technical drawings from the aerospace industry. It features:

- Deep navy backgrounds (#0d1b2a)
- Crisp white grid lines and borders
- Monospace typography (IBM Plex Mono, Courier New)
- Animated elements that mimic plotting machines
- Typewriter-like interactions and sound effects

For more details on the UI architecture, see the [Layout Specification](./LAYOUT.md).

## Contributors
- Jeffrey Sanford - Systems Architect

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is almost ready ✨.

Run `npx nx graph` to visually explore what got created. Now, let's get you up to speed!

## Finish your CI setup

[Click here to finish setting up your workspace!](https://cloud.nx.app/connect/VJ0JqS6RsX)


## Run tasks

To run tasks with Nx use:

```sh
npx nx <target> <project-name>
```

For example:

```sh
npx nx build myproject
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

To install a new plugin you can use the `nx add` command. Here's an example of adding the React plugin:
```sh
npx nx add @nx/react
```

Use the plugin's generator to create new projects. For example, to create a new React app or library:

```sh
# Generate an app
npx nx g @nx/react:app demo

# Generate a library
npx nx g @nx/react:lib some-lib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)


[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Architecture Overview

ForgeBoard is a modular Angular dashboard with a blueprint-inspired visual language. The application follows a client-server architecture:

- **Frontend**: Angular 16 application with Material design components and RxJS for reactive data flows
- **Backend**: NestJS API server with WebSocket support for real-time metrics

## Application Structure

- **Pages**: Main routable sections of the application (Home, Metrics, Kablan Board)
- **Components**: Reusable UI elements and tiles
- **Services**: Data and state management
- **Directives**: Behavior encapsulation (like letter animations)

## Features

- **Blueprint-inspired Design**: Aesthetic inspired by vintage engineering documents
- **Real-time Metrics**: WebSocket-based performance monitoring
- **Responsive Layout**: Adapts to different screen sizes
- **Error Handling**: Comprehensive error pages with service status checks
- **Grid Overlays**: Interactive design guides for development and alignment
- **Sound Effects**: Typewriter audio feedback system

## Navigation Structure

The application features a comprehensive routing system:
- `/home` - Dashboard landing page
- `/metrics` - Performance monitoring view
- `/kablan` - Kanban-style board for task management
- `/404` - Custom 404 page with system status checks

## Known Issues & Troubleshooting

### Server Connectivity Issues

The frontend application can route correctly even when the backend API is unavailable. This means:

- The UI will load and function properly
- Routes will work correctly
- But real-time data and API-dependent features will fail

#### Symptoms of API Connection Issues:
- Empty metric displays
- "No data available" messages
- Missing activity feed items
- Error messages in browser console (check Network tab)

#### Common Solutions:
1. Verify the API server is running on the correct port
2. Check network connectivity between client and server
3. Verify API endpoints are correctly configured in services
4. Examine CORS settings on the server

## Development

### Prerequisites
- Node.js v16+
- Angular CLI
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run start
```

### Testing
```bash
# Unit tests
npm run test

# End-to-end tests
npm run e2e
```

### Sound System
ForgeBoard includes a typewriter-inspired sound system that provides audio feedback for user interactions. The sounds are loaded at runtime and fallback to silent alternatives when unavailable.

See [LAYOUT.md](./LAYOUT.md) for design guidelines and component documentation.
See [API-DOCUMENTATION.md](./API-DOCUMENTATION.md) for API endpoint documentation.

## Type Safety and Shared DTOs

- All diagnostics and metrics data structures use explicit TypeScript interfaces.
- DTOs (Data Transfer Objects) are defined for all API and WebSocket payloads.
- Shared types are centralized (see `LAYOUT.md` and code comments) to ensure consistency between frontend and backend.
- This approach prevents type drift and runtime errors, and supports scalable, maintainable real-time features.

For more details, see the [Architecture & Expansion](./LAYOUT.md#🧠-architecture--expansion) and [Coding Standards](./CODING-STANDARDS.md) documents.
