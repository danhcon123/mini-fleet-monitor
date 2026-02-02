import { Request, Response, NextFunction } from 'express';
import { AuthHelper } from '../application/auth-helper.service';
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
        const authResult = AuthHelper.authenticateFromHeader(req.headers.authorization)

        if (!authResult.success) {
            res.status(401).json({ error: authResult.error || 'Authentication failed' });
            return;
        }

        logger.debug('[authMiddleware] Token verified', { 
            userId: authResult.userId, 
            email: authResult.email 
        });

        // Attach user info to request object
        req.user = {
            userId: authResult.userId!,
            email: authResult.email!,
        };

        next();
    } catch (error) {
        logger.warn('[authMiddleware] Authentication failed', { error: error instanceof Error ? error.message : 'Unknown' });
        const message = error instanceof Error ? error.message: 'Authentication failed';
        res.status(401).json({ error: message });
    }
};
