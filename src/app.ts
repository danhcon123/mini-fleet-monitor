import express from 'express';
import cors from 'cors';

import { createPositionRoutes } from './modules/robot/api/robot-position.router';
import { createAuthRoutes } from './modules/auth/api/auth.router';
import { logger } from './shared/logger';
import { db, dbHealth } from './config/database';
import { Pool } from 'pg';

export function createApp(dbPool: Pool = db) {
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
    app.use('/auth', createAuthRoutes(dbPool));
    app.use('/api', createPositionRoutes(dbPool));

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });

    // Error handler
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        logger.error('Unhandled error', err);
        res.status(500).json({ error: 'Internal server error' });
    });

    return app;
}
