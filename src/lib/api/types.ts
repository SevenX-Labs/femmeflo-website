/**
 * FemmeFlo Production Frontend API Types
 * Derived from backend server: femmeflo-yfa-inventory-server
 */

// ==========================================
// Base API Responses
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ==========================================
// Enums & Literals
// ==========================================

export type Role = "SUPER_ADMIN" | "MANAGER" | "SELLER";

export type StockLocationType = "HQ" | "WAREHOUSE" | "SELLER";

export type StockMovementType = "RECEIPT" | "TRANSFER" | "SALE";

export type PaymentMode = "CASH" | "BANK" | "PENDING";

export type SaleStatus = "PENDING_APPROVAL" | "CONFIRMED" | "REJECTED";

export type DeliveryChannel = "EMAIL" | "WHATSAPP";

export type DeliveryStatus = "PENDING" | "SENT" | "FAILED";

export type ManagerPermission =
  | "manage_sellers"
  | "manage_managers"
  | "onboard_customers"
  | "view_customers"
  | "view_inventory"
  | "transfer_inventory"
  | "approve_sales"
  | "view_reports"
  | "manage_permissions"
  | "SELLER_READ"
  | "SELLER_CREATE"
  | "CUSTOMER_READ"
  | "CUSTOMER_CREATE"
  | "SALES_READ"
  | "INVENTORY_READ";

// ==========================================
// User & Auth
// ==========================================

export interface PublicUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  active: boolean;
  managerId?: string | null;
  permissions: string[];
  state?: string | null;
  district?: string | null;
  village?: string | null;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  user: PublicUser;
}

export interface ForgotPasswordPayload {
  login: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// ==========================================
// Category
// ==========================================

export interface Category {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    customers: number;
  };
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  active?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  active?: boolean;
}

// ==========================================
// Managers & Sellers (User management)
// ==========================================

export interface ManagerItem extends PublicUser {
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    sellers: number;
  };
}

export interface CreateManagerPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
  state?: string;
  district?: string;
  village?: string;
  permissions?: string[];
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  email?: string;
  state?: string;
  district?: string;
  village?: string;
  active?: boolean;
}

export interface SellerItem extends PublicUser {
  manager?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  stockLocation?: {
    id: string;
    balance: number;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    customers: number;
    sales: number;
  };
}

export interface CreateSellerPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
  managerId?: string;
  state?: string;
  district?: string;
  village?: string;
}

// ==========================================
// Customers
// ==========================================

export interface CustomerItem {
  id: string;
  shopName: string;
  contactName: string;
  phone: string;
  email?: string | null;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  sellerId: string;
  seller?: {
    id: string;
    name: string;
    phone?: string | null;
  };
  state: string;
  district: string;
  village: string;
  photoPath?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sales: number;
  };
}

