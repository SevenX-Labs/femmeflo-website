"use client";

import { BulkCustomerOnboardingScreen } from "@/components/management/BulkCustomerOnboardingScreen";
import { sellerNavigation } from "@/components/management/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SellerBulkCustomerPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Seller";
  const userDetail = ["Seller", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  return (
    <BulkCustomerOnboardingScreen
      role="Seller"
      workspace="Seller workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={sellerNavigation}
      backHref="/seller/customers"
    />
  );
}
