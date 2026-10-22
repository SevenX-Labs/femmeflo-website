"use client";

import { NotificationsWorkspace } from "@/components/management/NotificationsWorkspace";
import { sellerNavigation } from "@/components/management/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SellerNotificationsPage() {
  const { user } = useAuth();

  return (
    <NotificationsWorkspace
      role="Seller"
      workspace="Seller workspace"
      userName={user?.name || "Field Officer"}
      userDetail={user?.phone || user?.email || "Seller Account"}
      navigation={sellerNavigation}
    />
  );
}