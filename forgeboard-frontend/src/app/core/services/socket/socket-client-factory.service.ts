import { Injectable } from '@angular/core';
import { BrowserSocketClientService } from './browser-socket-client.service';
import { ModernSocketClientService } from './modern-socket-client.service';
import { SocketClientService } from './socket-client.service';

/**
 * Factory service that decides which socket client implementation to use
 * based on the environment capabilities.
 */
@Injectable({
  providedIn: 'root'
})
export class SocketClientFactoryService {
  private socketClient: SocketClientService;

  constructor(
    private browserSocketClient: BrowserSocketClientService,
    private modernSocketClient: ModernSocketClientService
  ) {
    // Decide which socket client to use based on environment capabilities
    if (this.isModernEnvironment()) {
      console.log('Using modern socket client with enhanced features');
      this.socketClient = this.modernSocketClient;
    } else {
      console.log('Using basic browser socket client');
      this.socketClient = this.browserSocketClient;
    }
  }

  /**
   * Get the appropriate socket client for the current environment
   */
  getSocketClient(): SocketClientService {
    return this.socketClient;
  }

  /**
   * Check if we're in a modern environment that supports additional features
   */
  private isModernEnvironment(): boolean {
    // Check for modern browser APIs that the modern socket client depends on
    const hasRequiredApis = typeof window !== 'undefined' &&
      'BroadcastChannel' in window &&
      'crypto' in window &&
      typeof window.crypto.subtle !== 'undefined';
    
    return hasRequiredApis;
  }
}
