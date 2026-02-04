import config from '../config';

class WebSocketService {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.onPositionUpdateCallback = null;
    };

    connect(token) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        const wsUrl = `${config.WS_URL}/ws?token=${token}`;
        console.log('Connecting to WebSocket:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        // Connection opened
        this.ws.onopen = (event) => {
            console.log('WebSocket connected!', event);
            this.reconnectAttempts = 0; 
        };
        
        // Listen for messages
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket message received:', data);
            
                // Handle different message types
                switch (data.type) {
                    case 'connected':
                        console.log('Connection confirmed:', data);
                        break

                    case 'position_update':
                        console.log('Position update:', data);
                        console.log('Update robots:', data.robots);

                        // Call the callback if set
                        if (this.onPositionUpdateCallback) {
                            this.onPositionUpdateCallback(data.robots);
                        }
                        break
                    
                    case 'pong':
                        console.log('Pong received:', data);
                        break;
                    
                    default:
                        console.log('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        // Connection closed
        this.ws.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);

            // Try to reconnect
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                setTimeout(() => this.connect(token), this.reconnectDelay)
            } else {
                console.error('Max reconnection attempts reached');
            }
        };

        // Connection error
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    disconnect() {
        if(this.ws) {
            console.log('Disconnecting WebSocket...');
            this.ws.close();
            this.ws=null;
            this.onPositionUpdateCallback = null;
        }
    }

    onPositionUpdate(callback){
        this.onPositionUpdateCallback = callback;
    }

    // Send ping to keep connection alive
    sendPing() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            const message = { type: 'ping' };
            console.log('Sending ping:', message);
            this.ws.send(JSON.stringify(message));
        }
    }

    // Send custom message
    send(message) {
        if (this.ws?.ready === WebSocket.OPEN) {
            console.log('Sending message:', message);
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    }
}

// Create singleton instance
const wsService = new WebSocketService();

export default wsService;