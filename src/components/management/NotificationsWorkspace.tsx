"use client";

import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Filter,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  UserCheck,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell, PageHeading, SectionCard } from "./DashboardShell";
import type { NavigationItem } from "./navigation";
import { notificationsApi } from "@/lib/api/notifications";
import {
  webNotificationService,
  type NotificationCategory,
  type WebNotificationItem,
} from "@/lib/notifications/webNotifications";

interface NotificationsWorkspaceProps {
  role: "Super Admin" | "Manager" | "Seller";
  workspace: string;
  userName?: string;
  userDetail?: string;
  navigation: NavigationItem[];
}

type FilterCategory = "ALL" | "UNREAD" | NotificationCategory;

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      return `${mins}m ago`;
    }
    if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      return `${hours}h ago`;
    }
    if (diffSec < 172800) return "Yesterday";
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function getCategoryConfig(category?: string) {
  switch (category) {
    case "SALES":
      return {
        label: "Sales & Orders",
        bg: "bg-emerald-50 text-[#156035] border-emerald-200",
        icon: ShoppingBag,
      };
    case "INVENTORY":
      return {
        label: "Inventory & Warehouses",
        bg: "bg-sky-50 text-sky-800 border-sky-200",
        icon: Package,
      };
    case "APPROVALS":
      return {
        label: "Approval Alerts",
        bg: "bg-purple-50 text-purple-800 border-purple-200",
        icon: ShieldCheck,
      };
    case "SHIFTS":
      return {
        label: "Duty & GPS Visits",
        bg: "bg-amber-50 text-amber-800 border-amber-200",
        icon: Clock,
      };
    case "CUSTOMERS":
      return {
        label: "Retail Customers",
        bg: "bg-pink-50 text-pink-800 border-pink-200",
        icon: Store,
      };
    case "OFFICERS":
      return {
        label: "Team & Officers",
        bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
        icon: UserCheck,
      };
    default:
      return {
        label: "System",
        bg: "bg-zinc-100 text-zinc-700 border-zinc-200",
        icon: Bell,
      };
  }
}

