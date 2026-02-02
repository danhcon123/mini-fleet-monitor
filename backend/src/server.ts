import dotenv from 'dotenv';

// Load environment variable
dotenv.config();

import http from 'http';
import { config } from './config/env';
import { connectRedis } from './config/redis';
import { createApp } from './app';
import { logger } from './shared/logger';
import { db, dbHealth } from './config/database';
import { WebSocketHandler } from './modules/robot/api/websocketHandler';
import { SimulationService } from './modules/robot/application/robot-simulation.service';
import { PositionService } from './modules/robot/application/robot-position.service';
import { PositionRepository } from './modules/robot/infrastructure/robot-position.repo';
import { RedisCacheService } from './modules/robot/application/redis-cache.service';

const app = createApp(db);

// Create HTTP server
const server = http.createServer(app);

// Services
let wsHandler: WebSocketHandler;
let simulationService: SimulationService;

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

        // Init WebSocket handler
        logger.info('Initializing WebSocket handler...');
        wsHandler = new WebSocketHandler(server);
        await wsHandler.waitForInitialization();
        
        // Init simulation service
        logger.info('Initializing simulation service...');
        const positionRepository = new PositionRepository(db);
        const cacheService =  new RedisCacheService();
        const positionService = new PositionService(positionRepository, cacheService);
        simulationService = new SimulationService(positionService)

        // Start simulation
        await simulationService.start();

        // Start Express server
        console.log("Server.ts reached before listen, port =", config.port);

        server.listen(config.port, () => {
            logger.info(`Server running on port ${config.port}`);
            logger.info(`Environment: ${config.nodeEnv}`);
            logger.info(`Health check: http://localhost:${config.port}/health`);
            logger.info(`WebSocket: ws://localhost:${config.port}/ws`);
        });
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
}

// Graceful shutdown
const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    
    if (simulationService) {
        simulationService.stop();
    }
    
    if (wsHandler) {
        await wsHandler.close();
    }
    
    await db.end();
    
    logger.info('Shutdown complete');
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
startServer();