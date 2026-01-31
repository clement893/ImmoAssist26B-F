/**
 * Notification WebSocket Client
 *
 * Manages WebSocket connection for real-time notifications.
 * Handles connection, reconnection, and message routing.
 */

import { logger } from '@/lib/logger';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { getApiUrl } from '@/lib/api';
import type { Notification } from '@/types/notification';

export type NotificationMessage = {
  type: 'notification';
  data: Notification;
};

export type WebSocketMessage =
  | { type: 'connected'; message: string; user_id: string | null }
  | { type: 'pong' }
  | { type: 'subscribed'; notification_types: string[] }
  | { type: 'error'; message: string }
  | NotificationMessage;

export interface NotificationSocketCallbacks {
  onNotification?: (notification: Notification) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

class NotificationSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private callbacks: NotificationSocketCallbacks = {};
  private isConnecting = false;
  private shouldReconnect = true;

  constructor() {
    // Convert HTTP URL to WebSocket URL
    const apiUrl = getApiUrl();
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.url = `${wsProtocol}://${wsHost}/api/v1/ws/notifications`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(callbacks: NotificationSocketCallbacks = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.debug('[WebSocket] Already connected');
      return;
    }

    if (this.isConnecting) {
      logger.debug('[WebSocket] Connection already in progress');
      return;
    }

    this.callbacks = callbacks;
    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      // Get authentication token
      const token = TokenStorage.getToken();
      const wsUrl = token ? `${this.url}?token=${encodeURIComponent(token)}` : this.url;

      logger.debug('[WebSocket] Connecting to', wsUrl.replace(token || '', '[TOKEN]'));

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        logger.info('[WebSocket] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startPingInterval();
        this.callbacks.onConnected?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error: unknown) {
          logger.error('[WebSocket] Failed to parse message', error);
        }
      };

      this.ws.onerror = (error) => {
        logger.error('[WebSocket] Error', error);
        this.isConnecting = false;
        this.callbacks.onError?.(new Error('WebSocket connection error'));
      };

      this.ws.onclose = (event) => {
        logger.info('[WebSocket] Disconnected', { code: event.code, reason: event.reason });
        this.isConnecting = false;
        this.stopPingInterval();
        this.callbacks.onDisconnected?.();

        // Attempt to reconnect if not intentionally closed
        if (this.shouldReconnect && event.code !== 1000) {
          this.scheduleReconnect();
        }
      };
    } catch (error: unknown) {
      logger.error('[WebSocket] Failed to create connection', error);
      this.isConnecting = false;
      this.callbacks.onError?.(
        error instanceof Error ? error : new Error('Failed to create WebSocket')
      );
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.stopPingInterval();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Send a message to the server
   */
  send(message: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      logger.warn('[WebSocket] Cannot send message, not connected');
    }
  }

  /**
   * Subscribe to specific notification types
   */
  subscribe(types: string[]): void {
    this.send({ type: 'subscribe', types });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'connected':
        logger.debug('[WebSocket] Connection confirmed', { user_id: message.user_id });
        break;

      case 'pong':
        logger.debug('[WebSocket] Pong received');
        break;

      case 'subscribed':
        logger.debug('[WebSocket] Subscribed to types', message.notification_types);
        break;

      case 'notification':
        logger.debug('[WebSocket] Notification received', message.data);
        this.callbacks.onNotification?.(message.data);
        break;

      case 'error':
        logger.error('[WebSocket] Server error', message.message);
        this.callbacks.onError?.(new Error(message.message));
        break;

      default:
        logger.warn('[WebSocket] Unknown message type', message);
    }
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (!this.shouldReconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('[WebSocket] Max reconnection attempts reached');
      this.callbacks.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    this.clearReconnectTimer();

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    logger.info(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.callbacks);
    }, delay);
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// Singleton instance
let socketInstance: NotificationSocket | null = null;

/**
 * Get or create WebSocket instance
 */
export function getNotificationSocket(): NotificationSocket {
  if (!socketInstance) {
    socketInstance = new NotificationSocket();
  }
  return socketInstance;
}

/**
 * Connect to notification WebSocket
 */
export function connectNotificationSocket(
  callbacks: NotificationSocketCallbacks
): NotificationSocket {
  const socket = getNotificationSocket();
  socket.connect(callbacks);
  return socket;
}

/**
 * Disconnect from notification WebSocket
 */
export function disconnectNotificationSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
  }
}
