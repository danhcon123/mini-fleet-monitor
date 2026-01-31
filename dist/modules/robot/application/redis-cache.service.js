"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheService = void 0;
const redis_1 = require("../../../config/redis");
const logger_1 = require("../../../shared/logger");
// Single cache key for the "list robots" endpoint
const CACHE_KEY = 'robot:list';
// Short TTL to keep data reasonably fresh and reduce stale reads
const CACHE_TTL = 10; // 10 seconds
class RedisCacheService {
    /**
     * Reads the robots list from Redis.
     */
    async getCachedRobots() {
        try {
            const cached = await redis_1.redisClient.get(CACHE_KEY);
            if (cached) {
                logger_1.logger.debug('[RedisCacheService] Cache hit for robots list');
                // Parse cached JSON back into array shape
                return JSON.parse(cached);
            }
            logger_1.logger.debug('[RedisCacheService] Cache miss for robot list');
            return null;
        }
        catch (error) {
            logger_1.logger.error('[RedisCacheService] Error reading from Redis cache', error);
            return null;
        }
    }
    /**
     * Writes the robots list to Redis with TTL.
     */
    async setCachedRobot(robots) {
        try {
            //Uses SETEX pattern (set value + expiration) to avoid stale cache forever
            await redis_1.redisClient.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(robots));
            logger_1.logger.debug('[RedisCacheService] Robot cached successfully', { count: robots.length });
        }
        catch (error) {
            logger_1.logger.error('[RedisCacheService] Error writing to Redis cache', error);
            // No throw - cache failure shouldnt break the app
        }
    }
    /**
     * Invalidates the robots list cache.
     */
    async invalidateCache() {
        try {
            await redis_1.redisClient.del(CACHE_KEY);
            logger_1.logger.debug('[RedisCacheService] Cache invalidated');
        }
        catch (error) {
            logger_1.logger.error('[RedisCacheService] Error invalidating cache', error);
            // No throw - cache failure shouldnt break the app
        }
    }
}
exports.RedisCacheService = RedisCacheService;
//# sourceMappingURL=redis-cache.service.js.map