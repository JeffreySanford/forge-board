import { Injectable, OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoggerService } from '../common/logger.service';
import { AuditService } from '../security/audit.service';
import { SecurityService } from '../security/security.service';
import { OscalService, OscalDocument, OscalDocumentUpdate } from './oscal.service';
import { Observable, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';

interface ClientInfo {
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
  permissions: string[];
  connectedAt: Date;
}

export interface OscalDocumentSummary {
  id: string;
  title: string;
  type: string;
  version: string;
  lastModified: string | Date;
}

@WebSocketGateway({ namespace: 'oscal' })
@Injectable()
export class OscalGatewayService implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeClients: Map<string, ClientInfo> = new Map();
  private documentSubscriptions: Map<string, Set<string>> = new Map();

  constructor(
    private oscalService: OscalService,
    private securityService: SecurityService,
    private logger: LoggerService,
    private auditService: AuditService
  ) {}

  onModuleInit() {
    this.logger.info('OSCAL Gateway initialized');
    
    // Subscribe to OSCAL document updates
    this.oscalService.oscalDocumentUpdates$.subscribe(update => {
      if (update && update.documentId) {
        this.broadcastDocumentUpdate(update.documentId, update);
      }
    });
  }

  handleConnection(client: Socket) {
    // Extract token from handshake
    const token = client.handshake.auth.token || client.handshake.headers.authorization;
    
    // Validate token and check permissions
    this.securityService.validateToken(token)
      .subscribe({
        next: tokenData => {
          if (!tokenData || !tokenData.user) {
            this.logger.warn('Unauthorized WebSocket connection attempt', 'OscalGatewayService', {
              clientId: client.id,
              ipAddress: client.handshake.address
            });
            client.disconnect(true);
            return;
          }
          
          const { user, permissions } = tokenData;
          
          // Check if user has required permissions
          if (!this.securityService.hasPermission(permissions, 'oscal:read')) {
            this.logger.warn('Insufficient permissions for OSCAL gateway', 'OscalGatewayService', {
              userId: user.id,
              clientId: client.id
            });
            client.disconnect(true);
            return;
          }
          
          // Store user info and permissions
          this.activeClients.set(client.id, { 
            user, 
            permissions,
            connectedAt: new Date()
          });
          
          // Audit successful connection
          this.auditService.log({
            action: 'OSCAL_GATEWAY_CONNECTED',
            actor: user.id,
            resource: 'oscal-gateway',
            details: {
              clientId: client.id,
              ipAddress: client.handshake.address,
              userAgent: client.handshake.headers['user-agent']
            },
            success: true
          });
          
          this.logger.info('Client connected to OSCAL gateway', 'OscalGatewayService', {
            userId: user.id,
            clientId: client.id
          });
          
          // Confirm successful connection
          client.emit('connection:established', {
            status: 'connected',
            userId: user.id,
            permissions: this.securityService.getOscalPermissions(permissions)
          });
        },
        error: err => {
          this.logger.error('Authentication error in OSCAL gateway', 'OscalGatewayService', {
            clientId: client.id,
            error: err
          });
          client.disconnect(true);
        }
      });
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.activeClients.get(client.id);
    
    if (clientInfo) {
      // Audit disconnection
      this.auditService.log({
        action: 'OSCAL_GATEWAY_DISCONNECTED',
        actor: clientInfo.user.id,
        resource: 'oscal-gateway',
        details: {
          clientId: client.id,
          connectionDuration: (new Date().getTime() - clientInfo.connectedAt.getTime()) / 1000
        },
        success: true
      });
      
      // Remove client from active clients
      this.activeClients.delete(client.id);
      
      // Remove client from all document subscriptions
      for (const [, clients] of this.documentSubscriptions.entries()) {
        if (clients.has(client.id)) {
          clients.delete(client.id);
        }
      }
      
      this.logger.info('Client disconnected from OSCAL gateway', 'OscalGatewayService', {
        userId: clientInfo.user.id,
        clientId: client.id
      });
    }
  }

  @SubscribeMessage('oscal:documents:list')
  handleListDocuments(client: Socket): Observable<{ type: string; data: OscalDocumentSummary[] } | { error: string; code: number }> {
    const clientInfo = this.activeClients.get(client.id);
    if (!clientInfo) {
      return of({ error: 'Unauthorized', code: 401 });
    }
    
    // Audit the request
    this.auditService.log({
      action: 'OSCAL_DOCUMENTS_LIST_REQUESTED',
      actor: clientInfo.user.id,
      resource: 'oscal-documents',
      success: true
    });
    
    return this.oscalService.getDocuments().pipe(
      map((documents: OscalDocument[]) => ({
        type: 'documents:list',
        data: documents.map((doc: OscalDocument) => ({
          id: doc.documentId,
          title: doc.metadata.title,
          type: doc.documentType,
          version: doc.metadata.version,
          lastModified: doc.metadata.lastModified
        }))
      })),
      tap(result => {
        this.logger.debug('OSCAL documents list sent', 'OscalGatewayService', {
          userId: clientInfo.user.id,
          count: result.data.length
        });
      }),
      catchError(err => {
        this.logger.error('Error retrieving OSCAL documents', 'OscalGatewayService', {
          userId: clientInfo.user.id,
          error: err
        });
        return of({ error: 'Internal server error', code: 500 });
      })
    );
  }

  @SubscribeMessage('oscal:document:get')
  handleGetDocument(client: Socket, payload: { id: string; format?: 'json' | 'xml' }): Observable<{ type: string; format: string; documentId: string; data: unknown } | { error: string; code: number }> {
    const clientInfo = this.activeClients.get(client.id);
    if (!clientInfo) {
      return of({ error: 'Unauthorized', code: 401 });
    }
    
    const documentId = payload.id;
    const format = payload.format || 'json';
    
    // Audit the request
    this.auditService.log({
      action: 'OSCAL_DOCUMENT_REQUESTED',
      actor: clientInfo.user.id,
      resource: 'oscal-document',
      resourceId: documentId,
      details: { format },
      success: true
    });
    
    // Check specific document access permissions
    return this.securityService.checkDocumentAccess(clientInfo.user.id, documentId).pipe(
      switchMap(hasAccess => {
        if (!hasAccess) {
          this.logger.warn('Document access denied', 'OscalGatewayService', {
            userId: clientInfo.user.id,
            documentId
          });
          
          this.auditService.log({
            action: 'OSCAL_DOCUMENT_ACCESS_DENIED',
            actor: clientInfo.user.id,
            resource: 'oscal-document',
            resourceId: documentId,
            success: false
          });
          
          return of({ error: 'Access denied', code: 403 });
        }
        
        // Get document based on format
        if (format === 'xml') {
          return this.oscalService.getDocumentAsXml(documentId).pipe(
            map(xmlContent => ({
              type: 'document:content',
              format: 'xml',
              documentId,
              data: xmlContent
            }))
          );
        } else {
          return this.oscalService.getDocumentById(documentId).pipe(
            map(document => ({
              type: 'document:content',
              format: 'json',
              documentId,
              data: document
            }))
          );
        }
      }),
      tap(() => {
        // Add client to document subscription
        if (!this.documentSubscriptions.has(documentId)) {
          this.documentSubscriptions.set(documentId, new Set());
        }
        this.documentSubscriptions.get(documentId).add(client.id);
        
        this.logger.debug('OSCAL document sent', 'OscalGatewayService', {
          userId: clientInfo.user.id,
          documentId,
          format
        });
      }),
      catchError(err => {
        this.logger.error('Error retrieving OSCAL document', 'OscalGatewayService', {
          userId: clientInfo.user.id,
          documentId,
          error: err.message
        });
        return of({ error: 'Internal server error', code: 500 });
      })
    );
  }

  @SubscribeMessage('oscal:document:subscribe')
  handleSubscribeToDocument(client: Socket, payload: { id: string }): Observable<{ type: string; documentId: string; status: string } | { error: string; code: number }> {
    const clientInfo = this.activeClients.get(client.id);
    if (!clientInfo) {
      return of({ error: 'Unauthorized', code: 401 });
    }
    
    const documentId = payload.id;
    
    // Audit the subscription
    this.auditService.log({
      action: 'OSCAL_DOCUMENT_SUBSCRIPTION',
      actor: clientInfo.user.id,
      resource: 'oscal-document',
      resourceId: documentId,
      success: true
    });
    
    // Add client to document subscription
    if (!this.documentSubscriptions.has(documentId)) {
      this.documentSubscriptions.set(documentId, new Set());
    }
    this.documentSubscriptions.get(documentId).add(client.id);
    
    this.logger.info('Client subscribed to OSCAL document', 'OscalGatewayService', {
      userId: clientInfo.user.id,
      documentId
    });
    
    return of({
      type: 'document:subscribed',
      documentId,
      status: 'success'
    });
  }

  @SubscribeMessage('oscal:document:unsubscribe')
  handleUnsubscribeFromDocument(client: Socket, payload: { id: string }): Observable<{ type: string; documentId: string; status: string } | { error: string; code: number }> {
    const clientInfo = this.activeClients.get(client.id);
    if (!clientInfo) {
      return of({ error: 'Unauthorized', code: 401 });
    }
    
    const documentId = payload.id;
    
    // Remove client from document subscription
    if (this.documentSubscriptions.has(documentId)) {
      this.documentSubscriptions.get(documentId).delete(client.id);
    }
    
    // Audit the unsubscription
    this.auditService.log({
      action: 'OSCAL_DOCUMENT_UNSUBSCRIPTION',
      actor: clientInfo.user.id,
      resource: 'oscal-document',
      resourceId: documentId,
      success: true
    });
    
    this.logger.info('Client unsubscribed from OSCAL document', 'OscalGatewayService', {
      userId: clientInfo.user.id,
      documentId
    });
    
    return of({
      type: 'document:unsubscribed',
      documentId,
      status: 'success'
    });
  }

  private broadcastDocumentUpdate(documentId: string, update: OscalDocumentUpdate): void {
    const subscribers = this.documentSubscriptions.get(documentId);
    
    if (!subscribers || subscribers.size === 0) {
      return;
    }
    
    // Prepare the update notification
    const notification = {
      type: 'document:update',
      documentId,
      data: update,
      timestamp: new Date()
    };
    
    // Send to all subscribed clients
    for (const clientId of subscribers) {
      const clientInfo = this.activeClients.get(clientId);
      if (clientInfo) {
        // Check if client still has permission
        if (this.securityService.hasPermission(clientInfo.permissions, 'oscal:read')) {
          const socket = this.server.sockets.sockets.get(clientId);
          if (socket) {
            socket.emit('oscal:update', notification);
            
            this.logger.debug('OSCAL update sent to client', 'OscalGatewayService', {
              userId: clientInfo.user.id,
              documentId
            });
          }
        }
      }
    }
  }
}
