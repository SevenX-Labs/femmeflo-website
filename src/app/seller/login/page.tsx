"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacySellerLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/seller/auth/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] text-sm text-zinc-800">
      Redirecting to /seller/auth/login...
    </main>
  );
}