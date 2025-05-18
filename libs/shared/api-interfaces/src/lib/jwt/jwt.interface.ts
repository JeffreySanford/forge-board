/**
 * JWT related interfaces for shared use between frontend and backend
 */

/**
 * Standard JWT claims interface
 */
export interface JwtClaims {
    /** Subject (user ID) */
    sub: string;
    /** Issued at (timestamp) */
    iat?: number;
    /** Expiration time (timestamp) */
    exp?: number;
    /** JWT ID */
    jti?: string;
    /** Issuer */
    iss?: string;
    /** Audience */
    aud?: string;
}

/**
 * User-specific JWT payload
 */
export interface UserJwtPayload extends JwtClaims {
    /** User email */
    email?: string;
    /** User roles/permissions */
    roles?: string[];
    /** Username */
    username?: string;
}

/**
 * Auth token response from login/refresh endpoints
 */
export interface AuthTokenResponse {
    /** JWT access token */
    accessToken: string;
    /** Refresh token (if using refresh flow) */
    refreshToken?: string;
    /** Access token expiration time in seconds */
    expiresIn: number;
    /** Token type (usually "Bearer") */
    tokenType: string;
}

/**
 * Refresh token request payload
 */
export interface RefreshTokenRequest {
    refreshToken: string;
}