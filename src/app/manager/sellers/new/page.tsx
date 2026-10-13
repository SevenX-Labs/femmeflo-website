"use client";

import { OnboardingFormScreen } from "@/components/management/OnboardingFormScreen";
import { managerNavigation } from "@/components/management/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ManagerAddSellerPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Manager";
  const userDetail = [user?.district, user?.state].filter(Boolean).join(", ") || "Territory";

  return (
    <OnboardingFormScreen
      role="Manager"
      workspace="Manager workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={managerNavigation}
      entity="seller"
      backHref="/manager/sellers"
    />
  );
}
