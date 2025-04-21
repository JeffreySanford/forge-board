# ForgeBoard Coding Standards

## Angular

- Use Renderer2 for DOM manipulation.
- Always use explicit Angular decorators.
- Organize imports: Angular, third-party, internal, local.
- Use snake-case for services, kebab-case for components.
- No direct DOM access.
- Keep functions small and focused.
- Avoid unnecessary comments.
- Use Angular CLI for scaffolding.
- Components: `standalone: false` for module structure.

## RxJS

- Prefer hot observables for real-time data.
- Avoid Promises/async-await unless necessary.

## General

- No "crap code": prioritize clarity, performance, security, testability.
- All code must be maintainable and consistent.

---
