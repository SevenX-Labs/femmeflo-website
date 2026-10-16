"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, CheckCircle2, PackageCheck, RefreshCw, Send } from "lucide-react";
import { DashboardShell, MetricCard, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import type { StockTransactionItem } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

export default function SellerInventoryPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Seller";
  const userDetail = ["Seller", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  const [balance, setBalance] = useState(0);
  const [assigned, setAssigned] = useState(0);
  const [sold, setSold] = useState(0);
  const [locationName, setLocationName] = useState("Seller stock");
  const [transactions, setTransactions] = useState<StockTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [invRes, txRes] = await Promise.all([
        sellerApi.getInventory().catch(() => null),
        sellerApi.listTransactions().catch(() => ({ transactions: [] })),
      ]);

      if (invRes) {
        setBalance(invRes.balance ?? invRes.remaining ?? 0);
        setAssigned(invRes.assignedPackets ?? invRes.assigned ?? 0);
        setSold(invRes.soldPackets ?? invRes.sold ?? 0);
        setLocationName(invRes.locationName ?? invRes.name ?? "Seller stock");
      }

      setTransactions(txRes?.transactions ?? (txRes as any)?.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  return (
    <DashboardShell
      role="Seller"
      workspace="Seller workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={sellerNavigation}
    >
      <PageHeading
        eyebrow="Inventory"
        title="My packets"
        description="Physical packets currently assigned to your custody. Confirmed sales automatically deduct packets from this verified balance."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={loadInventory}
              disabled={loading}
              title="Refresh stock"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 hover:border-rose-200 hover:text-[#E61C5D]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-[#E61C5D] hover:bg-rose-50">
              <Send className="h-4 w-4" /> Request stock
            </button>
          </div>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total Assigned" value={(assigned ?? 0).toString()} note="Cumulative depot allocation" icon="packages" />
        <MetricCard label="Confirmed Sold" value={(sold ?? 0).toString()} note="Deducted upon verified delivery" icon="packages" tone="green" />
        <MetricCard label="Remaining In Hand" value={(balance ?? 0).toString()} note="Available to sell today" icon="packages" tone="amber" />
      </div>

      <SectionCard title="Stock movement & ledger" description={`Verified audit logs for ${locationName}`} className="mt-8">
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-zinc-100 p-4">
                <div>
                  <p className="text-sm font-bold text-zinc-700">
                    {t.type === "TRANSFER" ? "Depot transfer received" : t.type === "SALE" ? "Customer sale deduction" : "Stock receipt"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-700">
                    {new Date(t.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    t.type === "TRANSFER" || t.type === "RECEIPT"
                      ? "bg-emerald-50 text-[#157347]"
                      : "bg-rose-50 text-[#E61C5D]"
                  }`}
                >
                  {t.type === "TRANSFER" || t.type === "RECEIPT" ? `+${t.quantity} packets` : `-${t.quantity} packets`}
                </span>
              </div>
            ))
          ) : <p className="py-10 text-center text-sm text-zinc-700">No stock movements available.</p>}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}