export function NotificationsWorkspace({
  role,
  workspace,
  userName = "",
  userDetail = "",
  navigation,
}: NotificationsWorkspaceProps) {
  const [notifications, setNotifications] = useState<WebNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>("default");

  const loadNotifications = () => {
    setLoading(true);
    try {
      const res = webNotificationService.list({
        role,
        pageSize: 100,
      });
      setNotifications(res.items);
      setUnreadCount(res.unreadCount);
    } catch {
      // Fallback
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    if (typeof window !== "undefined" && "Notification" in window) {
      setDesktopPermission(Notification.permission);
    }

    const unsubscribe = webNotificationService.subscribe(() => {
      loadNotifications();
    });

    return () => unsubscribe();
  }, [role]);

  const handleRequestDesktopPermission = async () => {
    const granted = await webNotificationService.requestDesktopPermission();
    if (typeof window !== "undefined" && "Notification" in window) {
      setDesktopPermission(Notification.permission);
    }
    if (granted) {
      const notifUrl =
        role === "Super Admin"
          ? "/admin/notifications"
          : role === "Manager"
          ? "/manager/notifications"
          : "/seller/notifications";

      webNotificationService.showDesktopNotification(
        "Desktop Alerts Enabled",
        "You will now receive instant desktop notifications for sales, stock updates, and shifts.",
        notifUrl
      );
    }
  };

  const handleMarkAsRead = (id: string) => {
    webNotificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((it) => (it.id === id ? { ...it, readAt: new Date().toISOString() } : it))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllAsRead = () => {
    webNotificationService.markAllAsRead(role);
    setNotifications((prev) =>
      prev.map((it) => (it.readAt ? it : { ...it, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const handleDelete = (id: string) => {
    webNotificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((it) => it.id !== id));
    setUnreadCount(webNotificationService.getUnreadCount(role));
  };

  const filteredNotifications = useMemo(() => {
    let list = notifications;

    if (selectedCategory === "UNREAD") {
      list = list.filter((n) => !n.readAt);
    } else if (selectedCategory !== "ALL") {
      list = list.filter((n) => n.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.message?.toLowerCase().includes(q) ||
          n.kind?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [notifications, selectedCategory, searchQuery]);

  const categories: Array<{ id: FilterCategory; label: string; count?: number }> = [
    { id: "ALL", label: "All updates", count: notifications.length },
    { id: "UNREAD", label: "Unread", count: unreadCount },
    { id: "SALES", label: "Sales" },
    { id: "APPROVALS", label: "Approvals" },
    { id: "INVENTORY", label: "Inventory" },
    { id: "SHIFTS", label: "Duty Shifts" },
    { id: "CUSTOMERS", label: "Customers" },
    { id: "OFFICERS", label: "Officers" },
  ];

  return (
    <DashboardShell
      role={role}
      workspace={workspace}
      userName={userName}
      userDetail={userDetail}
      navigation={navigation}
    >
      <PageHeading
        eyebrow="Live system feeds"
        title="Notifications"
        description="Real-time web notification center for sales, stock allocations, shop duty shifts, approvals, and team activity."
        action={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-[#E61C5D] shadow-xs hover:bg-rose-100 transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </button>
            )}
            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading}
              title="Refresh notifications"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        }
      />

      {/* Desktop Alert Request Banner */}
      {desktopPermission !== "granted" && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50/70 to-pink-50/50 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#E61C5D] shadow-xs">
              <Volume2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-zinc-900">Enable Desktop Web Notifications</p>
              <p className="text-xs text-zinc-600">
                Receive browser alerts when sales are booked, stock is moved, or shifts are started.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestDesktopPermission}
            className="shrink-0 rounded-xl bg-[#E61C5D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#B4234D] transition-colors"
          >
            Allow Notifications
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 font-bold transition-all ${
                    active
                      ? "bg-[#156035] text-white shadow-sm"
                      : "bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <span>{cat.label}</span>
                  {typeof cat.count === "number" && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : cat.id === "UNREAD" && cat.count > 0
                          ? "bg-rose-100 text-[#E61C5D]"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200/80 bg-white pl-9 pr-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#E61C5D] focus:outline-none focus:ring-1 focus:ring-[#E61C5D]"
            />
          </div>
        </div>

        {/* Notifications List */}
        <SectionCard
          title={
            selectedCategory === "UNREAD"
              ? `${filteredNotifications.length} Unread Updates`
              : selectedCategory === "ALL"
              ? `All Updates (${filteredNotifications.length})`
              : `${selectedCategory} Updates (${filteredNotifications.length})`
          }
          description="Click any notification to open the associated operational module."
        >
          {loading ? (
            <div className="py-12 text-center">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#E61C5D]" />
              <p className="mt-2 text-xs font-semibold text-zinc-500">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                <Bell className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-bold text-zinc-800">No notifications found</p>
              <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                {searchQuery
                  ? "Try clearing your search query or switching categories."
                  : "You are all caught up! New updates will appear here automatically."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const isRead = Boolean(notification.readAt);
                const cfg = getCategoryConfig(notification.category);
                const CategoryIcon = cfg.icon;

                return (
                  <div
                    key={notification.id}
                    className={`group relative flex flex-col sm:flex-row items-start gap-3.5 rounded-2xl border p-4 transition-all ${
                      isRead
                        ? "border-zinc-200/70 bg-white hover:border-zinc-300"
                        : "border-rose-200/90 bg-[#FFF9FA] shadow-xs hover:border-rose-300"
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!isRead && (
                      <span
                        className="absolute -top-1 -left-1 flex h-3 w-3 items-center justify-center"
                        title="Unread"
                      >
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E61C5D] opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#E61C5D]" />
                      </span>
                    )}

                    {/* Category Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${cfg.bg}`}
                    >
                      <CategoryIcon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.bg}`}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-xs font-bold text-zinc-900">
                            {notification.title || notification.kind.replaceAll("_", " ")}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-zinc-500">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs leading-relaxed text-zinc-700">
                        {notification.message}
                      </p>

                      {/* Action Links */}
                      {notification.link && (
                        <div className="mt-2.5">
                          <Link
                            href={notification.link}
                            onClick={() => {
                              if (!isRead) handleMarkAsRead(notification.id);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E61C5D] hover:underline"
                          >
                            <span>Open details</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Quick Item Actions */}
                    <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(notification.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}