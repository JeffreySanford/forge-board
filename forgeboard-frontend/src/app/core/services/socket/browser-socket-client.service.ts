import { Injectable } from '@angular/core';
import { Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { SocketClientService } from './socket-client.service';
import { BrowserSocketService } from '../../../services/browser-socket.service';

/**
 * Browser-based implementation of the SocketClientService
 * Uses the BrowserSocketService
 */
@Injectable({
  providedIn: 'root'
})
export class BrowserSocketClientService implements SocketClientService {
  constructor(private browserSocketService: BrowserSocketService) {}

  /**
   * Connect to a specific namespace
   * @param namespace The namespace to connect to
   * @returns Socket connection
   */
  connect(namespace: string): Socket {
    return this.browserSocketService.connect(namespace);
  }

  /**
   * Disconnect from a specific namespace
   * @param namespace The namespace to disconnect from
   */
  disconnect(namespace: string): void {
    this.browserSocketService.disconnect(namespace);
  }

  /**
   * Get connection status for a specific namespace
   * @param namespace The namespace to check
   * @returns Observable of connection status
   */
  getConnectionStatus(namespace: string): Observable<boolean> {
    return this.browserSocketService.getConnectionStatus(namespace);
  }

  /**
   * Get socket for a specific namespace
   * @param namespace The namespace to get
   * @returns Socket or null if not connected
   */
  getSocket(namespace: string): Socket | null {
    return this.browserSocketService.getSocket(namespace);
  }
}
