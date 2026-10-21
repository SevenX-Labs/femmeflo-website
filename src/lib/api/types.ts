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
  alternatePhone?: string | null;
  designation?: string | null;
  employeeCode?: string | null;
  address?: string | null;
  pincode?: string | null;
  aadharNumber?: string | null;
  drivingLicense?: string | null;
  education?: string | null;
  role: Role;
  active: boolean;
  managerId?: string | null;
  permissions: string[];
  isSeller?: boolean;
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
  employeeCode?: string;
  password: string;
  state?: string;
  district?: string;
  village?: string;
  permissions?: string[];
  isSeller?: boolean;
  aadharNumber?: string;
  drivingLicense?: string;
  education?: string;
  address?: string;
  pincode?: string;
  alternatePhone?: string;
}

export interface UpdateUserPayload {
  name?: string;
  designation?: string;
  employeeCode?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  pincode?: string;
  state?: string;
  district?: string;
  village?: string;
  active?: boolean;
  isSeller?: boolean;
  aadharNumber?: string;
  drivingLicense?: string;
  education?: string;
  managerId?: string;
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
  designation?: string;
  employeeCode?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  password: string;
  address?: string;
  pincode?: string;
  village?: string;
  district?: string;
  state?: string;
  managerId?: string;
  active?: boolean;
  isSeller?: boolean;
  aadharNumber?: string;
  drivingLicense?: string;
  education?: string;
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
  shopNumber?: string | null;
  streetName?: string | null;
  pincode?: string | null;
  address?: string | null;
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
  shopNumber?: string;
  streetName?: string;
  pincode?: string;
  address?: string;
  state: string;
  district: string;
  village: string;
  photoPath?: string;
  photoUrl?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface PincodeLookupResponse {
  pincode: string;
  state: string;
  district: string;
  village: string;
  villages?: string[];
}

export interface UpdateCustomerPayload extends Partial<CreateCustomerPayload> {
  active?: boolean;
}

// ==========================================
// Products
// ==========================================

export interface ProductItem {
  id: string;
  name: string;
  sku: string | null;
  basePricePaise: number;
  minimumPricePaise: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  sku?: string;
  basePricePaise: number;
  minimumPricePaise: number;
  active?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  sku?: string | null;
  basePricePaise?: number;
  minimumPricePaise?: number;
  active?: boolean;
}

export interface SaleLineItemData {
  id: string;
  productId: string;
  product?: { id: string; name: string; sku?: string | null };
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
}

export interface ProductBalanceItem {
  productId: string;
  productName: string;
  productSku?: string | null;
  balance: number;
  assigned?: number;
  sold?: number;
}

// ==========================================
// Inventory & Stock
// ==========================================

export interface WarehouseItem {
  id: string;
  type: StockLocationType;
  name: string;
  balance: number;
  received?: number;
  transferredIn?: number;
  transferredOut?: number;
  sold?: number;
  lastMovementAt?: string | null;
  sellerId?: string | null;
  seller?: {
    id: string;
    name: string;
    phone?: string | null;
  } | null;
  productBalances?: ProductBalanceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InventorySummaryData {
  totalInventory: number;
  totalStock?: number;
  hqStock: number;
  warehouseStock: number;
  sellerStock: number;
  totalReceived?: number;
  totalTransferred?: number;
  totalSold?: number;
  products?: Array<{
    id: string;
    name: string;
    sku: string | null;
    totalBalance: number;
    hqBalance: number;
    warehouseBalance: number;
    sellerBalance: number;
  }>;
  warehouses: WarehouseItem[];
  locations?: WarehouseItem[];
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
  productId?: string | null;
  product?: {
    id: string;
    name: string;
    sku?: string | null;
  } | null;
  saleId?: string | null;
  sale?: {
    id: string;
    paymentMode?: PaymentMode;
    totalPaise?: number;
    customer?: {
      shopName?: string;
      contactName?: string;
    } | null;
  } | null;
  createdAt: string;
}

// ==========================================
// Sales & Approvals
// ==========================================

export interface UpdateSalePayload {
  customerId?: string;
  quantity?: number;
  unitPricePaise?: number;
  paymentMode?: PaymentMode;
}

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
  lineItems?: SaleLineItemData[];
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

export interface CreateMultiProductSalePayload {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPricePaise: number;
  }>;
  paymentMode: PaymentMode;
  requestKey?: string;
}

export interface StockReceiptMultiPayload {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface StockTransferMultiPayload {
  sourceId: string;
  destinationId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
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
  companyName?: string | null;
  companyGst?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyPan?: string | null;
  invoiceTerms?: string | null;
  updatedAt: string;
}

export interface PeriodEarning {
  year: number;
  month: number;
  label: string;
  confirmedPackets: number;
  salesIncentivePaise: number;
  additionsPaise: number;
  deductionsPaise: number;
  adjustedEntitlementPaise: number;
  allocatedPaidPaise: number;
  outstandingPaise: number;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
}

export interface IncentiveAdjustmentItem {
  id: string;
  type: "ADD" | "DEDUCT";
  amountPaise: number;
  reason: string;
  adjustmentDate?: string;
  createdAt: string;
  createdBy?: { id: string; name: string };
}

export interface IncentivePayoutAllocationItem {
  id: string;
  payoutId: string;
  periodYear: number;
  periodMonth: number;
  amountPaise: number;
  createdAt: string;
}

export interface IncentivePayoutItem {
  id: string;
  amountPaise: number;
  paymentDate: string;
  paymentMethod: string;
  referenceId?: string | null;
  remarks?: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string };
  allocations?: IncentivePayoutAllocationItem[];
}

export interface IncentiveRateHistoryItem {
  id: string;
  previousRatePaise?: number | null;
  newRatePaise: number;
  effectiveDate: string;
  reason?: string | null;
  createdAt: string;
  changedBy?: { id: string; name: string };
}

export interface IncentiveSummaryItem {
  sellerId: string;
  sellerName: string;
  role?: string;
  manager?: { id: string; name: string; phone?: string | null } | null;
  territory: string;
  isCustomRate?: boolean;
  ratePerPacketPaise: number;
  ratePerPacketRupees: number;
  confirmedPackets: number;
  totalConfirmedPackets: number;
  totalIncentivePaise: number;
  totalIncentiveRupees: number;
  earnedPaise: number;
  additionsPaise: number;
  deductionsPaise: number;
  adjustedEntitlementPaise: number;
  totalPaidPaise: number;
  outstandingPaise: number;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  currentMonth: PeriodEarning;
  previousMonth: PeriodEarning;
  olderPendingPaise: number;
  periods?: PeriodEarning[];
}

export interface AdminIncentiveCompanySummary {
  totalEarnedPaise: number;
  totalEarnedRupees: number;
  totalAdditionsPaise: number;
  totalAdditionsRupees: number;
  totalDeductionsPaise: number;
  totalDeductionsRupees: number;
  totalAdjustedEntitlementPaise: number;
  totalAdjustedEntitlementRupees: number;
  totalPaidPaise: number;
  totalPaidRupees: number;
  totalPendingPaise: number;
  totalPendingRupees: number;
  currentMonth: {
    year: number;
    month: number;
    earnedPaise: number;
    earnedRupees: number;
    paidPaise: number;
    paidRupees: number;
    pendingPaise: number;
    pendingRupees: number;
  };
  previousMonth: {
    year: number;
    month: number;
    earnedPaise: number;
    earnedRupees: number;
    paidPaise: number;
    paidRupees: number;
    pendingPaise: number;
    pendingRupees: number;
  };
  olderPendingPaise: number;
  olderPendingRupees: number;
  pendingEmployeesCount: number;
}

export interface AdminIncentivesResponse {
  summary: AdminIncentiveCompanySummary;
  currentRatePaise: number | null;
  sellers: IncentiveSummaryItem[];
  users: IncentiveSummaryItem[];
}

export interface AdminUserIncentiveDetailsResponse {
  user: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    role: string;
    employeeCode?: string | null;
    designation?: string | null;
    state?: string | null;
    district?: string | null;
    village?: string | null;
    manager?: { id: string; name: string; phone?: string | null } | null;
    incentiveRatePaise?: number | null;
    effectiveRatePaise: number;
    effectiveRateRupees: number;
    isCustomRate: boolean;
  };
  summary: {
    totalConfirmedPackets: number;
    salesIncentivePaise: number;
    additionsPaise: number;
    deductionsPaise: number;
    adjustedEntitlementPaise: number;
    totalPaidPaise: number;
    outstandingPaise: number;
    status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
    currentMonth: PeriodEarning;
    previousMonth: PeriodEarning;
    olderPendingPaise: number;
    periods: PeriodEarning[];
  };
  rateHistory: IncentiveRateHistoryItem[];
  adjustments: IncentiveAdjustmentItem[];
  payouts: IncentivePayoutItem[];
  sales: Array<{
    id: string;
    confirmedAt: string;
    customer: { id: string; shopName: string; contactName: string; phone?: string | null };
    quantity: number;
    incentiveRatePaise: number | null;
    incentiveAmountPaise: number | null;
  }>;
}

