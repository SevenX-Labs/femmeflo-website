import { RoleGuard } from "@/components/auth/RoleGuard";

export default function SellerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RoleGuard role="SELLER" loginPath="/seller/auth/login">{children}</RoleGuard>;
}