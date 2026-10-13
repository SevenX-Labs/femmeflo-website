"use client";

import { OnboardingFormScreen } from "@/components/management/OnboardingFormScreen";
import { sellerNavigation } from "@/components/management/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SellerAddCustomerPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Seller";
  const userDetail = ["Seller", user?.village, user?.district].filter(Boolean).join(" · ") || "Field operations";

  return (
    <OnboardingFormScreen
      role="Seller"
      workspace="Seller workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={sellerNavigation}
      entity="customer"
      backHref="/seller/customers"
    />
  );
}
