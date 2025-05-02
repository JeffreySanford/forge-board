import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TokenEncryption } from '../utils/token-encryption';
import { User } from '@forge-board/shared/api-interfaces';

interface LoginResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  
  constructor(private http: HttpClient) {
    this.loadToken();
  }
  
  /**
   * Get the current token (decrypted)
   */
  getToken(): string {
    const encryptedToken = environment.encryptedJwtToken || localStorage.getItem('encryptedToken') || '';
    if (!encryptedToken) return environment.jwtGuestToken || '';
    
    return TokenEncryption.decryptToken(encryptedToken);
  }
  
  /**
   * Store token after encryption
   */
  private storeToken(token: string): void {
    if (!token) {
      localStorage.removeItem('encryptedToken');
      environment.encryptedJwtToken = '';
      return;
    }
    
    const encryptedToken = TokenEncryption.encryptToken(token);
    localStorage.setItem('encryptedToken', encryptedToken);
    environment.encryptedJwtToken = encryptedToken;
  }
  
  /**
   * Load token from storage
   */
  private loadToken(): void {
    const encryptedToken = localStorage.getItem('encryptedToken');
    if (encryptedToken) {
      environment.encryptedJwtToken = encryptedToken;
    }
  }
  
  /**
   * Login user
   */
  login(username: string, password: string): Observable<User> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { 
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
    this.storeToken(environment.jwtGuestToken);
    // Typically you'd validate this token with the server
    // For now we'll create a mock guest user
    this.currentUser = {
      id: 'guest-user',
      username: 'guest',
      role: 'guest',
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
    return this.currentUser?.role === role;
  }
}
