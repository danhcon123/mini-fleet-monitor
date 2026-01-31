"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env file
dotenv_1.default.config();
// Simple validation
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required i .env');
}
// Simple validation
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in .env');
}
// Export config
exports.config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    // Database
    databaseUrl: process.env.DATABASE_URL,
    dbPoolMin: parseInt(process.env.DB_POOL_MIN || '2'),
    dbPoolMax: parseInt(process.env.DB_POOL_MAX || '20'),
    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    // JWT
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: '1h',
};
//# sourceMappingURL=env.js.map