"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { managerNavigation } from "@/components/management/navigation";
import { managerApi } from "@/lib/api/manager";
import { useAuth } from "@/context/AuthContext";

export default function ManagerCustomersPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Manager";
  const userDetail = [user?.district, user?.state].filter(Boolean).join(", ") || "Territory";

  const fetchCustomers = useCallback(async (): Promise<ResourceRow[]> => {
    const res = await managerApi.listCustomers({ pageSize: 100 });
    const customers = res?.customers ?? (res as any)?.items ?? [];
    return customers.map((c) => ({
      id: c.id,
      name: c.shopName,
      contact: c.contactName || c.phone || "—",
      seller: c.seller?.name || "Assigned Seller",
      village: c.village || "Territory",
      category: c.category?.name || "General trade",
      status: c.active ? "Active" : "Inactive",
      photoPath: c.photoPath,
    }));
  }, []);

  return (
    <ResourceListScreen
      role="Manager"
      workspace="Manager workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={managerNavigation}
      eyebrow="Assigned customers"
      title="My customers"
      description="Onboard customers and maintain full operational visibility over retail shop relationships within your assigned territory."
      primaryAction="Add customer"
      primaryHref="/manager/customers/new"
      searchPlaceholder="Search assigned customers by shop name, seller, or village"
      columns={[
        { key: "name", label: "Customer / shop" },
        { key: "contact", label: "Contact person" },
        { key: "seller", label: "Seller" },
        { key: "village", label: "Village" },
        { key: "category", label: "Category" },
        { key: "status", label: "Status" },
      ]}
      fetchData={fetchCustomers}
    />
  );
}