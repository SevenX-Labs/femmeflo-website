"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock3, IndianRupee, Loader2, RefreshCw, ShieldAlert, X } from "lucide-react";
import { DashboardShell } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import type { SaleItem } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

type ApprovalStatus = "Pending" | "Approved" | "Rejected";
type Filter = "All" | ApprovalStatus;

export default function AdminApprovalsPage() {
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SaleItem | null>(null);
  const [notice, setNotice] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listApprovals();
      setSales(res?.pendingSales ?? (res as any)?.items ?? []);
    } catch {
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (sale: SaleItem) => {
    setProcessingId(sale.id);
    try {
      await adminApi.approveSale(sale.id);
      setSales((prev) =>
        prev.map((s) => (s.id === sale.id ? { ...s, status: "CONFIRMED" } : s))
      );
      setNotice(`Sale for ${sale.customer?.shopName || sale.id} approved.`);
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Unable to approve sale.");
    } finally {
      setProcessingId(null);
      setSelected(null);
      setTimeout(() => setNotice(""), 3000);
    }
  };

  const handleReject = async (sale: SaleItem) => {
    setProcessingId(sale.id);
    try {
      await adminApi.rejectSale(sale.id, "Below minimum operating floor");
      setSales((prev) =>
        prev.map((s) => (s.id === sale.id ? { ...s, status: "REJECTED" } : s))
      );
      setNotice(`Sale for ${sale.customer?.shopName || sale.id} rejected.`);
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Unable to reject sale.");
    } finally {
      setProcessingId(null);
      setSelected(null);
      setTimeout(() => setNotice(""), 3000);
    }
  };

  const visibleSales = useMemo(() => {
    return (sales ?? []).filter((s) => {
      const statusMap: Record<string, ApprovalStatus> = {
        CONFIRMED: "Approved",
        PENDING_APPROVAL: "Pending",
        REJECTED: "Rejected",
      };
      const curStatus = statusMap[s.status] || "Pending";
      const text = `${s.customer?.shopName || ""} ${s.seller?.name || ""} ${s.id}`.toLowerCase();
      return (filter === "All" || curStatus === filter) && text.includes(query.toLowerCase());
    });
  }, [filter, query, sales]);

  const pendingSales = (sales ?? []).filter((s) => s.status === "PENDING_APPROVAL");
  const pendingValue = pendingSales.reduce((sum, s) => sum + s.totalPaise / 100, 0);

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800 hover:text-[#E61C5D]">
          <ArrowLeft className="h-4 w-4" />Back to admin
        </Link>
        <div className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E61C5D]">Approval center</p>
            <h1 className="mt-2 font-playfair text-4xl font-bold text-[#156035] sm:text-5xl">
              Review low-price sales
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-800">
              Approve or reject sales submitted below the threshold ₹25 per-packet price before inventory deductions and incentives are posted.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
            <ShieldAlert className="h-4 w-4" />Approval required below ₹25
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-[0_8px_30px_rgba(104,48,66,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-800">Awaiting Review</p>
              <Clock3 className="h-4 w-4 text-[#E61C5D]" />
            </div>
            <p className="mt-3 text-3xl font-bold font-sans tracking-tight text-zinc-900">{pendingSales.length}</p>
            <p className="mt-1 text-xs text-zinc-700">Requests in queue</p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-[0_8px_30px_rgba(104,48,66,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-800">Value Under Review</p>
              <IndianRupee className="h-4 w-4 text-[#E61C5D]" />
            </div>
            <p className="mt-3 text-3xl font-bold font-sans tracking-tight text-zinc-900">₹{pendingValue.toLocaleString("en-IN")}</p>
            <p className="mt-1 text-xs text-zinc-700">Pending transaction amount</p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-[0_8px_30px_rgba(104,48,66,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-800">Floor Price Rule</p>
              <Check className="h-4 w-4 text-[#156035]" />
            </div>
            <p className="mt-3 text-3xl font-bold font-sans tracking-tight text-zinc-900">₹25</p>
            <p className="mt-1 text-xs text-zinc-700">Minimum automatic price</p>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-[0_8px_30px_rgba(104,48,66,0.04)]">
          <div className="border-b border-zinc-100 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-playfair text-2xl font-bold text-[#156035]">Approval queue</h2>
                <p className="mt-1 text-xs text-zinc-700">{visibleSales.length} requests in view</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchApprovals}
                  disabled={loading}
                  title="Refresh queue"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 hover:border-rose-200 hover:text-[#E61C5D]"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
                </button>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customer or officer"
                  className="h-10 w-full sm:w-64 rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-1 overflow-x-auto rounded-xl bg-[#FAF8F5] p-1">
              {(["All", "Pending", "Approved", "Rejected"] as Filter[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold whitespace-nowrap ${
                    filter === tab ? "bg-white text-[#E61C5D] shadow-sm" : "text-zinc-800 hover:text-zinc-800"
                  }`}
                >
                  {tab}
                  {tab === "Pending" && (
                    <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                      {pendingSales.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* MOBILE CARD VIEW FOR APPROVALS (under 640px) */}
          <div className="sm:hidden p-4 space-y-3.5">
            {visibleSales.map((s) => {
              const isPending = s.status === "PENDING_APPROVAL";
              const isApproved = s.status === "CONFIRMED";
              const unitPrice = s.unitPricePaise / 100;
              const total = s.totalPaise / 100;

              return (
                <div
                  key={`m-${s.id}`}
                  className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button onClick={() => setSelected(s)} className="text-left">
                        <h4 className="text-sm font-bold text-zinc-950 hover:text-[#E61C5D]">
                          {s.customer?.shopName || "Retail Customer"}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">
                          ID: {s.id.slice(0, 10)}...
                        </span>
                      </button>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        isApproved
                          ? "bg-emerald-50 text-[#157347]"
                          : isPending
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-[#E61C5D]"
                      }`}
                    >
                      {isApproved ? "Approved" : isPending ? "Pending Review" : "Rejected"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-zinc-100 pt-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                        Field Officer
                      </span>
                      <span className="font-semibold text-zinc-900 block mt-0.5">
                        {s.seller?.name || "Officer"}
                      </span>
                      <span className="text-[11px] text-zinc-600 block">
                        {[s.seller?.village, s.seller?.district].filter(Boolean).join(", ") || "Territory"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                        Price vs Total
                      </span>
                      <span className="font-bold text-amber-700 block mt-0.5">
                        ₹{unitPrice}/pkt <span className="text-zinc-600 font-normal">({s.quantity} pkts)</span>
                      </span>
                      <span className="font-extrabold text-[#156035] block text-sm">
                        ₹{total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelected(s)}
                      className="text-xs font-bold text-zinc-700 hover:text-[#E61C5D]"
                    >
                      Inspect Details →
                    </button>

                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReject(s)}
                          disabled={processingId === s.id}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-[#E61C5D] hover:bg-rose-100 disabled:opacity-50 transition"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => handleApprove(s)}
                          disabled={processingId === s.id}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#156035] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] disabled:opacity-50 transition"
                        >
                          {processingId === s.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {visibleSales.length === 0 && (
              <p className="py-10 text-center text-sm text-zinc-800">No approval requests in this filter.</p>
            )}
          </div>

          {/* DESKTOP TABLE VIEW (640px and up) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-220 text-left">
              <thead className="bg-[#FFF8FA] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-700">
                <tr>
                  <th className="px-5 py-4">Request</th>
                  <th className="px-5 py-4">Officer / territory</th>
                  <th className="px-5 py-4">Packets</th>
                  <th className="px-5 py-4">Unit price</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {visibleSales.map((s) => {
                  const isPending = s.status === "PENDING_APPROVAL";
                  const isApproved = s.status === "CONFIRMED";
                  const unitPrice = s.unitPricePaise / 100;
                  const total = s.totalPaise / 100;

                  return (
                    <tr key={s.id} className="hover:bg-[#FFFDFD]">
                      <td className="px-5 py-4">
                        <button onClick={() => setSelected(s)} className="text-left">
                          <p className="text-sm font-bold text-zinc-800 hover:text-[#E61C5D]">
                            {s.customer?.shopName || "Retail Customer"}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-700">{s.id}</p>
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-zinc-700">{s.seller?.name || "Seller"}</p>
                        <p className="mt-1 text-xs text-zinc-700">
                          {[s.seller?.village, s.seller?.district].filter(Boolean).join(", ") || "Territory"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold">{s.quantity}</td>
                      <td className="px-5 py-4 text-sm font-bold text-amber-700">₹{unitPrice}</td>
                      <td className="px-5 py-4 text-sm font-bold text-[#156035]">₹{total}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            isApproved
                              ? "bg-emerald-50 text-[#157347]"
                              : isPending
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-[#E61C5D]"
                          }`}
                        >
                          {isApproved ? "Approved" : isPending ? "Pending" : "Rejected"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isPending ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(s)}
                              disabled={processingId === s.id}
                              title="Approve sale"
                              className="rounded-lg bg-emerald-50 p-2 text-[#157347] hover:bg-emerald-100 disabled:opacity-50"
                            >
                              {processingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleReject(s)}
                              disabled={processingId === s.id}
                              title="Reject sale"
                              className="rounded-lg bg-rose-50 p-2 text-[#E61C5D] hover:bg-rose-100 disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setSelected(s)} className="text-xs font-bold text-[#E61C5D]">
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleSales.length === 0 && (
              <p className="py-14 text-center text-sm text-zinc-800">No approval requests in this filter.</p>
            )}
          </div>
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/35 px-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E61C5D]">{selected.id}</p>
                <h2 className="mt-2 font-playfair text-3xl font-bold text-[#156035]">Sale review</h2>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-zinc-700 hover:bg-rose-50" aria-label="Close review">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 space-y-3 rounded-xl bg-[#FFF8FA] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-800">Customer</span>
                <strong>{selected.customer?.shopName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-800">Seller</span>
                <strong>{selected.seller?.name}</strong>
              </div>
              {selected.lineItems && selected.lineItems.length > 0 ? (
                <>
                  <div className="border-t border-rose-100 pt-3">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Line Items</p>
                    <div className="space-y-2">
                      {selected.lineItems.map((li) => (
                        <div key={li.id} className="flex items-center justify-between rounded-lg bg-white p-2.5">
                          <div>
                            <p className="text-xs font-bold text-zinc-900">{li.product?.name || "Product"}</p>
                            <p className="text-[11px] text-zinc-500">{li.quantity} pkts × ₹{li.unitPricePaise / 100}</p>
                          </div>
                          <span className="text-xs font-bold text-zinc-800">₹{li.totalPaise / 100}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-800">Total packets</span>
                    <strong>{selected.quantity}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-zinc-800">Packets</span>
                    <strong>{selected.quantity}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-800">Per packet</span>
                    <strong className="text-amber-700">₹{selected.unitPricePaise / 100}</strong>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-rose-100 pt-3">
                <span className="font-bold">Total amount</span>
                <strong className="text-[#156035]">₹{(selected.totalPaise / 100).toLocaleString("en-IN")}</strong>
              </div>
            </div>
            {selected.status === "PENDING_APPROVAL" ? (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleReject(selected)}
                  disabled={Boolean(processingId)}
                  className="rounded-xl border border-rose-200 py-3 text-sm font-bold text-[#E61C5D] hover:bg-rose-50"
                >
                  Reject sale
                </button>
                <button
                  onClick={() => handleApprove(selected)}
                  disabled={Boolean(processingId)}
                  className="rounded-xl bg-[#156035] py-3 text-sm font-bold text-white hover:bg-[#0f4e2b]"
                >
                  Approve sale
                </button>
              </div>
            ) : (
              <p className="mt-6 rounded-xl bg-zinc-50 p-3 text-center text-xs font-bold text-zinc-800">
                This request is already resolved.
              </p>
            )}
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed bottom-6 right-6 z-60 rounded-xl bg-[#156035] px-4 py-3 text-sm font-bold text-white shadow-xl">
          {notice}
        </div>
      )}
    </DashboardShell>
  );
}
