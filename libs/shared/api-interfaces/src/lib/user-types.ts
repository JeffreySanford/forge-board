/**
 * User and authentication related types
 */

/**
 * User role enum
 */
export type UserRole = 'admin' | 'user' | 'guest';

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
 * JWT payload structure
 */
export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Auth state interface
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  loading?: boolean;
  error?: string | null;
}
