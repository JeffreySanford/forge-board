/**
 * Utilities for socket communication
 */

import { SocketResponse } from '../api-response';

/**
 * Generic type for socket event data
 */
export type SocketEventData = Record<string, unknown>;

/**
 * Socket client options
 */
export interface SocketClientOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
  [key: string]: unknown;
}

/**
 * Base socket handler function type
 */
export type SocketHandler<T extends SocketEventData = SocketEventData, R = void> = 
  (data: T, ack?: (response: R) => void) => void;

/**
 * Socket event listener registry
 */
export interface SocketEventRegistry {
  [eventName: string]: SocketHandler[];
}

/**
 * Socket connection status
 */
export interface SocketConnectionStatus {
  connected: boolean;
  connectionId?: string;
  lastConnected?: Date;
  reconnecting: boolean;
  reconnectAttempts: number;
}

/**
 * Socket client interface
 */
export interface SocketClient {
  connect(): Promise<boolean>;
  disconnect(): void;
  isConnected(): boolean;
  emit<T extends SocketEventData>(event: string, data: T): void;
  emitWithAck<T extends SocketEventData, R>(event: string, data: T): Promise<R>;
  on<T extends SocketEventData>(event: string, handler: SocketHandler<T>): () => void;
  off(event: string, handler?: SocketHandler): void;
  onConnect(handler: () => void): () => void;
  onDisconnect(handler: (reason: string) => void): () => void;
  onError(handler: (error: Error) => void): () => void;
}

/**
 * Socket message handler
 */
export type SocketMessageHandler<T extends SocketEventData = SocketEventData> = 
  (data: SocketResponse<T>) => void;

/**
 * Create a standard socket event payload
 * @param type - Event type
 * @param data - Event data
 * @param meta - Additional metadata
 */
export function createSocketEventPayload<T extends SocketEventData>(
  type: string, 
  data: T, 
  meta?: Record<string, unknown>
): Record<string, unknown> {
  return {
    type,
    data,
    meta: meta || {},
    timestamp: new Date().toISOString()
  };
}

/**
 * Parse socket event response
 * @param response - Raw socket response
 */
export function parseSocketResponse<T>(response: unknown): SocketResponse<T> {
  if (!response) {
    return SocketResponse.failure<T>('unknown', 'Empty response received');
  }
  
  try {
    const parsed = response as Partial<SocketResponse<T>>;
    
    if (!parsed.event) {
      return SocketResponse.failure<T>('unknown', 'Invalid response format: missing event');
    }
    
    return new SocketResponse<T>(
      parsed.event,
      parsed.success ?? false,
      parsed.data as T | null,
      parsed.message
    );
  } catch (error) {
    return SocketResponse.failure<T>('unknown', `Failed to parse socket response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(status: unknown): boolean {
  return typeof status === 'object' && status !== null && 'connected' in status && (status as { connected: boolean }).connected === true;
}

/**
 * Parse socket error into a standardized format
 */
export function parseSocketError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  return new Error('Unknown socket error');
}

/**
 * Format socket error for logging
 */
export function formatSocketError(error: unknown): string {
  const parsedError = parseSocketError(error);
  return `Socket Error: ${parsedError.message}`;
}

/**
 * Create a socket response for log events
 */
export function createLogSocketResponse<T>(event: string, data: T, success = true, message?: string) {
  return {
    event,
    success,
    data,
    message,
    timestamp: new Date().toISOString(),
    type: 'log'
  };
}

// Socket response functions moved to api-response.ts
// for centralization and consistency
