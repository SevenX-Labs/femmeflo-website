import { apiRequest, API_BASE_URL, tokenStorage } from "./client";
import type {
  AdminDashboardData,
  BusinessSettings,
  CreateCustomerPayload,
  CreateManagerPayload,
  CreateSellerPayload,
  CreateWarehousePayload,
  CustomerItem,
  DashboardFilterOptions,
  IncentiveSummaryItem,
  InventoryReportData,
  InventorySummaryData,
  InvoiceItem,
  ManagerItem,
  PaginationMeta,
  PincodeLookupResponse,
  SaleItem,
  SalesReportData,
  SalesReportQuery,
  SellerItem,
  StockReceiptPayload,
  StockTransactionItem,
  StockTransferPayload,
  UpdateCustomerPayload,
  UpdateUserPayload,
  WarehouseItem,
} from "./types";

export interface ListResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export const adminApi = {
  // ----------------------------------------------------
  // Dashboard
  // ----------------------------------------------------
  async getDashboard(filters?: {
    state?: string;
    district?: string;
    village?: string;
    managerId?: string;
    sellerId?: string;
    categoryId?: string;
  }): Promise<AdminDashboardData> {
    return apiRequest<AdminDashboardData>("admin/dashboard", {
      method: "GET",
      params: filters,
    });
  },

  async getDashboardFilters(): Promise<DashboardFilterOptions> {
    return apiRequest<DashboardFilterOptions>("admin/dashboard/filters", {
      method: "GET",
    });
  },

