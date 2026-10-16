"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";

export default function AdminManagersPage() {
  const fetchManagers = useCallback(async (): Promise<ResourceRow[]> => {
    const [res, sellersRes] = await Promise.all([
      adminApi.listManagers({ pageSize: 100 }),
      adminApi.listSellers({ pageSize: 100 }).catch(() => ({ sellers: [] })),
    ]);
    const managers = res.managers ?? (res as any).items ?? [];
    const sellers = sellersRes.sellers ?? (sellersRes as any).items ?? [];

    // Map sellers to their manager
    const sellerCountMap = new Map<string, number>();
    for (const s of sellers) {
      const mId = s.manager?.id || (s as any).managerId;
      if (mId) {
        sellerCountMap.set(mId, (sellerCountMap.get(mId) || 0) + 1);
      }
      if (s.manager?.name) {
        const normName = s.manager.name.toLowerCase().trim();
        sellerCountMap.set(normName, (sellerCountMap.get(normName) || 0) + 1);
      }
    }

    return managers.map((m) => {
      let countFromList =
        sellerCountMap.get(m.id) ??
        sellerCountMap.get(m.name.toLowerCase().trim()) ??
        0;

      if (countFromList === 0) {
        const mFirstName = m.name.toLowerCase().split(/\s+/)[0];
        if (mFirstName && mFirstName.length > 2) {
          const matchingSellers = sellers.filter((s) => {
            const sMgrName = s.manager?.name?.toLowerCase();
            return sMgrName && sMgrName.includes(mFirstName);
          });
          if (matchingSellers.length > 0) {
            countFromList = matchingSellers.length;
          }
        }
      }

      const directCount =
        m._count?.sellers ??
        (Array.isArray((m as any).sellers) ? (m as any).sellers.length : undefined) ??
        (Array.isArray((m as any).subordinates) ? (m as any).subordinates.length : undefined) ??
        (m as any).sellerCount ??
        (m as any).sellersCount ??
        (m as any).officersCount ??
        (m as any)._count?.subordinates ??
        undefined;

      const totalOfficers = directCount !== undefined && directCount > 0 ? directCount : countFromList;

      return {
        id: m.id,
        name: m.name,
        territory: [m.village, m.district, m.state].filter(Boolean).join(", ") || "General Scope",
        phone: m.phone || "—",
        email: m.email || "—",
        sellers: String(totalOfficers),
        status: m.active ? "Active" : "Inactive",
      };
    });
  }, []);

  return (
    <ResourceListScreen
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
      eyebrow="People management"
      title="Managers"
      description="Control regional manager access, assigned territory scope, and field officer supervisory responsibilities."
      primaryAction="Add manager"
      primaryHref="/admin/managers/new"
      searchPlaceholder="Search by manager name, phone or territory"
      columns={[
        { key: "name", label: "Manager" },
        { key: "territory", label: "Territory" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "sellers", label: "Field Officers" },
        { key: "status", label: "Status" },
      ]}
      fetchData={fetchManagers}
    />
  );
}
