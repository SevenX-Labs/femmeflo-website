"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, ChevronDown, CircleUserRound, ClipboardCheck, FileText, IndianRupee, LayoutDashboard, Menu, Package, PackageCheck, ReceiptIndianRupee, ScrollText, Settings, ShoppingBag, Store, Tags, TrendingUp, Truck, Users, X } from "lucide-react";
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

export function DashboardShell({ role, workspace, userName, userDetail, navigation, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, isBackendOnline, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const displayName = user?.name || userName;
  const displayDetail =
    user?.role === "SUPER_ADMIN"
      ? "Super Admin · Head Office"
      : user?.role === "MANAGER"
      ? `Manager · ${user.district || user.state || "Territory"}`
      : user?.role === "SELLER"
      ? `Seller · ${user.village || user.district || "Field"}`
      : userDetail;

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    updateTime();
    const timer = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[#FAF8F5] font-jakarta text-zinc-800">
      <div className="flex min-h-screen">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-rose-100 bg-white px-5 py-6 transition-transform duration-300 lg:static lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-start justify-between px-2">
            <Link href={role === "Super Admin" ? "/admin" : role === "Manager" ? "/manager" : "/seller"} onClick={() => setMenuOpen(false)}>
              <Image src="/logo-copy.png" alt="Femmeflo" width={170} height={58} priority className="h-10 w-auto object-contain object-left" />
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#E61C5D]">{workspace}</p>
            </Link>
            <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-zinc-500 hover:bg-rose-50 lg:hidden" aria-label="Close navigation"><X className="h-5 w-5" /></button>
          </div>
          
          <p className="mt-10 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Main menu</p>
          <nav className="mt-3 space-y-1">
            {navigation.map((item) => {
              const Icon = navigationIconMap[item.icon];
              const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/manager" && item.href !== "/seller" && pathname.startsWith(`${item.href}/`));
              return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} aria-current={active ? "page" : undefined} className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-rose-300 ${active ? "bg-rose-50 text-[#E61C5D]" : "text-zinc-500 hover:bg-rose-50/60 hover:text-[#156035]"}`}><Icon className="h-4.5 w-4.5 transition-transform group-hover:scale-105" />{item.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#E61C5D]" />}</Link>;
            })}
          </nav>
          <div className="mt-auto pt-6 space-y-3">
            <div className="rounded-2xl bg-[#156035] p-4 text-white">
              <p className="text-xs font-semibold text-emerald-100">{role === "Seller" ? "Your daily rhythm" : "Workspace pulse"}</p>
              <p className="mt-1 text-sm font-bold leading-snug">{role === "Seller" ? "Check stock & record your sales." : "Everything is moving today."}</p>
              <Link href={navigation[1]?.href ?? navigation[0].href} className="mt-3 inline-block text-xs font-bold text-[#FDE047]">Open next &rarr;</Link>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-[#FFF8FA] p-3">
              <div className="min-w-0 pr-2">
                <p className="truncate text-xs font-bold text-zinc-800">{displayName}</p>
                <p className="truncate text-[10px] text-zinc-400">{displayDetail}</p>
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
        <section className="relative min-w-0 flex-1">
          <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-rose-100/80 bg-white/90 px-4 backdrop-blur-md lg:hidden">
            <div className="flex items-center gap-2.5">
              <button onClick={() => setMenuOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-white text-[#E61C5D] shadow-xs transition hover:bg-rose-50" aria-label="Open workspace navigation"><Menu className="h-5 w-5" /></button>
              <span className="text-xs font-bold text-zinc-800">{workspace}</span>
            </div>
            <button onClick={() => logout()} className="text-xs font-bold text-[#E61C5D]">Sign out</button>
          </div>
          <div className="mx-auto max-w-360 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
        </section>
      </div>
    </main>
  );
}

export function MetricCard({ label, value, note, icon, tone = "rose" }: { label: string; value: string | number; note: string; icon: MetricIcon; tone?: "rose" | "green" | "amber" }) {
  const Icon = metricIconMap[icon];
  const toneClass = tone === "green" ? "bg-emerald-50 text-[#156035]" : tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-[#E61C5D]";
  return <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-[0_8px_30px_rgba(104,48,66,0.04)]"><div className="flex items-start justify-between"><p className="text-xs font-semibold text-zinc-500">{label}</p><span className={`rounded-xl p-2 ${toneClass}`}><Icon className="h-4 w-4" /></span></div><p className="mt-4 font-playfair text-3xl font-bold text-zinc-900">{value}</p><p className="mt-1 text-xs text-zinc-400">{note}</p></div>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E61C5D]">{eyebrow}</p><h1 className="mt-2 font-playfair text-4xl font-bold tracking-tight text-[#156035] sm:text-5xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">{description}</p></div>{action}</div>;
}

export function SectionCard({ title, description, action, children, className = "" }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-rose-100 bg-white p-5 shadow-[0_8px_30px_rgba(104,48,66,0.04)] sm:p-6 ${className}`}><div className="flex items-start justify-between gap-4"><div><h2 className="font-playfair text-2xl font-bold text-[#156035]">{title}</h2>{description && <p className="mt-1 text-xs text-zinc-400">{description}</p>}</div>{action}</div><div className="mt-5">{children}</div></section>;
}
