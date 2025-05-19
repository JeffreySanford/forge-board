# 🛠️ ForgeBoard NestJS Contribution & Coding Standards

## Overview
This guide covers standards for NestJS (Node.js backend) in ForgeBoard:
- **Project Structure**: Modular, feature separation via modules.
- **Controllers**: Handle HTTP/WebSocket. Services: business logic.
- **DTOs**: Use DTOs and validation pipes for all inputs.

## Guidelines
- **TypeScript strict mode**: Always enabled.
- **Testing**: All services/controllers must have unit tests.
- **Dependency Injection**: Use for all services.
- **RxJS**: Use for async flows where appropriate.
- **API**: REST endpoints versioned (e.g., /api/v1/), OpenAPI decorators for docs, namespaced WebSocket events.

---
