"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { OnboardingFormScreen } from "@/components/management/OnboardingFormScreen";
import { DashboardShell } from "@/components/management/DashboardShell";
import { getManagerNavigation } from "@/components/management/navigation";
import { useAuth } from "@/context/AuthContext";
import { canOnboardCustomers } from "@/lib/permissions";

export default function ManagerAddCustomerPage() {
  const { user } = useAuth();
  const userName = user?.name ?? "Manager";
  const userDetail = [user?.district, user?.state].filter(Boolean).join(", ") || "Territory";

  if (user && !canOnboardCustomers(user)) {
    return (
      <DashboardShell
        role="Manager"
        workspace="Manager workspace"
        userName={userName}
        userDetail={userDetail}
        navigation={getManagerNavigation(user)}
      >
        <div className="mx-auto max-w-xl py-12 px-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-[#E61C5D]">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-zinc-900">Customer Onboarding Restricted</h2>
          <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
            Your manager profile currently does not have permission to register new retail shop customers.
            This capability can be enabled by your Super Admin in the central Permissions control panel.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/manager/customers"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c91550] transition shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Customer Directory
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <OnboardingFormScreen
      role="Manager"
      workspace="Manager workspace"
      userName={userName}
      userDetail={userDetail}
      navigation={getManagerNavigation(user)}
      entity="customer"
      backHref="/manager/customers"
    />
  );
}
