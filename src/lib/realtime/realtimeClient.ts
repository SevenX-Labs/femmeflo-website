/**
 * FemmeFlo Real-Time Web Event Client
 * Connects to the backend SSE event stream and dispatches real-time updates
 * to web pages and components.
 */

import { API_BASE_URL, tokenStorage } from "../api/client";

export type RealtimeEventType =
  | "INVENTORY_UPDATE"
  | "SALE_STATUS_UPDATE"
  | "APPROVAL_UPDATE"
  | "SHIFT_UPDATE"
  | "CUSTOMER_UPDATE"
  | "HEARTBEAT";

export interface RealtimeEventPayload {
  id: string;
  type: RealtimeEventType;
  timestamp: number;
  actorId?: string;
  role?: string;
  entityId?: string;
  action?: string;
  data?: Record<string, unknown>;
}

type EventCallback = (event: RealtimeEventPayload) => void;

class RealtimeWebClient {
  private eventSource: EventSource | null = null;
  private subscribers = new Map<string, Set<EventCallback>>();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private destroyed = false;

  constructor() {
    if (typeof window !== "undefined") {
      // Auto-connect when document becomes visible or online
      window.addEventListener("online", () => this.connect());
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.connect();
        }
      });
    }
  }

  public connect(): void {
    if (typeof window === "undefined" || this.destroyed) return;
    const token = tokenStorage.getToken();
    if (!token) return;

    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      const streamUrl = `${API_BASE_URL}/realtime/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(streamUrl);
      this.eventSource = es;

      es.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      es.addEventListener("message", (e: MessageEvent) => {
        try {
          const payload: RealtimeEventPayload = JSON.parse(e.data);
          this.notifySubscribers(payload);

          // Also dispatch a DOM CustomEvent for decoupled page listeners
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("femmeflo:realtime", { detail: payload })
            );
          }
        } catch {
          // Ignore malformed message
        }
      });

      es.onerror = () => {
        this.isConnecting = false;
        es.close();
        this.eventSource = null;
        this.scheduleReconnect();
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout || this.destroyed) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 12000);
    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  public subscribe(types: RealtimeEventType[], callback: EventCallback): () => void {
    this.connect();
    for (const t of types) {
      if (!this.subscribers.has(t)) {
        this.subscribers.set(t, new Set());
      }
      this.subscribers.get(t)!.add(callback);
    }

    return () => {
      for (const t of types) {
        this.subscribers.get(t)?.delete(callback);
      }
    };
  }

  private notifySubscribers(event: RealtimeEventPayload): void {
    const list = this.subscribers.get(event.type);
    if (list) {
      list.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.warn("[RealtimeWebClient] Subscriber error", err);
        }
      });
    }
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }
}

export const realtimeWebClient = new RealtimeWebClient();
