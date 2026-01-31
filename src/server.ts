import dotenv from 'dotenv';

// Load environment variable
dotenv.config();

import { config } from './config/env';
import { connectRedis } from './config/redis';
import { createApp } from './app';
import { logger } from './shared/logger';
import { db, dbHealth } from './config/database';

const app = createApp();

// Start server
async function startServer() {
    try {
        // Connect to Redis
        logger.info('Connecting to Redis...');
        await connectRedis();

        // Test database connection
        logger.info('Testing database connection...');
        const isDbHealthy = await dbHealth();
        if (!isDbHealthy) {
            throw new Error('Database health check failed');
        }
        logger.info('Database connection successful');

        // Start Express server
        console.log("Server.ts reached before listen, port =", config.port);

        app.listen(config.port, () => {
            logger.info(`Server running on port ${config.port}`);
            logger.info(`Environment: ${config.nodeEnv}`);
            logger.info(`Health check: http://localhost:${config.port}/health`);
        });
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down ...');
    await db.end();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Shutting down ...');
    await db.end();
    process.exit(0);
});

// Start the server
startServer();
