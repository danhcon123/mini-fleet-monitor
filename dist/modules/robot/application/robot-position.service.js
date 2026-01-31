"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionService = void 0;
const logger_1 = require("../../../shared/logger");
const robot_1 = require("../domain/robot");
class PositionService {
    constructor(positionRepository, cacheService) {
        this.positionRepository = positionRepository;
        this.cacheService = cacheService;
    }
    /**
     * Get all robots with caching
     */
    async getAllRobots() {
        const cached = await this.cacheService.getCachedRobots();
        if (cached) {
            return cached;
        }
        // Cache miss - query database
        const robots = await this.positionRepository.getAllRobots();
        // Update cache
        await this.cacheService.setCachedRobot(robots);
        return robots;
    }
    /**
     * Get single robot by ID
     */
    async getRobotById(id) {
        return this.positionRepository.getRobotById(id);
    }
    /**
     * Move robot to new random position within Leipzig bounds
     */
    async moveRobot(id) {
        // Get current robot position
        const robot = await this.positionRepository.getRobotById(id);
        if (!robot) {
            logger_1.logger.warn('[PositionService] Robot not found for move operation', { robotId: id });
            return null;
        }
        // Generate new position
        const newPosition = this.generateNewPosition(robot.lat, robot.lon);
        // Update position in database
        const updatedRobot = await this.positionRepository.updateRobotPosition(id, newPosition.lat, newPosition.lon, 'moving');
        // Invalidate cache
        await this.cacheService.invalidateCache();
        return updatedRobot;
    }
    /**
     * Generate new position within Leipzig bounds
     */
    generateNewPosition(currentLat, currentLon) {
        // move 100-300 meters per update
        const deltaLat = (Math.random() - 0.5) * 0.003; // ±~165m
        const deltaLon = (Math.random() - 0.5) * 0.005; // ±~165m
        let newLat = currentLat + deltaLat;
        let newLon = currentLon + deltaLon;
        // Keep within Leipzig bounds
        newLat = Math.max(robot_1.LEIPZIG_BOUNDS.minLat, Math.min(robot_1.LEIPZIG_BOUNDS.maxLat, newLat));
        newLon = Math.max(robot_1.LEIPZIG_BOUNDS.minLon, Math.min(robot_1.LEIPZIG_BOUNDS.maxLon, newLon));
        return { lat: newLat, lon: newLon };
    }
}
exports.PositionService = PositionService;
//# sourceMappingURL=robot-position.service.js.map