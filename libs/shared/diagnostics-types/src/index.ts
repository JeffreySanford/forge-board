/**
 * Re-export diagnostic types from the shared API interfaces library
 * This file exists for backward compatibility with code that used to import from '@forge-board/shared/diagnostics.types'
 */

export type {
  DiagnosticEvent,
  DiagnosticTimelineEvent,
  DiagnosticEventResponse,
  JwtDiagnosticEvent,
  AuthStats,
  AuthDiagnosticEvent,
  TypeDiagnosticEvent
} from '@forge-board/shared/api-interfaces';
