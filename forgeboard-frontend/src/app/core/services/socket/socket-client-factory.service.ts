import { Injectable } from '@angular/core';
import { Socket } from 'socket.io-client';
import { SocketClientService } from './socket-client.service';
import { ModernSocketClientService } from './modern-socket-client.service';
import { BrowserSocketClientService } from './browser-socket-client.service';
import { environment } from '../../../../environments/environment';

/**
 * Socket.IO client configuration
 */
export interface SocketClientConfig {
  useModern?: boolean;
  useBrowserCompatible?: boolean;
  defaultNamespace?: string;
  defaultOptions?: Record<string, unknown>;
}

/**
 * Factory service for creating Socket.IO clients with the appropriate configuration
 * 
 * This service centralizes the Socket.IO client configuration and provides access
 * to different client implementations based on application needs.
 */
@Injectable({
  providedIn: 'root'
})
export class SocketClientFactoryService {
  private config: SocketClientConfig = {
    useModern: true,
    useBrowserCompatible: true,
    defaultNamespace: '/',
    defaultOptions: {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 20000
    }
  };

  constructor(
    private socketClient: SocketClientService,
    private modernSocketClient: ModernSocketClientService,
    private browserSocketClient: BrowserSocketClientService
  ) {}

  /**
   * Set global Socket.IO client configuration
   * @param config The configuration to set
   */
  setConfig(config: Partial<SocketClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get the appropriate Socket.IO client service based on configuration
   */
  getClientService(): SocketClientService | ModernSocketClientService | BrowserSocketClientService {
    if (this.config.useBrowserCompatible) {
      return this.browserSocketClient;
    }
    
    if (this.config.useModern) {
      return this.modernSocketClient;
    }
    
    return this.socketClient;
  }

  /**
   * Connect to a socket namespace with the configured client
   * @param namespace The namespace to connect to (defaults to configured default namespace)
   * @param options Additional connection options
   * @returns Connected Socket instance
   */
  connect(namespace?: string, options?: Record<string, unknown>): Socket {
    const service = this.getClientService();
    const ns = namespace || this.config.defaultNamespace || '/';
    const opts = { ...this.config.defaultOptions, ...options };
    
    return service.connect(ns, opts);
  }
}

/**
 * Export the SocketIOConfig for use throughout the application
 */
export const SOCKET_IO_CONFIG: SocketClientConfig = {
  useModern: true,
  useBrowserCompatible: true,
  defaultNamespace: '/',
  defaultOptions: {
    path: '/socket.io', // Use the standard Socket.IO path
    transports: ['websocket', 'polling'], // Enable both transports for better fallback
    autoConnect: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    timeout: 20000
  }
};
