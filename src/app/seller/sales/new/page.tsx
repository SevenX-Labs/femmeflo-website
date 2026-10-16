"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, IndianRupee, Loader2, PackageCheck, ShieldAlert } from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import type { CustomerItem } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";

export default function NewSellerSalePage() {
  const router = useRouter();
  const { user } = useAuth();
  const userName = user?.name ?? "Seller";
  const userDetail = ["Seller", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [availableStock, setAvailableStock] = useState(0);
  const [packets, setPackets] = useState(1);
  const [price, setPrice] = useState(25);
  const [payment, setPayment] = useState<"CASH" | "BANK" | "PENDING">("CASH");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const total = useMemo(() => packets * price, [packets, price]);
  const needsApproval = price < 25;
  const overStock = packets > availableStock;

  useEffect(() => {
    let active = true;
    async function loadFormContext() {
      try {
        const [custRes, invRes] = await Promise.all([
          sellerApi.listCustomers().catch(() => ({ customers: [] })),
          sellerApi.getInventory().catch(() => null),
        ]);

        if (active) {
          if (custRes.customers.length > 0) {
            setCustomers(custRes.customers);
            setSelectedCustomerId(custRes.customers[0].id);
          }

          if (invRes) {
            setAvailableStock(invRes.balance ?? invRes.remaining ?? 0);
          }
        }
      } catch {
        // Ignored
      }
    }

    loadFormContext();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (overStock) return;

    setError("");
    setIsSubmitting(true);

    try {
      await sellerApi.createSale({
        customerId: selectedCustomerId,
        quantity: packets,
        unitPricePaise: price * 100,
        paymentMode: payment,
      });

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
          description="Select a customer store, enter packet quantity and price, and confirm transaction."
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
                // Deduplicate by ID just in case
                Array.from(new Map(customers.map((c) => [c.id, c])).values()).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shopName} ({c.contactName || c.village || "Store"})
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-bold text-zinc-700">
              Packets sold *
              <input
                type="number"
                min="1"
                max={availableStock}
                required
                value={packets}
                onChange={(e) => setPackets(Number(e.target.value))}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300"
              />
            </label>
            <label className="block text-xs font-bold text-zinc-700">
              Per packet cost (₹) *
              <input
                type="number"
                min="1"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-[#FFF8FA] p-4">
              <PackageCheck className="h-4 w-4 text-[#E61C5D]" />
              <p className="mt-3 text-xs text-zinc-800">Available stock</p>
              <p className="mt-1 text-xl font-bold text-[#156035]">{availableStock}</p>
            </div>
            <div className="rounded-xl bg-[#FFF8FA] p-4">
              <IndianRupee className="h-4 w-4 text-[#E61C5D]" />
              <p className="mt-3 text-xs text-zinc-800">Total amount</p>
              <p className="mt-1 text-xl font-bold text-[#156035]">₹{total.toLocaleString("en-IN")}</p>
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

          {overStock && (
            <div className="rounded-xl bg-rose-50 p-4 text-xs font-semibold text-[#E61C5D]">
              You only have {availableStock} packets available. Reduce quantity to proceed.
            </div>
          )}

          {needsApproval && (
            <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-700">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>
                This sale is priced below ₹25 per packet. It will be submitted for Super Admin approval before stock is deducted and incentives are awarded.
              </span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-[#157347]">
                ✓ {needsApproval ? "Approval request dispatched! Redirecting to sales..." : "Sale recorded successfully! Redirecting to sales ledger..."}
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
              disabled={overStock || isSubmitting}
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
