/**
 * Security event types and interfaces
 */

/**
 * Security event severity levels
 */
export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical' | 'info';

/**
 * Status of a security event
 */
export type SecurityEventStatus = 'completed' | 'pending' | 'error' | 'warning' | 'info' | 'complete' | 'verified' | 'partial';

/**
 * Types of security events
 */
export type SecurityEventType = 'sbom' | 'sca' | 'zap' | 'supplyChain' | 'fedramp';

/**
 * Base security event interface
 */
export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  source: string;
  message?: string; // Add message property to base interface
  status?: SecurityEventStatus; // Add status property to base interface
}

/**
 * Software Bill of Materials (SBOM) event
 */
export interface SbomEvent extends SecurityEvent {
  components: number;
  sbomId: string;
}

/**
 * Software Composition Analysis (SCA) event
 */
export interface ScaEvent extends SecurityEvent {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/**
 * OWASP ZAP scan event
 */
export interface ZapEvent extends SecurityEvent {
  findings: number;
}

/**
 * Supply Chain verification event
 */
export interface SupplyChainEvent extends SecurityEvent {
  image: string;
  signed: boolean;
  signer?: string;
  verified?: boolean;
}

/**
 * FedRAMP compliance event
 */
export interface FedRampEvent extends SecurityEvent {
  controlsPassed: number;
  controlsTotal: number;
}


