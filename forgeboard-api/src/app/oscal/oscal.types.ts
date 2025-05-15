import { UserRole } from '@forge-board/shared/api-interfaces';

/**
 * Query parameters for OSCAL document requests
 */
export interface QueryParams {
  type?: string;
  limit?: number;
  offset?: number;
}

/**
 * OSCAL Document interface
 */
export interface OscalDocument {
  id: string;
  documentType: string;
  title: string;
  version: string;
  lastModified: string;
  content: Record<string, unknown>;
  metadata: {
    created: string;
    lastModified: string;
    version: string;
    oscalVersion: string;
  };
}

/**
 * OSCAL Template interface
 */
export interface OscalTemplate {
  type: string;
  name: string;
  description: string;
  structure: Record<string, unknown>;
  version: string;
}

/**
 * OSCAL Baseline interface
 */
export interface OscalBaseline {
  id: string;
  title: string;
  description: string;
  version: string;
  controls: Array<{
    id: string;
    title: string;
    controlId: string;
  }>;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  documentId: string;
  documentType: string;
  errors?: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}
