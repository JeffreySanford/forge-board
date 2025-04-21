# Forge Board – Coding Standards

## Introduction
At Forge Board, we adhere to strict coding standards designed to produce secure, efficient, and maintainable software. This document provides clear guidelines on Angular best practices, naming conventions, and overall code quality.

---

## 1. Angular's Renderer2 for DOM Manipulation
• Do not access the DOM directly using ElementRef.  
• Use Renderer2 to safely manipulate the DOM.  
• Benefits include security, reduced flicker, and better compatibility with Angular’s rendering engine.

---

## 2. Explicit Angular Decorators
• Always use proper @Component, @Injectable, @Pipe, etc., for clarity and consistency.  
• Decorators make Angular’s dependency injection and component model explicit.

---

## 3. Organized Imports
• Order imports logically:  
  1. Angular core (e.g., @angular/core)  
  2. Third-party libraries (e.g., rxjs, lodash)  
  3. Internal services and components  
  4. Local references (relative paths within the project)

---

## 4. File Naming Conventions
• Use snake-case for services, e.g., metrics-service.ts.  
• Use kebab-case for components, e.g., metrics-indicator.component.ts.  
• File names should be descriptive and match the exported class or service.

---

## 5. Replacing Direct DOM Access
• If you encounter direct DOM access, refactor to use Renderer2.  
• This ensures better security and performance and aligns with Angular’s best practices.

---

## 6. Code Readability and Maintainability
• Follow consistent indentation and spacing.  
• Keep functions small and focused.  
• Avoid unnecessary comments—use expressive variable and function names instead.  
• Use Angular CLI for scaffolding to reduce boilerplate and remain consistent.

---

## 7. Standalone: False
• Configure Angular components with standalone: false.  
• Rationale: A clear, module-based structure prevents confusion in complex applications.  
• Keeping components in NgModules helps manage larger, scalable features.

---

## 8. RxJS “Hot” Observables
• Prefer hot Observables (e.g., websockets or shared subjects) for real-time data.  
• This approach eliminates “callback pyramids” and maintains consistency across asynchronous flows.  
• Use operators like switchMap, mergeMap, etc., to handle complex streams.

---

## 9. Avoid Promises or async/await
• RxJS patterns suffice for most asynchronous tasks.  
• Minimizing multiple approaches keeps code uniform and maintainable.  
• If a feature cannot be modeled as an Observable, carefully justify using promises.

---

## 10. Strict “No Crap Code” Policy
• Remain opinionated to avoid bloat.  
• Prioritize clarity, performance, security, and testability.  
• Challenge seemingly quick-and-dirty solutions to maintain code excellence.

---

## Contributing
• When submitting pull requests, ensure all code changes follow these guidelines.  
• Pull requests may be returned for revision if they fail to adhere to these standards.

---

## Final Note
This policy evolves over time. Stay updated on new Angular patterns, recommended libraries, and project-specific requirements.
