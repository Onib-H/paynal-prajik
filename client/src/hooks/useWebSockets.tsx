/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react"
import { WebSocketService, WebSocketEvent } from "../services/websockets"

type EventHandler<T extends WebSocketEvent['type']> = (
    data: Extract<WebSocketEvent, { type: T }>
) => void;

type EventHandlers = {
    [K in WebSocketEvent['type']]?: EventHandler<K>;
}

const connectionCounts = new WeakMap<WebSocketService, number>();

/**
 * Custom Hook able to manage WebSocket connections and events.
 * @params
 * - wsService - Instance of WebSocketService to manage the connection.
 * - userId - User ID to connect to the WebSocket.
 * - eventHandlers - Object containing event handlers for different WebSocket events.
 * @returns
 * - send: Function to send messages through the WebSocket.
 * - isConnected: Boolean indicating if the WebSocket is connected.
 */
const useWebSockets = (wsService: WebSocketService, userId: string, eventHandlers: EventHandlers) => {
    useEffect(() => {
        if (!userId) return;

        const count = connectionCounts.get(wsService) || 0;
        connectionCounts.set(wsService, count + 1);

        if (count === 0) {
            wsService.connect(userId);
        }

        (Object.entries(eventHandlers) as Array<[WebSocketEvent['type'], EventHandler<any>]>)
            .forEach(([eventType, handler]) => {
                wsService.on(eventType, handler);
            });

        return () => {
            const newCount = (connectionCounts.get(wsService) || 1) - 1;
            connectionCounts.set(wsService, newCount);

            (Object.keys(eventHandlers) as WebSocketEvent['type'][])
                .forEach(eventType => {
                    wsService.off(eventType);
                });

            if (newCount === 0) {
                wsService.disconnect();
            }
        };
    }, [userId, wsService, eventHandlers]);

    return {
        send: wsService.send.bind(wsService),
        isConnected: wsService.isConnected,
    }
}

export default useWebSockets;