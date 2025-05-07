/**
 * Types for security events used in the security dashboard and scanner service
 */

export type SecurityEventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type SecurityEventStatus = 'pending' | 'processing' | 'completed' | 'complete' | 'failed' | 'verified' | 'partial';

/**
 * Base security event interface
 */
export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: SecurityEventSeverity;
  source: string;
  message: string;
  status: SecurityEventStatus;
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
}

/**
 * OWASP ZAP scanning event data
 */
export interface ZapEvent extends SecurityEvent {
  type: 'zap';
  findings: number;
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
}
