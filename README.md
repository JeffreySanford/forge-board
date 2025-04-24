# ForgeBoard

ForgeBoard is a modern, real-time dashboard and management platform inspired by vintage engineering blueprints (1970s Boeing/NASA). It combines a highly interactive Angular Material frontend with a robust, type-safe NestJS backend, delivering live system metrics, diagnostics, logs, and task management in a visually distinctive, blueprint-style UI.

---

## ✨ Project Intent

- **Developer Enablement:** Demonstrate best practices in Angular and NestJS, with strong typing, DTOs, and RxJS for all real-time data.
- **Blueprint Aesthetic:** Recreate the look and feel of classic engineering documentation, with monospaced fonts, grid overlays, and animated SVG/CAD-like elements.
- **Real-Time Monitoring:** Provide live system metrics, diagnostics, and logs via WebSockets, with seamless fallback to mock data if the backend is unavailable.
- **Robust Error Handling:** Graceful degradation, clear status indicators, and auto-reconnection ensure the dashboard remains usable even during backend outages.
- **Extensibility:** Modular tile/page/component architecture, with shared types and DTOs for easy expansion and maintenance.

---

## 🏗️ Architecture Overview

- **Frontend:** Angular (NgModules, non-standalone components), Angular Material, RxJS, Socket.IO client.
- **Backend:** NestJS (REST + WebSocket gateways), DTOs, shared types, strong typing throughout.
- **Shared Types:** All API and socket payloads use explicit TypeScript interfaces, shared via a common library (`libs/shared/api-interfaces`).
- **Real-Time Data:** WebSocket gateways for metrics, diagnostics, and logs, with RxJS Observables on the frontend for composability and error handling.
- **Fallback System:** Automatic switch to mock data and visual indication when backend is unavailable; auto-reconnects when backend returns.
- **Sound System:** Typewriter-inspired audio feedback for UI interactions, with fallback to silent audio if assets are missing.

---

## 🩺 Key Features

- **Live Metrics:** Real-time CPU, memory, disk, and network stats, with animated SVG charts.
- **Diagnostics:** System health, socket status, and event logs, with timeline visualization.
- **Logs:** Real-time log viewer with filtering and search.
- **Task Board:** Kanban-style board for project/task management.
- **Blueprint UI:** Grid overlays, animated callouts, and monospaced typography for a unique engineering look.
- **Error Handling:** Custom 404/service status page, robust error routing, and visual status indicators.
- **Sound Effects:** Typewriter and terminal bell sounds for key UI actions, with user controls and fallbacks.

---

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the backend:**
   ```bash
   npx nx serve forgeboard-api
   ```

3. **Run the frontend:**
   ```bash
   npx nx serve forgeboard-frontend
   ```

4. **Access the dashboard:**
   - Open [http://localhost:4200](http://localhost:4200) in your browser.

---

## 📚 Documentation

- [LAYOUT.md](./LAYOUT.md): Blueprint UI and design guidelines.
- [CODING-STANDARDS.md](./CODING-STANDARDS.md): Coding standards, type safety, and RxJS patterns.
- [API-DOCUMENTATION.md](./API-DOCUMENTATION.md): REST and WebSocket API endpoints and response formats.
- [FRONTEND-API-ARCHITECTURE.md](./FRONTEND-API-ARCHITECTURE.md): Frontend-backend communication and architecture.
- [libs/shared/api-interfaces](./libs/shared/api-interfaces): All shared types, DTOs, and socket response helpers.

---

## 🏆 Successes

- **Type-safe, maintainable codebase:** Shared interfaces and DTOs prevent drift and runtime errors.
- **Robust real-time data:** RxJS and Socket.IO provide seamless, composable real-time streams.
- **Graceful error handling:** Fallbacks and auto-reconnection keep the dashboard usable at all times.
- **Blueprint-inspired UI:** Unique, memorable design with strong visual identity.
- **Extensible architecture:** Easy to add new tiles, pages, or backend endpoints.

---

## 🛠️ Areas for Further Improvement

- **Automated tests:** Expand E2E and unit test coverage for all tiles and services.
- **Accessibility:** Continue improving ARIA roles and keyboard navigation.
- **GraphQL/MongoDB integration:** Add strong-typed GraphQL endpoints and MongoDB models for persistent data.
- **User authentication:** Integrate secure authentication and role-based access control.
- **Advanced metrics:** Add more system metrics, historical data, and alerting.

---

## 💡 Inspiration

- Boeing/NASA engineering documentation (Apollo, Space Shuttle era)
- White-on-blue CAD terminals and typewriter-based technical docs

---

_ForgeBoard is a showcase of modern, type-safe, real-time dashboard engineering, with a nod to the golden age of aerospace design._
