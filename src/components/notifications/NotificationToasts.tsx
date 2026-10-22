"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Package,
  ReceiptIndianRupee,
  Route,
  Store,
  Users,
  X,
} from "lucide-react";
import {
  webNotificationService,
  type ToastPayload,
  type NotificationCategory,
} from "@/lib/notifications/webNotifications";

interface ActiveToast extends ToastPayload {
  key: string;
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

const categoryColorMap: Record<
  NotificationCategory,
  { bg: string; border: string; text: string; iconBg: string }
> = {
  SALES: {
    bg: "bg-emerald-50/95",
    border: "border-emerald-200",
    text: "text-emerald-950",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  INVENTORY: {
    bg: "bg-blue-50/95",
    border: "border-blue-200",
    text: "text-blue-950",
    iconBg: "bg-blue-100 text-blue-700",
  },
  APPROVALS: {
    bg: "bg-amber-50/95",
    border: "border-amber-200",
    text: "text-amber-950",
    iconBg: "bg-amber-100 text-amber-700",
  },
  CUSTOMERS: {
    bg: "bg-indigo-50/95",
    border: "border-indigo-200",
    text: "text-indigo-950",
    iconBg: "bg-indigo-100 text-indigo-700",
  },
  OFFICERS: {
    bg: "bg-rose-50/95",
    border: "border-rose-200",
    text: "text-rose-950",
    iconBg: "bg-rose-100 text-[#E61C5D]",
  },
  SHIFTS: {
    bg: "bg-purple-50/95",
    border: "border-purple-200",
    text: "text-purple-950",
    iconBg: "bg-purple-100 text-purple-700",
  },
  SYSTEM: {
    bg: "bg-zinc-50/95",
    border: "border-zinc-200",
    text: "text-zinc-950",
    iconBg: "bg-zinc-100 text-zinc-700",
  },
};

interface NotificationToastsProps {
  role?: "Super Admin" | "Manager" | "Seller";
}

export function NotificationToasts({ role }: NotificationToastsProps = {}) {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    const unsubscribe = webNotificationService.subscribeToToasts((newToast) => {
      // Role scoping: ensure toasts only show to targeted role or "ALL"
      if (role && newToast.recipientRole && newToast.recipientRole !== "ALL") {
        const normalizedRole =
          role === "Super Admin" ? "SUPER_ADMIN" : role === "Manager" ? "MANAGER" : "SELLER";
        if (newToast.recipientRole !== normalizedRole) {
          return;
        }
      }

      const toastWithKey: ActiveToast = {
        ...newToast,
        key: newToast.id + "_" + Math.random().toString(36).slice(2, 6),
      };

      setToasts((current) => [toastWithKey, ...current].slice(0, 3));

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.key !== toastWithKey.key));
      }, 4500);
    });

    return unsubscribe;
  }, [role]);

  const removeToast = (key: string) => {
    setToasts((current) => current.filter((t) => t.key !== key));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = categoryIconMap[toast.category] || Bell;
        const colors = categoryColorMap[toast.category] || categoryColorMap.SYSTEM;

        return (
          <div
            key={toast.key}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border ${colors.border} ${colors.bg} p-3.5 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200`}
            role="status"
            aria-live="polite"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${colors.iconBg}`}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className={`text-xs font-bold ${colors.text}`}>{toast.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600 line-clamp-2">
                {toast.message}
              </p>
              {toast.link && (
                <Link
                  href={toast.link}
                  onClick={() => removeToast(toast.key)}
                  className="mt-1.5 inline-block text-[11px] font-bold text-[#E61C5D] hover:underline"
                >
                  View details →
                </Link>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.key)}
              className="rounded-lg p-1 text-zinc-400 hover:bg-black/5 hover:text-zinc-600 transition"
              aria-label="Dismiss toast"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
