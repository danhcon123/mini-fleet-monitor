import { logger } from "../../../shared/logger";
import { Robot, LEIPZIG_BOUNDS } from "../domain/robot";
import { IPositionRepository } from "../domain/robot-position.port";
import { RedisCacheService } from "./redis-cache.service";

export class PositionService{
    constructor(
        private positionRepository: IPositionRepository,
        private cacheService: RedisCacheService
    ) {}
    
    /**
     * Get all robots with caching
     */
    async getAllRobots(): Promise<Robot[]> {
        const cached =  await this.cacheService.getCachedRobots();
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
    async getRobotById(id: number): Promise<Robot | null> {
        return this.positionRepository.getRobotById(id);
    }

    /**
     * Move robot to new random position within Leipzig bounds
     */
    async moveRobot(id: number): Promise<Robot | null> {
        // Get current robot position
        const robot = await this.positionRepository.getRobotById(id);
        
        if (!robot) {
            logger.warn('[PositionService] Robot not found for move operation', { robotId: id });
            return null;
        }

        // Generate new position
        const newPosition = this.generateNewPosition(robot.lat, robot.lon);

        // Update position in database
        const updatedRobot = await this.positionRepository.updateRobotPosition(
            id,
            newPosition.lat,
            newPosition.lon,
            'moving'
        );
        
        // Invalidate cache
        await this.cacheService.invalidateCache();
        
        return updatedRobot;
    }

    /**
     * Generate new position within Leipzig bounds
     */
    private generateNewPosition(
        currentLat: number, 
        currentLon: number)
    : { lat: number, lon: number} {
        // move 100-300 meters per update
        const deltaLat = (Math.random() - 0.5) * 0.003; // ±~165m
        const deltaLon = (Math.random() - 0.5) * 0.005; // ±~165m

        let newLat = currentLat + deltaLat;
        let newLon = currentLon + deltaLon;

        // Keep within Leipzig bounds
        newLat = Math.max(LEIPZIG_BOUNDS.minLat, Math.min(LEIPZIG_BOUNDS.maxLat, newLat));
        newLon = Math.max(LEIPZIG_BOUNDS.minLon, Math.min(LEIPZIG_BOUNDS.maxLon, newLon));

        return { lat: newLat, lon: newLon };
    }
}