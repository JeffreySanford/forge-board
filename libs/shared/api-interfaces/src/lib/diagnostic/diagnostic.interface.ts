/**
 * Types for system diagnostics and health monitoring
 */

/**
 * Base diagnostic event interface
 */
export interface DiagnosticEvent {
  id: string;
  timestamp: string;
  type: string;
  eventType: string;
  source: string;
  message: string;
  service?: string;
  level?: 'info' | 'warning' | 'error' | 'debug';
  metadata?: Record<string, unknown>;
}

/**
 * Timeline event for health status changes
 */
export interface DiagnosticTimelineEvent {
  id: string;
  title: string;
  content: string;
  status: string;
  timestamp: string;
  icon: string;
  metadata?: Record<string, unknown>;
  eventType?: string;
}

/**
 * Response for diagnostic events
 */
export interface DiagnosticEventResponse {
  id: string;
  status: boolean;
  timestamp: string;
  event: DiagnosticEvent;
}

/**
 * JWT specific diagnostic event
 */
export interface JwtDiagnosticEvent extends DiagnosticEvent {
  username?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Authentication statistics interface
 */
export interface AuthStats {
  totalAttempts: number;
  successCount: number;
  failCount: number;
  lastActivity: string;
  activeTokens: number;
  tokenVerifications: number;
  failedVerifications: number;
}

/**
 * Authentication diagnostic event interface
 */
export interface AuthDiagnosticEvent extends DiagnosticEvent {
  username: string;
  action: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number; // milliseconds
  tokenId?: string;
}

/**
 * Type validation diagnostic event
 */
export interface TypeDiagnosticEvent {
  id: string;
  timestamp: string;
  typeName: string;
  valid: boolean;
  stringRepresentation?: string;
  data?: unknown;
  issues: string[];
  callerInfo?: string;
}
