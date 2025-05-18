/**
 * Types for security events used in the security dashboard and scanner service
 */

export type SecurityEventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type SecurityEventStatus = 'pending' | 'processing' | 'completed' | 'complete' | 'failed' | 'verified' | 'partial';

/**
 * Security event types
 */
export type SecurityEventType = 'sbom' | 'sca' | 'zap' | 'supplyChain' | 'fedramp';

/**
 * Security event interface
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType; 
  severity: SecurityEventSeverity;
  title?: string;
  description?: string;
  timestamp: string;
  data?: Record<string, unknown>;
  source: string;
  verified?: boolean;
  message?: string;
  status?: string;
}

/**
 * SBOM specific event data
 */
export interface SbomEvent extends SecurityEvent {
  type: 'sbom';
  components: number;
  sbomId: string;
  format?: 'cyclonedx' | 'spdx';
  version?: string;
  valid?: boolean;
  message?: string;
  status?: string;
}

/**
 * Software Composition Analysis event data
 */
export interface ScaEvent extends SecurityEvent {
  type: 'sca';
  critical: number;
  high: number;
  medium: number;
  low: number;
  message?: string;
  status?: string;
}

/**
 * OWASP ZAP scanning event data
 */
export interface ZapEvent extends SecurityEvent {
  type: 'zap';
  findings: number;
  message?: string;
  status?: string;
}

/**
 * Supply Chain Security event data
 */
export interface SupplyChainEvent extends SecurityEvent {
  type: 'supplyChain';
  image: string;
  signed: boolean;
  signer: string;
  verified: boolean;
  rekorEntry?: string;
  message?: string;
  status?: string;
}

/**
 * FedRAMP compliance event data
 */
export interface FedRampEvent extends SecurityEvent {
  type: 'fedramp';
  controlsPassed: number;
  controlsTotal: number;
  complianceStatus?: 'compliant' | 'nonCompliant' | 'partial';
  impact?: 'low' | 'moderate' | 'high';
  message?: string;
  status?: string;
}
