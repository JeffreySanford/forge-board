/**
 * Types related to user management
 */

/**
 * User roles enumeration
 */
export enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
  // ...other roles as needed
}

/**
 * Base user interface
 */
export interface User {
  id: string;
  username?: string;
  email?: string;
  role: UserRole;
  guestExpiry?: string; // Property for guest user expiry
  lastLogin?: string; // Property for tracking last login
  preferences?: Record<string, unknown>; // For user preferences
  // Add any other properties that might be used
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  theme?: string;
  layout?: string;
  notifications?: boolean;
  dashboardConfig?: Record<string, unknown>;
  [key: string]: unknown;
}

// Module marker removed, types are now exported individually