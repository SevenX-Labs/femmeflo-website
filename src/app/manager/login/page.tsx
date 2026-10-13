"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyManagerLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/manager/auth/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] text-sm text-zinc-500">
      Redirecting to /manager/auth/login...
    </main>
  );
}