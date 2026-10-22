"use client";

import type { NotificationItem, PaginationMeta } from "../api/types";

export type NotificationCategory =
  | "SALES"
  | "INVENTORY"
  | "CUSTOMERS"
  | "OFFICERS"
  | "SHIFTS"
  | "APPROVALS"
  | "SYSTEM";

export type NotificationRole = "SUPER_ADMIN" | "MANAGER" | "SELLER" | "ALL";

export interface WebNotificationItem extends NotificationItem {
  id: string;
  recipientRole: NotificationRole;
  recipientId: string;
  saleId?: string | null;
  category: NotificationCategory;
  kind: string;
  title: string;
  message: string;
  link?: string;
  readAt?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ToastPayload {
  id: string;
  recipientRole?: NotificationRole;
  title: string;
  message: string;
  category: NotificationCategory;
  link?: string;
}

const STORAGE_KEY = "femmeflo_web_notifications_v1";
const EVENT_NAME = "femmeflo:notification";
const TOAST_EVENT = "femmeflo:toast";

// Seed notifications for initial workspace experience
const SEED_NOTIFICATIONS: WebNotificationItem[] = [
  {
    id: "notif_seed_001",
    recipientRole: "ALL",
    recipientId: "all",
    category: "SYSTEM",
    kind: "SYSTEM_INITIALIZED",
    title: "Femmeflo Workspace Active",
    message: "Live web notification channel connected for real-time sales, inventory, duty shifts, and approval updates.",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    readAt: null,
  },
  {
    id: "notif_seed_002",
    recipientRole: "SUPER_ADMIN",
    recipientId: "admin",
    category: "APPROVALS",
    kind: "APPROVAL_REQUIRED",
    title: "Low-Price Sale Verification",
    message: "Sale discounts below base threshold require Super Admin confirmation in the Approvals workspace.",
    link: "/admin/approvals",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    readAt: null,
  },
  {
    id: "notif_seed_003",
    recipientRole: "SUPER_ADMIN",
    recipientId: "admin",
    category: "INVENTORY",
    kind: "STOCK_UPDATE",
    title: "Regional Warehouse Stock Synced",
    message: "Central HQ and field warehouse allocations synced with real-time stock balances.",
    link: "/admin/inventory",
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    readAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    id: "notif_seed_004",
    recipientRole: "SELLER",
    recipientId: "all",
    category: "SHIFTS",
    kind: "SHIFT_UPDATE",
    title: "GPS Duty Shifts Enabled",
    message: "Field officers can now start mobile duty shifts, record customer store visits, and track distance covered.",
    link: "/seller/shifts",
    createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    readAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
  },
];

function getStoredNotifications(): WebNotificationItem[] {
  if (typeof window === "undefined") return SEED_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS));
      return SEED_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_NOTIFICATIONS;
  } catch {
    return SEED_NOTIFICATIONS;
  }
}

function saveNotifications(items: WebNotificationItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { items } }));
  } catch {
    // Local storage quotas / errors
  }
}

