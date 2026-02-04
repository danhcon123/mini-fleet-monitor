import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

// Simple validation
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required i .env')
}

// Simple validation
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in .env')
}

// Export config
export const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),

    // Database
    databaseUrl: process.env.DATABASE_URL as string,
    dbPoolMin: parseInt(process.env.DB_POOL_MIN || '2'),
    dbPoolMax: parseInt(process.env.DB_POOL_MAX || '20'),
  
    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    
    
    // JWT
    jwtSecret: process.env.JWT_SECRET as string,
    jwtExpiresIn: '1h' as SignOptions['expiresIn'], 
}

