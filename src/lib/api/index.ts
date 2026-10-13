/**
 * FemmeFlo Production API Module
 * Main entry point for frontend API client services
 */

export * from "./types";
export * from "./client";
export { authApi } from "./auth";
export { categoryApi } from "./categories";
export { adminApi } from "./admin";
export { managerApi } from "./manager";
export { sellerApi } from "./seller";

import { authApi } from "./auth";
import { categoryApi } from "./categories";
import { adminApi } from "./admin";
import { managerApi } from "./manager";
import { sellerApi } from "./seller";

export const api = {
  auth: authApi,
  categories: categoryApi,
  admin: adminApi,
  manager: managerApi,
  seller: sellerApi,
};

export default api;
