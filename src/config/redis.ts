import { createClient } from 'redis';
import { config } from './env';
import { logger } from '../shared/logger';

export const redisClient = createClient({
    url: config.redisUrl,
});

redisClient.on('error', (err) => {
    logger.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
    logger.info('Redis client connected');
}) 

// Connect to Redis
export async function connectRedis() {
    try {
        await redisClient.connect();
        logger.info('Redis connected successfully');
    } catch (error) {
        logger.error('Failed to connect to redis', error);
        throw error;
    }
}
