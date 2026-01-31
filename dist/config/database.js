"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.query = query;
exports.dbHealth = dbHealth;
const pg_1 = require("pg");
const env_1 = require("./env"); // ← use './env' not '../../config/config'
const logger_1 = require("../shared/logger");
exports.db = new pg_1.Pool({
    connectionString: env_1.config.databaseUrl,
    min: env_1.config.dbPoolMin,
    max: env_1.config.dbPoolMax,
    // ssl: { rejectUnauthorized: false } // enable if needed for production
});
// Log pool errors
exports.db.on('error', (err) => {
    logger_1.logger.error('Unexpected database pool error', err);
});
// Generic typed query helper
async function query(text, params) {
    const res = await exports.db.query(text, params);
    return res.rows;
}
// Health check
async function dbHealth() {
    try {
        const result = await exports.db.query('SELECT 1 as ok');
        return result.rows[0].ok === 1;
    }
    catch (error) {
        logger_1.logger.error('Database health check failed', error);
        return false;
    }
}
//# sourceMappingURL=database.js.map