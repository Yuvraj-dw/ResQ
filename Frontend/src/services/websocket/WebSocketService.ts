import type { WebSocketMessage, EmergencyStatus } from '../../types/emergency';

type MessageHandler = (message: WebSocketMessage) => void;
type StatusHandler = (status: 'connected' | 'disconnected' | 'reconnecting') => void;

const RECONNECT_DELAY_MS = 5000;
const PING_INTERVAL_MS = 30000;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string | null = null;
  private token: string | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private shouldReconnect = false;
  private isConnected = false;

  connect(token: string): void {
    this.token = token;
    this.shouldReconnect = true;

    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.emergencyconnect.dev';
    const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
    this.url = `${wsBaseUrl}/ws/volunteer?token=${token}`;

    this.createConnection();
  }

  private createConnection(): void {
    if (!this.url) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.notifyStatus('connected');
      this.startPing();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data as string);
        this.notifyHandlers(message);
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onerror = () => {
      // onclose will handle reconnect
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.stopPing();

      if (this.shouldReconnect) {
        this.notifyStatus('reconnecting');
        setTimeout(() => this.createConnection(), RECONNECT_DELAY_MS);
      } else {
        this.notifyStatus('disconnected');
      }
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.notifyStatus('disconnected');
  }

  sendPing(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => this.sendPing(), PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private notifyHandlers(message: WebSocketMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch {
        // Handler error - remove it
        this.messageHandlers.delete(handler);
      }
    });
  }

  private notifyStatus(status: 'connected' | 'disconnected' | 'reconnecting'): void {
    this.statusHandlers.forEach((handler) => {
      try {
        handler(status);
      } catch {
        this.statusHandlers.delete(handler);
      }
    });
  }

  isConnectedNow(): boolean {
    return this.isConnected;
  }
}

export const wsService = new WebSocketService();
export default WebSocketService;
