import { logger } from "../../../shared/logger";
import { PositionService } from "./robot-position.service";

const SIMULATION_INTERVAL = 2000;

export class SimulationService {
    // Stores the timer handle to prevent double-start and allow stop()
    private intervalId: NodeJS.Timeout | null = null;

    constructor(private positionService: PositionService) {}
    
    /**
     * Start the simulation timer
     */
    async start(): Promise<void>{
        
        // Avoid multiple intervals
        if (this.intervalId) {
            logger.warn('Simulation is already running');
            return;
        }

        logger.info('Starting robot position simulation (every 2 seconds)');

        // Schedule recurring ticks to move robot
        this.intervalId = setInterval(async () => {
            await this.tick();
        }, SIMULATION_INTERVAL);

        // Run immediately on start
        await this.tick();
    }

    /**
     * Stop the simulation timer
     */
    stop(): void{
        if (this.intervalId) {
            // Clear interval and reset state
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info('Simulation stopped');
        }
    }

    /**
     * Simulation tick - move all robots
     */
    private async tick(): Promise<void> {
        try {
            // Get all robots
            const robots = await this.positionService.getAllRobots();
            
            // Move each robot using the existing moveRobot method
            const movePromises = robots.map(robot => 
                this.positionService.moveRobot(robot.id)
            );
            
            // Wait for all moves to compleste before finshsing the tick
            await Promise.all(movePromises)

            logger.debug('Simulation tick completed', { robotsUpdated: robots.length });
        } catch (error) {
            logger.error('Error in simulation tick', error)
        }
    }
}