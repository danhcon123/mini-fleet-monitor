import { redisClient } from "../../../config/redis";
import { logger } from "../../../shared/logger";
import { Robot } from "../domain/robot";

// Single cache key for the "list robots" endpoint
const CACHE_KEY = 'robot:list';
// Short TTL to keep data reasonably fresh and reduce stale reads
const CACHE_TTL = 10; // 10 seconds

export class RedisCacheService {
    /**
     * Reads the robots list from Redis.
     */
    async getCachedRobots(): Promise<Robot[] | null> {
        try {
            const cached = await redisClient.get(CACHE_KEY);
            
            if (cached) {
                logger.debug('[RedisCacheService] Cache hit for robots list');
                // Parse cached JSON back into array shape
                return JSON.parse(cached)
            }

            logger.debug('[RedisCacheService] Cache miss for robot list');
            return null;
        } catch (error) {
            logger.error('[RedisCacheService] Error reading from Redis cache', error);
            return null;
        }
    }
    
    /**
     * Writes the robots list to Redis with TTL.
     */
    async setCachedRobot(robots: Robot[]): Promise<void> {
       try {
        //Uses SETEX pattern (set value + expiration) to avoid stale cache forever
        await redisClient.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(robots));
        
        logger.debug('[RedisCacheService] Robot cached successfully', { count: robots.length });
       } catch (error) {
        logger.error('[RedisCacheService] Error writing to Redis cache', error);
        // No throw - cache failure shouldnt break the app
       }
    }
    
    /**
     * Invalidates the robots list cache.
     */
    async invalidateCache():Promise<void> {
        try {
            await redisClient.del(CACHE_KEY);
            logger.debug('[RedisCacheService] Cache invalidated');
        } catch (error) {
            logger.error('[RedisCacheService] Error invalidating cache', error);
            // No throw - cache failure shouldnt break the app
        }
    }
}