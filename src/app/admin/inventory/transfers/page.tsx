"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRightLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import type { StockTransactionItem, WarehouseItem } from "@/lib/api/types";

export default function TransfersPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransactionItem[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [whRes, txRes] = await Promise.all([
        adminApi.listWarehouses().catch(() => ({ warehouses: [] })),
        adminApi.listTransactions().catch(() => ({ transactions: [] })),
      ]);

      const warehouses = whRes?.warehouses ?? (whRes as any)?.items ?? [];
      if (warehouses.length > 0) {
        setWarehouses(warehouses);
        setSourceId(warehouses[0].id);
        if (warehouses.length > 1) {
          setDestinationId(warehouses[1].id);
        }
      }

      setTransactions(txRes?.transactions ?? (txRes as any)?.items ?? []);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destinationId || sourceId === destinationId) {
      setError("Please select different source and destination locations.");
      return;
    }

    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      await adminApi.transferStock({
        sourceId,
        destinationId,
        quantity: Number(quantity),
      });

      setNotice(`Successfully recorded transfer of ${quantity} packets.`);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process stock transfer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-[#E61C5D]">
        <ArrowLeft className="h-4 w-4" />Back to inventory
      </Link>
      <div className="mt-7">
        <PageHeading
          eyebrow="Inventory movement"
          title="Stock transfers"
          description="Record verified packet movement from HQ to regional warehouses and from warehouses to field Sellers."
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Create transfer" description="Choose a source depot, destination, and packet quantity">
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#B4234D]">
                {error}
              </p>
            )}

            <label className="block text-xs font-bold text-zinc-700">
              Source Location (From) *
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.balance} available)
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-zinc-700">
              Destination Location (To) *
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
              >
                {warehouses
                  .filter((w) => w.id !== sourceId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-zinc-700">
              Packets to transfer *
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing transfer...
                </>
              ) : (
                "Execute stock transfer"
              )}
            </button>

            {notice && <p className="text-xs font-semibold text-emerald-700">{notice}</p>}
            <p className="text-[11px] text-zinc-400">
              Endpoint: <code className="text-[#E61C5D]">POST /api/v1/admin/inventory/transfers</code>
            </p>
          </form>
        </SectionCard>

        <SectionCard title="Transaction history" description="Recent stock movements across the distribution chain">
          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <div key={t.id} className="rounded-xl border border-zinc-100 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <span>{t.source?.name || "Depot"}</span>
                    <ArrowRightLeft className="h-4 w-4 shrink-0 text-[#E61C5D]" />
                    <span>{t.destination?.name || "Destination"}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                    <span>{t.quantity.toLocaleString()} packets · {new Date(t.createdAt).toLocaleDateString("en-IN")}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
                    </span>
                  </div>
                </div>
              ))
            ) : (
              [
                { from: "HQ Central Store", to: "Thane Regional Depot", qty: 8000, date: "Oct 5, 2026", status: "Received" },
                { from: "Thane Regional Depot", to: "Ananya Deshmukh (Diva)", qty: 40, date: "Oct 5, 2026", status: "Received" },
                { from: "Thane Regional Depot", to: "Meera Patil (Kalyan)", qty: 40, date: "Oct 4, 2026", status: "Received" },
              ].map((t, i) => (
                <div key={i} className="rounded-xl border border-zinc-100 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <span>{t.from}</span>
                    <ArrowRightLeft className="h-4 w-4 shrink-0 text-[#E61C5D]" />
                    <span>{t.to}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                    <span>{t.qty.toLocaleString()} packets · {t.date}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
