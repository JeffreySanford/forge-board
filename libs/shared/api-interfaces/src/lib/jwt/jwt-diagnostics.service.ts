import { Injectable } from '@angular/core';

// JWT payload type definition
export interface JwtPayload {
    sub?: string; // subject (user id)
    iat?: number; // issued at
    exp?: number; // expiration time
    [key: string]: any; // additional custom claims
}

// Service interface definition for type safety across frontend and backend
@Injectable({
    providedIn: 'root'
})
export class JwtDiagnosticsService {
    /**
     * Retrieve JWT token from storage
     */
    getToken(): string | null {
        // Implementation would differ between frontend/backend
        // Frontend might use localStorage, backend might use request headers
        return null;
    }

    /**
     * Store JWT token
     * @param token - The JWT token to store
     */
    putToken(token: string): void {
        // Implementation would differ between frontend/backend
        // Frontend might use localStorage, backend might set cookies
    }

    /**
     * Decode and validate JWT token
     * @param token - Optional token (uses stored token if not provided)
     */
    decodeToken<T extends JwtPayload = JwtPayload>(token?: string): T | null {
        const jwtToken = token || this.getToken();
        if (!jwtToken) return null;

        try {
            // Basic JWT decoding
            const [, payload] = jwtToken.split('.');
            const decodedPayload = JSON.parse(atob(payload));
            
            // Check if token is expired
            if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
                return null;
            }
            
            return decodedPayload as T;
        } catch (e) {
            console.error('Error decoding token', e);
            return null;
        }
    }

    /**
     * Check if stored token is valid and not expired
     */
    isTokenValid(): boolean {
        return this.decodeToken() !== null;
    }

    /**
     * Clear stored token
     */
    clearToken(): void {
        // Implementation depends on storage mechanism
    }
}