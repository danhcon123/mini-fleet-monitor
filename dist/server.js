"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const env_1 = require("./config/env");
const redis_1 = require("./config/redis");
const robot_position_router_1 = require("./modules/robot/api/robot-position.router");
const auth_router_1 = require("./modules/auth/api/auth.router");
const logger_1 = require("./shared/logger");
const database_1 = require("./config/database");
// Load environment variable
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', async (req, res) => {
    const dbHealthy = await (0, database_1.dbHealth)();
    res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
    });
});
// Public routes
app.use('/auth', (0, auth_router_1.createAuthRoutes)(database_1.db));
app.use('/api', (0, robot_position_router_1.createPositionRoutes)(database_1.db)); // /api/robots, /api/robots/:id, /api/robots/:id/move
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Error handler
app.use((err, req, res, next) => {
    logger_1.logger.error('Unhandled error', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Start server
async function startServer() {
    try {
        // Connect to Redis
        logger_1.logger.info('Connecting to Redis...');
        await (0, redis_1.connectRedis)();
        // Test database connection
        logger_1.logger.info('Testing database connection...');
        const isDbHealthy = await (0, database_1.dbHealth)();
        if (!isDbHealthy) {
            throw new Error('Database health check failed');
        }
        logger_1.logger.info('Database connection successful');
        // Start Express server
        console.log("Server.ts reached before listen, port =", env_1.config.port);
        app.listen(env_1.config.port, () => {
            logger_1.logger.info(`Server running on port ${env_1.config.port}`);
            logger_1.logger.info(`Environment: ${env_1.config.nodeEnv}`);
            logger_1.logger.info(`Health check: http://localhost:${env_1.config.port}/health`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    logger_1.logger.info('Shutting down ...');
    await database_1.db.end();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger_1.logger.info('Shutting down ...');
    await database_1.db.end();
    process.exit(0);
});
// Start the server
startServer();
//# sourceMappingURL=server.js.map