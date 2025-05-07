import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { interval, Subscription } from 'rxjs';
import { SbomEvent, ScaEvent, ZapEvent, SupplyChainEvent, FedRampEvent } from '@forge-board/shared/api-interfaces';

@Injectable()
@WebSocketGateway({
  namespace: '/security-stream',
  cors: { origin: '*', methods: ['GET', 'POST'] }
})
export class SecurityStreamGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SecurityStreamGateway.name);
  private mockMode = true;
  private mockInterval: NodeJS.Timeout | null = null;
  private clientSubscriptions = new Map<string, Subscription>();

  afterInit(server: Server) {
    this.logger.log('SecurityStreamGateway initialized');
    // Use the server for future event emission or namespace setup
    console.log('WebSocket server instance:', !!server);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    if (this.mockMode) {
      this.startMockStream(client);
    }
    client.emit('security-stream-status', { connected: true, mockMode: this.mockMode });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    if (this.clientSubscriptions.has(client.id)) {
      this.clientSubscriptions.get(client.id)?.unsubscribe();
      this.clientSubscriptions.delete(client.id);
    }
  }

  @SubscribeMessage('toggle-mock')
  handleToggleMock(@ConnectedSocket() client: Socket, @MessageBody() enable: boolean) {
    this.mockMode = enable;
    client.emit('security-stream-status', { connected: true, mockMode: this.mockMode });
    if (enable) {
      this.startMockStream(client);
    } else {
      this.stopMockStream(client);
    }
  }

  @SubscribeMessage('mock-events')
  handleMockEvents(client: Socket) {
    this.logger.debug('Generating mock security events');
    
    // Create a batch of mock events
    setTimeout(() => {
      const now = new Date().toISOString();
      const events: (SbomEvent | ScaEvent | ZapEvent | SupplyChainEvent | FedRampEvent)[] = [
        { 
          id: 'sbom-1',
          timestamp: now,
          type: 'sbom', 
          severity: 'info', // Fixed: removed 'as any', using proper value from SecurityEventSeverity
          source: 'syft',
          message: 'SBOM generation complete',
          status: 'completed', 
          components: 120, 
          sbomId: 'abc123'
        },
        { 
          id: 'sca-1',
          timestamp: now,
          type: 'sca', 
          severity: 'medium',
          source: 'grype',
          message: 'Vulnerability scan complete',
          status: 'complete', 
          critical: 1, 
          high: 5, 
          medium: 8, 
          low: 12
        },
        { 
          id: 'zap-1',
          timestamp: now,
          type: 'zap', 
          severity: 'high',
          source: 'owasp-zap',
          message: 'ZAP scan complete',
          status: 'complete', 
          findings: 3  // This is correct as a number
        },
        { 
          id: 'chain-1',
          timestamp: now,
          type: 'supplyChain', 
          severity: 'low',
          source: 'cosign',
          message: 'Supply chain verification complete',
          status: 'verified', 
          image: 'webapp:prod', 
          signed: true, 
          signer: 'Sigstore', 
          verified: true
        },
        { 
          id: 'fedramp-1',
          timestamp: now,
          type: 'fedramp', 
          severity: 'medium',
          source: 'compliance-scan',
          message: 'FedRAMP control scan complete',
          status: 'partial', 
          controlsPassed: 18, 
          controlsTotal: 20
        }
      ];
      events.forEach(event => client.emit('security-event', event));
    });
  }

  private startMockStream(client: Socket) {
    // Send mock events every 3 seconds
    const sub = interval(3000).subscribe(() => {
      const now = new Date().toISOString();
      const events: (SbomEvent | ScaEvent | ZapEvent | SupplyChainEvent | FedRampEvent)[] = [
        { 
          id: 'sbom-mock',
          timestamp: now,
          type: 'sbom', // Changed from eventType to type
          status: 'completed', 
          components: 120, 
          sbomId: 'abc123',
          severity: 'low',
          source: 'syft',
          message: 'SBOM generation complete'
        },
        { 
          id: 'sca-mock',
          timestamp: now,
          type: 'sca', // Changed from eventType to type 
          status: 'complete', 
          critical: 1, 
          high: 5, 
          medium: 8, 
          low: 12,
          severity: 'medium',
          source: 'grype',
          message: 'Vulnerability scan complete'
        },
        { 
          id: 'zap-mock',
          timestamp: now,
          type: 'zap', // Changed from eventType to type
          status: 'complete', 
          findings: 3, // Changed from array to number to match interface
          severity: 'high',
          source: 'owasp-zap',
          message: 'ZAP scan complete'
        },
        { 
          id: 'chain-mock',
          timestamp: now,
          type: 'supplyChain', // Changed from eventType to type
          status: 'verified', 
          image: 'webapp:prod', 
          signed: true, 
          signer: 'Sigstore', 
          verified: true,
          severity: 'low',
          source: 'cosign',
          message: 'Supply chain verification complete'
        },
        { 
          id: 'fedramp-mock',
          timestamp: now,
          type: 'fedramp', // Changed from eventType to type
          status: 'partial', 
          controlsPassed: 18, 
          controlsTotal: 20,
          severity: 'medium',
          source: 'compliance-scan',
          message: 'FedRAMP control scan complete'
        }
      ];
      events.forEach(event => client.emit('security-event', event));
    });
    
    // Store subscription for cleanup
    this.clientSubscriptions.set(client.id, sub);
  }

  private stopMockStream(client: Socket) {
    if (this.clientSubscriptions.has(client.id)) {
      this.clientSubscriptions.get(client.id)?.unsubscribe();
      this.clientSubscriptions.delete(client.id);
    }
  }
}