export interface SellerIncentiveData {
  summary: {
    totalPacketsSold: number;
    totalIncentivePaise: number;
    totalIncentiveRupees: number;
    additionsPaise?: number;
    additionsRupees?: number;
    deductionsPaise?: number;
    deductionsRupees?: number;
    adjustedEntitlementPaise?: number;
    adjustedEntitlementRupees?: number;
    totalPaidPaise?: number;
    totalPaidRupees?: number;
    outstandingPaise?: number;
    outstandingRupees?: number;
    status?: "UNPAID" | "PARTIALLY_PAID" | "PAID";
    currentMonth?: PeriodEarning;
    previousMonth?: PeriodEarning;
    olderPendingPaise?: number;
    olderPendingRupees?: number;
  };
  items: Array<{
    saleId: string;
    date: string;
    customer: { id: string; shopName: string; contactName: string };
    quantity: number;
    incentiveRatePaise: number | null;
    incentiveAmountPaise: number;
  }>;
  months?: PeriodEarning[];
  adjustments?: IncentiveAdjustmentItem[];
  payouts?: IncentivePayoutItem[];
}

export interface ManagerIncentiveMemberSummary {
  sellerId: string;
  sellerName: string;
  phone?: string | null;
  territory: string;
  confirmedPackets: number;
  earnedPaise: number;
  earnedRupees: number;
  additionsPaise: number;
  deductionsPaise: number;
  adjustedEntitlementPaise: number;
  adjustedEntitlementRupees: number;
  totalPaidPaise: number;
  totalPaidRupees: number;
  outstandingPaise: number;
  outstandingRupees: number;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  currentMonth: PeriodEarning;
  previousMonth: PeriodEarning;
  olderPendingPaise: number;
}

