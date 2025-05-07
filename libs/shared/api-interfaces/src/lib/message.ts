/**
 * Basic message interface for system communications
 */
export interface Message {
  id?: string;
  timestamp?: string;
  content: string;
  sender?: string;
  recipient?: string;
  metadata?: Record<string, unknown>;
}

/**
 * System broadcast message
 */
export interface SystemBroadcast extends Message {
  type: 'broadcast';
  priority: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: string;
}

/**
 * Direct user message
 */
export interface UserMessage extends Message {
  type: 'direct';
  read?: boolean;
  readAt?: string;
}

/**
 * Message with action capabilities
 */
export interface ActionMessage extends Message {
  type: 'action';
  actionType: 'approve' | 'reject' | 'acknowledge' | 'custom';
  actionId?: string;
  actionComplete?: boolean;
  actionData?: Record<string, unknown>;
}

// Mark this file as a module
export const __messageTypes = true;