export interface CreateCustomerPayload {
  shopName: string;
  contactName: string;
  phone: string;
  email?: string;
  categoryId: string;
  sellerId?: string;
  state: string;
  district: string;
  village: string;
  photoPath?: string;
  photoUrl?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateCustomerPayload extends Partial<CreateCustomerPayload> {
  active?: boolean;
}

// ==========================================
// Inventory & Stock
// ==========================================

export interface WarehouseItem {
  id: string;
  type: StockLocationType;
  name: string;
  balance: number;
  sellerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySummaryData {
  totalInventory: number;
  hqStock: number;
  warehouseStock: number;
  sellerStock: number;
  warehouses: WarehouseItem[];
  sellers?: Array<{
    id: string;
    name: string;
    balance: number;
    territory?: string;
  }>;
}

export interface CreateWarehousePayload {
  name: string;
}

export interface StockReceiptPayload {
  quantity: number;
  locationId?: string;
}

export interface StockTransferPayload {
  sourceId: string;
  destinationId: string;
  quantity: number;
}

export interface StockTransactionItem {
  id: string;
  type: StockMovementType;
  quantity: number;
  sourceId?: string | null;
  source?: {
    id: string;
    name: string;
    type: StockLocationType;
  } | null;
  destinationId?: string | null;
  destination?: {
    id: string;
    name: string;
    type: StockLocationType;
  } | null;
  actorId: string;
  actor?: {
    id: string;
    name: string;
    role: Role;
  };
  saleId?: string | null;
  createdAt: string;
}

// ==========================================
// Sales & Approvals
// ==========================================

export interface SaleItem {
  id: string;
  sellerId: string;
  seller?: {
    id: string;
    name: string;
    phone?: string | null;
    state?: string | null;
    district?: string | null;
    village?: string | null;
  };
  customerId: string;
  customer?: {
    id: string;
    shopName: string;
    contactName: string;
    phone: string;
    state?: string | null;
    district?: string | null;
    village?: string | null;
  };
  quantity: number;
  unitPricePaise: number;
  unitPriceRupees?: number;
  totalPaise: number;
  totalRupees?: number;
  paymentMode: PaymentMode;
  status: SaleStatus;
  requestedAt: string;
  confirmedAt?: string | null;
  decidedAt?: string | null;
  rejectionReason?: string | null;
  incentiveRatePaise?: number | null;
  incentiveAmountPaise?: number | null;
  createdAt: string;
  updatedAt: string;
  invoice?: {
    id: string;
    number: string;
  } | null;
  payments?: Array<{
    id: string;
    mode: PaymentMode;
    amountPaise: number;
    createdAt: string;
  }>;
}

export interface CreateSalePayload {
  customerId: string;
  quantity: number;
  unitPricePaise: number;
  paymentMode: PaymentMode;
  requestKey?: string;
}

export interface CollectPaymentPayload {
  mode: "CASH" | "BANK";
  amountPaise?: number;
}

export interface RejectSalePayload {
  reason?: string;
}

// ==========================================
// Incentives
// ==========================================

export interface BusinessSettings {
  id: number;
  minimumPricePaise: number;
  incentiveRatePaise: number | null;
  updatedAt: string;
}

export interface IncentiveSummaryItem {
  sellerId: string;
  sellerName: string;
  territory: string;
  confirmedPackets: number;
  ratePerPacketPaise: number;
  ratePerPacketRupees: number;
  totalIncentivePaise: number;
  totalIncentiveRupees: number;
}

export interface SellerIncentiveData {
  summary: {
    totalPacketsSold: number;
    totalIncentivePaise: number;
    totalIncentiveRupees: number;
  };
  items: Array<{
    saleId: string;
    date: string;
    customer: { id: string; shopName: string; contactName: string };
    quantity: number;
    incentiveRatePaise: number | null;
    incentiveAmountPaise: number;
  }>;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  saleId?: string | null;
  kind: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
  sale?: { id: string; status: SaleStatus } | null;
}

// ==========================================
// Invoices
// ==========================================

export interface InvoiceItem {
  id: string;
  saleId: string;
  number: string;
  pdfPath?: string | null;
  createdAt: string;
  sale?: SaleItem;
  deliveries?: Array<{
    channel: DeliveryChannel;
    status: DeliveryStatus;
  }>;
}

// ==========================================
// Dashboards
// ==========================================

export interface AdminDashboardMetrics {
  totalPacketsSold: number;
  totalEarningsPaise: number;
  totalEarningsRupees: number;
  totalStates: number;
  totalShops: number;
  totalManagers: number;
  totalSellers: number;
  totalInventory: number;
  hqStock: number;
  warehouseStock: number;
  sellerStock: number;
  totalIncentivePaise: number;
  totalIncentiveRupees: number;
}

export interface AdminDashboardData {
  metrics: AdminDashboardMetrics;
  appliedFilters: {
    state?: string;
    district?: string;
    village?: string;
    managerId?: string;
    sellerId?: string;
    categoryId?: string;
  };
}

export interface DashboardFilterOptions {
  categories: Array<{ id: string; name: string }>;
  states: string[];
  districts: Array<{ state: string; district: string }>;
  villages?: Array<{ state: string; district: string; village: string }>;
}

export interface ManagerDashboardData {
  metrics: {
    totalSellers: number;
    totalCustomers: number;
    totalPacketsSold: number;
    totalEarningsPaise: number;
    totalEarningsRupees: number;
    totalRemainingStock: number;
  };
}

export interface SellerDashboardData {
  metrics: {
    assignedPackets: number;
    soldPackets: number;
    remainingPackets: number;
    totalIncentivePaise: number;
    totalIncentiveRupees: number;
  };
  recentSales: SaleItem[];
}

// ==========================================
// Reports
// ==========================================

export interface SalesReportQuery {
  from?: string;
  to?: string;
  state?: string;
  district?: string;
  village?: string;
  managerId?: string;
  sellerId?: string;
  paymentMode?: PaymentMode;
  status?: SaleStatus;
  groupBy?: "date" | "seller" | "manager" | "state" | "district" | "village";
  format?: "json" | "csv" | "xlsx";
}

export interface SalesReportData {
  summary: {
    totalSalesCount: number;
    totalQuantitySold: number;
    grossSalesPaise: number;
    grossSalesRupees: number;
    netSalesPaise: number;
    netSalesRupees: number;
    averageOrderValueRupees: number;
  };
  groups?: Array<{
    label: string;
    count: number;
    quantity: number;
    totalPaise: number;
  }>;
  items: SaleItem[];
}

export interface InventoryReportData {
  summary: {
    totalStock: number;
    hqStock: number;
    warehouseStock: number;
    sellerStock: number;
    totalReceived: number;
    totalTransferred: number;
    totalSold: number;
  };
  locations: Array<WarehouseItem & {
    seller?: {
      id: string;
      name: string;
      phone?: string | null;
      manager?: { id: string; name: string } | null;
    } | null;
  }>;
  movements: StockTransactionItem[];
}
