/**
 * Main entry point for @forge-board/api-interfaces
 * Re-exports all types from the library's internal modules
 */

// Export everything from the internal lib/index.ts
export * from './lib/index';

// Re-export the diagnostic event interfaces with disambiguated names
export type {
  DiagnosticEvent as DiagnosticEventV2,
  DiagnosticTimelineEvent as DiagnosticTimelineEventV2,
} from './lib/diagnostic/diagnostic.interface';

// Also export the original interfaces from diagnostic.interface.ts
export type {
  DiagnosticEvent as DiagnosticEventV1,
} from './lib/diagnostic/diagnostic.interface';

// These are already exported from ./lib/index.ts
// No need to re-export them directly here
