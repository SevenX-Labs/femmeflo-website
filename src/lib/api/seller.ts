import { apiRequest, API_BASE_URL, tokenStorage } from "./client";
import type {
  CollectPaymentPayload,
  CreateCustomerPayload,
  CreateMultiProductSalePayload,
  CreateSalePayload,
  CustomerItem,
  PaginationMeta,
  PincodeLookupResponse,
  ProductItem,
  PublicUser,
  SaleItem,
  SellerDashboardData,
  SellerIncentiveData,
  StockTransactionItem,
  UpdateCustomerPayload,
  UpdateSalePayload,
  UpdateUserPayload,
} from "./types";

export const sellerApi = {
  // ----------------------------------------------------
  // Dashboard
  // ----------------------------------------------------
  async getDashboard(): Promise<SellerDashboardData> {
    return apiRequest<SellerDashboardData>("seller/dashboard", {
      method: "GET",
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
    active?: boolean;
    state?: string;
    district?: string;
    village?: string;
  }): Promise<{ customers: CustomerItem[]; items: CustomerItem[]; pagination: PaginationMeta }> {
    const raw = await apiRequest<{ customers?: CustomerItem[]; items?: CustomerItem[]; pagination: PaginationMeta }>(
      "seller/customers",
      {
        method: "GET",
        params: {
          page: params?.page,
          pageSize: params?.pageSize,
          search: params?.search,
          categoryId: params?.categoryId,
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
    return apiRequest<{ customer: CustomerItem }>(`seller/customers/${id}`, {
      method: "GET",
    });
  },

  async lookupPincode(pincode: string): Promise<PincodeLookupResponse> {
    try {
      const res = await apiRequest<{ pincode: string; state: string; district: string; village: string; villages?: string[] }>(
        `seller/customers/pincode/${pincode}`,
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

  async createCustomer(
    payload: Omit<CreateCustomerPayload, "sellerId"> | FormData
  ): Promise<{ customer: CustomerItem; photoUrl?: string }> {
    return apiRequest<{ customer: CustomerItem; photoUrl?: string }>("seller/customers", {
      method: "POST",
      body: payload,
    });
  },

  async updateCustomer(
    id: string,
    payload: UpdateCustomerPayload
  ): Promise<{ customer: CustomerItem }> {
    return apiRequest<{ customer: CustomerItem }>(`seller/customers/${id}`, {
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
    return apiRequest<{ customer: CustomerItem; photoUrl: string }>(`seller/customers/${id}/photo`, {
      method: "POST",
      body: formData,
    });
  },

  // ----------------------------------------------------
  // Products
  // ----------------------------------------------------
  async listProducts(): Promise<{ items: Array<{ id: string; name: string; sku: string | null; basePricePaise: number; minimumPricePaise: number }> }> {
    return apiRequest<{ items: Array<{ id: string; name: string; sku: string | null; basePricePaise: number; minimumPricePaise: number }> }>("seller/products", {
      method: "GET",
    });
  },

  // ----------------------------------------------------
  // Inventory
  // ----------------------------------------------------
  async getInventory(): Promise<{
    balance: number;
    remaining?: number;
    assignedPackets: number;
    assigned?: number;
    soldPackets: number;
    sold?: number;
    locationName: string;
    name?: string;
    products?: Array<{ productId: string; productName: string; productSku?: string | null; balance: number; assigned: number; sold: number }>;
  }> {
    return apiRequest<{
      balance: number;
      remaining?: number;
      assignedPackets: number;
      assigned?: number;
      soldPackets: number;
      sold?: number;
      locationName: string;
      name?: string;
      products?: Array<{ productId: string; productName: string; productSku?: string | null; balance: number; assigned: number; sold: number }>;
    }>("seller/inventory", {
      method: "GET",
    });
  },

  async listTransactions(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
  }): Promise<{ transactions: StockTransactionItem[]; items: StockTransactionItem[]; pagination: PaginationMeta }> {
    const raw = await apiRequest<{ transactions?: StockTransactionItem[]; items?: StockTransactionItem[]; pagination: PaginationMeta }>(
      "seller/inventory/transactions",
      {
        method: "GET",
        params: {
          page: params?.page,
          pageSize: params?.pageSize,
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
  async createSale(payload: CreateSalePayload | CreateMultiProductSalePayload): Promise<{ sale: SaleItem }> {
    return apiRequest<{ sale: SaleItem }>("seller/sales", {
      method: "POST",
      body: payload,
    });
  },

  async listSales(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    paymentMode?: string;
    period?: string;
    customerId?: string;
    search?: string;
  }): Promise<{ sales: SaleItem[]; items: SaleItem[]; pagination: PaginationMeta }> {
    const raw = await apiRequest<{ sales?: SaleItem[]; items?: SaleItem[]; pagination: PaginationMeta }>("seller/sales", {
      method: "GET",
      params: {
        page: params?.page,
        pageSize: params?.pageSize,
        status: params?.status,
        paymentMode: params?.paymentMode,
        period: params?.period,
        customerId: params?.customerId,
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

  async updateSale(
    id: string,
    payload: UpdateSalePayload
  ): Promise<{ sale: SaleItem }> {
    return apiRequest<{ sale: SaleItem }>(`seller/sales/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  async getSale(id: string): Promise<{ sale: SaleItem }> {
    return apiRequest<{ sale: SaleItem }>(`seller/sales/${id}`, {
      method: "GET",
    });
  },

  async collectPayment(
    saleId: string,
    payload: CollectPaymentPayload
  ): Promise<{ sale: SaleItem }> {
    return apiRequest<{ sale: SaleItem }>(`seller/sales/${saleId}/payment`, {
      method: "PATCH",
      body: payload,
    });
  },

  // ----------------------------------------------------
  // Incentives
  // ----------------------------------------------------
  async getIncentives(): Promise<SellerIncentiveData> {
    return apiRequest<SellerIncentiveData>("seller/incentives", {
      method: "GET",
    });
  },

  // ----------------------------------------------------
  // Profile
  // ----------------------------------------------------
  async getProfile(): Promise<{ user: PublicUser & { manager?: { name: string; phone?: string } | null } }> {
    return apiRequest<{ user: PublicUser & { manager?: { name: string; phone?: string } | null } }>(
      "seller/profile",
      {
        method: "GET",
      }
    );
  },

  async updateProfile(payload: UpdateUserPayload): Promise<{ user: PublicUser }> {
    return apiRequest<{ user: PublicUser }>("seller/profile", {
      method: "PATCH",
      body: payload,
    });
  },

  getInvoicePdfUrl(id: string, download = false): string {
    const token = tokenStorage.getToken();
    return `${API_BASE_URL}/invoices/${id}/pdf?download=${download ? "true" : "false"}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
  },

  async downloadInvoicePdf(id: string, download = false): Promise<Blob> {
    return apiRequest<Blob>(`invoices/${id}/pdf?download=${download ? "true" : "false"}`, {
      method: "GET",
    });
  },
};
