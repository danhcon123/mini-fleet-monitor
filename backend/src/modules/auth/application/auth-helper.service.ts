import { TokenService } from "./token.service";
import { logger } from "../../../shared/logger";

export interface AuthResult {
    success: boolean;
    userId?: number;
    email?: string;
    error?: string;
}

export class AuthHelper {
    /**
     * Extract token from Bearer header format
     */
    static extractBearerToken(authHeader: string | undefined): string | null {
        if( !authHeader ) {
            return null;
        }

        const parts = authHeader.split(' ');
            if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }
        return parts[1];
    }

    /** 
     * Verify token and return user info
     */
    static verifyAndExtractUser(token: string): AuthResult {
        try {
            const decoded = TokenService.verifyToken(token);

            return {
                success: true,
                userId: decoded.userId,
                email: decoded.email,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            logger.warn('[AuthHelper] Token verification failed', { error: errorMessage });

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Extract and verify token from Authorization header
     */
    static authenticateFromHeader(authHeader: string | undefined): AuthResult {
        const token = this.extractBearerToken(authHeader);
        
        if (!token) {
            return {
                success: false,
                error: 'Invalid authorization header format. Use: Bearer <token>',
            }
        }

        return this.verifyAndExtractUser(token)
    }
}