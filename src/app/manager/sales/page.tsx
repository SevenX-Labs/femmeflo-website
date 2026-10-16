"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { managerNavigation } from "@/components/management/navigation";
import { managerApi } from "@/lib/api/manager";
import { useAuth } from "@/context/AuthContext";

export default function ManagerSalesPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Manager";
  const userDetail = [user?.district, user?.state].filter(Boolean).join(", ") || "Territory";

  const fetchSales = useCallback(async (): Promise<ResourceRow[]> => {
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
      status:
        s.status === "CONFIRMED"
          ? "Confirmed"
          : s.status === "PENDING_APPROVAL"
          ? "Approval required"
          : "Rejected",
      invoiceId: s.invoice?.id,
      invoiceNumber: s.invoice?.number,
    }));
  }, []);

  return (
    <ResourceListScreen
      role="Manager"
      workspace="Manager workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={managerNavigation}
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