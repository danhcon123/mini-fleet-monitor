import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../application/tokenService';
import { logger } from '../../../shared/logger';

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                email: string;
            }
        }
    }
}

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction 
) : void => {
    try {
        // Extract token from Authorization header (format: "Bearer <token>")
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({ error: 'No authorization header provided' });
            return;
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            res.status(401).json({ error: 'Invalid authorization header format. Use: Bearer <token>' });
            return;
        }

        const token = parts[1];

        // Verify token and extract payload
        const decoded = TokenService.verifyToken(token);
        
        logger.debug('[authMiddleware] Token verified', { userId: decoded.userId, email: decoded.email });
        
        // Attach user info to request object
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
        };

        next();
    } catch (error) {
        logger.warn('[authMiddleware] Authentication failed', { error: error instanceof Error ? error.message : 'Unknown' });
        const message = error instanceof Error ? error.message: 'Authentication failed';
        res.status(401).json({ error: message });
    }
};
