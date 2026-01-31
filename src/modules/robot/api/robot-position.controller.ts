import { Request, Response } from 'express';
import { PositionService } from '../application/robot-position.service';
import { logger } from '../../../shared/logger';

export class PositionController {
    constructor(private positionService: PositionService) {}
    
    /**
     * GET /robots
     * Get all robots with caching
     */
    getAllRobots = async (req: Request, res: Response): Promise<void> => {
        try {
            const robots = await this.positionService.getAllRobots();
            res.status(200).json(robots)
        } catch (error) {
            logger.error('[PositionController] Error in getAllRobots controller')
            res.status(500).json({ error: 'Failed to fetch robots' });
        }
    };

    /**
     * GET /robots/:id
     * Get single robot by ID
     */
    getRobotById = async (req: Request, res: Response) : Promise<void> => {
        try {
            const id = Number(req.params.id);
            
            if (isNaN(id)){
                res.status(400).json({error: 'Invalid robot ID'})
                return;
            }
            
            const robot = await this.positionService.getRobotById(id);

            if (!robot) {
                res.status(404).json({ error: 'Robot not found'})
                return;
            }
            
            res.status(200).json(robot);
        } catch (error) {
            logger.error('Error in getRobotById controller', error);
            res.status(500).json({ error: 'Failed to fetch robot' })
        }
    };

    /**
     * POST /robots/:id/move
     * Move robot to new random position
     */
    moveRobot = async (req: Request, res: Response) : Promise<void> => {
        try {
            const id = Number(req.params.id);

            if (Number.isInteger(id)) {
                res.status(400).json({error: 'Invalid robot ID' });
                return;
            }
            
            const robot = await this.positionService.moveRobot(id);

            if (!robot) {
                res.status(404).json({ error: 'Robot not found' });
                return;
            }

            res.status(200).json(robot);
        } catch (error) {
            logger.error('Error in moveRobot controller', error);
            res.status(500).json({ error: 'Failed to move robot' })
        }
    };
}