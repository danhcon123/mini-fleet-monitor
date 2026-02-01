import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { createClient } from 'redis';
import { config } from '../../../config/env';
import { logger } from '../../../shared/logger';
import { AuthHelper } from '../../auth/application/auth-helper.service';

const REDIS_CHANNEL = 'robot:positions';

interface AuthenticatedWebSocket extends WebSocket{
    userId?: number;
    email?: string;
}

export class WebSocketHandler {
    private wss: WebSocketServer;
    private redisSubscreiber;
    private initializePromise: Promise<void>;

    constructor (server: Server) {
        this.wss = new WebSocketServer({
            server,
            path: '/ws'
        });

        this.redisSubscreiber = createClient({ url: config.redisUrl });
        
        // Store the initialization promise
        this.initializePromise = this.initialize();
    }

    /**
     * Wait for initialization to complete
     */
    async waitForInitialization(): Promise<void> {
        await this.initializePromise;
    }

    
    private async initialize(): Promise<void> {
        // Connect Redis subscriber
        await this.redisSubscreiber.connect();
        logger.info('Redis subscriber connected for WebSocket');

        // Subscribe to position updates channel
        await this.redisSubscreiber.subscribe(REDIS_CHANNEL, (message) => {
            this.broadcastToAll(message);
        });

        // Handle WebSocket connections
        this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
            this.handleConnection(ws, req);
        });
        
        logger.info('WebSocket server initialized on path: /ws');
    }

    /**
     * Handle new WebSocket connection
     */
    private handleConnection(ws: AuthenticatedWebSocket, req: any): void {
        logger.info('New WebSocket connection attempt');
        
        // Extract token from query params or headers
        const token = this.extractToken(req);
        
        if (!token) {
            logger.warn('WebSocket connection rejected: No token provided');
            ws.close(1008, 'Authentication required');
            return;
        }

        
        // Verify JWT Token
        const authResult = AuthHelper.verifyAndExtractUser(token)

        if (!authResult.success) {
            logger.warn('WebSocket authentication failed', { error: authResult.error });
            ws.close(1008, authResult.error || 'Invalid token');
            return;
        }

        ws.userId = authResult.userId;
        ws.email = authResult.email;

        logger.info('Websocket authenticated', { userId: ws.userId, email: ws.email});

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            messages: 'WebSocket connection established',
            userId: ws.userId,
            timestamp: new Date().toISOString(),
        }));

        // Handle messages from client
        ws.on('message', (data) => {
            this.handleMessage(ws, data);
        })

        // Handle disconnection
        ws.on('close', () => {
            logger.info('WebSocket disconnected', { userId: ws.userId });
        });

        // Handle errors
        ws.on('error', (error) => {
            logger.error('WebSocket error', { userId: ws.userId, error });
        });
    }

    /**
     * Extract JWT token from request
     */
    private extractToken(req: any): string | null {
        // Query params: ws://localhost:8080/ws?token=...
        const url =  new URL(req.url, `http://${req.headers.host}`);
        const tokenFromQuery = url.searchParams.get('token');

        if (tokenFromQuery) {
            return tokenFromQuery;
        }
        
        // Try Authorization header: Bearer <token>
        return AuthHelper.extractBearerToken(req.headers.authorization)
    }

    /**
     * Send message through WebSocket
     */
    private handleMessage(ws: AuthenticatedWebSocket, data: any): void {
        try {
            const message = JSON.parse(data.toString());
            logger.debug('Received WebSocket message', { userId: ws.userId, type: message.type })

            if (message.type === 'ping') {
                ws.send(JSON.stringify({
                    type: 'pong',
                    timestamp: new Date().toISOString()
                }));
            }
        } catch (error) {
            logger.error('Error handling WebSocket message', error);
        }
    }

    private broadcastToAll(message: string): void {
        let sentCount = 0;

        this.wss.clients.forEach((client: WebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
                sentCount++;
            }
        });

        if (sentCount > 0) {
            logger.debug('Broadcasted to WebSocket clients', { count: sentCount })
        }
    }
    
    /**
     * Get number of connected client
     */
    getConnectedClients(): number{
        return this.wss.clients.size;
    }

    /**
     * Close WebSocket server
     */
    async close(): Promise<void> {
        await this.redisSubscreiber.quit();
        this.wss.close();
        logger.info('WebSocket server close');
    }
}