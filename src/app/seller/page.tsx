"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  DollarSign,
  Download,
  Eye,
  Loader2,
  Package,
  PackageCheck,
  Plus,
  ReceiptIndianRupee,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import type { SellerDashboardData } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

export default function SellerOverviewDashboard() {
  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const { user } = useAuth();

  const handleInvoicePdf = async (invoiceId: string, invoiceNumber?: string, mode: "view" | "download" = "view") => {
    setPdfLoadingId(`${invoiceId}-${mode}`);
    try {
      const blob = await sellerApi.downloadInvoicePdf(invoiceId, mode === "download");
      const blobUrl = URL.createObjectURL(blob);
      if (mode === "view") {
        window.open(blobUrl, "_blank");
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `Invoice-${invoiceNumber || invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }
    } catch {
      const directUrl = sellerApi.getInvoicePdfUrl(invoiceId, mode === "download");
      window.open(directUrl, "_blank");
    } finally {
      setPdfLoadingId(null);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sellerApi.getDashboard();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Backend unavailable";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = data?.metrics ?? {
    assignedPackets: 0,
    soldPackets: 0,
    remainingPackets: 0,
    totalIncentivePaise: 0,
    totalIncentiveRupees: 0,
  };
  const recentSales = data?.recentSales ?? [];

  const soldPercent =
    metrics.assignedPackets > 0
      ? Math.min(100, Math.round((metrics.soldPackets / metrics.assignedPackets) * 100))
      : 0;

  const sellerLocationLabel =
    ["Seller", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  return (
    <DashboardShell
      role="Seller"
      workspace="Seller workspace"
      userName={user?.name ?? "Seller"}
      userDetail={sellerLocationLabel}
      navigation={sellerNavigation}
    >
      <PageHeading
        eyebrow="Field operations"
        title="Seller home"
        description="Your live inventory balance, confirmed retail sales, customer relationships, and accrued performance incentives."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchDashboard}
              disabled={loading}
              title="Refresh live metrics"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <Link
              href="/seller/customers/new"
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-[#E61C5D] shadow-sm transition hover:bg-rose-50"
            >
              <Store className="h-4 w-4" /> Add customer
            </Link>
            <Link
              href="/seller/sales/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:bg-[#c91550]"
            >
              <Plus className="h-4 w-4" /> Record sale
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          <span>Unable to load live seller data. ({error})</span>
          <button onClick={fetchDashboard} className="underline hover:text-amber-950 font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Primary KPI Grid according to PRD Section 4 */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Available Stock"
          value={`${metrics.remainingPackets.toLocaleString("en-IN")} pkts`}
          note="Packets ready in hand to sell"
          icon="packages"
          tone="amber"
        />
        <MetricCard
          label="Confirmed Sold"
          value={`${metrics.soldPackets.toLocaleString("en-IN")} pkts`}
          note="Delivered to retail customers"
          icon="packages"
          tone="green"
        />
        <MetricCard
          label="Total Assigned"
          value={`${metrics.assignedPackets.toLocaleString("en-IN")} pkts`}
          note="Received from territory depot"
          icon="package"
          tone="rose"
        />
        <MetricCard
          label="Incentive Earned"
          value={`₹${metrics.totalIncentiveRupees.toLocaleString("en-IN")}`}
          note="Performance reward accrued"
          icon="rupee"
          tone="green"
        />
      </div>

      {/* Stock Progress & Price Policy Banner */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-[0_8px_30px_rgba(104,48,66,0.04)] lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E61C5D]">Stock balance</p>
              <h3 className="mt-1 text-xl font-bold font-sans tracking-tight text-[#156035]">Inventory distribution</h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#156035]">
              {soldPercent}% sold
            </span>
          </div>

          <div className="mt-4">
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#156035] to-[#E61C5D] transition-all duration-500"
                style={{ width: `${soldPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4 text-center">
            <div>
              <p className="text-xs text-zinc-700">Assigned</p>
              <p className="mt-1 text-xl font-bold font-sans tracking-tight text-zinc-900">
                {metrics.assignedPackets}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-700">Sold</p>
              <p className="mt-1 text-xl font-bold font-sans tracking-tight text-[#156035]">
                {metrics.soldPackets}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-700">Remaining</p>
              <p className="mt-1 text-xl font-bold font-sans tracking-tight text-amber-600">
                {metrics.remainingPackets}
              </p>
            </div>
          </div>
        </div>

        {/* Business Rule 2 Note (PRD Section 8) */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-gradient-to-br from-[#FFFDF8] to-[#FFF9EE] p-5 shadow-[0_8px_30px_rgba(104,48,66,0.04)]">
          <div>
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-bold uppercase tracking-[0.16em]">Price Rule notice</p>
            </div>
            <h4 className="mt-2 text-sm font-bold text-zinc-900">Standard rate: ₹25 / packet</h4>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-900">
              Sales below ₹25 require Super Admin WhatsApp approval before packet deduction and incentive calculation.
            </p>
          </div>
          <Link
            href="/seller/sales/new"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#E61C5D] hover:underline"
          >
            Record new sale <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Recent Sales & Quick Actions */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <SectionCard
          title="Recent field sales"
          description="Your latest recorded transactions with retail stores"
          action={
            <Link href="/seller/sales" className="text-xs font-bold text-[#E61C5D] hover:underline">
              View all sales &rarr;
            </Link>
          }
        >
          <div className="space-y-3">
            {recentSales && recentSales.length > 0 ? (
              recentSales.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-[#FFFDFD]"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-rose-50 p-2 text-[#E61C5D]">
                      <ReceiptIndianRupee className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-zinc-800">
                        {s.customer?.shopName || "Customer Store"}
                      </p>
                      <p className="text-xs text-zinc-700">
                        {s.quantity} packets ·{" "}
                        <span className="font-semibold text-zinc-900">
                          {s.paymentMode === "CASH" ? "Cash" : s.paymentMode === "BANK" ? "Bank" : "Pending"}
                        </span>{" "}
                        · {new Date(s.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#156035]">
                        ₹{(s.totalPaise / 100).toLocaleString("en-IN")}
                      </p>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          s.status === "CONFIRMED"
                            ? "bg-emerald-50 text-[#157347]"
                            : s.status === "PENDING_APPROVAL"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-[#E61C5D]"
                        }`}
                      >
                        {s.status === "CONFIRMED"
                          ? "Confirmed"
                          : s.status === "PENDING_APPROVAL"
                          ? "Pending approval"
                          : "Rejected"}
                      </span>
                    </div>

                    {s.invoice?.id && (
                      <div className="flex items-center gap-1 border-l border-zinc-200 pl-2">
                        <button
                          type="button"
                          onClick={() => handleInvoicePdf(s.invoice!.id, s.invoice?.number, "view")}
                          disabled={Boolean(pdfLoadingId)}
                          title="View Tax Invoice PDF"
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {pdfLoadingId === `${s.invoice.id}-view` ? (
                            <Loader2 className="h-3 w-3 animate-spin text-emerald-700" />
                          ) : (
                            <Eye className="h-3 w-3 text-emerald-700" />
                          )}
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInvoicePdf(s.invoice!.id, s.invoice?.number, "download")}
                          disabled={Boolean(pdfLoadingId)}
                          title="Download Invoice PDF"
                          className="rounded-lg p-1 text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
                        >
                          {pdfLoadingId === `${s.invoice.id}-download` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#E61C5D]" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center text-xs text-zinc-700">
                No recorded sales yet. Click &quot;Record sale&quot; to log your first field transaction.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Quick actions" description="Daily field tools">
          <div className="space-y-3">
            <Link
              href="/seller/sales/new"
              className="flex items-center justify-between rounded-xl border border-rose-100 bg-[#FFF8FA] p-4 transition hover:bg-rose-50"
            >
              <div className="flex items-center gap-3">
                <ReceiptIndianRupee className="h-4 w-4 text-[#E61C5D]" />
                <div>
                  <p className="text-sm font-bold text-zinc-800">Record Field Sale</p>
                  <p className="text-xs text-zinc-700">Calculate totals, packet cost &amp; invoice</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#E61C5D]">Record &rarr;</span>
            </Link>

            <Link
              href="/seller/customers/new"
              className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-zinc-50"
            >
              <div className="flex items-center gap-3">
                <Store className="h-4 w-4 text-[#156035]" />
                <div>
                  <p className="text-sm font-bold text-zinc-800">Onboard Retail Shop</p>
                  <p className="text-xs text-zinc-700">Add shopkeeper, category &amp; GPS location</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#156035]">+ Add</span>
            </Link>

            <Link
              href="/seller/inventory"
              className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-zinc-50"
            >
              <div className="flex items-center gap-3">
                <PackageCheck className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-zinc-800">My Packet Inventory</p>
                  <p className="text-xs text-zinc-700">{metrics.remainingPackets} packets in hand</p>
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-900">Audit &rarr;</span>
            </Link>

            <Link
              href="/seller/incentive"
              className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 transition hover:bg-zinc-50"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-zinc-800">Incentive Status</p>
                  <p className="text-xs text-zinc-700">₹{metrics.totalIncentiveRupees} earned this month</p>
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-900">View &rarr;</span>
            </Link>
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
