import { Pool, QueryResultRow } from 'pg';
import { config } from './env'; // ← use './env' not '../../config/config'
import { logger } from '../shared/logger';

export const db = new Pool({
  connectionString: config.databaseUrl,
  min: config.dbPoolMin,
  max: config.dbPoolMax,
  // ssl: { rejectUnauthorized: false } // enable if needed for production
});

// Log pool errors
db.on('error', (err) => {
  logger.error('Unexpected database pool error', err);
});

// Generic typed query helper
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const res = await db.query<T>(text, params);
  return res.rows;
}

// Health check
export async function dbHealth(): Promise<boolean> {
  try {
    const result = await db.query('SELECT 1 as ok');
    return result.rows[0].ok === 1;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
}