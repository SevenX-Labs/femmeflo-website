"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";

export default function AdminSellersPage() {
  const fetchSellers = useCallback(async (): Promise<ResourceRow[]> => {
    const [sellersRes, managersRes, invRes, txRes] = await Promise.all([
      adminApi.listSellers({ pageSize: 100 }),
      adminApi.listManagers({ pageSize: 100 }).catch(() => ({ managers: [] })),
      adminApi.getInventorySummary().catch(() => null),
      adminApi.listTransactions().catch(() => ({ transactions: [] })),
    ]);

    const sellers = sellersRes.sellers ?? (sellersRes as any).items ?? [];
    const managers = managersRes.managers ?? (managersRes as any).items ?? [];
    const invLocations = invRes?.locations ?? invRes?.warehouses ?? [];
    const invSellers = invRes?.sellers ?? [];
    const transactions = txRes?.transactions ?? (txRes as any)?.items ?? [];

    return sellers.map((s, idx) => {
      // 1. Resolve Assigned Manager accurately
      let managerName = s.manager?.name;
      if (!managerName || managerName === "Assigned Manager") {
        const mId = s.managerId || (s as any).manager?.id;
        if (mId) {
          const matched = managers.find((m) => m.id === mId);
          if (matched) managerName = matched.name;
        }
      }
      if (!managerName || managerName === "Assigned Manager") {
        if ((s as any).managerName) managerName = (s as any).managerName;
        else if ((s as any).assignedManager) managerName = (s as any).assignedManager;
      }
      // Territory fallback matching if still unassigned
      if (!managerName || managerName === "Assigned Manager") {
        if (s.district) {
          const territoryMatched = managers.find(
            (m) => m.district && m.district.toLowerCase().trim() === s.district?.toLowerCase().trim()
          );
          if (territoryMatched) managerName = territoryMatched.name;
        }
      }
      // If only 1 manager exists in scope, they supervise this officer
      if ((!managerName || managerName === "Assigned Manager") && managers.length === 1) {
        managerName = managers[0].name;
      }
      if (!managerName || managerName === "Assigned Manager") {
        managerName = "Unassigned";
      }

      // 2. Resolve Assigned / Current Packets accurately
      const directPackets = [
        s.stockLocation?.balance,
        (s as any).balance,
        (s as any).packets,
        (s as any).currentPackets,
        (s as any).assignedPackets,
        (s as any).remainingPackets,
        (s as any).stock,
      ].find((val) => typeof val === "number" && val > 0);

      const fromInvSellers = invSellers.find(
        (sl) => sl.id === s.id || sl.name.toLowerCase().trim() === s.name.toLowerCase().trim()
      )?.balance;

      const fromInvLocation = invLocations.find(
        (l) =>
          (l.sellerId && l.sellerId === s.id) ||
          (l.type === "SELLER" &&
            (l.name.toLowerCase().includes(s.name.toLowerCase()) ||
              s.name.toLowerCase().includes(l.name.toLowerCase())))
      )?.balance;

      const fromTransactions = transactions
        .filter((tx) => {
          if (tx.type !== "TRANSFER") return false;
          const destName = tx.destination?.name?.toLowerCase() || "";
          const destSellerId = (tx.destination as any)?.sellerId;
          return (
            (destSellerId && destSellerId === s.id) ||
            destName.includes(s.name.toLowerCase())
          );
        })
        .reduce((sum, tx) => sum + (tx.quantity || 0), 0);

      const resolvedPackets =
        directPackets ??
        (fromInvSellers && fromInvSellers > 0 ? fromInvSellers : undefined) ??
        (fromInvLocation && fromInvLocation > 0 ? fromInvLocation : undefined) ??
        (fromTransactions && fromTransactions > 0 ? fromTransactions : undefined) ??
        s.stockLocation?.balance ??
        0;

      return {
        id: s.id,
        name: s.name,
        designation: s.designation || "Field Sales Officer",
        employeeCode: s.employeeCode || (s as any).code || `FF-S${String(idx + 1).padStart(3, "0")}`,
        code: s.employeeCode || (s as any).code || `FF-S${String(idx + 1).padStart(3, "0")}`,
        territory: [s.village, s.district, s.state].filter(Boolean).join(", ") || "Field Scope",
        phone: s.phone || "—",
        alternatePhone: s.alternatePhone || "—",
        email: s.email || "—",
        address: [s.address, s.village, s.district, s.state, s.pincode].filter(Boolean).join(", ") || "—",
        manager: managerName,
        aadharNumber: s.aadharNumber || "—",
        drivingLicense: s.drivingLicense || "—",
        education: s.education || "—",
        customers: s._count?.customers?.toString() || (s as any).customersCount?.toString() || "0",
        packets: String(resolvedPackets),
        status: s.active ? "Active" : "Inactive",
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
      eyebrow="Field Team & Officers"
      title="Field Officers"
      description="Manage field officer personnel, territory coverage, reporting managers, and packet distribution across the organization."
      primaryAction="Onboard Officer"
      primaryHref="/admin/sellers/new"
      searchPlaceholder="Search officer, territory or phone"
      columns={[
        { key: "name", label: "Field Officer" },
        { key: "code", label: "Employee Code" },
        { key: "designation", label: "Designation" },
        { key: "phone", label: "Primary Phone" },
        { key: "alternatePhone", label: "Alternate Phone" },
        { key: "manager", label: "Reporting Manager" },
        { key: "packets", label: "Current Packets" },
        { key: "status", label: "Status" },
      ]}
      fetchData={fetchSellers}
    />
  );
}
