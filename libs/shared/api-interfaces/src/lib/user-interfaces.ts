/**
 * User related interfaces
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
  email: string;
  name?: string;
  roles: UserRole[];
  created: string;
  lastLogin?: string;
}

/**
 * JWT payload
 */
export interface JwtPayload {
  sub: string; // user id
  username: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

// Mark this file as a User module
export const __userInterfaces = true;
