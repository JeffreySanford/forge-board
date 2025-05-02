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
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { createSocketResponse } from '@forge-board/shared/api-interfaces';
import { JwtDiagnosticsService, TokenVerificationOptions } from '../diagnostics/jwt-diagnostics.service';
import { SocketRegistryService } from '../socket/socket-registry.service';

// Define request/response interfaces for token verification
interface TokenVerificationRequest {
  token: string;
  options?: TokenVerificationOptions;
}

interface TokenVerificationResponse {
  valid: boolean;
  token: string;
  payload?: Record<string, unknown>;
  error?: string;
  expiresAt?: string;
  issuedAt?: string;
}

@Injectable()
@WebSocketGateway({
  namespace: '/auth-diagnostics',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
export class JwtDiagnosticsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(JwtDiagnosticsGateway.name);
  private eventsInterval: NodeJS.Timeout;
  
  constructor(
    private readonly jwtDiagnostics: JwtDiagnosticsService,
    private readonly socketRegistry: SocketRegistryService
  ) {}
  
  afterInit() {
    this.logger.log('JWT Diagnostics gateway initialized');
    
    // Set up interval to emit authentication events periodically
    this.eventsInterval = setInterval(() => {
      if (this.server && Object.keys(this.server.sockets.sockets).length > 0) {
        const events = this.jwtDiagnostics.getCurrentEvents();
        const stats = this.jwtDiagnostics.getCurrentStats();
        
        this.server.emit('auth-events', createSocketResponse('auth-events', events));
        this.server.emit('auth-stats', createSocketResponse('auth-stats', stats));
      }
    }, 5000); // Every 5 seconds
  }
  
  handleConnection(client: Socket) {
    this.logger.log(`Client connected to auth diagnostics: ${client.id}`);
    
    // Register socket
    this.socketRegistry.registerSocket(client, '/auth-diagnostics');
    
    // Send initial data
    const events = this.jwtDiagnostics.getCurrentEvents();
    const stats = this.jwtDiagnostics.getCurrentStats();
    
    client.emit('auth-events', createSocketResponse('auth-events', events));
    client.emit('auth-stats', createSocketResponse('auth-stats', stats));
  }
  
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from auth diagnostics: ${client.id}`);
  }
  
  @SubscribeMessage('get-auth-events')
  handleGetAuthEvents(client: Socket) {
    this.logger.verbose(`Client ${client.id} requested auth events`);
    const events = this.jwtDiagnostics.getCurrentEvents();
    client.emit('auth-events', createSocketResponse('auth-events', events));
  }
  
  @SubscribeMessage('get-auth-stats')
  handleGetAuthStats(client: Socket) {
    this.logger.verbose(`Client ${client.id} requested auth stats`);
    const stats = this.jwtDiagnostics.getCurrentStats();
    client.emit('auth-stats', createSocketResponse('auth-stats', stats));
  }

  @SubscribeMessage('verify-token')
  handleVerifyToken(
    @ConnectedSocket() client: Socket, 
    @MessageBody() data: TokenVerificationRequest
  ) {
    this.logger.verbose(`Client ${client.id} requested token verification`);
    
    // Check if token is provided
    if (!data.token) {
      return {
        event: 'token-verified',
        data: createSocketResponse('token-verified', {
          valid: false,
          token: '',
          error: 'No token provided'
        } as TokenVerificationResponse)
      };
    }

    try {
      // Use the JWT diagnostics service to verify the token
      const verification = this.jwtDiagnostics.verifyToken(data.token, data.options);
      
      // Return the verification result
      const response: TokenVerificationResponse = {
        valid: verification.valid,
        token: data.token,
        payload: verification.payload,
        expiresAt: verification.expiresAt,
        issuedAt: verification.issuedAt
      };

      // Log the successful verification
      this.socketRegistry.recordMessageReceived(client.id, 'verify-token', { 
        tokenValid: verification.valid 
      });
      
      return {
        event: 'token-verified',
        data: createSocketResponse('token-verified', response)
      };
    } catch (error) {
      this.logger.error(`Token verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Log the failed verification
      this.socketRegistry.recordMessageReceived(client.id, 'verify-token', { 
        tokenValid: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return error response
      const response: TokenVerificationResponse = {
        valid: false,
        token: data.token,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      return {
        event: 'token-verified',
        data: createSocketResponse('token-verified', response)
      };
    }
  }
}
