import jwt from 'jsonwebtoken';
import { config } from '../../../config/env';

interface TokenPayload {
    userId: number;
    email: string;
}

interface DecodedToken extends TokenPayload {
    iat: number
    exp: number
}

export class TokenService {
    /**
     * Generate a JWT access token
     */
    static generateToken(userId: number, email: string): string {
        const payload: TokenPayload = {
            userId,
            email,
        };
        
        return jwt.sign(payload, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn,
            algorithm: 'HS256',
        });
    }   


    /**
     * Verify and decode a JWT token
     * Throws an error if token is invalid or expired
     */
    static verifyToken(token: string): DecodedToken {
        try{
            const decoded = jwt.verify(token, config.jwtSecret, {
                algorithms: ['HS256'],
            }) as DecodedToken;

            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Token has expired')
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid token')
            }
            throw new Error('Token verification failed')
        }
    }
}
