import { useEffect, useRef } from "react";
import { WebSocketEvent, WebSocketService } from "../services/websockets";

type EventHandler<T extends WebSocketEvent['type']> = (
    data: Extract<WebSocketEvent, { type: T }>
) => void;

type EventHandlers = {
    [K in WebSocketEvent['type']]?: EventHandler<K>;
}

const connectionCounts = new WeakMap<WebSocketService, number>();

/**
 * Custom Hook to manage WebSocket connections and events.
 * @params
 * - `wsService` - Instance of WebSocketService to manage the connection.
 * - `userId` - User ID to connect to the WebSocket.
 * - `eventHandlers` - Object containing event handlers for different WebSocket events.
 * @returns
 * - `send` - Function to send messages through the WebSocket.
 * - `isConnected` - Boolean indicating if the WebSocket is connected.
 */
const useWebSockets = (wsService: WebSocketService, userId: string | undefined, eventHandlers: EventHandlers) => {
    const userIdRef = useRef<string | undefined>(userId);
    const serviceNameRef = useRef<string>(wsService.socketPath);

    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    useEffect(() => {
        const serviceName = serviceNameRef.current;
        console.log(`[WebSocket:${serviceName}] Initializing for user: ${userId || 'unknown'}`);
        
        const count = connectionCounts.get(wsService) || 0;
        connectionCounts.set(wsService, count + 1);
        console.log(`[WebSocket:${serviceName}] Connection count: ${count + 1}`);

        if (count === 0) {
            console.log(`[WebSocket:${serviceName}] First instance, connecting for user: ${userId}`);
            wsService.connect(userId);
        } else {
            if (wsService.isConnected && wsService.getCurrentUserId() !== userId) {
                console.log(`[WebSocket:${serviceName}] User ID changed from ${wsService.getCurrentUserId()} to ${userId}, reconnecting`);
                wsService.disconnect();
                wsService.connect(userId);
            } else {
                console.log(`[WebSocket:${serviceName}] Using existing connection for user: ${wsService.getCurrentUserId()}`);
            }
        }

        console.log(`[WebSocket:${serviceName}] Registering event handlers:`, Object.keys(eventHandlers));
        (Object.entries(eventHandlers) as Array<[WebSocketEvent['type'], EventHandler<WebSocketEvent['type']>]>)
            .forEach(([eventType, handler]) => {
                console.log(`[WebSocket:${serviceName}] Registering handler for event: ${eventType}`);
                wsService.on(eventType, (data) => {
                    console.log(`[WebSocket:${serviceName}] Received event: ${eventType}`, data);
                    handler(data);
                });
            });

        const connectionCheck = setInterval(() => {
            if (userIdRef.current && !wsService.isConnected) {
                console.log(`[WebSocket:${serviceName}] Connection check failed, reconnecting for user: ${userIdRef.current}`);
                wsService.connect(userIdRef.current);
            }
        }, 5000);

        return () => {
            console.log(`[WebSocket:${serviceName}] Cleaning up WebSocket hook`);
            clearInterval(connectionCheck);

            const newCount = (connectionCounts.get(wsService) || 1) - 1;
            connectionCounts.set(wsService, newCount);
            console.log(`[WebSocket:${serviceName}] Connection count after cleanup: ${newCount}`);

            console.log(`[WebSocket:${serviceName}] Removing event handlers:`, Object.keys(eventHandlers));
            (Object.keys(eventHandlers) as WebSocketEvent['type'][])
                .forEach(eventType => {
                    console.log(`[WebSocket:${serviceName}] Removing handler for event: ${eventType}`);
                    wsService.off(eventType);
                });

            if (newCount === 0) {
                console.log(`[WebSocket:${serviceName}] Last instance, disconnecting`);
                wsService.disconnect();
            }
        };
    }, [wsService, eventHandlers, userId]);

    return {
        send: (data: object) => {
            console.log(`[WebSocket:${serviceNameRef.current}] Sending message:`, data);
            return wsService.send(data);
        },
        isConnected: wsService.isConnected,
    }
}

export default useWebSockets;