export const webNotificationService = {
  /**
   * Add a new web notification, dispatch toast, and trigger desktop push if granted
   */
  addNotification(params: {
    recipientRole?: NotificationRole;
    recipientId?: string | null;
    category?: NotificationCategory;
    kind: string;
    title: string;
    message: string;
    link?: string;
    saleId?: string | null;
    metadata?: Record<string, unknown>;
  }): WebNotificationItem {
    const newItem: WebNotificationItem = {
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      recipientRole: params.recipientRole || "ALL",
      recipientId: params.recipientId || "all",
      category: params.category || "SYSTEM",
      kind: params.kind,
      title: params.title,
      message: params.message,
      link: params.link,
      saleId: params.saleId ?? null,
      metadata: params.metadata,
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    const current = getStoredNotifications();
    const updated = [newItem, ...current].slice(0, 200); // retain last 200 items
    saveNotifications(updated);

    // Dispatch in-app toast event
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(TOAST_EVENT, {
          detail: {
            id: newItem.id,
            recipientRole: newItem.recipientRole,
            title: newItem.title,
            message: newItem.message,
            category: newItem.category,
            link: newItem.link,
          } as ToastPayload,
        })
      );

      // Trigger HTML5 Web Notification if permission is granted
      this.showDesktopNotification(newItem.title, newItem.message, newItem.link);
    }

    return newItem;
  },

  /**
   * List notifications with pagination and role/unread filters
   */
  list(params?: {
    page?: number;
    pageSize?: number;
    unread?: boolean;
    role?: string;
    category?: string;
    search?: string;
  }): {
    items: WebNotificationItem[];
    unreadCount: number;
    pagination: PaginationMeta;
  } {
    const all = getStoredNotifications();
    const normalizedRole = params?.role
      ? params.role.toUpperCase().replace(/\s+/g, "_")
      : undefined;

    let filtered = all.filter((item) => {
      // Role scoping
      if (normalizedRole && item.recipientRole !== "ALL") {
        if (item.recipientRole === "SUPER_ADMIN" && normalizedRole !== "SUPER_ADMIN") return false;
        if (item.recipientRole === "MANAGER" && normalizedRole !== "MANAGER") return false;
        if (item.recipientRole === "SELLER" && normalizedRole !== "SELLER") return false;
      }
      // Unread filtering
      if (params?.unread && item.readAt) return false;
      // Category filtering
      if (params?.category && params.category !== "ALL" && item.category !== params.category) {
        return false;
      }
      // Text search
      if (params?.search && params.search.trim()) {
        const q = params.search.toLowerCase().trim();
        const text = `${item.title} ${item.message} ${item.kind}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });

    const unreadCount = all.filter((item) => {
      if (item.readAt) return false;
      if (normalizedRole && item.recipientRole !== "ALL") {
        if (item.recipientRole === "SUPER_ADMIN" && normalizedRole !== "SUPER_ADMIN") return false;
        if (item.recipientRole === "MANAGER" && normalizedRole !== "MANAGER") return false;
        if (item.recipientRole === "SELLER" && normalizedRole !== "SELLER") return false;
      }
      return true;
    }).length;

    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.max(1, params?.pageSize || 50);
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      unreadCount,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  },

  /**
   * Get total unread count for current user/role
   */
  getUnreadCount(role?: string): number {
    const all = getStoredNotifications();
    const normalizedRole = role ? role.toUpperCase().replace(/\s+/g, "_") : undefined;
    return all.filter((item) => {
      if (item.readAt) return false;
      if (normalizedRole && item.recipientRole !== "ALL") {
        if (item.recipientRole === "SUPER_ADMIN" && normalizedRole !== "SUPER_ADMIN") return false;
        if (item.recipientRole === "MANAGER" && normalizedRole !== "MANAGER") return false;
        if (item.recipientRole === "SELLER" && normalizedRole !== "SELLER") return false;
      }
      return true;
    }).length;
  },

  /**
   * Mark an individual notification as read
   */
  markAsRead(id: string): WebNotificationItem | null {
    const all = getStoredNotifications();
    let updatedItem: WebNotificationItem | null = null;
    const updated = all.map((item) => {
      if (item.id === id) {
        updatedItem = { ...item, readAt: new Date().toISOString() };
        return updatedItem;
      }
      return item;
    });
    saveNotifications(updated);
    return updatedItem;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead(role?: string): void {
    const all = getStoredNotifications();
    const normalizedRole = role ? role.toUpperCase().replace(/\s+/g, "_") : undefined;
    const now = new Date().toISOString();
    const updated = all.map((item) => {
      if (normalizedRole && item.recipientRole !== "ALL") {
        if (item.recipientRole === "SUPER_ADMIN" && normalizedRole !== "SUPER_ADMIN") return item;
        if (item.recipientRole === "MANAGER" && normalizedRole !== "MANAGER") return item;
        if (item.recipientRole === "SELLER" && normalizedRole !== "SELLER") return item;
      }
      return item.readAt ? item : { ...item, readAt: now };
    });
    saveNotifications(updated);
  },

  /**
   * Delete an individual notification
   */
  deleteNotification(id: string): void {
    const all = getStoredNotifications();
    const updated = all.filter((item) => item.id !== id);
    saveNotifications(updated);
  },

  /**
   * Clear all notifications
   */
  clearAll(): void {
    saveNotifications([]);
  },

  /**
   * Subscribe to notification updates across any tab or component
   */
  subscribe(callback: (items: WebNotificationItem[]) => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ items: WebNotificationItem[] }>;
      callback(customEvent.detail?.items || getStoredNotifications());
    };
    window.addEventListener(EVENT_NAME, handler);
    // Also listen to cross-tab storage changes
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        callback(getStoredNotifications());
      }
    };
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", storageHandler);
    };
  },

  /**
   * Subscribe to real-time Toast messages
   */
  subscribeToToasts(callback: (toast: ToastPayload) => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ToastPayload>;
      if (customEvent.detail) {
        callback(customEvent.detail);
      }
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => {
      window.removeEventListener(TOAST_EVENT, handler);
    };
  },

  /**
   * HTML5 Web Notification API permission check
   */
  isDesktopSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  },

  getDesktopPermission(): NotificationPermission | "unsupported" {
    if (!this.isDesktopSupported()) return "unsupported";
    return Notification.permission;
  },

  async requestDesktopPermission(): Promise<boolean> {
    if (!this.isDesktopSupported()) return false;
    try {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    } catch {
      return false;
    }
  },

  showDesktopNotification(title: string, body: string, url?: string): void {
    if (!this.isDesktopSupported() || Notification.permission !== "granted") return;
    try {
      const notif = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
      if (url && typeof window !== "undefined") {
        notif.onclick = () => {
          window.focus();
          window.location.href = url;
          notif.close();
        };
      }
    } catch {
      // Browser notification dispatch ignored
    }
  },
};
