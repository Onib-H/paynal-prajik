/* eslint-disable @typescript-eslint/no-explicit-any */
export interface NotificationMessage {
    id: string;
    message: string;
    notification_type: string;
    is_read: boolean;
    created_at: string;
    booking_id?: string;
}

type WebSocketEvent =
    | { type: 'initial_count'; count: number }
    | { type: 'unread_update'; count: number }
    | { type: 'new_notification'; notification: NotificationMessage; unread_count: number }
    | { type: 'auth_response'; success: boolean; message?: string }
    | { type: 'active_count'; count: number };

export class WebSocketService {
    private socket: WebSocket | null = null;
    private callbacks: Map<string, (data: any) => void> = new Map();
    private retries = 0;
    private maxRetries = 5;
    private retryDelay = 3000;
    private heartbeatInterval = 25000;
    private heartbeatTimer?: NodeJS.Timeout;
    private currentUserId: string = '';
    private connecting: boolean = false;
    private reconnectTimer?: NodeJS.Timeout;

    constructor(private socketPath: string) {
        this.reconnect = this.reconnect.bind(this);
        this.connect = this.connect.bind(this);
        this.handleConnectionError = this.handleConnectionError.bind(this);
    }

    connect(userId: string) {
        if (!userId) return;
        if (this.socket?.readyState === WebSocket.OPEN) return;
        if (this.connecting) return;

        this.connecting = true;
        this.currentUserId = userId;

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
            const url = `${protocol}//${host}/${this.socketPath}`;

            this.socket = new WebSocket(url);
            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onerror = this.handleConnectionError;

        } catch {
            this.handleConnectionError();
        }
    }

    private handleOpen() {
        this.connecting = false;
        this.retries = 0;
        this.startHeartbeat();
        this.send({ type: 'authenticate', userId: this.currentUserId });
    }

    private handleMessage(event: MessageEvent) {
        try {
            const data: WebSocketEvent = JSON.parse(event.data);
            this.triggerEvent(data.type, data);
        } catch (error) {
            console.error(`WebSocket: Message parsing error: ${error}`);
        }
    }

    private handleClose(event: CloseEvent) {
        this.connecting = false;
        this.stopHeartbeat();
        
        if (!event.wasClean) this.handleConnectionError();
    }

    private handleConnectionError() {
        this.connecting = false;

        if (this.retries < this.maxRetries) {
            const delay = this.retryDelay * Math.pow(2, this.retries);
            
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(this.reconnect, delay);
        } else {
            console.error(`WebSocket: Max reconnection attempts (${this.maxRetries}) reached`);
        }
    }

    private reconnect() {
        this.retries++;
        if (this.retries <= this.maxRetries) {
            this.connect(this.currentUserId);
        }
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) this.send({ type: 'heartbeat' });
            else this.stopHeartbeat();
        }, this.heartbeatInterval);
    }

    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
    }

    on<T extends WebSocketEvent['type']>(
        event: T,
        callback: (data: Extract<WebSocketEvent, { type: T }>) => void
    ) {
        this.callbacks.set(event, callback as any);
    }

    off(event: string) {
        this.callbacks.delete(event);
    }

    private triggerEvent(event: string, data: any) {
        const callback = this.callbacks.get(event);
        if (callback) callback(data);
    }

    send(data: object) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            if (!this.connecting && this.currentUserId) {
                this.connect(this.currentUserId);
            }
        }
    }

    markAsRead() {
        this.send({ type: 'mark_read' });
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.stopHeartbeat();
        this.callbacks.clear();
        this.connecting = false;
        this.retries = 0;
    }

    get isConnected() {
        return this.socket?.readyState === WebSocket.OPEN;
    }
}

export const webSocketService = new WebSocketService('ws/notifications/');
export const webSocketAdminActives = new WebSocketService('ws/admin_dashboard/active-bookings/');