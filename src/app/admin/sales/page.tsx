"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";

export default function AdminSalesPage() {
  const fetchSales = useCallback(async (): Promise<ResourceRow[]> => {
    const res = await adminApi.listSales({ pageSize: 100 });
    const sales = res?.sales ?? (res as any)?.items ?? [];
    return sales.map((s) => ({
      id: s.id,
      customer: s.customer?.shopName || "Retail Shop",
      seller: s.seller?.name || "Field Officer",
      packets: s.quantity.toString(),
      amount: `₹${(s.totalPaise / 100).toLocaleString("en-IN")}`,
      payment: s.paymentMode === "CASH" ? "Cash" : s.paymentMode === "BANK" ? "Bank" : "Pending",
      status:
        s.status === "CONFIRMED"
          ? "Confirmed"
          : s.status === "PENDING_APPROVAL"
          ? "Approval required"
          : "Rejected",
      date: new Date(s.createdAt).toLocaleDateString("en-IN"),
      rawDate: s.createdAt,
      invoiceId: s.invoice?.id,
      invoiceNumber: s.invoice?.number,
    }));
  }, []);

  return (
    <ResourceListScreen
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
      eyebrow="Sales management"
      title="All sales"
      description="Monitor confirmed, pending, and approval-required sales across the full regional distribution network."
      primaryAction="Export sales"
      searchPlaceholder="Search by customer shop, officer, or sale status"
      columns={[
        { key: "customer", label: "Customer" },
        { key: "seller", label: "Field Officer" },
        { key: "packets", label: "Packets" },
        { key: "amount", label: "Total amount" },
        { key: "payment", label: "Payment mode" },
        { key: "date", label: "Date" },
        { key: "status", label: "Sale status" },
      ]}
      fetchData={fetchSales}
    />
  );
}