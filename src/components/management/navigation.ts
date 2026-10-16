import type { PublicUser } from "@/lib/api/types";
import {
  canApproveSales,
  canManageSellers,
  canOnboardCustomers,
  canViewCustomers,
  canViewInventory,
} from "@/lib/permissions";
export type NavigationIcon =
  | "dashboard"
  | "users"
  | "store"
  | "customers"
  | "inventory"
  | "sales"
  | "approvals"
  | "reports"
  | "invoices"
  | "incentives"
  | "permissions"
  | "notifications"
  | "categories"
  | "settings";

export type NavigationItem = {
  label: string;
  href: string;
  icon: NavigationIcon;
};

export const adminNavigation: NavigationItem[] = [
  { label: "Overview", href: "/admin", icon: "dashboard" },
  { label: "Managers", href: "/admin/managers", icon: "users" },
  { label: "Field Officers", href: "/admin/sellers", icon: "store" },
  { label: "Customers", href: "/admin/customers", icon: "customers" },
  { label: "Inventory", href: "/admin/inventory", icon: "inventory" },
  { label: "Categories", href: "/admin/categories", icon: "categories" },
  { label: "Sales", href: "/admin/sales", icon: "sales" },
  { label: "Approvals", href: "/admin/approvals", icon: "approvals" },
  { label: "Reports", href: "/admin/reports", icon: "reports" },
  { label: "Invoices", href: "/admin/invoices", icon: "invoices" },
  { label: "Incentives", href: "/admin/incentives", icon: "incentives" },
  { label: "Permissions", href: "/admin/permissions", icon: "permissions" },
  { label: "Notifications", href: "/admin/notifications", icon: "notifications" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

export const managerNavigation: NavigationItem[] = [
  { label: "Overview", href: "/manager", icon: "dashboard" },
  { label: "Field Officers", href: "/manager/sellers", icon: "users" },
  { label: "Customers", href: "/manager/customers", icon: "store" },
  { label: "Sales", href: "/manager/sales", icon: "sales" },
  { label: "Inventory", href: "/manager/inventory", icon: "inventory" },
  { label: "Notifications", href: "/manager/notifications", icon: "notifications" },
];

export const sellerNavigation: NavigationItem[] = [
  { label: "Home", href: "/seller", icon: "dashboard" },
  { label: "Customers", href: "/seller/customers", icon: "store" },
  { label: "Sales", href: "/seller/sales", icon: "sales" },
  { label: "Inventory", href: "/seller/inventory", icon: "inventory" },
  { label: "Incentive", href: "/seller/incentive", icon: "invoices" },
  { label: "Profile", href: "/seller/profile", icon: "users" },
  { label: "Notifications", href: "/seller/notifications", icon: "notifications" },
];

export function getManagerNavigation(user?: PublicUser | null): NavigationItem[] {
  const items: NavigationItem[] = [
    { label: "Overview", href: "/manager", icon: "dashboard" },
  ];

  // If user object is loaded, filter strictly by granted permissions
  if (user) {
    if (canManageSellers(user)) {
      items.push({ label: "Field Officers", href: "/manager/sellers", icon: "users" });
    }
    if (canViewCustomers(user) || canOnboardCustomers(user)) {
      items.push({ label: "Customers", href: "/manager/customers", icon: "store" });
    }
    if (canApproveSales(user)) {
      items.push({ label: "Sales", href: "/manager/sales", icon: "sales" });
    }
    if (canViewInventory(user)) {
      items.push({ label: "Inventory", href: "/manager/inventory", icon: "inventory" });
    }
  } else {
    // Fallback if user is hydrating
    items.push(
      { label: "Field Officers", href: "/manager/sellers", icon: "users" },
      { label: "Customers", href: "/manager/customers", icon: "store" },
      { label: "Sales", href: "/manager/sales", icon: "sales" },
      { label: "Inventory", href: "/manager/inventory", icon: "inventory" }
    );
  }

  items.push({ label: "Notifications", href: "/manager/notifications", icon: "notifications" });
  return items;
}
