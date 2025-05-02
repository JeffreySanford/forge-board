/**
 * User related types and interfaces
 */

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

/**
 * User interface
 */
export interface User {
  id: string;
  username: string;
  role: UserRole;
  email?: string;
  lastLogin?: string;
  guestExpiry?: string;
  preferences?: Record<string, unknown>;
}

/**
 * User registration request
 */
export interface UserRegistrationRequest {
  username: string;
  password: string;
  email?: string;
}

/**
 * User login request
 */
export interface UserLoginRequest {
  username: string;
  password: string;
}

/**
 * User login response
 */
export interface UserLoginResponse {
  token: string;
  user: User;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  /**
   * Currently authenticated user
   */
  user: User | null;
  
  /**
   * Authentication token
   */
  token: string | null;
  
  /**
   * Whether authentication is in progress
   */
  loading: boolean;
  
  /**
   * Authentication error if any
   */
  error: string | null;
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  /**
   * Subject (user ID)
   */
  sub: string;
  
  /**
   * Username
   */
  username: string;
  
  /**
   * User role
   */
  role: UserRole;
  
  /**
   * Issued at timestamp
   */
  iat?: number;
  
  /**
   * Expiration timestamp
   */
  exp?: number;
}
