"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRightLeft, CheckCircle2, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import type { StockTransactionItem, WarehouseItem } from "@/lib/api/types";

export default function TransfersPage() {
  const [locations, setLocations] = useState<WarehouseItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransactionItem[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [quantity, setQuantity] = useState<number | string>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [invRes, txRes] = await Promise.all([
        adminApi.getInventorySummary().catch(() => null),
        adminApi.listTransactions().catch(() => ({ transactions: [] })),
      ]);

      const allLocs: WarehouseItem[] = invRes?.locations ?? invRes?.warehouses ?? [];
      setLocations(allLocs);

      // Auto-select source (default to HQ if exists, else first location)
      const hq = allLocs.find((l) => l.type === "HQ");
      const defaultSource = hq || allLocs[0];
      const defaultDest = allLocs.find((l) => l.id !== defaultSource?.id);

      setSourceId((prev) => (prev && allLocs.some((l) => l.id === prev) ? prev : defaultSource?.id || ""));
      setDestinationId((prev) => (prev && allLocs.some((l) => l.id === prev && l.id !== defaultSource?.id) ? prev : defaultDest?.id || ""));

      setTransactions(txRes?.transactions ?? (txRes as any)?.items ?? []);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const hqLocations = useMemo(() => locations.filter((l) => l.type === "HQ"), [locations]);
  const warehouseLocations = useMemo(() => locations.filter((l) => l.type === "WAREHOUSE"), [locations]);
  const sellerLocations = useMemo(() => locations.filter((l) => l.type === "SELLER"), [locations]);

  const selectedSource = useMemo(() => locations.find((l) => l.id === sourceId), [locations, sourceId]);
  const selectedDestination = useMemo(() => locations.find((l) => l.id === destinationId), [locations, destinationId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destinationId) {
      setError("Please select both a source and destination location.");
      return;
    }
    if (sourceId === destinationId) {
      setError("Source and destination cannot be the same location.");
      return;
    }

    const numQty = Number(quantity);
    if (!numQty || numQty <= 0 || !Number.isInteger(numQty)) {
      setError("Please enter a valid positive packet quantity.");
      return;
    }

    if (selectedSource && numQty > selectedSource.balance) {
      setError(`Transfer quantity exceeds available stock (${selectedSource.balance.toLocaleString("en-IN")} packets available at ${selectedSource.name}).`);
      return;
    }

    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      await adminApi.transferStock({
        sourceId,
        destinationId,
        quantity: numQty,
      });

      setNotice(`Successfully recorded transfer of ${numQty} packets from ${selectedSource?.name || "source"} to ${selectedDestination?.name || "destination"}.`);
      await loadData();
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

      {locations.length < 2 && !isLoading && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>At least two locations</strong> (e.g., HQ and a regional warehouse or seller) are required to perform a stock transfer.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/inventory"
                className="inline-flex items-center gap-1 rounded-lg bg-amber-200 px-3 py-1.5 font-bold text-amber-900 hover:bg-amber-300"
              >
                <Plus className="h-3.5 w-3.5" /> Add Warehouse
              </Link>
              <Link
                href="/admin/sellers/new"
                className="inline-flex items-center gap-1 rounded-lg bg-[#E61C5D] px-3 py-1.5 font-bold text-white hover:bg-[#c91550]"
              >
                <Plus className="h-3.5 w-3.5" /> Add Seller
              </Link>
            </div>
          </div>
        </div>
      )}

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
                onChange={(e) => {
                  const newSource = e.target.value;
                  setSourceId(newSource);
                  if (destinationId === newSource) {
                    const alt = locations.find((l) => l.id !== newSource);
                    setDestinationId(alt?.id || "");
                  }
                }}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-medium outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              >
                <option value="">Select source location...</option>
                {hqLocations.length > 0 && (
                  <optgroup label="Headquarters">
                    {hqLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.balance.toLocaleString("en-IN")} pkts available)
                      </option>
                    ))}
                  </optgroup>
                )}
                {warehouseLocations.length > 0 && (
                  <optgroup label="Regional Warehouses">
                    {warehouseLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.balance.toLocaleString("en-IN")} pkts available)
                      </option>
                    ))}
                  </optgroup>
                )}
                {sellerLocations.length > 0 && (
                  <optgroup label="Field Sellers">
                    {sellerLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.balance.toLocaleString("en-IN")} pkts available)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>

            <label className="block text-xs font-bold text-zinc-700">
              Destination Location (To) *
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-medium outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              >
                <option value="">Select destination location...</option>
                {hqLocations.filter((l) => l.id !== sourceId).length > 0 && (
                  <optgroup label="Headquarters">
                    {hqLocations
                      .filter((l) => l.id !== sourceId)
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.balance.toLocaleString("en-IN")} pkts currently)
                        </option>
                      ))}
                  </optgroup>
                )}
                {warehouseLocations.filter((l) => l.id !== sourceId).length > 0 && (
                  <optgroup label="Regional Warehouses">
                    {warehouseLocations
                      .filter((l) => l.id !== sourceId)
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.balance.toLocaleString("en-IN")} pkts currently)
                        </option>
                      ))}
                  </optgroup>
                )}
                {sellerLocations.filter((l) => l.id !== sourceId).length > 0 && (
                  <optgroup label="Field Sellers">
                    {sellerLocations
                      .filter((l) => l.id !== sourceId)
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.balance.toLocaleString("en-IN")} pkts currently)
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </label>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-700">
                  Packets to transfer *
                </label>
                {selectedSource && (
                  <span className="text-xs font-medium text-zinc-500">
                    Available: <strong className="text-[#156035]">{selectedSource.balance.toLocaleString("en-IN")}</strong> pkts
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                max={selectedSource ? selectedSource.balance : undefined}
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-medium outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                placeholder="Enter packet quantity"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || locations.length < 2 || (selectedSource ? selectedSource.balance < 1 : false)}
              className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                <div key={t.id} className="rounded-xl border border-zinc-100 p-4 hover:border-zinc-200 transition">
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <span>{t.source?.name || "Depot"}</span>
                    <ArrowRightLeft className="h-4 w-4 shrink-0 text-[#E61C5D]" />
                    <span>{t.destination?.name || "Destination"}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                    <span>{t.quantity.toLocaleString("en-IN")} packets · {new Date(t.createdAt).toLocaleDateString("en-IN")}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-400">
                No transfer history recorded yet. Executed transfers will appear here.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
