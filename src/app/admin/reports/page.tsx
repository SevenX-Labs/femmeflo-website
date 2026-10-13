"use client";

import { useEffect, useState } from "react";
import { Download, MapPin, Package, RefreshCw, TrendingUp } from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import type { SalesReportData } from "@/lib/api/types";

export default function AdminReportsPage() {
  const [report, setReport] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSalesReport({ groupBy: "district" });
      setReport(res);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const downloadReport = () => {
    const csvContent = [
      "Territory,Packets Sold,Revenue (INR),Performance Share",
      ...(report?.groups ?? []).map(
        (t) => `"${t.label}",${t.quantity},${t.totalPaise / 100},-`
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
        eyebrow="Business intelligence"
        title="Reports"
        description="Comprehensive analytics covering revenue velocity, packet distribution, territory penetration, and inventory movements."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={loadReports}
              disabled={loading}
              title="Refresh reports"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:border-rose-200 hover:text-[#E61C5D]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <button
              onClick={downloadReport}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550]"
            >
              <Download className="h-4 w-4" /> Download CSV
            </button>
          </div>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Net Confirmed Sales"
          value={`₹${(report?.summary.grossSalesRupees ?? 0).toLocaleString("en-IN")}`}
          note="Total verified field revenue"
          icon="rupee"
          tone="green"
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
          icon="trend"
          tone="amber"
        />
        <MetricCard
          label="Total Orders"
          value={(report?.summary.totalSalesCount ?? 0).toString()}
          note="Completed field receipts"
          icon="chart"
        />
      </div>

      <SectionCard
        title="Territory performance breakdown"
        description="Packet sales volume and revenue by assigned regional jurisdiction"
        className="mt-8"
      >
        <div className="space-y-6">
          {(report?.groups ?? []).map((t) => (
            <div key={t.label}>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-zinc-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#E61C5D]" />
                  {t.label}
                </span>
                <span className="text-zinc-600 font-semibold">
                  {t.quantity.toLocaleString("en-IN")} pkts · ₹{(t.totalPaise / 100).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="mt-2.5 h-2.5 rounded-full bg-rose-100/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#E61C5D] transition-all duration-500"
                  style={{ width: `${report && report.summary.totalQuantitySold > 0 ? Math.min(100, (t.quantity / report.summary.totalQuantitySold) * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
          {(!report || !report.groups?.length) && <p className="py-10 text-center text-sm text-zinc-400">No report data available.</p>}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}