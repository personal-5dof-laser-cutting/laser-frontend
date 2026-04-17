export interface WSMessage {
  type: string;
  content: string;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectDelay = 1000;

  connectWebsocket(onMessage: (data: WSMessage) => void) {
    if (
      this.socket &&
      this.socket.readyState !== WebSocket.CLOSED &&
      this.socket.readyState !== WebSocket.CLOSING
    )
      return;

    this.socket = new WebSocket("ws://localhost:8000/ws/cut_svg");

    this.socket.onopen = () => {
      console.log("WS Connected");
      this.reconnectDelay = 1000;
    };

    this.socket.onmessage = (e) => {
      try {
        const msg: WSMessage = JSON.parse(e.data);
        onMessage(msg);
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    this.socket.onclose = (e) => {
      console.log(`WS Closed: ${e.reason}. Retrying in ${this.reconnectDelay}ms`);
      setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
        this.connectWebsocket(onMessage);
      }, this.reconnectDelay);
    };

    this.socket.onerror = (err) => {
      console.error("WS Error:", err);
      this.socket?.close();
    };
  }

  send(message: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("WS not ready, dropping message");
      return;
    }
    this.socket.send(message);
  }
}

export const wsService = new WebSocketService();