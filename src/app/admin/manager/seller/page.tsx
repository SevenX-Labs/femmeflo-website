"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";

export default function AdminSellerManagementPage() {
  const fetchSellers = useCallback(async (): Promise<ResourceRow[]> => {
    const result = await adminApi.listSellers({ pageSize: 100 });
    const sellers = result?.sellers ?? (result as any)?.items ?? [];
    return sellers.map((seller) => ({
      id: seller.id,
      name: seller.name,
      phone: seller.phone ?? "—",
      manager: seller.manager?.name ?? "Unassigned",
      territory: [seller.village, seller.district, seller.state].filter(Boolean).join(", ") || "—",
      customers: seller._count?.customers ?? 0,
      packets: seller.stockLocation?.balance ?? 0,
      status: seller.active ? "Active" : "Inactive",
    }));
  }, []);

  return (
    <ResourceListScreen
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
      eyebrow="Field team"
      title="Sellers"
      description="View seller accounts, reporting managers, assigned territories, customer counts, and remaining stock."
      primaryAction="Add seller"
      primaryHref="/admin/sellers/new"
      searchPlaceholder="Search by name, phone, manager, or territory"
      columns={[
        { key: "name", label: "Seller" },
        { key: "phone", label: "Phone" },
        { key: "manager", label: "Manager" },
        { key: "territory", label: "Territory" },
        { key: "customers", label: "Customers" },
        { key: "packets", label: "Stock balance" },
        { key: "status", label: "Status" },
      ]}
      fetchData={fetchSellers}
    />
  );
}
