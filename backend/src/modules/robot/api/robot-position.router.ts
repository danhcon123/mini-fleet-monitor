import { Router } from 'express';
import { Pool } from 'pg';
import { PositionController } from './robot-position.controller';
import { PositionService } from '../application/robot-position.service';
import { RedisCacheService } from '../application/redis-cache.service';
import { PositionRepository } from '../infrastructure/robot-position.repo';
import { authMiddleware } from '../../auth/api/auth-middleware';

export const createPositionRoutes = (db: Pool) : Router => {
    const router = Router();
    
    // Initialize dependencies
    const positionRepository = new PositionRepository(db)
    const cacheService = new RedisCacheService();
    const positionService = new PositionService(positionRepository, cacheService);
    const positionController = new PositionController(positionService);
    
    // All routes are protected with JWT
    router.get('/robots', authMiddleware, positionController.getAllRobots);
    router.get('/robots/:id', authMiddleware, positionController.getRobotById);
    router.post('/robots/:id/move', authMiddleware, positionController.moveRobot);
    
    return router;
}