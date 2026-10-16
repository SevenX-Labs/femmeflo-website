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
    // Note: Backend /categories schema is strictObject({ search, active }).
    // Do not pass page or pageSize as query parameters to avoid 400 Bad Request.
    const queryParams: Record<string, string | boolean | undefined> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.active !== undefined) queryParams.active = params.active;

    const raw = await apiRequest<{ categories?: Category[]; items?: Category[]; pagination?: PaginationMeta }>("categories", {
      method: "GET",
      params: queryParams,
    });
    const list = raw?.categories ?? raw?.items ?? [];
    return {
      categories: list,
      items: list,
      pagination: raw?.pagination ?? { page: 1, pageSize: list.length || 100, total: list.length, totalPages: 1 },
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
    // Note: Backend /admin/categories schema is strictObject({ name }).
    // Omit active or description from payload to avoid 400 Bad Request.
    return apiRequest<{ category: Category }>("admin/categories", {
      method: "POST",
      body: { name: payload.name.trim() },
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

  /**
   * Delete category (Admin)
   * DELETE /api/v1/admin/categories/:id
   */
  async deleteCategory(id: string): Promise<{ id: string; name: string }> {
    return apiRequest<{ id: string; name: string }>(`admin/categories/${id}`, {
      method: "DELETE",
    });
  },
};
