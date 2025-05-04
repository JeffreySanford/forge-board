/**
 * Types for system diagnostics and health monitoring
 */

/**
 * Diagnostic event type
 */
export interface DiagnosticEvent {
  id: string;
  timestamp: string;
  type: string;
  eventType: string;
  source: string;
  message: string;
  service?: string;
  data?: Record<string, unknown>;
}

/**
 * Diagnostic event response
 */
export interface DiagnosticEventResponse {
  success: boolean;
  timestamp: string;
  id: string;
  eventType: string;
}

// Mark this module for export
export const __diagnosticTypes = true;

