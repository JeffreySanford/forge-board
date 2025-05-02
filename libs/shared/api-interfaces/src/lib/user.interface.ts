/**
 * User role type
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
  passwordHash?: string;
  lastLogin?: string;
  guestExpiry?: string;
  preferences?: Record<string, unknown>;
}

/**
 * JWT payload interface
 */
export interface JwtPayload {
  sub: string;      // subject (user id)
  username: string; // username
  role: UserRole;   // user role
  iat?: number;     // issued at
  exp?: number;     // expiration time
}

/**
 * Auth state interface
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
