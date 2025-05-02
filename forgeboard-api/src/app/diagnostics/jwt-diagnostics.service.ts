import { Injectable, Logger } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';

// Define a type for JWT payload
interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  username?: string;
  [key: string]: unknown;
}

/**
 * Authentication event type
 */
export type AuthEventType = 
  | 'login-success' 
  | 'login-fail' 
  | 'token-validate-success' 
  | 'token-validate-fail'
  | 'logout';

/**
 * Authentication diagnostic event
 */
export interface AuthDiagnosticEvent {
  id: string;
  type: AuthEventType;
  username?: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Authentication statistics interface
 */
export interface AuthStats {
  totalAttempts: number;
  successCount: number;
  failCount: number;
  lastActivity: string;
  activeTokens: number;
  tokenVerifications: number;
  failedVerifications: number;
}

// Type for token verification options
export interface TokenVerificationOptions {
  ignoreExpiration?: boolean;
  audience?: string | string[];
  issuer?: string;
}

// Interface for verification result
export interface JwtVerificationResult {
  valid: boolean;
  payload?: Record<string, unknown>;
  expiresAt?: string;
  issuedAt?: string;
  error?: string;
}

/**
 * JWT Authentication diagnostics service
 * Tracks authentication events for diagnostic purposes
 */
@Injectable()
export class JwtDiagnosticsService {
  private readonly logger = new Logger(JwtDiagnosticsService.name);
  
  // Store authentication events with a size limit
  private authEvents: AuthDiagnosticEvent[] = [];
  private readonly maxEvents = 100;
  
  // Observable sources
  private authEventsSubject = new BehaviorSubject<AuthDiagnosticEvent[]>([]);
  private authStatsSubject = new BehaviorSubject<AuthStats>({
    totalAttempts: 0,
    successCount: 0,
    failCount: 0,
    lastActivity: '',
    activeTokens: 0,
    tokenVerifications: 0,
    failedVerifications: 0
  });
  
  // Authentication statistics
  private stats: AuthStats = {
    totalAttempts: 0,
    successCount: 0,
    failCount: 0,
    lastActivity: new Date().toISOString(),
    activeTokens: 0,
    tokenVerifications: 0,
    failedVerifications: 0
  };

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Record an authentication event
   */
  recordAuthEvent(event: AuthDiagnosticEvent): void {
    // Add to events array
    this.authEvents.unshift(event);
    
    // Enforce size limit
    if (this.authEvents.length > this.maxEvents) {
      this.authEvents = this.authEvents.slice(0, this.maxEvents);
    }
    
    // Update stats
    this.stats.totalAttempts++;
    this.stats.lastActivity = event.timestamp;
    
    if (event.success) {
      this.stats.successCount++;
      if (event.type === 'login-success') {
        this.stats.activeTokens++;
      } else if (event.type === 'logout') {
        this.stats.activeTokens = Math.max(0, this.stats.activeTokens - 1);
      }
    } else {
      this.stats.failCount++;
    }
    
    // Emit updates
    this.authEventsSubject.next([...this.authEvents]);
    this.authStatsSubject.next({...this.stats});
    
    // Log event
    this.logger.debug(
      `Auth event: ${event.type} | Success: ${event.success} | ${event.username || 'Anonymous'}`,
      event.metadata
    );
  }
  
  /**
   * Get authentication events as observable
   */
  getAuthEvents(): Observable<AuthDiagnosticEvent[]> {
    return this.authEventsSubject.asObservable();
  }
  
  /**
   * Get authentication stats as observable
   */
  getAuthStats(): Observable<AuthStats> {
    return this.authStatsSubject.asObservable();
  }
  
  /**
   * Get current authentication events
   */
  getCurrentEvents(): AuthDiagnosticEvent[] {
    return [...this.authEvents];
  }
  
  /**
   * Get current authentication stats
   */
  getCurrentStats(): AuthStats {
    return {...this.stats};
  }
  
  /**
   * Reset statistics (but keep events)
   */
  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successCount: 0,
      failCount: 0,
      lastActivity: new Date().toISOString(),
      activeTokens: 0,
      tokenVerifications: 0,
      failedVerifications: 0
    };
    this.authStatsSubject.next({...this.stats});
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string, options?: TokenVerificationOptions): JwtVerificationResult {
    try {
      // We're not using options directly but it's part of the function interface
      // Use the JwtService to verify the token
      const payload = this.jwtService.verify(token) as JwtPayload;
      this.stats.tokenVerifications++;
      
      // Extract expiration and issuance date if available
      const expiresAt = payload.exp 
        ? new Date(payload.exp * 1000).toISOString() 
        : undefined;
      
      const issuedAt = payload.iat 
        ? new Date(payload.iat * 1000).toISOString() 
        : undefined;
      
      return {
        valid: true,
        payload: payload as Record<string, unknown>,
        expiresAt,
        issuedAt
      };
    } catch (error) {
      this.stats.failedVerifications++;
      this.logger.debug(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  logEvent(event: string, meta?: Record<string, unknown>) {
    this.logger.debug(`[JWT DIAGNOSTICS] ${event}`, meta);
  }

  logError(message: string, error?: unknown) {
    this.logger.error(`[JWT DIAGNOSTICS] ${message}`, error instanceof Error ? error.stack : undefined);
  }

  // Add more diagnostics methods as needed
}
