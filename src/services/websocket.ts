export interface WSMessage {
  type: string;
  content: string;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnect: boolean = true;
  private reconnectDelay = 1000;

  connectWebsocket(onMessage: (data: WSMessage) => void) {
    this.disconnect(1012, "Re-establishing WebSocket connection", true);

    this.socket = new WebSocket("ws://localhost:8000/ws/main");

    this.socket.onopen = () => {
      console.log("WS Connected");
    };

    this.socket.onmessage = (e) => {
      try {
        const msg: WSMessage = JSON.parse(e.data);
        onMessage(msg);
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    this.socket.onerror = (err) => {
      console.error("WS Error:", err);
      this.disconnect(1001, err.type, false);
    };

    this.socket.onclose = (e) => {
      console.log(`WS Closed: ${e.reason}`);
      if (!this.reconnect) {
        return
      }
      console.log("Reconnecting...")
      setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
        this.connectWebsocket(onMessage);
      }, this.reconnectDelay);
    };
  }

  send(message: WSMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("WS not ready, dropping message");
      return;
    }
    this.socket.send(JSON.stringify(message));
  }

  disconnect(code: number, reason: string, reconnect: boolean) {
    if (
      this.socket &&
      this.socket.readyState !== WebSocket.CLOSED &&
      this.socket.readyState !== WebSocket.CLOSING
    ) {
      this.socket.close(code, reason);
    }
    this.reconnect = reconnect
    this.socket = null;
  }
}

export const wsService = new WebSocketService();