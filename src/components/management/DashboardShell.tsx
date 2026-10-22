"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, BarChart3, Bell, Route, ChevronDown, CircleUserRound, ClipboardCheck, FileText, IndianRupee, LayoutDashboard, Menu, Package, PackageCheck, ReceiptIndianRupee, ScrollText, Settings, ShoppingBag, Store, Tags, TrendingUp, Truck, Users, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

import type { LucideIcon } from "lucide-react";
import type { NavigationIcon } from "./navigation";

export type NavigationItem = {
  label: string;
  href: string;
  icon: NavigationIcon;
};

const navigationIconMap: Record<NavigationIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  store: Store,
  customers: ShoppingBag,
  inventory: Package,
  sales: ReceiptIndianRupee,
  approvals: ClipboardCheck,
  reports: BarChart3,
  invoices: FileText,
  incentives: ReceiptIndianRupee,
  permissions: ScrollText,
  notifications: Bell,
  categories: Tags,
  products: Package,
  shifts: Route,
  settings: Settings,
};

type MetricIcon = "rupee" | "packages" | "trend" | "chart" | "truck" | "package";

const metricIconMap: Record<MetricIcon, LucideIcon> = {
  rupee: IndianRupee,
  packages: PackageCheck,
  trend: TrendingUp,
  chart: BarChart3,
  truck: Truck,
  package: Package,
};

type DashboardShellProps = {
  role: "Super Admin" | "Manager" | "Seller";
  workspace: string;
  userName: string;
  userDetail: string;
  navigation: NavigationItem[];
  children: React.ReactNode;
};

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationToasts } from "@/components/notifications/NotificationToasts";
import { webNotificationService } from "@/lib/notifications/webNotifications";

