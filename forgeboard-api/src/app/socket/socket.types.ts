/**
 * Socket event log entry
 */
export interface SocketLogEvent {
  socketId: string;
  namespace: string;
  eventType: 'connect' | 'disconnect' | 'error' | 'message' | 'custom';
  timestamp: Date;
  message: string;
  data?: any;
}

/**
 * Socket event history entry
 */
export interface SocketEventEntry {
  type: string;
  timestamp: Date;
  data?: any;
}

/**
 * Tracked socket information
 */
export interface SocketInfo {
  id: string;
  namespace: string;
  clientIp: string;
  userAgent: string;
  query: any;
  connectTime: Date;
  disconnectTime?: Date;
  lastActivity: Date;
  events: SocketEventEntry[];
}

/**
 * Socket log filter options
 */
export interface SocketLogFilter {
  socketId?: string;
  namespace?: string;
  eventType?: string;
  startTime?: Date;
  endTime?: Date;
}
