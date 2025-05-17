/**
 * Socket registry types
 */

/**
 * Socket registry options
 */
export interface SocketRegistryOptions {
  maxEvents: number;
  logEvents: boolean;
  persistEvents: boolean;
}

/**
 * Socket registry entry
 */
export interface SocketRegistryEntry {
  id: string;
  namespace: string;
  socket: any; // Socket instance
  connected: boolean;
  connectedAt: Date;
  disconnectedAt?: Date;
  events: SocketRegistryEvent[];
}

/**
 * Socket registry event
 */
export interface SocketRegistryEvent {
  type: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

/**
 * Socket registry
 */
export interface SocketRegistry {
  options: SocketRegistryOptions;
  entries: Map<string, SocketRegistryEntry>;
  registerSocket(namespace: string, socket: any): void;
  unregisterSocket(socketId: string): void;
  getSocket(socketId: string): any;
  getAllSockets(): any[];
  logEvent(socketId: string, event: string, data?: Record<string, unknown>): void;
}

/**
 * Registry event types
 */
export enum RegistryEventTypes {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  MESSAGE = 'message',
  EVENT = 'event'
}
