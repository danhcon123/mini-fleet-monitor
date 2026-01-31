"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const token_service_1 = require("../application/token.service");
const logger_1 = require("../../../shared/logger");
const authMiddleware = (req, res, next) => {
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
        const decoded = token_service_1.TokenService.verifyToken(token);
        logger_1.logger.debug('[authMiddleware] Token verified', { userId: decoded.userId, email: decoded.email });
        // Attach user info to request object
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
        };
        next();
    }
    catch (error) {
        logger_1.logger.warn('[authMiddleware] Authentication failed', { error: error instanceof Error ? error.message : 'Unknown' });
        const message = error instanceof Error ? error.message : 'Authentication failed';
        res.status(401).json({ error: message });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth-middleware.js.map