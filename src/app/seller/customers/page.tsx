"use client";

import { useCallback } from "react";
import { ResourceListScreen, type ResourceRow } from "@/components/management/ResourceListScreen";
import { sellerNavigation } from "@/components/management/navigation";
import { sellerApi } from "@/lib/api/seller";
import { useAuth } from "@/context/AuthContext";

export default function SellerCustomersPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Seller";
  const userDetail = ["Seller", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  const fetchCustomers = useCallback(async (): Promise<ResourceRow[]> => {
    const res = await sellerApi.listCustomers({ pageSize: 100 });
    const customers = res?.customers ?? (res as any)?.items ?? [];
    return customers.map((c) => ({
      id: c.id,
      name: c.shopName,
      contact: c.phone || c.contactName || "—",
      category: c.category?.name || "General trade",
      location: [c.village, c.district].filter(Boolean).join(", ") || "Field",
      address:
        c.address ||
        [c.shopNumber, c.streetName, c.village, c.district, c.state, c.pincode].filter(Boolean).join(", ") ||
        [c.village, c.district, c.state].filter(Boolean).join(", "),
      status: c.active ? "Active" : "Inactive",
      photoPath: c.photoPath,
      latitude: c.latitude,
      longitude: c.longitude,
    }));
  }, []);

  return (
    <ResourceListScreen
      role="Seller"
      workspace="Seller workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={sellerNavigation}
      eyebrow="Customer book"
      title="My customers"
      description="Your shops and customers are the starting point for every sale. Keep their details and GPS coordinates verified."
      primaryAction="Add customer"
      primaryHref="/seller/customers/new"
      searchPlaceholder="Search your customers by shop name, contact, or location"
      columns={[
        { key: "name", label: "Customer / shop" },
        { key: "contact", label: "Contact" },
        { key: "category", label: "Category" },
        { key: "location", label: "Location" },
        { key: "status", label: "Status" },
      ]}
      fetchData={fetchCustomers}
    />
  );
}