"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";

export default function AdminCustomersPage() {
  const fetchCustomers = useCallback(async (): Promise<ResourceRow[]> => {
    const res = await adminApi.listCustomers({ pageSize: 100 });
    const customers = res?.customers ?? (res as any)?.items ?? [];
    return customers.map((c) => ({
      id: c.id,
      name: c.shopName,
      contact: c.contactName,
      seller: c.seller?.name || "Assigned Seller",
      location: [c.village, c.district, c.state].filter(Boolean).join(", ") || "Field",
      phone: c.phone || "—",
      category: c.category?.name || "General trade",
      status: c.active ? "Active" : "Inactive",
      photoPath: c.photoPath,
    }));
  }, []);

  return (
    <ResourceListScreen
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
      eyebrow="Customer management"
      title="Customers & shops"
      description="Review every customer relationship across state, district, village, business category, manager, and seller."
      primaryAction="Add customer"
      primaryHref="/admin/customers/new"
      searchPlaceholder="Search customer by shop name, contact, village, or seller"
      columns={[
        { key: "name", label: "Customer / shop" },
        { key: "contact", label: "Contact person" },
        { key: "seller", label: "Seller" },
        { key: "location", label: "Location" },
        { key: "phone", label: "Phone" },
        { key: "category", label: "Category" },
        { key: "status", label: "Status" },
      ]}
      fetchData={fetchCustomers}
    />
  );
}