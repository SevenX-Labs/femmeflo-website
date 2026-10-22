import { apiRequest } from "./client";
import type { NotificationItem, PaginationMeta } from "./types";
import {
  webNotificationService,
  type WebNotificationItem,
  type NotificationCategory,
  type NotificationRole,
} from "../notifications/webNotifications";

export const notificationsApi = {
  async list(params?: {
    page?: number;
    pageSize?: number;
    unread?: boolean;
    role?: string;
    category?: string;
    search?: string;
  }): Promise<{
    items: NotificationItem[];
    unreadCount: number;
    pagination: PaginationMeta;
  }> {
    try {
      const serverResult = await apiRequest<{
        items?: NotificationItem[];
        notifications?: NotificationItem[];
        unreadCount?: number;
        pagination?: PaginationMeta;
      }>("notifications", { method: "GET", params });

      const items = serverResult?.items ?? serverResult?.notifications ?? [];
      const unreadCount = serverResult?.unreadCount ?? items.filter((i) => !i.readAt).length;
      const pagination = serverResult?.pagination ?? {
        page: params?.page || 1,
        pageSize: params?.pageSize || 50,
        total: items.length,
        totalPages: 1,
      };

      if (items.length > 0) {
        return { items, unreadCount, pagination };
      }
    } catch {
      // Backend does not implement notifications endpoint — fallback to client-side web notification service
    }

    // Fallback to web-based notification store
    const local = webNotificationService.list(params);
    return {
      items: local.items,
      unreadCount: local.unreadCount,
      pagination: local.pagination,
    };
  },

  async unreadCount(role?: string): Promise<{ unreadCount: number }> {
    try {
      const serverResult = await apiRequest<{ unreadCount: number }>("notifications/unread-count", { method: "GET" });
      if (typeof serverResult?.unreadCount === "number") {
        return serverResult;
      }
    } catch {
      // Fallback
    }
    return { unreadCount: webNotificationService.getUnreadCount(role) };
  },

  async markRead(id: string): Promise<{ notification: NotificationItem }> {
    try {
      const serverResult = await apiRequest<{ notification: NotificationItem }>(`notifications/${id}/read`, { method: "PATCH" });
      if (serverResult?.notification) {
        return serverResult;
      }
    } catch {
      // Fallback
    }
    const item = webNotificationService.markAsRead(id);
    return {
      notification: item || {
        id,
        recipientId: "",
        kind: "UPDATE",
        message: "Marked as read",
        readAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    };
  },

  async markAllRead(role?: string): Promise<{ success: boolean }> {
    try {
      await apiRequest("notifications/read-all", { method: "PATCH" });
    } catch {
      // Fallback
    }
    webNotificationService.markAllAsRead(role);
    return { success: true };
  },

  async delete(id: string): Promise<{ success: boolean }> {
    webNotificationService.deleteNotification(id);
    return { success: true };
  },

  async clearAll(): Promise<{ success: boolean }> {
    webNotificationService.clearAll();
    return { success: true };
  },

  add(params: {
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
    return webNotificationService.addNotification(params);
  },
};