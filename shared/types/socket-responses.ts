import { User } from '@forge-board/shared/api-interfaces';

/**
 * Base response interface for all socket responses
 */
export interface SocketResponse {
  success: boolean;
  timestamp: string;
  requestId?: string;
}

/**
 * Error response for socket communications
 */
export interface SocketErrorResponse extends SocketResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Authentication response for socket communications
 */
export interface SocketAuthResponse extends SocketResponse {
  success: true;
  user: User;
  token: string;
}

/**
 * OSCAL document update notification
 */
export interface OscalDocumentUpdateNotification extends SocketResponse {
  success: true;
  documentId: string;
  documentType: string;
  updatedBy: string;
  updateType: 'create' | 'update' | 'delete' | 'validate';
}