export function DashboardShell({ role, workspace, userName, userDetail, navigation, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, isBackendOnline, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(webNotificationService.getUnreadCount(role));
    const unsubscribe = webNotificationService.subscribe(() => {
      setUnreadCount(webNotificationService.getUnreadCount(role));
    });
    return unsubscribe;
  }, [role]);

  const displayName = user?.name || userName;
  const displayDetail =
    user?.role === "SUPER_ADMIN"
      ? "Super Admin · Head Office"
      : user?.role === "MANAGER"
      ? `Manager · ${user.district || user.state || "Territory"}`
      : user?.role === "SELLER"
      ? `Seller · ${user.village || user.district || "Field"}`
      : userDetail;

  return (
    <main className="h-screen w-full overflow-hidden bg-[#FAF8F5] font-jakarta text-zinc-800">
      <div className="flex h-full w-full">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-56 lg:w-[220px] max-w-[85vw] shrink-0 flex-col border-r border-rose-100 bg-white px-5 py-6 transition-transform duration-300 lg:static lg:h-full lg:translate-x-0 overflow-y-auto shrink-0 select-none ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-start justify-between px-2">
            <Link href={role === "Super Admin" ? "/admin" : role === "Manager" ? "/manager" : "/seller"} onClick={() => setMenuOpen(false)}>
              <Image src="/logo-copy.png" alt="Femmeflo" width={170} height={58} priority className="h-10 w-auto object-contain object-left" />
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#E61C5D]">{workspace}</p>
            </Link>
            <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-zinc-800 hover:bg-rose-50 lg:hidden" aria-label="Close navigation"><X className="h-5 w-5" /></button>
          </div>
          
          <p className="mt-10 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-700">Main menu</p>
          <nav className="mt-3 space-y-1">
            {navigation.map((item) => {
              const Icon = navigationIconMap[item.icon];
              const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/manager" && item.href !== "/seller" && pathname.startsWith(`${item.href}/`));
              const isNotificationsItem = item.icon === "notifications";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-rose-300 ${
                    active ? "bg-rose-50 text-[#E61C5D]" : "text-zinc-800 hover:bg-rose-50/60 hover:text-[#156035]"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 transition-transform group-hover:scale-105" />
                  <span className="truncate">{item.label}</span>
                  {isNotificationsItem && unreadCount > 0 ? (
                    <span className="ml-auto rounded-full bg-[#E61C5D] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : (
                    active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#E61C5D]" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto pt-6">
            <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-[#FFF8FA] p-3">
              <div className="min-w-0 pr-2">
                <p className="truncate text-xs font-bold text-zinc-800">{displayName}</p>
                <p className="truncate text-[10px] text-zinc-700">{displayDetail}</p>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="shrink-0 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-[#E61C5D] transition hover:bg-rose-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>
        {menuOpen && <button onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-zinc-900/20 lg:hidden" aria-label="Close navigation overlay" />}
        <section className="relative min-w-0 flex-1 h-full overflow-y-auto">
          {/* Mobile Top Bar */}
          <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-rose-100/80 bg-white/90 px-4 backdrop-blur-md lg:hidden">
            <div className="flex items-center gap-2.5">
              <button onClick={() => setMenuOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-white text-[#E61C5D] shadow-xs transition hover:bg-rose-50" aria-label="Open workspace navigation"><Menu className="h-5 w-5" /></button>
              <span className="text-xs font-bold text-zinc-800">{workspace}</span>
            </div>
            <NotificationBell role={role} />
          </div>

          {/* Desktop Top Header */}
          <div className="hidden lg:flex sticky top-0 z-20 h-14 items-center justify-between border-b border-rose-100/60 bg-[#FAF8F5]/90 px-8 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
              <span className="font-bold text-zinc-800">{workspace}</span>
              <span>/</span>
              <span className="text-[#E61C5D] font-bold">
                {navigation.find((n) => n.href === pathname || (n.href !== "/admin" && n.href !== "/manager" && n.href !== "/seller" && pathname.startsWith(`${n.href}/`)))?.label || "Workspace"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell role={role} />
            </div>
          </div>

          <div className="mx-auto max-w-360 px-3.5 py-5 sm:px-6 lg:px-10 lg:py-10">{children}</div>
          <NotificationToasts role={role} />
        </section>
      </div>
    </main>
  );
}

export function MetricCard({
  label,
  value,
  note,
  icon,
  tone = "rose",
  href,
  onClick,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: MetricIcon;
  tone?: "rose" | "green" | "amber";
  href?: string;
  onClick?: () => void;
}) {
  const Icon = metricIconMap[icon];
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-[#156035]"
      : tone === "amber"
      ? "bg-amber-50 text-amber-600"
      : "bg-rose-50 text-[#E61C5D]";

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-xs font-semibold text-zinc-800 truncate">{label}</p>
          {(href || onClick) && (
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-400 opacity-60 group-hover:opacity-100 group-hover:text-[#E61C5D] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
          )}
        </div>
        <span
          className={`rounded-xl p-2 shrink-0 ${toneClass} group-hover:scale-105 transition-transform duration-200`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold font-sans tracking-tight text-zinc-900 group-hover:text-[#156035] transition-colors duration-200">
        {value}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-700 truncate">{note}</p>
        {(href || onClick) && (
          <span className="text-[11px] font-bold text-[#E61C5D] opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
            View &rarr;
          </span>
        )}
      </div>
    </>
  );

  const baseClasses =
    "rounded-2xl border border-rose-100 bg-white p-5 shadow-[0_8px_30px_rgba(104,48,66,0.04)]";

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClasses} group block transition-all duration-200 hover:-translate-y-1 hover:border-rose-300 hover:shadow-[0_12px_32px_rgba(104,48,66,0.09)] cursor-pointer active:translate-y-0`}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} group text-left w-full transition-all duration-200 hover:-translate-y-1 hover:border-rose-300 hover:shadow-[0_12px_32px_rgba(104,48,66,0.09)] cursor-pointer active:translate-y-0`}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E61C5D]">{eyebrow}</p>
        <h1 className="mt-1.5 font-playfair text-2xl font-bold tracking-tight text-[#156035] sm:text-4xl lg:text-5xl break-words">{title}</h1>
        <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-zinc-800">{description}</p>
      </div>
      {action && <div className="shrink-0 w-full sm:w-auto">{action}</div>}
    </div>
  );
}

export function SectionCard({ title, description, action, children, className = "" }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-rose-100 bg-white p-4 shadow-[0_8px_30px_rgba(104,48,66,0.04)] sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#156035] leading-snug break-words">{title}</h2>
          {description && <p className="mt-1 text-xs text-zinc-600 font-medium leading-normal">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="mt-4 sm:mt-5">{children}</div>
    </section>
  );
}
