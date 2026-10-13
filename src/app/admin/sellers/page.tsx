"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";

export default function AdminSellersPage() {
  const fetchSellers = useCallback(async (): Promise<ResourceRow[]> => {
    const res = await adminApi.listSellers({ pageSize: 100 });
    const sellers = res.sellers ?? (res as any).items ?? [];
    return sellers.map((s, idx) => ({
      id: s.id,
      name: s.name,
      code: `FF-S${String(idx + 1).padStart(3, "0")}`,
      territory: [s.village, s.district, s.state].filter(Boolean).join(", ") || "Field Scope",
      phone: s.phone || "—",
      manager: s.manager?.name || "Assigned Manager",
      customers: s._count?.customers?.toString() || "0",
      packets: s.stockLocation ? String(s.stockLocation.balance) : "0",
      status: s.active ? "Active" : "Inactive",
    }));
  }, []);

  return (
    <ResourceListScreen
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
      eyebrow="Seller management"
      title="Sellers"
      description="Manage seller access, territory coverage, manager links, and packet distribution across the full field network."
      primaryAction="Add seller"
      primaryHref="/admin/sellers/new"
      searchPlaceholder="Search by seller name, territory or phone"
      columns={[
        { key: "name", label: "Seller" },
        { key: "code", label: "Seller code" },
        { key: "territory", label: "Territory" },
        { key: "phone", label: "Phone" },
        { key: "manager", label: "Reporting manager" },
        { key: "packets", label: "Current packets" },
        { key: "status", label: "Status" },
      ]}
      fetchData={fetchSellers}
    />
  );
}
