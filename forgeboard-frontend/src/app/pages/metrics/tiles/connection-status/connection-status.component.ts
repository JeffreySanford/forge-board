/* eslint-disable require-socket-cleanup/ngondestroy-socket-disconnect */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { Socket, io } from 'socket.io-client';

// Define a more specific error type for socket errors
interface SocketConnectionError {
  message?: string;
  description?: string;
  toString(): string;
}

@Component({
  selector: 'app-connection-status',
  templateUrl: './connection-status.component.html',
  styleUrls: ['./connection-status.component.scss'],
  standalone: false
})
export class ConnectionStatusComponent implements OnInit, OnDestroy {
  status: 'connected' | 'disconnected' | 'connecting' = 'connecting';
  lastConnected: Date | null = null;

  // Properties to hold current values
  connectionQuality = 0;
  pingTime = 0;

  // Add property to track CORS errors
  hasCorsError = false;

  private socket: Socket | null = null;
  private pingInterval: Subscription | null = null;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 3;
  private readonly socketUrl = 'http://localhost:3000';

  ngOnInit(): void {
    console.log('[ConnectionStatus] Component initializing');
    this.initSocket();
  }

  ngOnDestroy(): void {
    console.log('[ConnectionStatus] Component destroying, cleaning up resources');
    // Clean up the ping interval subscription
    if (this.pingInterval) {
      this.pingInterval.unsubscribe();
      this.pingInterval = null;
    }

    // Clean up socket directly in ngOnDestroy to satisfy ESLint rule
    if (this.socket) {
      console.log('[ConnectionStatus] Removing socket event listeners and disconnecting');
      // Remove all event listeners
      this.socket.off('connect');
      this.socket.off('disconnect');
      this.socket.off('connect_error');
      this.socket.off('ping');

      // Disconnect if connected
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private initSocket(): void {
    try {
      console.log('[ConnectionStatus] Initializing socket connection');
      this.status = 'connecting';
      this.socket = io(this.socketUrl, {
        reconnectionAttempts: this.maxConnectionAttempts,
        timeout: 5000,
      });

      this.setupSocketEvents();
      this.startPingInterval();
    } catch (err) {
      console.error('[ConnectionStatus] Socket initialization error:', err);
      this.handleConnectionError(err as SocketConnectionError);
    }
  }

  private setupSocketEvents(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[ConnectionStatus] Socket connected');
      this.status = 'connected';
      this.lastConnected = new Date();
      this.connectionQuality = 100;
      this.hasCorsError = false; // Clear CORS error flag on successful connection
      this.connectionAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('[ConnectionStatus] Socket disconnected');
      this.status = 'disconnected';
      this.connectionQuality = 0;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[ConnectionStatus] Socket connection error:', error);
      this.handleConnectionError(error as SocketConnectionError);
    });

    // Add event listeners for other socket events
  }

  private handleConnectionError(error: SocketConnectionError): void {
    this.connectionAttempts++;
    console.error('[ConnectionStatus] Socket connection error:', error);

    // Check if error is CORS-related
    if (
      error &&
      (error.message?.includes('CORS') ||
        error.toString().includes('CORS') ||
        // Check for transport error which can indicate CORS issues
        error.message?.includes('xhr poll error') ||
        error.description?.includes('failed'))
    ) {
      console.warn('[ConnectionStatus] CORS error detected');
      this.hasCorsError = true;
    }

    // Update status and quality based on connection attempts
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.warn('[ConnectionStatus] Max connection attempts reached, giving up');
      this.status = 'disconnected';
      this.connectionQuality = 0;
    } else {
      console.log('[ConnectionStatus] Attempt', this.connectionAttempts, 'of', this.maxConnectionAttempts);
      this.status = 'connecting';
      this.connectionQuality = Math.max(0, 100 - this.connectionAttempts * 30);
    }
  }

  private startPingInterval(): void {
    console.log('[ConnectionStatus] Starting ping interval to measure latency');
    this.pingInterval = timer(0, 2000).subscribe(() => {
      if (this.socket && this.socket.connected) {
        const start = Date.now();
        this.socket.emit('ping', () => {
          this.pingTime = Date.now() - start;
          // Update connection quality based on ping time
          this.updateConnectionQuality();
        });
      }
    });
  }

  private updateConnectionQuality(): void {
    if (this.status !== 'connected') return;

    // Calculate quality based on ping time (lower ping = higher quality)
    if (this.pingTime < 50) {
      this.connectionQuality = 100;
    } else if (this.pingTime < 100) {
      this.connectionQuality = 90;
    } else if (this.pingTime < 200) {
      this.connectionQuality = 80;
    } else if (this.pingTime < 300) {
      this.connectionQuality = 70;
    } else {
      this.connectionQuality = Math.max(50, 100 - this.pingTime / 10);
    }
    
    console.log(`[ConnectionStatus] Connection quality: ${this.connectionQuality}%, ping: ${this.pingTime}ms`);
  }

  getStatusClass(): string {
    return `status-${this.status}`;
  }

  getQualityClass(quality: number): string {
    if (quality >= 80) return 'quality-high';
    if (quality >= 50) return 'quality-medium';
    return 'quality-low';
  }
}
