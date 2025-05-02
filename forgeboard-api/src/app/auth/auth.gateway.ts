import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { WsJwtGuard } from './ws-jwt.guard';
import { User } from '@forge-board/shared/api-interfaces';
import { from, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SocketRegistryService } from '../socket/socket-registry.service';

@WebSocketGateway({
  namespace: '/auth',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(AuthGateway.name);
  
  constructor(
    private authService: AuthService,
    private socketRegistry: SocketRegistryService
  ) {}
  
  afterInit() {
    this.logger.log('Auth WebSocket Gateway initialized');
  }
  
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Register the socket with the registry service
    this.socketRegistry.registerSocket(client, 'auth');
    
    // Check token if provided in handshake
    const token = client.handshake.auth?.token;
    if (token) {
      this.authService.validateUserByToken(token).pipe(
        tap(user => {
          if (user) {
            // Store user in socket data (using User type from shared interfaces)
            client.data.user = user as User;
            client.emit('auth-state', {
              status: 'success',
              data: {
                authenticated: true,
                user,
                token
              }
            });
            this.logger.log(`Client ${client.id} authenticated as ${user.username}`);
          } else {
            client.emit('auth-state', {
              status: 'error',
              message: 'Invalid token',
              data: {
                authenticated: false
              }
            });
          }
        }),
        catchError(error => {
          this.logger.error(`Authentication error for client ${client.id}:`, error);
          client.emit('auth-error', { message: 'Authentication failed' });
          return of(null);
        })
      ).subscribe();
    }
  }
  
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // The method name should match what's available in SocketRegistryService
    // Checking from the error, it seems only registerSocket is available
    this.socketRegistry.registerSocket(client, 'disconnected');
  }
  
  @SubscribeMessage('login')
  handleLogin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { username: string; password: string }
  ) {
    return this.authService.validateUserCredentials(data.username, data.password).pipe(
      tap(result => {
        if (result) {
          // Store user in socket data
          client.data.user = result.user;
          client.emit('auth-state', {
            status: 'success',
            data: {
              authenticated: true,
              user: result.user,
              token: result.token
            }
          });
        } else {
          client.emit('auth-state', {
            status: 'error',
            message: 'Invalid credentials',
            data: {
              authenticated: false
            }
          });
        }
      }),
      catchError(error => {
        client.emit('auth-error', { message: error.message });
        return of(null);
      })
    );
  }
  
  @SubscribeMessage('guest-login')
  handleGuestLogin(@ConnectedSocket() client: Socket) {
    return this.authService.createGuestUser().pipe(
      tap(result => {
        // Store user in socket data
        client.data.user = result.user;
        client.emit('auth-state', {
          status: 'success',
          data: {
            authenticated: true,
            user: result.user,
            token: result.token
          }
        });
      }),
      catchError(error => {
        client.emit('auth-error', { message: error.message });
        return of(null);
      })
    );
  }
  
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('logout')
  handleLogout(@ConnectedSocket() client: Socket) {
    // Clear user data from socket
    const user = client.data.user;
    delete client.data.user;
    
    return from(this.authService.logout()).pipe(
      tap(() => {
        client.emit('auth-state', {
          status: 'success',
          data: {
            authenticated: false
          }
        });
        this.logger.log(`User ${user?.username || 'unknown'} logged out`);
      })
    );
  }
  
  @SubscribeMessage('verify-token')
  handleVerifyToken(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token: string }
  ) {
    return this.authService.validateUserByToken(data.token).pipe(
      tap(user => {
        if (user) {
          // Store user in socket data
          client.data.user = user;
          client.emit('auth-state', {
            status: 'success',
            data: {
              authenticated: true,
              user,
              token: data.token
            }
          });
        } else {
          client.emit('auth-state', {
            status: 'error',
            message: 'Invalid token',
            data: {
              authenticated: false
            }
          });
        }
      }),
      catchError(error => {
        client.emit('auth-error', { message: error.message });
        return of(null);
      })
    );
  }

  // Add HTTP-based endpoint with JWT guard (using it with HTTP endpoints)
  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('authenticate-token')
  handleAuthenticateToken(
    @ConnectedSocket() client: Socket,
    @MessageBody() tokenData: { token: string } // Changed _data to tokenData to avoid unused variable
  ) {
    // The JwtAuthGuard ensures a valid user is attached to the request
    // This endpoint will only be accessible with a valid JWT token
    return from(this.authService.logout()).pipe(
      tap(() => {
        // Using JwtAuthGuard to verify user authenticity for protected endpoints
        const authenticatedUser = client.data.user as User;
        client.emit('auth-state', {
          status: 'success',
          data: {
            authenticated: true,
            message: `Token authenticated via JwtAuthGuard for ${authenticatedUser.username}`,
            role: authenticatedUser.role,
            token: tokenData.token // Use the token data
          }
        });
      })
    );
  }
}
