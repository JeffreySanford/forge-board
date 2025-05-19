# 🛠️ ForgeBoard Angular 19+ Contribution & Coding Standards

## Overview
This guide details standards for Angular 19+ development in ForgeBoard:
- **No standalone components**: All declarations in NgModules.
- **State**: NGRX for state, RxJS for async/data streams.
- **Material Design 3**: Use only Angular Material v3, theme via SCSS.

## Guidelines
- **Modules**: Use feature modules for domain separation.
- **State**: NGRX for global/feature state, @ngrx/component-store for local state.
- **RxJS**: Use for all async flows, avoid mutable state.
- **Components**: OnPush change detection, strongly typed Inputs/Outputs, async pipe in templates.
- **Testing**: Unit tests (Jest/Angular TestBed), E2E (Playwright).
- **Visuals**: Follow [Visual Standards](../forgeboard-frontend/src/assets/documentation/design/VISUAL-STANDARDS.md).

---
