import { Pool } from "pg";
import { logger } from "../../../shared/logger";
import { IPositionRepository } from "../domain/robot-position.port";
import { Robot, RobotStatus } from "../domain/robot";

export class PositionRepository implements IPositionRepository{
    constructor(private db: Pool) {}
    
    async getAllRobots(): Promise<Robot[]> {
        try {
            const result = await this.db.query<Robot>(
                `SELECT id, name, status, lat, lon, updated_at FROM robots ORDER BY id`
            );
            return result.rows;
        } catch (error) {
            logger.error('[PositionRepository] Error fetching robots from database', error);
            throw error;
        }
    }

    async getRobotById(id: number): Promise<Robot | null> {
        try {
            const result = await this.db.query<Robot>(
                `SELECT id, name, status, lat, lon, updated_at FROM robots WHERE id = $1`,
                [id]
            )
            return result.rows[0] || null;
        } catch (error) {
            logger.error('[PositionRepository] Error get robot by ID', error);
            throw error;
        }
    }

    async updateRobotPosition(id: number, lat: number, lon: number, status?: RobotStatus): Promise<Robot | null> {
        try {
            const result = await this.db.query<Robot>(`
                UPDATE robots
                SET lat = $1, lon = $2, status = $3 
                WHERE id = $4
                RETURNING id, name, status, lat, lon, updated_at`,
            [lat, lon, status, id]);
            
            if (result.rows[0]) {
                logger.debug('[PositionRepository] Robot position updated in database', { robotId: id });
            }

            return result.rows[0] || null;
        } catch (error) {
            logger.error('[PositionRepository] Error updating robot position', error);
            throw error;
        }
    }
}