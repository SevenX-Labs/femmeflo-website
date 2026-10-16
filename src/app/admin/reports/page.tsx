"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, MapPin, Package, RefreshCw, TrendingUp, IndianRupee, Award, Calendar, ShoppingBag, Layers } from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import type { SalesReportData, AdminDashboardData } from "@/lib/api/types";
import { SalesTrendLineGraph, SalesDonutPieChart, type LineGraphPoint, type PieSlice } from "@/components/analytics/AnalyticsCharts";

export default function AdminReportsPage() {
  const [report, setReport] = useState<SalesReportData | null>(null);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [incentiveData, setIncentiveData] = useState<{ totalIncentive: number; rate: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"district" | "date" | "seller">("district");

  const loadReports = async () => {
    setLoading(true);
    try {
      const [salesRes, dashRes, incRes] = await Promise.all([
        adminApi.getSalesReport({ groupBy }),
        adminApi.getDashboard().catch(() => null),
        adminApi.getIncentives().catch(() => null),
      ]);
      setReport(salesRes);
      setDashboardData(dashRes);

      if (incRes) {
        const sellers = incRes.sellers ?? (incRes as any).items ?? [];
        const sumIncentive = sellers.reduce(
          (sum: number, item: any) => sum + (item.totalIncentiveRupees || (item.totalIncentivePaise ? item.totalIncentivePaise / 100 : 0)),
          0
        );
        const rate = (incRes.currentRatePaise ?? 500) / 100;
        setIncentiveData({ totalIncentive: sumIncentive, rate });
      }
    } catch {
      setReport(null);
      setDashboardData(null);
      setIncentiveData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [groupBy]);

  // Compute Total Incentives with verified database data or fallback
  const totalIncentiveRupees = useMemo(() => {
    if (incentiveData && incentiveData.totalIncentive > 0) {
      return incentiveData.totalIncentive;
    }
    if (dashboardData?.metrics?.totalIncentiveRupees) {
      return dashboardData.metrics.totalIncentiveRupees;
    }
    if (dashboardData?.metrics?.totalIncentivePaise) {
      return dashboardData.metrics.totalIncentivePaise / 100;
    }
    if (report?.items && report.items.length > 0) {
      const sumPaise = report.items.reduce((acc, curr) => acc + (curr.incentiveAmountPaise || 0), 0);
      if (sumPaise > 0) return sumPaise / 100;
    }
    const packets = report?.summary?.totalQuantitySold || 0;
    const rate = incentiveData?.rate || 5;
    return packets * rate;
  }, [incentiveData, dashboardData, report]);

  // Prepare Line Graph Data Points
  const lineGraphData: LineGraphPoint[] = useMemo(() => {
    if (!report?.items || report.items.length === 0) {
      const groups = report?.groups ?? [];
      if (groups.length > 0) {
        return groups.map((g) => ({
          date: g.label,
          label: g.label,
          salesRupees: g.totalPaise / 100,
          packets: g.quantity,
        }));
      }
      return [];
    }

    const dateMap: Record<string, { rupees: number; packets: number }> = {};
    report.items.forEach((item) => {
      const d = item.createdAt ? item.createdAt.slice(0, 10) : "Recent";
      if (!dateMap[d]) {
        dateMap[d] = { rupees: 0, packets: 0 };
      }
      dateMap[d].rupees += item.totalPaise / 100;
      dateMap[d].packets += item.quantity;
    });

    const sortedDates = Object.keys(dateMap).sort();
    return sortedDates.map((d) => {
      const parsed = new Date(d);
      const label = !isNaN(parsed.getTime())
        ? parsed.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
        : d;
      return {
        date: d,
        label,
        salesRupees: dateMap[d].rupees,
        packets: dateMap[d].packets,
      };
    });
  }, [report]);

  // Prepare Territory / Channel Donut Pie Chart Slices
  const pieSlices: PieSlice[] = useMemo(() => {
    const palette = ["#E61C5D", "#156035", "#F59E0B", "#3B82F6", "#8B5CF6", "#EC4899", "#10B981"];
    const groups = report?.groups ?? [];
    if (groups.length === 0) return [];

    return groups.map((g, idx) => ({
      label: g.label || "Other",
      value: g.totalPaise / 100,
      color: palette[idx % palette.length],
      secondaryLabel: `${g.quantity.toLocaleString("en-IN")} packets sold`,
    }));
  }, [report]);

  const downloadReport = () => {
    const csvContent = [
      "Territory,Packets Sold,Revenue (INR),Incentive (INR)",
      ...(report?.groups ?? []).map(
        (t) => `"${t.label}",${t.quantity},${t.totalPaise / 100},${t.quantity * 5}`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `femmeflo-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <PageHeading
        eyebrow="Business intelligence & analytics"
        title="Reports & Analytics"
        description="Comprehensive analytics covering revenue velocity, total seller incentives, territory penetration, and interactive visual trend charts."
        action={
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={loadReports}
              disabled={loading}
              title="Refresh reports"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 hover:border-rose-200 hover:text-[#E61C5D] transition shadow-xs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <button
              onClick={downloadReport}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] transition"
            >
              <Download className="h-4 w-4" /> Download CSV
            </button>
          </div>
        }
      />

      {/* KEY PERFORMANCE METRIC CARDS (Responsive Grid: 1 col on mobile, 2 on tablet, 3 on laptop, 5 on wide screens) */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        <MetricCard
          label="Net Confirmed Sales"
          value={`₹${(report?.summary.grossSalesRupees ?? 0).toLocaleString("en-IN")}`}
          note="Total verified field revenue"
          icon="rupee"
          tone="green"
        />
        <MetricCard
          label="Total Incentive"
          value={`₹${totalIncentiveRupees.toLocaleString("en-IN")}`}
          note="Earned by field network"
          icon="trend"
          tone="rose"
        />
        <MetricCard
          label="Packets Delivered"
          value={(report?.summary.totalQuantitySold ?? 0).toLocaleString("en-IN")}
          note="Across all regional zones"
          icon="packages"
          tone="rose"
        />
        <MetricCard
          label="Average Order Value"
          value={`₹${report?.summary.averageOrderValueRupees ?? 0}`}
          note="Per retail store transaction"
          icon="chart"
          tone="amber"
        />
        <MetricCard
          label="Total Orders"
          value={(report?.summary.totalSalesCount ?? 0).toString()}
          note="Completed field receipts"
          icon="truck"
        />
      </div>

      {/* INTERACTIVE DATA VISUALIZATIONS (Line Graph & Pie Chart) */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* 1. Daily Sales Timeline Graph (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <SalesTrendLineGraph
            data={lineGraphData}
            title="Sales Revenue Trend"
            subtitle="Hover over data points to inspect date, revenue, and packet count"
          />
        </div>

        {/* 2. Donut Pie Chart Distribution (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <SalesDonutPieChart
            slices={pieSlices}
            title="Revenue by Territory"
            subtitle="Share distribution across operational districts"
            centerValue={`₹${(report?.summary.grossSalesRupees ?? 0).toLocaleString("en-IN")}`}
            centerLabel="Total Revenue"
          />
        </div>
      </div>

      {/* TERRITORY PERFORMANCE BREAKDOWN */}
      <SectionCard
        title="Territory performance breakdown"
        description="Packet sales volume and revenue by assigned regional jurisdiction"
        className="mt-8"
        action={
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-[#FAF8F5] p-1 text-xs">
            <button
              onClick={() => setGroupBy("district")}
              className={`rounded-lg px-2.5 py-1 font-bold transition ${
                groupBy === "district" ? "bg-white text-[#E61C5D] shadow-xs" : "text-zinc-800 hover:text-zinc-800"
              }`}
            >
              By District
            </button>
            <button
              onClick={() => setGroupBy("seller")}
              className={`rounded-lg px-2.5 py-1 font-bold transition ${
                groupBy === "seller" ? "bg-white text-[#E61C5D] shadow-xs" : "text-zinc-800 hover:text-zinc-800"
              }`}
            >
              By Seller
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {(report?.groups ?? []).map((t) => {
            const pct =
              report && report.summary.totalQuantitySold > 0
                ? Math.min(100, Math.round((t.quantity / report.summary.totalQuantitySold) * 100))
                : 0;

            return (
              <div key={t.label}>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-zinc-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#E61C5D] shrink-0" />
                    <span>{t.label}</span>
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs font-semibold text-zinc-800">
                      {t.quantity.toLocaleString("en-IN")} pkts
                    </span>
                    <span className="font-bold text-emerald-800">
                      ₹{(t.totalPaise / 100).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-700">({pct}%)</span>
                  </div>
                </div>
                <div className="mt-2.5 h-2.5 rounded-full bg-rose-100/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#156035] to-[#E61C5D] transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {(!report || !report.groups?.length) && (
            <p className="py-10 text-center text-sm text-zinc-700">No report data available.</p>
          )}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