export interface ManagerIncentiveData {
  personal: SellerIncentiveData;
  team: {
    summary: {
      assignedSellersCount: number;
      totalPacketsSold: number;
      totalIncentiveEarnedPaise: number;
      totalIncentiveEarnedRupees: number;
      totalAdditionsPaise: number;
      totalDeductionsPaise: number;
      totalAdjustedEntitlementPaise: number;
      totalAdjustedEntitlementRupees: number;
      totalPaidPaise: number;
      totalPaidRupees: number;
      totalPendingPaise: number;
      totalPendingRupees: number;
      currentMonth: {
        year: number;
        month: number;
        earnedPaise: number;
        earnedRupees: number;
        paidPaise: number;
        paidRupees: number;
        pendingPaise: number;
        pendingRupees: number;
      };
      previousMonth: {
        year: number;
        month: number;
        earnedPaise: number;
        earnedRupees: number;
        paidPaise: number;
        paidRupees: number;
        pendingPaise: number;
        pendingRupees: number;
      };
      olderPendingPaise: number;
      olderPendingRupees: number;
    };
    members: ManagerIncentiveMemberSummary[];
  };
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
    from?: string;
    to?: string;
  };
}

export interface DashboardFilterOptions {
  categories: Array<{ id: string; name: string }>;
  states: string[];
  districts: Array<{ state: string; district: string }>;
  villages?: Array<{ state: string; district: string; village: string }>;
  managers?: Array<{ id: string; name: string; state?: string | null; district?: string | null }>;
  sellers?: Array<{ id: string; name: string; managerId?: string | null; state?: string | null; district?: string | null }>;
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
