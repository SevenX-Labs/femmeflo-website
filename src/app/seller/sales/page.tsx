"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import { useAuth } from "@/context/AuthContext";

export default function SellerSalesPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Seller";
  const userDetail = ["Seller", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  const fetchSales = useCallback(async (): Promise<ResourceRow[]> => {
    const res = await sellerApi.listSales({ pageSize: 100 });
    const sales = res?.sales ?? (res as any)?.items ?? [];
    return sales.map((s) => ({
      id: s.id,
      customer: s.customer?.shopName || "Customer Store",
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
    }));
  }, []);

  return (
    <ResourceListScreen
      role="Seller"
      workspace="Seller workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={sellerNavigation}
      eyebrow="Sales history"
      title="My sales"
      description="Every packet transaction, payment method, invoice generation, and status. Low-price sales remain pending until Admin confirmation."
      primaryAction="Record sale"
      primaryHref="/seller/sales/new"
      searchPlaceholder="Search customer, date, or payment"
      columns={[
        { key: "customer", label: "Customer" },
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
