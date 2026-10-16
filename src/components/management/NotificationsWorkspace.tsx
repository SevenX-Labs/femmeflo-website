"use client";

import { Bell, Check, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell, PageHeading, SectionCard } from "./DashboardShell";
import type { NavigationItem } from "./navigation";
import { notificationsApi } from "@/lib/api/notifications";
import type { NotificationItem } from "@/lib/api/types";

export function NotificationsWorkspace({ role, workspace, navigation }: {
  role: "Super Admin" | "Manager" | "Seller";
  workspace: string;
  navigation: NavigationItem[];
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await notificationsApi.list({ pageSize: 50 });
      setNotifications(result.items);
      setUnreadCount(result.unreadCount);
    } catch (err: unknown) {
      setNotifications([]);
      setUnreadCount(0);
      setError(err instanceof Error ? err.message : "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((items) => items.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to mark notification as read");
    }
  };

  return (
    <DashboardShell role={role} workspace={workspace} userName="" userDetail="" navigation={navigation}>
      <PageHeading
        eyebrow="System updates"
        title="Notifications"
        description="Live notifications from your Femmeflo workspace."
        action={<button onClick={load} disabled={loading} title="Refresh notifications" className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>}
      />
      {error && <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">Unable to load live notifications. {error}</p>}
      <SectionCard title={`${unreadCount} unread updates`} description="Recent workspace activity" className="mt-8">
        <div className="space-y-3">
          {!loading && notifications.length === 0 && <p className="py-10 text-center text-sm text-zinc-700">No notifications available.</p>}
          {notifications.map((notification) => {
            const isRead = Boolean(notification.readAt);
            return <div key={notification.id} className={`flex gap-4 rounded-xl border p-4 ${isRead ? "border-zinc-100 bg-white" : "border-rose-100 bg-[#FFF8FA]"}`}>
              <span className="mt-1 rounded-xl bg-white p-2 text-[#E61C5D] shadow-sm"><Bell className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-bold text-zinc-800">{notification.kind.replaceAll("_", " ")}</p><span className="text-[11px] text-zinc-700">{new Date(notification.createdAt).toLocaleString("en-IN")}</span></div><p className="mt-1 text-xs leading-relaxed text-zinc-800">{notification.message}</p></div>
              {!isRead && <button onClick={() => markRead(notification.id)} className="self-start rounded-lg p-2 text-[#157347] hover:bg-emerald-50" aria-label="Mark notification as read"><Check className="h-4 w-4" /></button>}
            </div>;
          })}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}