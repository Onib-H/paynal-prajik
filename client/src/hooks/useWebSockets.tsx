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
    
    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    useEffect(() => {
        const count = connectionCounts.get(wsService) || 0;
        connectionCounts.set(wsService, count + 1);

        if (count === 0) wsService.connect(userId);
        else {
            if (wsService.isConnected && wsService.getCurrentUserId() !== userId) {
                wsService.disconnect();
                wsService.connect(userId);
            }
        }

        (Object.entries(eventHandlers) as Array<[WebSocketEvent['type'], EventHandler<WebSocketEvent['type']>]>)
            .forEach(([eventType, handler]) => {
                wsService.on(eventType, (data) => {
                    handler(data);
                });
            });

        return () => {

            const newCount = (connectionCounts.get(wsService) || 1) - 1;
            connectionCounts.set(wsService, newCount);

            (Object.keys(eventHandlers) as WebSocketEvent['type'][])
                .forEach(eventType => {
                    wsService.off(eventType);
                });

            if (newCount === 0) wsService.disconnect();
        };
    }, [wsService, eventHandlers, userId]);

    return {
        send: (data: object) => { return wsService.send(data) },
        isConnected: wsService.isConnected,
    }
}

export default useWebSockets;