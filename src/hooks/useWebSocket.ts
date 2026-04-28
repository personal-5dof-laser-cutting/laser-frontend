import { useEffect, useCallback, useRef } from "react";
import { WSMessage, wsService } from "@/services/websocket";

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    useEffect(() => {
        wsService.connectWebsocket((msg) => onMessageRef.current(msg));
        return () => wsService.disconnect(1000, "Connection shut down", false)
    }, []);

    const send = useCallback((data: WSMessage) => {
        wsService.send(data);
    }, []);

    return { send }
}