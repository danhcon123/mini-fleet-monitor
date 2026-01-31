import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { logger } from '../../../shared/logger';
import { Pool } from 'pg';
import { TokenService } from '../application/tokenService';

export class AuthController {
    constructor(private db: Pool) {}
    
    /**
     * POST /auth/login
     * Body: { email: string, password: string}
     */
    login = async(req: Request, res: Response): Promise<void> => {
        try{
            const { email, password } = req.body;
            
            logger.info('Login attempt', { email });

            // Validation
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }

            // Find user by email
            const result = await this.db.query(
                `SELECT id, email, password_hash FROM users WHERE email = $1`,
                [email]
            );

            if (result.rows.length === 0) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            const user = result.rows[0];

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);

            if(!isValidPassword) {
                res.status(401).json({error: 'Invalid credentials' });
                return;
            }
            
            // Generate token
            const access_token = TokenService.generateToken(user.id, user.email);

            logger.info('Login successful', { userId: user.id, email: user.email });
            // Return token
            res.status(200).json({
                access_token,
                user: {
                    id: user.id,
                    email: user.email,
                }
            });
        } catch (error) {
            logger.error('Login error', error)
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}