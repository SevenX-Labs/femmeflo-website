"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  ClipboardCheck,
  ExternalLink,
  Package,
  ReceiptIndianRupee,
  Route,
  Store,
  Users,
} from "lucide-react";
import {
  webNotificationService,
  type WebNotificationItem,
  type NotificationCategory,
} from "@/lib/notifications/webNotifications";

interface NotificationBellProps {
  role: "Super Admin" | "Manager" | "Seller";
}

const categoryIconMap: Record<NotificationCategory, React.ElementType> = {
  SALES: ReceiptIndianRupee,
  INVENTORY: Package,
  APPROVALS: ClipboardCheck,
  CUSTOMERS: Store,
  OFFICERS: Users,
  SHIFTS: Route,
  SYSTEM: Bell,
};

const categoryToneMap: Record<NotificationCategory, string> = {
  SALES: "bg-emerald-50 text-emerald-700 border-emerald-100",
  INVENTORY: "bg-blue-50 text-blue-700 border-blue-100",
  APPROVALS: "bg-amber-50 text-amber-700 border-amber-100",
  CUSTOMERS: "bg-indigo-50 text-indigo-700 border-indigo-100",
  OFFICERS: "bg-rose-50 text-[#E61C5D] border-rose-100",
  SHIFTS: "bg-purple-50 text-purple-700 border-purple-100",
  SYSTEM: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export function NotificationBell({ role }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<WebNotificationItem[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  const notificationsUrl =
    role === "Super Admin"
      ? "/admin/notifications"
      : role === "Manager"
      ? "/manager/notifications"
      : "/seller/notifications";

  const refresh = () => {
    const listRes = webNotificationService.list({ role, pageSize: 6 });
    setNotifications(listRes.items);
    setUnreadCount(listRes.unreadCount);
  };

  useEffect(() => {
    refresh();
    const unsubscribe = webNotificationService.subscribe(() => {
      refresh();
    });
    return unsubscribe;
  }, [role]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    webNotificationService.markAsRead(id);
    refresh();
  };

  const handleMarkAllAsRead = () => {
    webNotificationService.markAllAsRead(role);
    refresh();
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-rose-100/80 bg-white text-zinc-700 shadow-xs transition hover:border-rose-200 hover:bg-rose-50/50 hover:text-[#E61C5D] focus:outline-none focus:ring-2 focus:ring-rose-200"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E61C5D] px-1 text-[9px] font-black text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-rose-100 bg-white p-3.5 shadow-2xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900">Notifications</span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#E61C5D]">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                  All caught up
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-[#E61C5D] transition"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List of recent items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50 py-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto h-6 w-6 text-zinc-300" />
                <p className="mt-2 text-xs font-semibold text-zinc-600">No notifications yet</p>
                <p className="text-[11px] text-zinc-400">Workspace updates will appear here live.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = categoryIconMap[n.category] || Bell;
                const tone = categoryToneMap[n.category] || categoryToneMap.SYSTEM;
                const isRead = Boolean(n.readAt);

                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2.5 p-2 rounded-xl transition ${
                      isRead ? "hover:bg-zinc-50/80" : "bg-[#FFF8FA]/60 hover:bg-[#FFF8FA]"
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs ${tone}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${isRead ? "font-semibold text-zinc-700" : "font-bold text-zinc-900"}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-zinc-400 shrink-0">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-600 leading-snug line-clamp-2">
                        {n.message}
                      </p>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => {
                            handleMarkAsRead(n.id);
                            setIsOpen(false);
                          }}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#E61C5D] hover:underline"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      )}
                    </div>

                    {!isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-emerald-600"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-zinc-100 pt-2 text-center">
            <Link
              href={notificationsUrl}
              onClick={() => setIsOpen(false)}
              className="inline-block text-xs font-bold text-[#E61C5D] hover:text-[#c91550] transition"
            >
              View all in Notifications workspace →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
