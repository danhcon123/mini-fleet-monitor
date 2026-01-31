"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionRepository = void 0;
const logger_1 = require("../../../shared/logger");
class PositionRepository {
    constructor(db) {
        this.db = db;
    }
    async getAllRobots() {
        try {
            const result = await this.db.query(`SELECT id, name, status, lat, lon, updated_at FROM robots ORDER BY id`);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('[PositionRepository] Error fetching robots from database', error);
            throw error;
        }
    }
    async getRobotById(id) {
        try {
            const result = await this.db.query(`SELECT id, name, status, lat, lon, updated_at FROM robots WHERE id = $1`, [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('[PositionRepository] Error get robot by ID', error);
            throw error;
        }
    }
    async updateRobotPosition(id, lat, lon, status) {
        try {
            const result = await this.db.query(`
                UPDATE robots
                SET lat = $1, lon = $2, status = $3 
                WHERE id = $4
                RETURNING id, name, status, lat, lon, updated_at`, [lat, lon, status, id]);
            if (result.rows[0]) {
                logger_1.logger.debug('[PositionRepository] Robot position updated in database', { robotId: id });
            }
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.logger.error('[PositionRepository] Error updating robot position', error);
            throw error;
        }
    }
}
exports.PositionRepository = PositionRepository;
//# sourceMappingURL=robot-position.repo.js.map