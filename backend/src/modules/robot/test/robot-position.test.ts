import request from 'supertest';
import { Pool } from 'pg';
import { createApp } from '../../../app';
import { TokenService } from '../../auth/application/token.service';
import { connectRedis, redisClient } from '../../../config/redis';
import { db } from '../../../config/database';
import { LEIPZIG_BOUNDS } from '../domain/robot';


const app = createApp(db);

// Generate a valid JWT for authenticated requests
const validToken = TokenService.generateToken(1, 'test@test.com');

beforeAll(async () => {
    await connectRedis();

    // Seed test data: ensure at least one robot exists
    await db.query(`
        CREATE TABLE IF NOT EXISTS robots (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            status VARCHAR(20) DEFAULT 'idle',
            lat DOUBLE PRECISION NOT NULL,
            lon DOUBLE PRECISION NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `);

    // Insert a test robot if table is empty
    const existing = await db.query('SELECT COUNT(*) as count FROM robots');
    if (parseInt(existing.rows[0].count) === 0) {
        await db.query(
            `INSERT INTO robots (name, status, lat, lon) VALUES ($1, $2, $3, $4)`,
            ['TestBot-1', 'idle', 51.340, 12.380]
        );
    }
});

afterAll(async () => {
    await redisClient.quit();
    await db.end();
});

describe('GET /api/robots', () => {
    it('should return 401 without auth token', async () => {
        const res = await request(app).get('/api/robots');
        expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
        const res = await request(app)
            .get('/api/robots')
            .set('Authorization', 'Bearer invalid-token');
        expect(res.status).toBe(401);
    });

    it('should return 200 with array of robots', async () => {
        const res = await request(app)
            .get('/api/robots')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);

        // Check robot shape
        const robot = res.body[0];
        expect(robot).toHaveProperty('id');
        expect(robot).toHaveProperty('name');
        expect(robot).toHaveProperty('status');
        expect(robot).toHaveProperty('lat');
        expect(robot).toHaveProperty('lon');
        expect(robot).toHaveProperty('updated_at');
    });
});

describe('GET /api/robots/:id', () => {
    it('should return 400 for non-numeric id', async () => {
        const res = await request(app)
            .get('/api/robots/abc')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid robot ID');
    });

    it('should return 404 for non-existent robot', async () => {
        const res = await request(app)
            .get('/api/robots/99999')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Robot not found');
    });

    it('should return 200 with robot data for valid id', async () => {
        // Get a real robot id first
        const listRes = await request(app)
            .get('/api/robots')
            .set('Authorization', `Bearer ${validToken}`);
        const robotId = listRes.body[0].id;

        const res = await request(app)
            .get(`/api/robots/${robotId}`)
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(robotId);
        expect(res.body).toHaveProperty('name');
        expect(res.body).toHaveProperty('lat');
        expect(res.body).toHaveProperty('lon');
    });
});

describe('POST /api/robots/:id/move', () => {
    it('should return 400 for non-numeric id', async () => {
        const res = await request(app)
            .post('/api/robots/abc/move')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(400);
    });

    it('should return 200 and move robot to new position', async () => {
        // Get a real robot id
        const listRes = await request(app)
            .get('/api/robots')
            .set('Authorization', `Bearer ${validToken}`);
        const robot = listRes.body[0];

        const res = await request(app)
            .post(`/api/robots/${robot.id}/move`)
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(robot.id);
        expect(res.body.status).toBe('moving');

        // Verify new position is within Leipzig bounds
        expect(res.body.lat).toBeGreaterThanOrEqual(LEIPZIG_BOUNDS.minLat);
        expect(res.body.lat).toBeLessThanOrEqual(LEIPZIG_BOUNDS.maxLat);
        expect(res.body.lon).toBeGreaterThanOrEqual(LEIPZIG_BOUNDS.minLon);
        expect(res.body.lon).toBeLessThanOrEqual(LEIPZIG_BOUNDS.maxLon);
    });

    it('should return 404 for non-existent robot', async () => {
        const res = await request(app)
            .post('/api/robots/99999/move')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(404);
    });
});

describe('Cache invalidation', () => {
    it('should return fresh data after move invalidates cache', async () => {
        // 1. GET /robots → populates cache
        const firstList = await request(app)
            .get('/api/robots')
            .set('Authorization', `Bearer ${validToken}`);
        expect(firstList.status).toBe(200);
        const robot = firstList.body[0];

        // 2. GET /robots again → served from cache, same data
        const cachedList = await request(app)
            .get('/api/robots')
            .set('Authorization', `Bearer ${validToken}`);
        expect(cachedList.status).toBe(200);
        const cachedRobot = cachedList.body.find((r: any) => r.id === robot.id);
        expect(cachedRobot.lat).toBe(robot.lat);
        expect(cachedRobot.lon).toBe(robot.lon);

        // 3. POST /robots/:id/move → invalidates cache
        const moveRes = await request(app)
            .post(`/api/robots/${robot.id}/move`)
            .set('Authorization', `Bearer ${validToken}`);
        expect(moveRes.status).toBe(200);

        // 4. GET /robots → should reflect the new position from DB, not stale cache
        const freshList = await request(app)
            .get('/api/robots')
            .set('Authorization', `Bearer ${validToken}`);
        expect(freshList.status).toBe(200);
        const movedRobot = freshList.body.find((r: any) => r.id === robot.id);
        expect(movedRobot.lat).toBe(moveRes.body.lat);
        expect(movedRobot.lon).toBe(moveRes.body.lon);
    });
});
