import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SecurityService } from '../security/security.service';
import { LoggerService } from '../common/logger.service';
import { Request } from 'express';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private securityService: SecurityService,
    private logger: LoggerService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);
    
    if (!token) {
      this.logger.warn('Missing token in request', 'PermissionsGuard');
      return false;
    }
    
    // Validate token and check permissions
    const tokenData = await this.securityService.validateToken(token).toPromise();
    if (!tokenData) {
      this.logger.warn('Invalid token', 'PermissionsGuard');
      return false;
    }
    
    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      this.securityService.hasPermission(tokenData.permissions, permission)
    );
    
    if (!hasAllPermissions) {
      this.logger.warn(`User lacks required permissions: ${requiredPermissions.join(', ')}`, 'PermissionsGuard', {
        userId: tokenData.user.id,
      });
    }
    
    return hasAllPermissions;
  }

  private extractTokenFromRequest(request: Request): string | undefined {
    const authorization = request.headers?.authorization;
    if (!authorization) {
      return undefined;
    }
    
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
