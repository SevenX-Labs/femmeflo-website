"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRightLeft, CheckCircle2, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import type { StockTransactionItem, WarehouseItem } from "@/lib/api/types";
import { webNotificationService } from "@/lib/notifications/webNotifications";

interface ProductOption {
  id: string;
  name: string;
  sku: string | null;
}

interface TransferItem {
  productId: string;
  quantity: number | string;
}

export default function TransfersPage() {
  const [locations, setLocations] = useState<WarehouseItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [transactions, setTransactions] = useState<StockTransactionItem[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [quantity, setQuantity] = useState<number | string>(1);
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [invRes, txRes, prodRes] = await Promise.all([
        adminApi.getInventorySummary().catch(() => null),
        adminApi.listTransactions().catch(() => ({ transactions: [] })),
        adminApi.listProducts({ active: "true" }).catch(() => ({ items: [] })),
      ]);

      const allLocs: WarehouseItem[] = invRes?.locations ?? invRes?.warehouses ?? [];
      setLocations(allLocs);

      const prods = (prodRes?.items ?? []).map((p) => ({ id: p.id, name: p.name, sku: p.sku }));
      setProducts(prods);

      const hq = allLocs.find((l) => l.type === "HQ");
      const defaultSource = hq || allLocs[0];
      const defaultDest = allLocs.find((l) => l.id !== defaultSource?.id);

      setSourceId((prev) => (prev && allLocs.some((l) => l.id === prev) ? prev : defaultSource?.id || ""));
      setDestinationId((prev) => (prev && allLocs.some((l) => l.id === prev && l.id !== defaultSource?.id) ? prev : defaultDest?.id || ""));

      if (prods.length > 0 && transferItems.length === 0) {
        setTransferItems([{ productId: prods[0].id, quantity: 1 }]);
      }

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

  const getSourceProductBalance = (productId: string) => {
    const pb = selectedSource?.productBalances?.find((b) => b.productId === productId);
    return pb?.balance ?? selectedSource?.balance ?? 0;
  };

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

    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      if (products.length > 0) {
        const validItems = transferItems.filter((it) => it.productId && Number(it.quantity) > 0);
        if (validItems.length === 0) {
          setError("Add at least one product with a valid quantity.");
          setIsSubmitting(false);
          return;
        }
        for (const it of validItems) {
          const qty = Number(it.quantity);
          if (!Number.isInteger(qty) || qty <= 0) {
            setError("All quantities must be positive integers.");
            setIsSubmitting(false);
            return;
          }
          const avail = getSourceProductBalance(it.productId);
          if (qty > avail) {
            const prod = products.find((p) => p.id === it.productId);
            setError(`Transfer quantity for ${prod?.name || "product"} exceeds available stock (${avail} available).`);
            setIsSubmitting(false);
            return;
          }
        }

        await adminApi.transferStock({
          sourceId,
          destinationId,
          items: validItems.map((it) => ({ productId: it.productId, quantity: Number(it.quantity) })),
        });

        const totalQty = validItems.reduce((s, it) => s + Number(it.quantity), 0);
        setNotice(`Successfully transferred ${totalQty} packets from ${selectedSource?.name || "source"} to ${selectedDestination?.name || "destination"}.`);
        webNotificationService.addNotification({
          recipientRole: "SUPER_ADMIN",
          title: "Stock Transfer Completed",
          message: `Transferred ${totalQty} packets from ${selectedSource?.name || "Source"} to ${selectedDestination?.name || "Destination"}.`,
          category: "INVENTORY",
          kind: "STOCK_TRANSFERRED",
          link: "/admin/inventory/transfers",
          metadata: {
            source: selectedSource?.name,
            destination: selectedDestination?.name,
            totalQty,
            itemCount: validItems.length,
          },
        });
      } else {
        const numQty = Number(quantity);
        if (!numQty || numQty <= 0 || !Number.isInteger(numQty)) {
          setError("Please enter a valid positive packet quantity.");
          setIsSubmitting(false);
          return;
        }
        if (selectedSource && numQty > selectedSource.balance) {
          setError(`Transfer quantity exceeds available stock (${selectedSource.balance.toLocaleString("en-IN")} packets available at ${selectedSource.name}).`);
          setIsSubmitting(false);
          return;
        }

        await adminApi.transferStock({
          sourceId,
          destinationId,
          quantity: numQty,
        });

        setNotice(`Successfully recorded transfer of ${numQty} packets from ${selectedSource?.name || "source"} to ${selectedDestination?.name || "destination"}.`);
        webNotificationService.addNotification({
          recipientRole: "SUPER_ADMIN",
          title: "Stock Transfer Completed",
          message: `Transferred ${numQty} packets from ${selectedSource?.name || "Source"} to ${selectedDestination?.name || "Destination"}.`,
          category: "INVENTORY",
          kind: "STOCK_TRANSFERRED",
          link: "/admin/inventory/transfers",
          metadata: {
            source: selectedSource?.name,
            destination: selectedDestination?.name,
            totalQty: numQty,
          },
        });
      }

      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process stock transfer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLocationOptions = (excludeId?: string) => {
    const filtered = (locs: WarehouseItem[], label: string) => {
      const items = locs.filter((l) => l.id !== excludeId);
      if (items.length === 0) return null;
      return (
        <optgroup key={label} label={label}>
          {items.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} ({loc.balance.toLocaleString("en-IN")} pkts available)
            </option>
          ))}
        </optgroup>
      );
    };

    return (
      <>
        {filtered(hqLocations, "Headquarters")}
        {filtered(warehouseLocations, "Regional Warehouses")}
        {filtered(sellerLocations, "Field Officers")}
      </>
    );
  };

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800 hover:text-[#E61C5D]">
        <ArrowLeft className="h-4 w-4" />Back to inventory
      </Link>
      <div className="mt-7">
        <PageHeading
          eyebrow="Inventory movement"
          title="Stock transfers"
          description="Record verified packet movement from HQ to regional warehouses and from warehouses to field officers."
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
                href="/admin/inventory?action=add-warehouse"
                className="inline-flex items-center gap-1 rounded-lg bg-amber-200 px-3 py-1.5 font-bold text-amber-900 hover:bg-amber-300"
              >
                <Plus className="h-3.5 w-3.5" /> Add Warehouse
              </Link>
              <Link
                href="/admin/sellers/new"
                className="inline-flex items-center gap-1 rounded-lg bg-[#E61C5D] px-3 py-1.5 font-bold text-white hover:bg-[#c91550]"
              >
                <Plus className="h-3.5 w-3.5" /> Add Field Officer
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Create transfer" description="Choose a source depot, destination, and product quantities">
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
                {renderLocationOptions()}
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
                {renderLocationOptions(sourceId)}
              </select>
            </label>

            {products.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-700">Products & Quantities *</label>
                  {transferItems.length < products.length && (
                    <button
                      type="button"
                      onClick={() => {
                        const unused = products.find((p) => !transferItems.some((it) => it.productId === p.id));
                        if (unused) setTransferItems((prev) => [...prev, { productId: unused.id, quantity: 1 }]);
                      }}
                      className="text-xs font-bold text-[#E61C5D] hover:text-[#c91550]"
                    >
                      + Add product
                    </button>
                  )}
                </div>
                {transferItems.map((item, idx) => {
                  const avail = getSourceProductBalance(item.productId);
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const newItems = [...transferItems];
                            newItems[idx] = { ...newItems[idx], productId: e.target.value };
                            setTransferItems(newItems);
                          }}
                          className="h-10 flex-1 rounded-lg border border-zinc-200 bg-[#FAF8F5] px-2 text-xs font-semibold outline-none focus:border-rose-300"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ""}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          max={avail}
                          required
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...transferItems];
                            newItems[idx] = { ...newItems[idx], quantity: e.target.value === "" ? "" : Number(e.target.value) };
                            setTransferItems(newItems);
                          }}
                          placeholder="Qty"
                          className="h-10 w-24 rounded-lg border border-zinc-200 bg-[#FAF8F5] px-2 text-sm font-semibold outline-none focus:border-rose-300"
                        />
                        {transferItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setTransferItems((prev) => prev.filter((_, i) => i !== idx))}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-[#E61C5D]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {selectedSource && (
                        <p className="text-[11px] text-zinc-500 pl-1">
                          Available at source: <strong className="text-[#156035]">{avail.toLocaleString("en-IN")}</strong> pkts
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-700">
                    Packets to transfer *
                  </label>
                  {selectedSource && (
                    <span className="text-xs font-medium text-zinc-800">
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
            )}

            <button
              type="submit"
              disabled={isSubmitting || locations.length < 2}
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
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-800">
                    <span>
                      {t.quantity.toLocaleString("en-IN")} packets
                      {t.product ? ` · ${t.product.name}` : ""}
                      {" · "}{new Date(t.createdAt).toLocaleDateString("en-IN")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-700">
                No transfer history recorded yet. Executed transfers will appear here.
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
