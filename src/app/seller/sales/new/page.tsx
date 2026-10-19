"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, IndianRupee, Loader2, PackageCheck, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import type { CustomerItem } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";

interface ProductOption {
  id: string;
  name: string;
  sku: string | null;
  basePricePaise: number;
  minimumPricePaise: number;
}

interface ProductStock {
  productId: string;
  balance: number;
}

interface LineItem {
  key: number;
  productId: string;
  quantity: number;
  unitPrice: number;
}

let lineKeyCounter = 1;

export default function NewSellerSalePage() {
  const router = useRouter();
  const { user } = useAuth();
  const userName = user?.name ?? "Seller";
  const userDetail = ["Seller", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productStocks, setProductStocks] = useState<ProductStock[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { key: lineKeyCounter++, productId: "", quantity: 1, unitPrice: 25 },
  ]);

  const [payment, setPayment] = useState<"CASH" | "BANK" | "PENDING">("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const grandTotal = useMemo(
    () => lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0),
    [lineItems]
  );

  const totalPackets = useMemo(
    () => lineItems.reduce((sum, li) => sum + li.quantity, 0),
    [lineItems]
  );

  const needsApproval = useMemo(() => {
    return lineItems.some((li) => {
      const product = products.find((p) => p.id === li.productId);
      if (!product) return false;
      return li.unitPrice * 100 < product.minimumPricePaise;
    });
  }, [lineItems, products]);

  const stockErrors = useMemo(() => {
    const perProduct: Record<string, number> = {};
    for (const li of lineItems) {
      if (li.productId) {
        perProduct[li.productId] = (perProduct[li.productId] || 0) + li.quantity;
      }
    }
    const errors: Record<string, string> = {};
    for (const [pid, qty] of Object.entries(perProduct)) {
      const stock = productStocks.find((s) => s.productId === pid);
      const available = stock?.balance ?? 0;
      if (qty > available) {
        const product = products.find((p) => p.id === pid);
        errors[pid] = `Only ${available} ${product?.name || "packets"} available, but ${qty} requested.`;
      }
    }
    return errors;
  }, [lineItems, productStocks, products]);

  const hasStockError = Object.keys(stockErrors).length > 0;

  useEffect(() => {
    let active = true;
    async function loadFormContext() {
      try {
        const [custRes, invRes, prodRes] = await Promise.all([
          sellerApi.listCustomers().catch(() => ({ customers: [] })),
          sellerApi.getInventory().catch(() => null),
          sellerApi.listProducts().catch(() => ({ items: [] })),
        ]);

        if (!active) return;

        if (custRes.customers.length > 0) {
          setCustomers(custRes.customers);
          setSelectedCustomerId(custRes.customers[0].id);
        }

        if (invRes) {
          setTotalBalance(invRes.balance ?? invRes.remaining ?? 0);
          if (invRes.products && invRes.products.length > 0) {
            setProductStocks(invRes.products.map((p) => ({ productId: p.productId, balance: p.balance })));
          }
        }

        if (prodRes.items.length > 0) {
          setProducts(prodRes.items);
          setLineItems([{
            key: lineKeyCounter++,
            productId: prodRes.items[0].id,
            quantity: 1,
            unitPrice: prodRes.items[0].basePricePaise / 100,
          }]);
        }
      } catch {
        // Ignored
      }
    }

    loadFormContext();
    return () => { active = false; };
  }, []);

  const addLineItem = () => {
    const unusedProduct = products.find((p) => !lineItems.some((li) => li.productId === p.id));
    setLineItems((prev) => [
      ...prev,
      {
        key: lineKeyCounter++,
        productId: unusedProduct?.id || "",
        quantity: 1,
        unitPrice: unusedProduct ? unusedProduct.basePricePaise / 100 : 25,
      },
    ]);
  };

  const removeLineItem = (key: number) => {
    setLineItems((prev) => (prev.length <= 1 ? prev : prev.filter((li) => li.key !== key)));
  };

  const updateLineItem = (key: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((li) => {
        if (li.key !== key) return li;
        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          return { ...li, productId: value as string, unitPrice: product ? product.basePricePaise / 100 : li.unitPrice };
        }
        return { ...li, [field]: Number(value) };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasStockError) return;

    const validLines = lineItems.filter((li) => li.productId && li.quantity > 0);
    if (validLines.length === 0) {
      setError("Add at least one product with quantity.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      if (validLines.length === 1 && products.length <= 1) {
        await sellerApi.createSale({
          customerId: selectedCustomerId,
          quantity: validLines[0].quantity,
          unitPricePaise: validLines[0].unitPrice * 100,
          paymentMode: payment,
        });
      } else {
        await sellerApi.createSale({
          customerId: selectedCustomerId,
          items: validLines.map((li) => ({
            productId: li.productId,
            quantity: li.quantity,
            unitPricePaise: li.unitPrice * 100,
          })),
          paymentMode: payment,
        });
      }

      setSubmitted(true);
      setTimeout(() => {
        router.push("/seller/sales");
      }, 700);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || "Failed to record sale.");
      } else {
        setError("Failed to record sale.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableStock = (productId: string) => {
    const stock = productStocks.find((s) => s.productId === productId);
    return stock?.balance ?? 0;
  };

  return (
    <DashboardShell
      role="Seller"
      workspace="Seller workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={sellerNavigation}
    >
      <Link href="/seller/sales" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800 hover:text-[#E61C5D]">
        <ArrowLeft className="h-4 w-4" />Back to sales
      </Link>
      <div className="mt-7">
        <PageHeading
          eyebrow="Sales entry"
          title="Record a sale"
          description="Select a customer store, add products with quantities and prices, and confirm the transaction."
        />
      </div>

      <SectionCard title="Sale information" description="Enter retail customer sale details and payment receipt" className="mt-8">
        <form className="max-w-2xl space-y-5" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-[#B4234D]">
              {error}
            </p>
          )}

          <label className="block text-xs font-bold text-zinc-700">
            Customer / shop *
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300"
            >
              {customers.length === 0 ? (
                <option value="">No registered stores found</option>
              ) : (
                Array.from(new Map(customers.map((c) => [c.id, c])).values()).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shopName} ({c.contactName || c.village || "Store"})
                  </option>
                ))
              )}
            </select>
          </label>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-700">Products *</p>
              {products.length > 1 && lineItems.length < products.length && (
                <button
                  type="button"
                  onClick={addLineItem}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#FFF8FA] px-2.5 py-1.5 text-xs font-bold text-[#E61C5D] hover:bg-rose-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Add product
                </button>
              )}
            </div>

            {lineItems.map((li, idx) => {
              const product = products.find((p) => p.id === li.productId);
              const available = getAvailableStock(li.productId);
              const belowMin = product ? li.unitPrice * 100 < product.minimumPricePaise : false;

              return (
                <div key={li.key} className="rounded-xl border border-zinc-200 bg-[#FAFAFA] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Item {idx + 1}</span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(li.key)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-[#E61C5D]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {products.length > 1 ? (
                    <label className="block text-xs font-bold text-zinc-700">
                      Product
                      <select
                        value={li.productId}
                        onChange={(e) => updateLineItem(li.key, "productId", e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold outline-none focus:border-rose-300"
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.sku ? `(${p.sku})` : ""} — ₹{p.basePricePaise / 100}/pkt
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <p className="text-sm font-semibold text-zinc-800">
                      {product?.name || "Product"} {product?.sku ? `(${product.sku})` : ""}
                    </p>
                  )}

                  <div className="grid gap-3 grid-cols-2">
                    <label className="block text-xs font-bold text-zinc-700">
                      Qty (packets)
                      <input
                        type="number"
                        min="1"
                        required
                        value={li.quantity}
                        onChange={(e) => updateLineItem(li.key, "quantity", e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold outline-none focus:border-rose-300"
                      />
                    </label>
                    <label className="block text-xs font-bold text-zinc-700">
                      Price/pkt (₹)
                      <input
                        type="number"
                        min="1"
                        required
                        value={li.unitPrice}
                        onChange={(e) => updateLineItem(li.key, "unitPrice", e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold outline-none focus:border-rose-300"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      Available: <strong className="text-[#156035]">{available}</strong> pkts
                      {belowMin && product && (
                        <span className="ml-2 text-amber-600">
                          (min ₹{product.minimumPricePaise / 100}/pkt)
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-zinc-800">
                      Subtotal: ₹{(li.quantity * li.unitPrice).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {stockErrors[li.productId] && (
                    <p className="text-xs font-semibold text-[#E61C5D]">{stockErrors[li.productId]}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-[#FFF8FA] p-4">
              <PackageCheck className="h-4 w-4 text-[#E61C5D]" />
              <p className="mt-3 text-xs text-zinc-800">Total packets</p>
              <p className="mt-1 text-xl font-bold text-[#156035]">{totalPackets}</p>
            </div>
            <div className="rounded-xl bg-[#FFF8FA] p-4">
              <IndianRupee className="h-4 w-4 text-[#E61C5D]" />
              <p className="mt-3 text-xs text-zinc-800">Grand total</p>
              <p className="mt-1 text-xl font-bold text-[#156035]">₹{grandTotal.toLocaleString("en-IN")}</p>
            </div>
            <label className="block rounded-xl bg-[#FFF8FA] p-4 text-xs font-bold text-zinc-700">
              Payment mode
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value as "CASH" | "BANK" | "PENDING")}
                className="mt-2 h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs font-semibold"
              >
                <option value="CASH">Cash</option>
                <option value="BANK">Bank transfer</option>
                <option value="PENDING">Pending</option>
              </select>
            </label>
          </div>

          {hasStockError && (
            <div className="rounded-xl bg-rose-50 p-4 text-xs font-semibold text-[#E61C5D]">
              Some products exceed available stock. Reduce quantities to proceed.
            </div>
          )}

          {needsApproval && (
            <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-700">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>
                One or more products are priced below their minimum price. This sale will be submitted for Super Admin approval before stock is deducted and incentives are awarded.
              </span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-[#157347]">
                {needsApproval ? "Approval request dispatched! Redirecting to sales..." : "Sale recorded successfully! Redirecting to sales ledger..."}
              </div>
              <Link
                href="/seller/sales"
                className="inline-block rounded-xl bg-[#156035] px-5 py-3 text-xs font-bold text-white hover:bg-[#0f4e2b]"
              >
                View in Sales Ledger
              </Link>
            </div>
          ) : (
            <button
              type="submit"
              disabled={hasStockError || isSubmitting}
              className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting sale...
                </>
              ) : needsApproval ? (
                "Send for Admin approval"
              ) : (
                "Confirm & record sale"
              )}
            </button>
          )}
        </form>
      </SectionCard>
    </DashboardShell>
  );
}
