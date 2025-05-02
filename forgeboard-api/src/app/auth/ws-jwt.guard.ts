import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // For WebSockets, the client is attached to context.switchToWs().getClient()
    const client = context.switchToWs().getClient();
    
    // Check if user is already attached to socket data
    if (client.data?.user) {
      return of(true);
    }
    
    // Extract token from handshake auth
    const token = client.handshake?.auth?.token;
    
    if (!token) {
      throw new WsException('No token provided');
    }
    
    return this.authService.validateUserByToken(token).pipe(
      map(user => {
        if (!user) {
          throw new WsException('Invalid token');
        }
        
        // Store user in socket data for future requests
        client.data = {
          ...client.data,
          user
        };
        
        return true;
      }),
      catchError(() => {
        throw new WsException('Authentication failed');
      })
    );
  }
}
