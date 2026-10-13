import { apiRequest } from "./client";
import type { NotificationItem, PaginationMeta } from "./types";

export const notificationsApi = {
  async list(params?: { page?: number; pageSize?: number; unread?: boolean }): Promise<{
    items: NotificationItem[];
    unreadCount: number;
    pagination: PaginationMeta;
  }> {
    return apiRequest("notifications", { method: "GET", params });
  },

  async unreadCount(): Promise<{ unreadCount: number }> {
    return apiRequest("notifications/unread-count", { method: "GET" });
  },

  async markRead(id: string): Promise<{ notification: NotificationItem }> {
    return apiRequest(`notifications/${id}/read`, { method: "PATCH" });
  },
};