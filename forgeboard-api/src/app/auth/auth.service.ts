import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User, UserRole } from '@forge-board/shared/api-interfaces';
import type { AuthState } from '@forge-board/shared/api-interfaces';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { Socket } from 'socket.io';
import { JwtDiagnosticsService } from '../diagnostics/jwt-diagnostics.service';

// Fix the JwtPayload to be compatible with Record<string, unknown>
interface JwtPayload extends Record<string, unknown> {
  sub: string;
  username: string;
  role: UserRole;
}

/**
 * Authentication service using reactive patterns with RxJS
 * 
 * - Uses BehaviorSubject for state management
 * - Returns Observables instead of Promises
 * - Integrates with MongoDB via UserService
 * - Supports WebSocket authentication
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  /**
   * BehaviorSubject for the current authentication state
   */
  private authStateSubject = new BehaviorSubject<AuthState>({
    user: null,
    token: null,
    loading: false,
    error: null,
  });
  
  /**
   * Observable of the current authentication state
   */
  public authState$: Observable<AuthState> = this.authStateSubject.asObservable();
  
  /**
   * Observable of the current user
   */
  public currentUser$: Observable<User | null> = this.authState$.pipe(
    map(state => state.user)
  );
  
  /**
   * Observable of whether the user is authenticated
   */
  public isAuthenticated$: Observable<boolean> = this.authState$.pipe(
    map(state => !!state.user)
  );
  
  /**
   * Observable of the current token
   */
  public token$: Observable<string | null> = this.authState$.pipe(
    map(state => state.token)
  );
  
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private readonly jwtDiagnostics: JwtDiagnosticsService
  ) {}
  
  /**
   * Get the current authentication state
   */
  getAuthState(): AuthState {
    return this.authStateSubject.getValue();
  }
  
  /**
   * Update the authentication state
   */
  private updateAuthState(update: Partial<AuthState>): void {
    this.authStateSubject.next({
      ...this.authStateSubject.getValue(),
      ...update,
    });
  }
  
  /**
   * Validate a user by JWT token
   */
  validateUserByToken(token: string): Observable<User | null> {
    this.updateAuthState({ loading: true, error: null });
    
    try {
      // Verify and decode the JWT token
      const payload = this.jwtService.verify<JwtPayload>(token);
      
      if (!payload || !payload.sub) {
        this.logger.warn('Invalid JWT payload structure');
        this.updateAuthState({ loading: false, error: 'Invalid token payload' });
        return of(null);
      }
      
      // Find the user in the database
      return this.userService.findById(payload.sub).pipe(
        tap(user => {
          if (!user) {
            this.logger.warn(`User from token not found: ${payload.sub}`);
            this.updateAuthState({ loading: false, error: 'User not found' });
          } else {
            // For guest users, check if token has expired
            if (user.role === 'guest' && user.guestExpiry) {
              const expiryDate = new Date(user.guestExpiry);
              if (expiryDate < new Date()) {
                this.logger.warn(`Guest user token expired: ${user.id}`);
                this.updateAuthState({ 
                  user: null, 
                  token: null,
                  loading: false, 
                  error: 'Guest account expired' 
                });
                return null;
              }
            }
            
            // Update auth state with valid user
            this.updateAuthState({
              user,
              token,
              loading: false,
              error: null
            });
            
            this.logger.log(`User validated: ${user.id} (${user.role})`);
          }
        }),
        catchError(error => {
          this.logger.error(`Error validating user: ${error.message}`);
          this.updateAuthState({ loading: false, error: error.message });
          return of(null);
        })
      );
    } catch (error) {
      this.logger.error(`JWT validation error: ${error.message}`);
      this.updateAuthState({ loading: false, error: error.message });
      return of(null);
    }
  }
  
  /**
   * Create a token for a user
   */
  createToken(user: User): Observable<string> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };
    
    // Set expiration based on user role
    if (user.role === 'guest') {
      // Guest tokens expire in 24 hours
      payload.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    } else {
      // Regular tokens expire in 7 days
      payload.exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    }
    
    return of(this.jwtService.sign(payload));
  }
  
  /**
   * Validate user credentials and return a token
   */
  validateUserCredentials(username: string, password: string): Observable<{ user: User, token: string } | null> {
    this.updateAuthState({ loading: true, error: null });
    
    return this.userService.findByUsername(username).pipe(
      switchMap(user => {
        if (!user) {
          this.updateAuthState({ loading: false, error: 'Invalid credentials' });
          return of(null);
        }
        
        // Here you would normally check password hash
        // For now we'll skip actual password verification
        console.log('Processing credentials for:', username, 'with password length:', password.length);
        
        // Update last login time
        return this.userService.updateLastLogin(user.id).pipe(
          switchMap(updatedUser => {
            return this.createToken(updatedUser).pipe(
              map(token => {
                // Update auth state
                this.updateAuthState({
                  user: updatedUser,
                  token,
                  loading: false,
                  error: null
                });
                
                return { user: updatedUser, token };
              })
            );
          })
        );
      }),
      catchError(error => {
        this.logger.error(`Login error: ${error.message}`);
        this.updateAuthState({ loading: false, error: error.message });
        return of(null);
      })
    );
  }
  
  /**
   * Create a guest user
   */
  createGuestUser(): Observable<{ user: User, token: string }> {
    this.updateAuthState({ loading: true, error: null });
    
    // Generate a unique ID for the guest
    const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the guest user
    return this.userService.create({
      id: guestId,
      username: `guest-${guestId.substr(0, 6)}`,
      role: 'guest' as UserRole,
      // Guest expires in 24 hours
      guestExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }).pipe(
      switchMap(user => {
        return this.createToken(user).pipe(
          map(token => {
            // Update auth state
            this.updateAuthState({
              user,
              token,
              loading: false,
              error: null
            });
            
            return { user, token };
          })
        );
      }),
      catchError(error => {
        this.logger.error(`Error creating guest user: ${error.message}`);
        this.updateAuthState({ loading: false, error: error.message });
        return throwError(() => new Error('Failed to create guest user'));
      })
    );
  }
  
  /**
   * Authenticate via WebSocket
   */
  authenticateSocket(socket: Socket, token: string): Observable<boolean> {
    return this.validateUserByToken(token).pipe(
      map(user => {
        if (user) {
          // Store user data in socket
          socket.data.user = user;
          return true;
        }
        return false;
      }),
      catchError(() => of(false))
    );
  }
  
  /**
   * Log out the current user
   */
  logout(): Observable<void> {
    this.updateAuthState({
      user: null,
      token: null,
      loading: false,
      error: null
    });
    
    return of(undefined);
  }
}
