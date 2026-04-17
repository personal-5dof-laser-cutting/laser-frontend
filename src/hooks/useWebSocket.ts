import { useEffect, useCallback, useRef } from "react";
import { WSMessage, wsService } from "@/services/websocket";

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
    const onMessageRef = useRef(onMessage);
    useEffect(() => {
        onMessageRef.current = onMessage;
    });

    useEffect(() => {
        wsService.connectWebsocket((msg) => onMessageRef.current(msg));
    }, [])

    const send = useCallback((data: string) => {
        wsService.send(data);
    }, []);

    return { send }
}