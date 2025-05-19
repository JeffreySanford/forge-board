# RxJS & NgRx Best Practices

> **Note:** This document has been merged into the [Comprehensive Service Architecture Guide](./COMPREHENSIVE-SERVICE-ARCHITECTURE.md). Please refer to that document for the most up-to-date information on RxJS and Reactive Programming patterns in ForgeBoard.

The Comprehensive Service Architecture Guide contains detailed sections on:

- Common Anti-Patterns to Avoid
- Best Practices for Service-Gateway-Controller Architecture
- Data Flow Patterns
- Performance Optimization
- Memory Management
- Prevention of Infinite Loops
- Testing Reactive Code

For the most current and complete information, please refer to the [Comprehensive Service Architecture Guide](./COMPREHENSIVE-SERVICE-ARCHITECTURE.md).

## Key Principles

1. **Shared Interface Library**: Use a single source of truth for all data models
2. **NgRx for State Management**: Prefer NgRx over direct Subject manipulation
3. **Finite Buffers**: Control stream sizes to prevent memory issues
4. **Cleanup**: Always implement proper teardown logic with `takeUntil`
5. **Interface Isolation**: Use interfaces to clearly define service boundaries
6. **Avoid Direct Subscriptions**: Never subscribe to subjects directly within services
7. **Immutable State Updates**: Always create new state objects instead of mutating
