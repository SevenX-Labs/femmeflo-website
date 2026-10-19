"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";

export default function AdminInvoicesPage() {
  const fetchInvoices = useCallback(async (): Promise<ResourceRow[]> => {
    const res = await adminApi.listInvoices({ pageSize: 100 });
    const invoices = res?.invoices ?? (res as any)?.items ?? [];
    return invoices.map((inv) => ({
      id: inv.id,
      invoice: inv.number,
      customer: inv.sale?.customer?.shopName || "Customer",
      customerPhone: inv.sale?.customer?.phone,
      customerEmail: (inv.sale?.customer as any)?.email,
      seller: inv.sale?.seller?.name || "Officer",
      amount: inv.sale ? `₹${(inv.sale.totalPaise / 100).toLocaleString("en-IN")}` : "₹250",
      delivery: inv.deliveries?.map((d) => d.channel).join(" · ") || "Email · WhatsApp",
      status: inv.sale?.paymentMode === "PENDING" ? "Pending payment" : "Paid",
      date: new Date(inv.createdAt).toLocaleDateString("en-IN"),
      invoiceId: inv.id,
      invoiceNumber: inv.number,
      pdfPath: inv.pdfPath,
    }));
  }, []);

  return (
    <ResourceListScreen
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
      eyebrow="Invoice management"
      title="Invoices"
      description="Track invoices generated automatically upon confirmed packet sales and audit multi-channel dispatch via Email and WhatsApp."
      primaryAction="Export invoices"
      searchPlaceholder="Search by invoice number, customer, or officer"
      columns={[
        { key: "invoice", label: "Invoice number" },
        { key: "customer", label: "Customer" },
        { key: "seller", label: "Field Officer" },
        { key: "amount", label: "Amount" },
        { key: "delivery", label: "Delivery channels" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status" },
      ]}
      fetchData={fetchInvoices}
    />
  );
}
