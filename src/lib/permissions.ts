import type { PublicUser } from "./api/types";

// Supported manager permission keys in backend
export const MANAGER_PERMISSIONS = [
  "onboard_customers",
  "view_customers",
  "manage_sellers",
  "view_inventory",
  "transfer_inventory",
  "approve_sales",
  "view_reports",
] as const;

export type ManagerPermissionKey = (typeof MANAGER_PERMISSIONS)[number];

// Friendly labels and descriptions for backend permission keys
export const PERMISSION_METADATA: Record<string, { label: string; description: string }> = {
  onboard_customers: {
    label: "Onboard Customers",
    description: "Allow manager to register and edit retail shop customers in their territory",
  },
  view_customers: {
    label: "View Customers",
    description: "Allow manager to view customer directory and contact information",
  },
  manage_sellers: {
    label: "Manage Field Officers",
    description: "Allow manager to onboard and supervise field sales officers",
  },
  view_inventory: {
    label: "View Inventory",
    description: "Allow manager to inspect regional warehouse stock levels and packet allocations",
  },
  transfer_inventory: {
    label: "Transfer Inventory",
    description: "Allow manager to allocate packet batches from warehouse to field officers",
  },
  approve_sales: {
    label: "Approve Sales",
    description: "Allow manager to verify recorded sales transactions and audit history",
  },
  view_reports: {
    label: "View Reports",
    description: "Allow manager to access territory sales summaries and performance analytics",
  },
};

// Aliases for compatibility between legacy uppercase and action keys
const PERMISSION_ALIASES: Record<string, string[]> = {
  onboard_customers: ["onboard_customers", "CUSTOMER_CREATE"],
  CUSTOMER_CREATE: ["onboard_customers", "CUSTOMER_CREATE"],
  view_customers: ["view_customers", "CUSTOMER_READ"],
  CUSTOMER_READ: ["view_customers", "CUSTOMER_READ"],
  manage_sellers: ["manage_sellers", "SELLER_CREATE", "SELLER_READ"],
  SELLER_CREATE: ["manage_sellers", "SELLER_CREATE", "SELLER_READ"],
  SELLER_READ: ["manage_sellers", "SELLER_READ", "SELLER_CREATE"],
  view_inventory: ["view_inventory", "INVENTORY_READ"],
  INVENTORY_READ: ["view_inventory", "INVENTORY_READ"],
  transfer_inventory: ["transfer_inventory"],
  approve_sales: ["approve_sales", "SALES_READ"],
  SALES_READ: ["approve_sales", "SALES_READ"],
  view_reports: ["view_reports"],
};

export function hasPermission(
  user: PublicUser | null | undefined,
  permission: string
): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;

  const userPerms = user.permissions || [];
  if (userPerms.includes(permission)) return true;

  const aliases = PERMISSION_ALIASES[permission];
  if (aliases && aliases.some((alias) => userPerms.includes(alias))) {
    return true;
  }

  return false;
}

export function canOnboardCustomers(user: PublicUser | null | undefined): boolean {
  return hasPermission(user, "onboard_customers");
}

export function canViewCustomers(user: PublicUser | null | undefined): boolean {
  return hasPermission(user, "view_customers");
}

export function canManageSellers(user: PublicUser | null | undefined): boolean {
  return hasPermission(user, "manage_sellers");
}

export function canViewInventory(user: PublicUser | null | undefined): boolean {
  return hasPermission(user, "view_inventory");
}

export function canApproveSales(user: PublicUser | null | undefined): boolean {
  return hasPermission(user, "approve_sales");
}

// Sync aliases when saving to backend so legacy and modern routes both recognize permissions
export function syncPermissionAliases(permissions: string[]): string[] {
  const result = new Set<string>();
  for (const perm of permissions) {
    result.add(perm);
    const aliases = PERMISSION_ALIASES[perm];
    if (aliases) {
      aliases.forEach((a) => result.add(a));
    }
  }
  return Array.from(result);
}
