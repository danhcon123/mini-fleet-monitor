import { logger } from "../../../shared/logger";
import { Robot, LEIPZIG_BOUNDS } from '../domain/robot';
import { IPositionRepository } from "../domain/robot-position.port";
import { RedisCacheService } from "./redis-cache.service";
import { redisClient } from "../../../config/redis";

const REDIS_CHANNEL = 'robot:positions';

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

        // Dont start a new move if already moving
        if (robot.status === 'moving') return robot;

        // Generate new destination ~5 km away in a random direction
        const angle = Math.random() * 2 * Math.PI; // random direction
        const distanceKm = 3 + Math.random() * 2; // 1-3km
        const destLat = robot.lat + (distanceKm / 111) * Math.cos(angle); // 1° lat ≈ 111km
        const destLon = robot.lon + (distanceKm / (111 * Math.cos(robot.lat * Math.PI / 180))) * Math.sin(angle);

        // Clamp to Leipzig bounds
        const finalLat = Math.max(LEIPZIG_BOUNDS.minLat, Math.min(LEIPZIG_BOUNDS.maxLat, destLat));
        const finalLon = Math.max(LEIPZIG_BOUNDS.minLon, Math.min(LEIPZIG_BOUNDS.maxLon, destLon));
        
        const STEPS = 10;
        const STEP_DELAY_MS = 200;

        // Animate in steps
        for (let i=1; i<= STEPS; i++) {
            const progress = i / STEPS;
            const lat = robot.lat + (finalLat - robot.lat) * progress;
            const lon = robot.lon + (finalLon - robot.lon) * progress;
            const status = i === STEPS ? 'idle' : 'moving'; // idle on last step

            const updated = await this.positionRepository.updateRobotPosition(id, lat, lon, status);

            if (updated)
            {
                await this.cacheService.invalidateCache();
                await this.publishPositionUpdate(updated); // streams to frontend via WebSocket
            }

            // Wait between steps (except the last one)
            if (i < STEPS) {
                await new Promise(resolve => setTimeout(resolve, STEP_DELAY_MS));
            }
        }

        return this.positionRepository.getRobotById(id);
        /*
        const newPosition = this.generateNewPosition(robot.lat, robot.lon);

        // Update position in database
        const updatedRobot = await this.positionRepository.updateRobotPosition(
            id,
            newPosition.lat,
            newPosition.lon,
            'moving'
        );
        
        if (updatedRobot) {
            // Invalidate cache
            await this.cacheService.invalidateCache();

            // Publish to WebSocket via Redis Pub/Sub
            await this.publishPositionUpdate(updatedRobot);
        }
        return updatedRobot;*/
    }

    /**
     * Generate new position within Leipzig bounds
     */
    private generateNewPosition(
        currentLat: number, 
        currentLon: number)
    : { lat: number, lon: number} {
        // move 100-300 meters per update
        const deltaLat = (Math.random() - 0.5) * 0.003; // ±165m
        const deltaLon = (Math.random() - 0.5) * 0.005; // ±165m

        let newLat = currentLat + deltaLat;
        let newLon = currentLon + deltaLon;

        // Keep within Leipzig bounds
        newLat = Math.max(LEIPZIG_BOUNDS.minLat, Math.min(LEIPZIG_BOUNDS.maxLat, newLat));
        newLon = Math.max(LEIPZIG_BOUNDS.minLon, Math.min(LEIPZIG_BOUNDS.maxLon, newLon));

        return { lat: newLat, lon: newLon };
    }

    /**
     * Publish position update to Redis Pub/Sub for WebSocket broadcasting
     */
    private async publishPositionUpdate(robot: Robot): Promise<void> {
        try {
            const message = JSON.stringify({
                type: 'position_update',
                timestamp: new Date().toISOString(),
                robots: [{
                    id: robot.id,
                    name: robot.name,
                    status: robot.status,
                    lat: robot.lat,
                    lon: robot.lon,
                    updated_at: robot.updated_at,
                }],
            });
            
            await redisClient.publish(REDIS_CHANNEL, message);
            logger.debug('[PositionService] Published position update to Redis', { robotId: robot.id })
        } catch (error) {
            logger.error('[PositionService] Error publishing to Redis', error)
        }
    }
}