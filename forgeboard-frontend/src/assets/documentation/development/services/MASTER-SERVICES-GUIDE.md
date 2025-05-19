# ForgeBoard: Master Services Guide

*Last Updated: May 19, 2025*

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
  <div style="background-color: #002868; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Category:</strong> Angular & Backend Services
  </div>
  <div style="background-color: #BF0A30; color: white; padding: 8px 12px; border-radius: 6px; flex: 1; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    <strong>Status:</strong> Production Ready
  </div>
</div>

---

## Overview

This master guide covers the architecture, implementation, and best practices for all services in ForgeBoard, including Angular frontend services and backend (NestJS) services. Topics include:
- Service patterns and dependency injection
- Lifecycle management and cleanup
- Observables and RxJS integration
- Security and compliance considerations

---

## Service Patterns in ForgeBoard

- **Singleton Services:** Used for global state and cross-cutting concerns.
- **Feature Services:** Scoped to specific modules or features.
- **Utility Services:** Provide reusable logic (e.g., formatting, validation).

---

## Best Practices

- Use dependency injection for all services.
- Clean up subscriptions and resources in `ngOnDestroy`.
- Document all public methods and expected behaviors.
- Enforce security and compliance in all service logic.

---

## Reference
- See all service-related documentation in this directory and the main architecture guides.

---

*This master document consolidates all service-related guidance for ForgeBoard. For details, see the referenced files and subdirectories.*
