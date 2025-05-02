import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { User } from '@forge-board/shared/api-interfaces';

// Use module augmentation instead of namespace
declare module 'express' {
  interface Request {
    user?: User;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    
    return this.authService.validateUserByToken(token).pipe(
      map(user => {
        if (!user) {
          throw new UnauthorizedException('Invalid token');
        }
        
        // Add user to request
        request.user = user;
        return true;
      }),
      catchError(() => {
        throw new UnauthorizedException('Authentication failed');
      })
    );
  }
  
  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;
    
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
