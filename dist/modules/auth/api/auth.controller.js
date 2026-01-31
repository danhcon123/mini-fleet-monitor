"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const logger_1 = require("../../../shared/logger");
const token_service_1 = require("../application/token.service");
class AuthController {
    constructor(db) {
        this.db = db;
        /**
         * POST /auth/login
         * Body: { email: string, password: string}
         */
        this.login = async (req, res) => {
            try {
                const { email, password } = req.body;
                logger_1.logger.info('Login attempt', { email });
                // Validation
                if (!email || !password) {
                    res.status(400).json({ error: 'Email and password are required' });
                    return;
                }
                // Find user by email
                const result = await this.db.query(`SELECT id, email, password_hash FROM users WHERE email = $1`, [email]);
                if (result.rows.length === 0) {
                    res.status(401).json({ error: 'Invalid credentials' });
                    return;
                }
                const user = result.rows[0];
                // Verify password
                const isValidPassword = await bcrypt_1.default.compare(password, user.password_hash);
                if (!isValidPassword) {
                    res.status(401).json({ error: 'Invalid credentials' });
                    return;
                }
                // Generate token
                const access_token = token_service_1.TokenService.generateToken(user.id, user.email);
                logger_1.logger.info('Login successful', { userId: user.id, email: user.email });
                // Return token
                res.status(200).json({
                    access_token,
                    user: {
                        id: user.id,
                        email: user.email,
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('Login error', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        };
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map