  // ----------------------------------------------------
  // Managers
  // ----------------------------------------------------
  async listManagers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    active?: boolean;
    state?: string;
    district?: string;
    village?: string;
  }): Promise<{ managers: ManagerItem[]; items: ManagerItem[]; pagination: PaginationMeta }> {
    const raw = await apiRequest<{ managers?: ManagerItem[]; items?: ManagerItem[]; pagination: PaginationMeta }>(
      "admin/managers",
      {
        method: "GET",
        params: {
          page: params?.page,
          pageSize: params?.pageSize,
          search: params?.search,
          active: params?.active,
          state: params?.state,
          district: params?.district,
          village: params?.village,
        },
      }
    );
    const list = raw?.managers ?? raw?.items ?? [];
    return {
      managers: list,
      items: list,
      pagination: raw?.pagination ?? { page: 1, pageSize: 20, total: list.length, totalPages: 1 },
    };
  },

  async getManager(id: string): Promise<{ manager: ManagerItem }> {
    return apiRequest<{ manager: ManagerItem }>(`admin/managers/${id}`, {
      method: "GET",
    });
  },

  async createManager(payload: CreateManagerPayload): Promise<{ manager: ManagerItem }> {
    return apiRequest<{ manager: ManagerItem }>("admin/managers", {
      method: "POST",
      body: payload,
    });
  },

  async updateManager(
    id: string,
    payload: UpdateUserPayload
  ): Promise<{ manager: ManagerItem }> {
    return apiRequest<{ manager: ManagerItem }>(`admin/managers/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async updateManagerPermissions(
    id: string,
    permissions: string[]
  ): Promise<{ manager: ManagerItem }> {
    return apiRequest<{ manager: ManagerItem }>(`admin/permissions/managers/${id}/permissions`, {
      method: "PATCH",
      body: { permissions },
    });
  },

  async updateOverallPermissions(
    permissions: string[]
  ): Promise<{ count: number; managers?: ManagerItem[] }> {
    return apiRequest<{ count: number; managers?: ManagerItem[] }>("admin/permissions/overall", {
      method: "PATCH",
      body: { permissions },
    });
  },

  // ----------------------------------------------------
  // Sellers
  // ----------------------------------------------------
  async listSellers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    active?: boolean;
    managerId?: string;
    state?: string;
    district?: string;
    village?: string;
  }): Promise<{ sellers: SellerItem[]; items: SellerItem[]; pagination: PaginationMeta }> {
    const raw = await apiRequest<{ sellers?: SellerItem[]; items?: SellerItem[]; pagination: PaginationMeta }>(
      "admin/sellers",
      {
        method: "GET",
        params: {
          page: params?.page,
          pageSize: params?.pageSize,
          search: params?.search,
          active: params?.active,
          managerId: params?.managerId,
          state: params?.state,
          district: params?.district,
          village: params?.village,
        },
      }
    );
    const list = raw?.sellers ?? raw?.items ?? [];
    return {
      sellers: list,
      items: list,
      pagination: raw?.pagination ?? { page: 1, pageSize: 20, total: list.length, totalPages: 1 },
    };
  },

  async getSeller(id: string): Promise<{ seller: SellerItem }> {
    return apiRequest<{ seller: SellerItem }>(`admin/sellers/${id}`, {
      method: "GET",
    });
  },

  async createSeller(payload: CreateSellerPayload): Promise<{ seller: SellerItem }> {
    return apiRequest<{ seller: SellerItem }>("admin/sellers", {
      method: "POST",
      body: payload,
    });
  },

  async updateSeller(
    id: string,
    payload: UpdateUserPayload
  ): Promise<{ seller: SellerItem }> {
    return apiRequest<{ seller: SellerItem }>(`admin/sellers/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  // ----------------------------------------------------
  // Customers
  // ----------------------------------------------------
  async listCustomers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
    sellerId?: string;
    active?: boolean;
    state?: string;
    district?: string;
    village?: string;
  }): Promise<{ customers: CustomerItem[]; items: CustomerItem[]; pagination: PaginationMeta }> {
    const raw = await apiRequest<{ customers?: CustomerItem[]; items?: CustomerItem[]; pagination: PaginationMeta }>(
      "admin/customers",
      {
        method: "GET",
        params: {
          page: params?.page,
          pageSize: params?.pageSize,
          search: params?.search,
          categoryId: params?.categoryId,
          sellerId: params?.sellerId,
          active: params?.active,
          state: params?.state,
          district: params?.district,
          village: params?.village,
        },
      }
    );
    const list = raw?.customers ?? raw?.items ?? [];
    return {
      customers: list,
      items: list,
      pagination: raw?.pagination ?? { page: 1, pageSize: 20, total: list.length, totalPages: 1 },
    };
  },

  async getCustomer(id: string): Promise<{ customer: CustomerItem }> {
    return apiRequest<{ customer: CustomerItem }>(`admin/customers/${id}`, {
      method: "GET",
    });
  },

  async lookupPincode(pincode: string): Promise<PincodeLookupResponse> {
    try {
      const res = await apiRequest<{ pincode: string; state: string; district: string; village: string; villages?: string[] }>(
        `admin/customers/pincode/${pincode}`,
        { method: "GET" }
      );
      if (res && res.state) {
        return res;
      }
    } catch {
      // Fallback below
    }
    try {
      const postalRes = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await postalRes.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && data[0].PostOffice?.length) {
        const poList = data[0].PostOffice;
        const state = poList[0].State || "";
        const district = poList[0].District || "";
        const villages: string[] = Array.from(new Set(poList.map((p: any) => String(p.Name || "")).filter(Boolean))) as string[];
        return {
          pincode,
          state,
          district,
          village: villages[0] || "",
          villages,
        };
      }
    } catch {
      // Ignored
    }
    return {
      pincode,
      state: "",
      district: "",
      village: "",
      villages: [],
    };
  },

  async createCustomer(payload: CreateCustomerPayload | FormData): Promise<{ customer: CustomerItem; photoUrl?: string }> {
    return apiRequest<{ customer: CustomerItem; photoUrl?: string }>("admin/customers", {
      method: "POST",
      body: payload,
    });
  },

  async updateCustomer(
    id: string,
    payload: UpdateCustomerPayload
  ): Promise<{ customer: CustomerItem }> {
    return apiRequest<{ customer: CustomerItem }>(`admin/customers/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async uploadCustomerPhoto(
    id: string,
    file: File | Blob
  ): Promise<{ customer: CustomerItem; photoUrl: string }> {
    const formData = new FormData();
    formData.append("photo", file);
    return apiRequest<{ customer: CustomerItem; photoUrl: string }>(`admin/customers/${id}/photo`, {
      method: "POST",
      body: formData,
    });
  },

  // ----------------------------------------------------
  // Inventory
  // ----------------------------------------------------
  async getInventorySummary(): Promise<InventorySummaryData> {
    const raw = await apiRequest<any>("admin/inventory", {
      method: "GET",
    });
    const allLocations: WarehouseItem[] = raw?.locations ?? raw?.warehouses ?? [];
    return {
      totalInventory: raw?.totalInventory ?? raw?.totalStock ?? 0,
      hqStock: raw?.hqStock ?? 0,
      warehouseStock: raw?.warehouseStock ?? 0,
      sellerStock: raw?.sellerStock ?? 0,
      warehouses: allLocations,
      locations: allLocations,
      sellers: raw?.sellers ?? [],
    };
  },

  async listWarehouses(): Promise<{ warehouses: WarehouseItem[]; items: WarehouseItem[] }> {
    const raw = await apiRequest<{ warehouses?: WarehouseItem[]; items?: WarehouseItem[] }>(
      "admin/inventory/warehouses",
      {
        method: "GET",
      }
    );
    const list = raw?.warehouses ?? raw?.items ?? [];
    return {
      warehouses: list,
      items: list,
    };
  },

  async createWarehouse(payload: CreateWarehousePayload): Promise<{ warehouse: WarehouseItem }> {
    return apiRequest<{ warehouse: WarehouseItem }>("admin/inventory/warehouses", {
      method: "POST",
      body: payload,
    });
  },

  async addReceipt(payload: StockReceiptPayload): Promise<{ receipt: StockTransactionItem }> {
    return apiRequest<{ receipt: StockTransactionItem }>("admin/inventory/receipts", {
      method: "POST",
      body: payload,
    });
  },

  async transferStock(payload: StockTransferPayload): Promise<{ transfer: StockTransactionItem }> {
    return apiRequest<{ transfer: StockTransactionItem }>("admin/inventory/transfers", {
      method: "POST",
      body: payload,
    });
  },

  async listTransactions(params?: {
    page?: number;
    pageSize?: number;
    locationId?: string;
    type?: string;
  }): Promise<{ transactions: StockTransactionItem[]; items: StockTransactionItem[]; pagination: PaginationMeta }> {
    const raw = await apiRequest<{ transactions?: StockTransactionItem[]; items?: StockTransactionItem[]; pagination: PaginationMeta }>(
      "admin/inventory/transactions",
      {
        method: "GET",
        params: {
          page: params?.page,
          pageSize: params?.pageSize,
          locationId: params?.locationId,
          type: params?.type,
        },
      }
    );
    const list = raw?.transactions ?? raw?.items ?? [];
    return {
      transactions: list,
      items: list,
      pagination: raw?.pagination ?? { page: 1, pageSize: 20, total: list.length, totalPages: 1 },
    };
  },

  // ----------------------------------------------------
  // Sales
  // ----------------------------------------------------
  async listSales(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    paymentMode?: string;
    period?: string;
    customerId?: string;
    sellerId?: string;
    search?: string;
  }): Promise<{ sales: SaleItem[]; items: SaleItem[]; pagination: PaginationMeta }> {
    const raw = await apiRequest<{ sales?: SaleItem[]; items?: SaleItem[]; pagination: PaginationMeta }>("admin/sales", {
      method: "GET",
      params: {
        page: params?.page,
        pageSize: params?.pageSize,
        status: params?.status,
        paymentMode: params?.paymentMode,
        period: params?.period,
        customerId: params?.customerId,
        sellerId: params?.sellerId,
        search: params?.search,
      },
    });
    const list = raw?.sales ?? raw?.items ?? [];
    return {
      sales: list,
      items: list,
      pagination: raw?.pagination ?? { page: 1, pageSize: 20, total: list.length, totalPages: 1 },
    };
  },

  async getSale(id: string): Promise<{ sale: SaleItem }> {
    return apiRequest<{ sale: SaleItem }>(`admin/sales/${id}`, {
      method: "GET",
    });
  },

  // ----------------------------------------------------
  // Approvals
  // ----------------------------------------------------
  async listApprovals(): Promise<{ pendingSales: SaleItem[]; items: SaleItem[]; pagination: PaginationMeta }> {
    const raw = await apiRequest<{ pendingSales?: SaleItem[]; items?: SaleItem[]; pagination?: PaginationMeta }>(
      "admin/approvals",
      {
        method: "GET",
      }
    );
    const list = raw?.pendingSales ?? raw?.items ?? [];
    return {
      pendingSales: list,
      items: list,
      pagination: raw?.pagination ?? { page: 1, pageSize: 20, total: list.length, totalPages: 1 },
    };
  },

  async approveSale(saleId: string): Promise<{ sale: SaleItem }> {
    return apiRequest<{ sale: SaleItem }>(`admin/approvals/${saleId}/approve`, {
      method: "POST",
    });
  },

  async rejectSale(saleId: string, reason?: string): Promise<{ sale: SaleItem }> {
    return apiRequest<{ sale: SaleItem }>(`admin/approvals/${saleId}/reject`, {
      method: "POST",
      body: { reason },
    });
  },

  // ----------------------------------------------------
  // Incentives
  // ----------------------------------------------------
  async getIncentives(): Promise<{
    currentRatePaise: number | null;
    sellers: Array<{
      seller: { id: string; name: string; phone?: string | null };
      totalConfirmedPackets: number;
      totalIncentivePaise: number;
      totalIncentiveRupees: number;
    }>;
  }> {
    return apiRequest("admin/incentives", {
      method: "GET",
    });
  },

  async getIncentiveSettings(): Promise<{ settings: BusinessSettings }> {
    return apiRequest<{ settings: BusinessSettings }>("admin/incentives/settings", {
      method: "GET",
    });
  },

  async updateIncentiveSettings(payload: {
    minimumPricePaise?: number;
    incentiveRatePaise?: number;
  }): Promise<{ settings: BusinessSettings }> {
    return apiRequest<{ settings: BusinessSettings }>("admin/incentives/settings", {
      method: "PATCH",
      body: payload,
    });
  },

  // ----------------------------------------------------
  // Invoices
  // ----------------------------------------------------
  async listInvoices(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<{ invoices: InvoiceItem[]; items: InvoiceItem[]; pagination: PaginationMeta }> {
    const raw = await apiRequest<{ invoices?: InvoiceItem[]; items?: InvoiceItem[]; pagination: PaginationMeta }>(
      "admin/invoices",
      {
        method: "GET",
        params: {
          page: params?.page,
          pageSize: params?.pageSize,
          search: params?.search,
        },
      }
    );
    const list = raw?.invoices ?? raw?.items ?? [];
    return {
      invoices: list,
      items: list,
      pagination: raw?.pagination ?? { page: 1, pageSize: 20, total: list.length, totalPages: 1 },
    };
  },

  async getInvoice(id: string): Promise<{ invoice: InvoiceItem }> {
    return apiRequest<{ invoice: InvoiceItem }>(`admin/invoices/${id}`, {
      method: "GET",
    });
  },

  getInvoicePdfUrl(id: string, download = false): string {
    const token = tokenStorage.getToken();
    return `${API_BASE_URL}/admin/invoices/${id}/pdf?download=${download ? "true" : "false"}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
  },

  async downloadInvoicePdf(id: string, download = false): Promise<Blob> {
    return apiRequest<Blob>(`admin/invoices/${id}/pdf?download=${download ? "true" : "false"}`, {
      method: "GET",
    });
  },

  // ----------------------------------------------------
  // Permissions
  // ----------------------------------------------------
  async listPermissions(): Promise<{ permissions: string[] }> {
    return apiRequest<{ permissions: string[] }>("admin/permissions", {
      method: "GET",
    });
  },

  // ----------------------------------------------------
  // Reports
  // ----------------------------------------------------
  async getSalesReport(query?: SalesReportQuery): Promise<SalesReportData> {
    return apiRequest<SalesReportData>("admin/reports/sales", {
      method: "GET",
      params: query as Record<string, string | number | boolean | undefined>,
    });
  },

  async getInventoryReport(query?: {
    from?: string;
    to?: string;
    locationId?: string;
    type?: string;
  }): Promise<InventoryReportData> {
    return apiRequest<InventoryReportData>("admin/reports/inventory", {
      method: "GET",
      params: query,
    });
  },
};
