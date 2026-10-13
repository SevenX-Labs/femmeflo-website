import { apiRequest } from "./client";
import type {
  Category,
  CreateCategoryPayload,
  PaginationMeta,
  UpdateCategoryPayload,
} from "./types";

export interface CategoryListResponse {
  categories: Category[];
  pagination: PaginationMeta;
}

export const categoryApi = {
  /**
   * List customer categories
   * GET /api/v1/categories
   */
  async listCategories(params?: {
    search?: string;
    active?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<CategoryListResponse & { items: Category[] }> {
    const raw = await apiRequest<{ categories?: Category[]; items?: Category[]; pagination?: PaginationMeta }>("categories", {
      method: "GET",
      params: {
        search: params?.search,
        active: params?.active,
        page: params?.page,
        pageSize: params?.pageSize ?? 100,
      },
    });
    const list = raw?.categories ?? raw?.items ?? [];
    return {
      categories: list,
      items: list,
      pagination: raw?.pagination ?? { page: 1, pageSize: params?.pageSize ?? 100, total: list.length, totalPages: 1 },
    };
  },

  /**
   * Get single category
   * GET /api/v1/categories/:id
   */
  async getCategory(id: string): Promise<{ category: Category }> {
    return apiRequest<{ category: Category }>(`categories/${id}`, {
      method: "GET",
    });
  },

  /**
   * Create new category (Admin)
   * POST /api/v1/admin/categories
   */
  async createCategory(payload: CreateCategoryPayload): Promise<{ category: Category }> {
    return apiRequest<{ category: Category }>("admin/categories", {
      method: "POST",
      body: payload,
    });
  },

  /**
   * Update category (Admin)
   * PATCH /api/v1/admin/categories/:id
   */
  async updateCategory(
    id: string,
    payload: UpdateCategoryPayload
  ): Promise<{ category: Category }> {
    return apiRequest<{ category: Category }>(`admin/categories/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },
};
