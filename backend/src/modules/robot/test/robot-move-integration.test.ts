import request from 'supertest';
import http from 'http';
import WebSocket from 'ws';
import { createApp } from '../../../app';
import { TokenService } from '../../auth/application/token.service';
import { connectRedis, redisClient } from '../../../config/redis';
import { db } from '../../../config/database';
import { WebSocketHandler } from '../api/websocketHandler';
import { LEIPZIG_BOUNDS } from '../domain/robot';


// -- Setup --

const app = createApp(db);

// Create a real HTTP server so WebSocket can attach to it
const server = http.createServer(app);

// Generate a valid JWT for test requests
const validToken = TokenService.generateToken(1, 'test@test.com');

let wsHandler: WebSocketHandler;
let serverPort: number;

beforeAll(async() => {
    // Connect Redis (needed for cache + pub/sub)
    await connectRedis();

    // Ensure robots table exists with a test robot set to 'idle'
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

    // Insert a dedicated test robot, always idle, at a known position
    await db.query(
        `INSERT INTO robots (name, status, lat, lon)
           VALUES ('MoveTest-Bot', 'idle', 51.340, 12.380)
           ON CONFLICT DO NOTHING`
    );
     // Start WebSocket handler on the HTTP server (same as server.ts does)
      wsHandler = new WebSocketHandler(server);
      await wsHandler.waitForInitialization();

      // Start the HTTP server on a random available port
      await new Promise<void>((resolve) => {
          server.listen(0, () => {
              serverPort = (server.address() as any).port;
              resolve();
          });
      });
  });

  afterAll(async () => {
      // Clean up: close WebSocket, Redis, DB, and HTTP server
      await wsHandler.close();
      await redisClient.quit();
      await db.end();
      server.close();
  });

  // --- Helper: connect a WebSocket client and collect messages ---

  function connectTestWebSocket(): Promise<{
      ws: WebSocket;
      messages: any[];
      close: () => void;
  }> {
      return new Promise((resolve, reject) => {
          const messages: any[] = [];

          // Connect with the same auth pattern the frontend uses
          const ws = new WebSocket(
              `ws://localhost:${serverPort}/ws?token=${validToken}`
          );

          ws.on('open', () => {
              // Wait for the 'connected' welcome message before resolving
              // so we know the connection is fully established
          });

          ws.on('message', (data) => {
              const parsed = JSON.parse(data.toString());
              messages.push(parsed);

              // Resolve after receiving the welcome message
              if (parsed.type === 'connected') {
                  resolve({
                      ws,
                      messages,
                      close: () => ws.close(),
                  });
              }
          });

          ws.on('error', reject);

          // Timeout if connection takes too long
          setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
      });
  }

  // --- Tests ---

  describe('POST /api/robots/:id/move (new behavior)', () => {

      it('should set robot to moving, stream position updates via WebSocket, and end as idle', async () => {
          // 1. Get a robot that is currently idle
          const listRes = await request(app)
              .get('/api/robots')
              .set('Authorization', `Bearer ${validToken}`);
          expect(listRes.status).toBe(200);

          const robot = listRes.body.find((r: any) => r.status === 'idle');
          expect(robot).toBeDefined(); // we need at least one idle robot

          const originalLat = robot.lat;
          const originalLon = robot.lon;

          // 2. Connect a WebSocket client BEFORE triggering the move
          //    so we can capture all position_update messages
          const { messages, close: closeWs } = await connectTestWebSocket();

          // 3. Trigger the move via the API
          const moveRes = await request(app)
              .post(`/api/robots/${robot.id}/move`)
              .set('Authorization', `Bearer ${validToken}`);

          expect(moveRes.status).toBe(200);

          // 4. The response should be the robot in its final state (idle, at new position)
          expect(moveRes.body.id).toBe(robot.id);
          expect(moveRes.body.status).toBe('idle'); // should be idle after finishing

          // 5. Final position should be different from the original (~5km away)
          const finalLat = moveRes.body.lat;
          const finalLon = moveRes.body.lon;
          expect(finalLat).not.toBe(originalLat);
          expect(finalLon).not.toBe(originalLon);

          // 6. Final position should still be within Leipzig bounds
          expect(finalLat).toBeGreaterThanOrEqual(LEIPZIG_BOUNDS.minLat);
          expect(finalLat).toBeLessThanOrEqual(LEIPZIG_BOUNDS.maxLat);
          expect(finalLon).toBeGreaterThanOrEqual(LEIPZIG_BOUNDS.minLon);
          expect(finalLon).toBeLessThanOrEqual(LEIPZIG_BOUNDS.maxLon);

          // 7. Calculate actual distance moved (Haversine approximation)
          const dLat = finalLat - originalLat;
          const dLon = finalLon - originalLon;
          const distanceKm = Math.sqrt(
              (dLat * 111) ** 2 +
              (dLon * 111 * Math.cos(originalLat * Math.PI / 180)) ** 2
          );
          // Should be roughly 3-7km (allow some tolerance for clamping to bounds)
          expect(distanceKm).toBeGreaterThan(1);
          expect(distanceKm).toBeLessThan(10);

          // 8. Wait a moment for any remaining WebSocket messages to arrive
          await new Promise((r) => setTimeout(r, 1000));

          // 9. Check WebSocket received position_update messages
          const positionUpdates = messages.filter((m) => m.type === 'position_update');
          expect(positionUpdates.length).toBeGreaterThan(0);

          // 10. All intermediate updates should have status 'moving' (except the last one)
          const movingUpdates = positionUpdates.filter(
              (m) => m.robots[0].id === robot.id && m.robots[0].status === 'moving'
          );
          expect(movingUpdates.length).toBeGreaterThan(0); // at least some 'moving' steps

          // 11. The last update for this robot should be 'idle'
          const robotUpdates = positionUpdates
              .filter((m) => m.robots[0].id === robot.id);
          const lastUpdate = robotUpdates[robotUpdates.length - 1];
          expect(lastUpdate.robots[0].status).toBe('idle');

          // 12. Verify the DB also reflects idle status
          const dbCheck = await request(app)
              .get(`/api/robots/${robot.id}`)
              .set('Authorization', `Bearer ${validToken}`);
          expect(dbCheck.body.status).toBe('idle');

          closeWs();
      }, 30000); // 30s timeout since the move takes ~10s (20 steps × 500ms)

      it('should reject move if robot is already moving', async () => {
          // Get a robot and manually set it to 'moving' in the DB
          const listRes = await request(app)
              .get('/api/robots')
              .set('Authorization', `Bearer ${validToken}`);
          const robot = listRes.body[0];

          await db.query(
              `UPDATE robots SET status = 'moving' WHERE id = $1`,
              [robot.id]
          );

          // Try to move it — should return the robot without starting a new move
          const moveRes = await request(app)
              .post(`/api/robots/${robot.id}/move`)
              .set('Authorization', `Bearer ${validToken}`);

          expect(moveRes.status).toBe(200);
          expect(moveRes.body.status).toBe('moving'); // still moving, didn't restart

          // Reset robot back to idle for other tests
          await db.query(
              `UPDATE robots SET status = 'idle' WHERE id = $1`,
              [robot.id]
          );
      });

    it('should return 404 for non-existent robot', async () => {
        const res = await request(app)
              .post('/api/robots/99999/move')
              .set('Authorization', `Bearer ${validToken}`);

          expect(res.status).toBe(404);
        });

        it('should allow multiple robots to move at the same time', async () => {
        // 1. Get all robots and make sure at least 2 are idle
        const listRes = await request(app)
            .get('/api/robots')
            .set('Authorization', `Bearer ${validToken}`);
        expect(listRes.status).toBe(200);

        // Reset all robots to idle so we have clean state
        const allRobots = listRes.body;
        for (const r of allRobots) {
            await db.query(`UPDATE robots SET status = 'idle' WHERE id = $1`, [r.id]);
        }

        // Pick two robots
        const robot1 = allRobots[0];
        const robot2 = allRobots[1];
        expect(robot1).toBeDefined();
        expect(robot2).toBeDefined();

        // 2. Connect WebSocket to capture updates for both robots
        const { messages, close: closeWs } = await connectTestWebSocket();

        // 3. Trigger both moves at the same time (don't await sequentially)
        const [moveRes1, moveRes2] = await Promise.all([
            request(app)
                .post(`/api/robots/${robot1.id}/move`)
                .set('Authorization', `Bearer ${validToken}`),
            request(app)
                .post(`/api/robots/${robot2.id}/move`)
                .set('Authorization', `Bearer ${validToken}`),
        ]);

        // 4. Both should succeed
        expect(moveRes1.status).toBe(200);
        expect(moveRes2.status).toBe(200);

        // 5. Both should end as idle
        expect(moveRes1.body.status).toBe('idle');
        expect(moveRes2.body.status).toBe('idle');

        // 6. Both should have moved from their original positions
        expect(moveRes1.body.lat).not.toBe(robot1.lat);
        expect(moveRes2.body.lat).not.toBe(robot2.lat);

        // 7. Wait for remaining WebSocket messages
        await new Promise((r) => setTimeout(r, 1000));

        // 8. WebSocket should have received updates for BOTH robots
        const updatesForRobot1 = messages.filter(
            (m) => m.type === 'position_update' && m.robots[0].id === robot1.id
        );
        const updatesForRobot2 = messages.filter(
            (m) => m.type === 'position_update' && m.robots[0].id === robot2.id
        );

        expect(updatesForRobot1.length).toBeGreaterThan(0);
        expect(updatesForRobot2.length).toBeGreaterThan(0);

        // 9. Verify both ended as idle in the DB
        const [dbCheck1, dbCheck2] = await Promise.all([
            request(app)
                .get(`/api/robots/${robot1.id}`)
                .set('Authorization', `Bearer ${validToken}`),
            request(app)
                .get(`/api/robots/${robot2.id}`)
                .set('Authorization', `Bearer ${validToken}`),
        ]);

        expect(dbCheck1.body.status).toBe('idle');
        expect(dbCheck2.body.status).toBe('idle');

        closeWs();
    }, 30000);
});
