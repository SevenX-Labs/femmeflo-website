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
export { geoApi } from "./geo";

import { authApi } from "./auth";
import { categoryApi } from "./categories";
import { adminApi } from "./admin";
import { managerApi } from "./manager";
import { sellerApi } from "./seller";
import { geoApi } from "./geo";

export const api = {
  auth: authApi,
  categories: categoryApi,
  admin: adminApi,
  manager: managerApi,
  seller: sellerApi,
  geo: geoApi,
};

export default api;
