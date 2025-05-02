import { Controller, Post, Body, UseGuards, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { User } from '@forge-board/shared/api-interfaces';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto, TokenDto } from './dto/auth.dto';

/**
 * Auth response DTO
 */
interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(private authService: AuthService) {}

  /**
   * Login endpoint
   */
  @Post('login')
  login(@Body() loginDto: LoginDto): Observable<AuthResponse> {
    return this.authService.validateUserCredentials(loginDto.username, loginDto.password).pipe(
      map(result => {
        if (!result) {
          throw new HttpException({
            success: false,
            message: 'Invalid credentials'
          }, HttpStatus.UNAUTHORIZED);
        }
        
        return {
          success: true,
          user: result.user,
          token: result.token
        };
      }),
      catchError(error => {
        this.logger.error(`Login error: ${error.message}`);
        throw new HttpException({
          success: false,
          message: 'Authentication failed'
        }, HttpStatus.UNAUTHORIZED);
      })
    );
  }

  /**
   * Guest login endpoint
   */
  @Post('guest')
  guestLogin(): Observable<AuthResponse> {
    return this.authService.createGuestUser().pipe(
      map(result => ({
        success: true,
        user: result.user,
        token: result.token
      })),
      catchError(error => {
        this.logger.error(`Guest login error: ${error.message}`);
        throw new HttpException({
          success: false,
          message: 'Failed to create guest user'
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      })
    );
  }

  /**
   * Verify token endpoint
   */
  @Post('verify')
  verifyToken(@Body() tokenDto: TokenDto): Observable<AuthResponse> {
    if (!tokenDto.token) {
      throw new HttpException({
        success: false,
        message: 'Token is required'
      }, HttpStatus.BAD_REQUEST);
    }
    
    return this.authService.validateUserByToken(tokenDto.token).pipe(
      map(user => {
        if (!user) {
          throw new HttpException({
            success: false,
            message: 'Invalid or expired token'
          }, HttpStatus.UNAUTHORIZED);
        }
        
        return {
          success: true,
          user,
          token: tokenDto.token
        };
      }),
      catchError(error => {
        this.logger.error(`Token verification error: ${error.message}`);
        throw new HttpException({
          success: false,
          message: 'Token verification failed'
        }, HttpStatus.UNAUTHORIZED);
      })
    );
  }
  
  /**
   * Logout endpoint
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(): Observable<{ success: boolean }> {
    return this.authService.logout().pipe(
      map(() => ({ success: true }))
    );
  }
}
