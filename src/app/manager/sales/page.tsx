"use client";

import { useCallback } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { DashboardShell, PageHeading } from "@/components/management/DashboardShell";
import { getManagerNavigation } from "@/components/management/navigation";
import { managerApi } from "@/lib/api/manager";
import { useAuth } from "@/context/AuthContext";
import { canApproveSales } from "@/lib/permissions";

export default function ManagerSalesPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Manager";
  const userDetail = [user?.district, user?.state].filter(Boolean).join(", ") || "Territory";
  const canSales = canApproveSales(user);

  const fetchSales = useCallback(async (): Promise<ResourceRow[]> => {
    if (!canSales) return [];
    const res = await managerApi.listSales({ pageSize: 100 });
    const sales = res?.sales ?? (res as any)?.items ?? [];
    return sales.map((s) => ({
      id: s.id,
      customer: s.customer?.shopName || "Retail Shop",
      seller: s.seller?.name || "Field Officer",
      packets: s.quantity.toString(),
      amount: `₹${(s.totalPaise / 100).toLocaleString("en-IN")}`,
      payment: s.paymentMode === "CASH" ? "Cash" : s.paymentMode === "BANK" ? "Bank" : "Pending",
      date: new Date(s.createdAt).toLocaleDateString("en-IN"),
      rawDate: s.createdAt,
      status:
        s.status === "CONFIRMED"
          ? "Confirmed"
          : s.status === "PENDING_APPROVAL"
          ? "Approval required"
          : "Rejected",
      invoiceId: s.invoice?.id,
      invoiceNumber: s.invoice?.number,
    }));
  }, [canSales]);

  if (!canSales) {
    return (
      <DashboardShell
        role="Manager"
        workspace="Manager workspace"
        userName={userName}
        userDetail={userDetail}
        navigation={getManagerNavigation(user)}
      >
        <PageHeading
          eyebrow="Access control"
          title="Sales ledger"
          description="Review packet transactions from field officers in your territory."
        />
        <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Access Restricted</h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
            Your Super Admin has not assigned sales approval or transaction auditing permissions to your account.
            If your role requires reviewing sales, contact your head office administrator.
          </p>
          <div className="mt-6">
            <Link
              href="/manager"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#c91550] transition cursor-pointer"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <ResourceListScreen
      role="Manager"
      workspace="Manager workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={getManagerNavigation(user)}
      eyebrow="Territory sales"
      title="Sales ledger"
      description="Review all packet transactions from field officers and customers in your assigned territory. Track confirmed deliveries, pending approvals, and payment status."
      primaryAction="Export sales"
      searchPlaceholder="Search by customer, officer, or status"
      columns={[
        { key: "customer", label: "Customer" },
        { key: "seller", label: "Field Officer" },
        { key: "packets", label: "Packets" },
        { key: "amount", label: "Amount" },
        { key: "payment", label: "Payment mode" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status" },
      ]}
      fetchData={fetchSales}
    />
  );
}
