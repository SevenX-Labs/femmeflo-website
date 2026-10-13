import { apiRequest } from "./client";
import type {
  CollectPaymentPayload,
  CreateCustomerPayload,
  CreateSalePayload,
  CustomerItem,
  PaginationMeta,
  PublicUser,
  SaleItem,
  SellerDashboardData,
  SellerIncentiveData,
  StockTransactionItem,
  UpdateCustomerPayload,
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

  async createCustomer(
    payload: Omit<CreateCustomerPayload, "sellerId">
  ): Promise<{ customer: CustomerItem }> {
    return apiRequest<{ customer: CustomerItem }>("seller/customers", {
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
  async createSale(payload: CreateSalePayload): Promise<{ sale: SaleItem }> {
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
};
