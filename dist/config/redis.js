"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.connectRedis = connectRedis;
const redis_1 = require("redis");
const env_1 = require("./env");
const logger_1 = require("../shared/logger");
exports.redisClient = (0, redis_1.createClient)({
    url: env_1.config.redisUrl,
});
exports.redisClient.on('error', (err) => {
    logger_1.logger.error('Redis Client Error', err);
});
exports.redisClient.on('connect', () => {
    logger_1.logger.info('Redis client connected');
});
// Connect to Redis
async function connectRedis() {
    try {
        await exports.redisClient.connect();
        logger_1.logger.info('Redis connected successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to redis', error);
        throw error;
    }
}
//# sourceMappingURL=redis.js.map