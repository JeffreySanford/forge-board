import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TokenEncryption } from '../utils/token-encryption';
import { User, UserRole } from '@forge-board/shared/api-interfaces';
import { Environment } from '../../environments/environment.interface';

interface LoginResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  private readonly envConfig = environment as Environment;
  
  constructor(private http: HttpClient) {
    this.loadToken();
  }
  
  /**
   * Get the current token (decrypted)
   */
  getToken(): string {
    const encryptedToken = this.envConfig.encryptedJwtToken || localStorage.getItem('encryptedToken') || '';
    if (!encryptedToken) return this.envConfig.jwtGuestToken || '';
    
    return TokenEncryption.decryptToken(encryptedToken);
  }
  
  /**
   * Store token after encryption
   */
  private storeToken(token: string): void {
    if (!token) {
      localStorage.removeItem('encryptedToken');
      (environment as Environment).encryptedJwtToken = ''; // Modifying imported env is not ideal but fixes immediate error
      return;
    }
    
    const encryptedToken = TokenEncryption.encryptToken(token);
    localStorage.setItem('encryptedToken', encryptedToken);
    (environment as Environment).encryptedJwtToken = encryptedToken; // Modifying imported env
  }
  
  /**
   * Load token from storage
   */
  private loadToken(): void {
    const encryptedToken = localStorage.getItem('encryptedToken');
    if (encryptedToken) {
      (environment as Environment).encryptedJwtToken = encryptedToken; // Modifying imported env
    }
  }
  
  /**
   * Login user
   */
  login(username: string, password: string): Observable<User> {
    return this.http.post<LoginResponse>(`${this.envConfig.apiUrl}/auth/login`, {
      username, 
      password 
    }).pipe(
      tap(response => {
        this.currentUser = response.user;
        this.storeToken(response.token);
      }),
      map(response => response.user),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => new Error('Login failed. Please check your credentials.'));
      })
    );
  }
  
  /**
   * Get guest token for anonymous access
   */
  useGuestToken(): Observable<User> {
    this.storeToken(this.envConfig.jwtGuestToken);
    // Typically you'd validate this token with the server
    // For now we'll create a mock guest user
    this.currentUser = {
      id: 'guest-user',
      username: 'guest',
      role: UserRole.GUEST,
      guestExpiry: new Date(Date.now() + 24*60*60*1000).toISOString() // 24 hours
    };
    return of(this.currentUser);
  }
  
  /**
   * Log out user
   */
  logout(): void {
    this.storeToken('');
    this.currentUser = null;
  }
  
  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
  
  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.role === role;
  }
}
