import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { config } from './config/env';
import { connectRedis } from './config/redis';
import { createPositionRoutes } from './modules/robot/api/robot-position.router';
import { createAuthRoutes } from './modules/auth/api/auth.router';
import { logger } from './shared/logger';
import { db, dbHealth} from './config/database';
import { timeStamp } from 'node:console';


// Load environment variable
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
    const dbHealthy = await dbHealth();
    res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
    });
});

// Public routes
app.use('/auth', createAuthRoutes(db));
app.use('/api', createPositionRoutes(db)); // /api/robots, /api/robots/:id, /api/robots/:id/move

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', err);
    res.status(500).json({ error: 'Internal server error' });
});

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