"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../../config/env");
class TokenService {
    /**
     * Generate a JWT access token
     */
    static generateToken(userId, email) {
        const payload = {
            userId,
            email,
        };
        return jsonwebtoken_1.default.sign(payload, env_1.config.jwtSecret, {
            expiresIn: env_1.config.jwtExpiresIn,
            algorithm: 'HS256',
        });
    }
    /**
     * Verify and decode a JWT token
     * Throws an error if token is invalid or expired
     */
    static verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret, {
                algorithms: ['HS256'],
            });
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Token has expired');
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid token');
            }
            throw new Error('Token verification failed');
        }
    }
}
exports.TokenService = TokenService;
//# sourceMappingURL=tokenService.js.map