/**
 * Authentication related interfaces
 */

/**
 * Authentication credentials
 */
export interface AuthCredentials {
  username: string;
  password: string;
}

/**
 * JWT Auth token response
 */
export interface AuthTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

/**
 * Auth state
 */
export interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    roles: string[];
  };
  expiresAt?: number;
}

// Module marker removed, interfaces are now exported individually
