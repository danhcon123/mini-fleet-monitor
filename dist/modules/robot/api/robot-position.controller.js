"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionController = void 0;
const logger_1 = require("../../../shared/logger");
class PositionController {
    constructor(positionService) {
        this.positionService = positionService;
        /**
         * GET /robots
         * Get all robots with caching
         */
        this.getAllRobots = async (req, res) => {
            try {
                const robots = await this.positionService.getAllRobots();
                res.status(200).json(robots);
            }
            catch (error) {
                logger_1.logger.error('[PositionController] Error in getAllRobots controller');
                res.status(500).json({ error: 'Failed to fetch robots' });
            }
        };
        /**
         * GET /robots/:id
         * Get single robot by ID
         */
        this.getRobotById = async (req, res) => {
            try {
                const id = Number(req.params.id);
                if (isNaN(id)) {
                    res.status(400).json({ error: 'Invalid robot ID' });
                    return;
                }
                const robot = await this.positionService.getRobotById(id);
                if (!robot) {
                    res.status(404).json({ error: 'Robot not found' });
                    return;
                }
                res.status(200).json(robot);
            }
            catch (error) {
                logger_1.logger.error('Error in getRobotById controller', error);
                res.status(500).json({ error: 'Failed to fetch robot' });
            }
        };
        /**
         * POST /robots/:id/move
         * Move robot to new random position
         */
        this.moveRobot = async (req, res) => {
            try {
                const id = Number(req.params.id);
                if (Number.isInteger(id)) {
                    res.status(400).json({ error: 'Invalid robot ID' });
                    return;
                }
                const robot = await this.positionService.moveRobot(id);
                if (!robot) {
                    res.status(404).json({ error: 'Robot not found' });
                    return;
                }
                res.status(200).json(robot);
            }
            catch (error) {
                logger_1.logger.error('Error in moveRobot controller', error);
                res.status(500).json({ error: 'Failed to move robot' });
            }
        };
    }
}
exports.PositionController = PositionController;
//# sourceMappingURL=robot-position.controller.js.map