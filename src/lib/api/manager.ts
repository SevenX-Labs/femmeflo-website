import { apiRequest, API_BASE_URL, tokenStorage } from "./client";
import type {
  CreateCustomerPayload,
  CreateSellerPayload,
  CustomerItem,
  ManagerIncentiveData,
  ManagerDashboardData,
  PaginationMeta,
  PincodeLookupResponse,
  SaleItem,
  SellerItem,
  UpdateCustomerPayload,
  UpdateUserPayload,
} from "./types";

export const managerApi = {
  // ----------------------------------------------------
  // Dashboard
  // ----------------------------------------------------
  async getDashboard(): Promise<ManagerDashboardData> {
    return apiRequest<ManagerDashboardData>("manager/dashboard", {
      method: "GET",
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
  }): Promise<{ sellers: SellerItem[]; items: SellerItem[]; pagination: PaginationMeta }> {
    const raw = await apiRequest<{ sellers?: SellerItem[]; items?: SellerItem[]; pagination: PaginationMeta }>(
      "manager/sellers",
      {
        method: "GET",
        params: {
          page: params?.page,
          pageSize: params?.pageSize,
          search: params?.search,
          active: params?.active,
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
    return apiRequest<{ seller: SellerItem }>(`manager/sellers/${id}`, {
      method: "GET",
    });
  },

  async createSeller(
    payload: Omit<CreateSellerPayload, "managerId">
  ): Promise<{ seller: SellerItem }> {
    return apiRequest<{ seller: SellerItem }>("manager/sellers", {
      method: "POST",
      body: payload,
    });
  },

  async updateSeller(
    id: string,
    payload: UpdateUserPayload
  ): Promise<{ seller: SellerItem }> {
    return apiRequest<{ seller: SellerItem }>(`manager/sellers/${id}`, {
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
  }): Promise<{ customers: CustomerItem[]; items: CustomerItem[]; pagination: PaginationMeta }> {
    const raw = await apiRequest<{ customers?: CustomerItem[]; items?: CustomerItem[]; pagination: PaginationMeta }>(
      "manager/customers",
      {
        method: "GET",
        params: {
          page: params?.page,
          pageSize: params?.pageSize,
          search: params?.search,
          categoryId: params?.categoryId,
          sellerId: params?.sellerId,
          active: params?.active,
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
    return apiRequest<{ customer: CustomerItem }>(`manager/customers/${id}`, {
      method: "GET",
    });
  },

  async lookupPincode(pincode: string): Promise<PincodeLookupResponse> {
    try {
      const res = await apiRequest<{ pincode: string; state: string; district: string; village: string; villages?: string[] }>(
        `manager/customers/pincode/${pincode}`,
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
    return apiRequest<{ customer: CustomerItem; photoUrl?: string }>("manager/customers", {
      method: "POST",
      body: payload,
    });
  },

  async updateCustomer(
    id: string,
    payload: UpdateCustomerPayload
  ): Promise<{ customer: CustomerItem }> {
    return apiRequest<{ customer: CustomerItem }>(`manager/customers/${id}`, {
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
    return apiRequest<{ customer: CustomerItem; photoUrl: string }>(`manager/customers/${id}/photo`, {
      method: "POST",
      body: formData,
    });
  },

  // ----------------------------------------------------
  // Inventory
  // ----------------------------------------------------
  async getInventory(): Promise<{
    summary: {
      totalSellers: number;
      totalAssigned: number;
      totalSold: number;
      totalRemaining: number;
    };
    sellers: Array<{
      seller: SellerItem;
      assigned: number;
      sold: number;
      remaining: number;
    }>;
  }> {
    return apiRequest<{
      summary: {
        totalSellers: number;
        totalAssigned: number;
        totalSold: number;
        totalRemaining: number;
      };
      sellers: Array<{
        seller: SellerItem;
        assigned: number;
        sold: number;
        remaining: number;
      }>;
    }>("manager/inventory", {
      method: "GET",
    });
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
    const raw = await apiRequest<{ sales?: SaleItem[]; items?: SaleItem[]; pagination: PaginationMeta }>("manager/sales", {
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
    return apiRequest<{ sale: SaleItem }>(`manager/sales/${id}`, {
      method: "GET",
    });
  },

  // ----------------------------------------------------
  // Incentives & Team Earnings
  // ----------------------------------------------------
  async getIncentives(): Promise<ManagerIncentiveData> {
    return apiRequest<ManagerIncentiveData>("manager/incentives", {
      method: "GET",
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
