# ForgeBoard

A modern monitoring and management dashboard with a blueprint-inspired engineering aesthetic.

## Features

- **Real-time Metrics Dashboard**: Monitor system performance metrics with live visualizations
- **Interactive Kablan Board**: Kanban-style project management with phase-based workflow
- **Comprehensive Diagnostics**: System health monitoring and connection status tracking
- **Advanced Logging System**: Real-time log collection with filtering and export capabilities
- **Mock Data Support**: Seamless fallback to simulated data when backend is unavailable

## System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  Frontend (Angular)                                            │
│                                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │            │  │            │  │            │  │           │ │
│  │  Metrics   │  │ Diagnostics│  │  Kablan    │  │  Logger   │ │
│  │  Module    │  │ Module     │  │  Module    │  │  Module   │ │
│  │            │  │            │  │            │  │           │ │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └─────┬─────┘ │
│         │               │               │               │      │
│         └───────┬───────┴───────┬───────┴───────┬───────┘      │
│                 │               │               │              │
│         ┌───────▼───────────────▼───────────────▼────────┐     │
│         │                                                │     │
│         │        Shared Services & Components            │     │
│         │                                                │     │
│         └────────────────────┬─────────────────────┬─────┘     │
│                              │                     │           │
└──────────────────────────────┼─────────────────────┼───────────┘
                               │                     │
                   Socket.IO   │                     │    HTTP
                  Connections  │                     │   Requests
                               │                     │
┌──────────────────────────────┼─────────────────────┼───────────┐
│                              │                     │           │
│  Backend (NestJS)            │                     │           │
│                              │                     │           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                        │    │
│  │  Websocket Gateways         REST Controllers           │    │
│  │                                                        │    │
│  │  ┌────────────┬────────────┬────────────┬───────────┐  │    │
│  │  │            │            │            │           │  │    │
│  │  │  Metrics   │ Diagnostics│  Kablan    │  Logger   │  │    │
│  │  │  Gateway   │ Gateway    │  Gateway   │  Gateway  │  │    │
│  │  │            │            │            │           │  │    │
│  │  └────────────┴────────────┴────────────┴───────────┘  │    │
│  │                                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                        │    │
│  │  Services                                              │    │
│  │                                                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Architecture Overview

ForgeBoard uses a modular architecture with:

- **Frontend**: Angular 15+ with Material Design components
- **Backend**: NestJS with Socket.IO for real-time data
- **Communication**: WebSockets for live updates, REST APIs for configuration
- **State Management**: RxJS for reactive data flow
- **UI Design**: Blueprint-inspired SCSS with responsive layouts

## Core Modules

| Module | Description | Features |
|--------|-------------|----------|
| Metrics Dashboard | Real-time system monitoring | Live charts, customizable refresh rates, mock data support |
| Kablan Board | Project management system | Phase-based columns, drag-and-drop cards, workflow visualization |
| Diagnostics | System health monitoring | Connection status tracking, socket metrics, health timeline |
| Logger | Comprehensive logging | Filtering, statistics, CSV export |
| Connection Status | Backend connectivity | Real-time status monitoring, automatic mock data fallback |

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run start:dev
   ```
4. Navigate to `http://localhost:4200/`

## Documentation

- [API Documentation](./API-DOCUMENTATION.md)
- [Frontend-API Architecture](./FRONTEND-API-ARCHITECTURE.md)
- [Layout System](./LAYOUT.md)
- [Coding Standards](./CODING-STANDARDS.md)

## Technical Features

- **Socket Connection Management**: Automatic reconnection with backoff strategy
- **Mock Data Generation**: Seamless switch between real and simulated data
- **Reactive UI Updates**: RxJS-powered real-time UI updates
- **Drag-and-Drop Interface**: Customizable dashboard tiles and Kablan cards
- **Responsive Blueprint Design**: Adaptive layout with grid visualization tools

## License

MIT
