import { apiRequest } from "./client";
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponseData,
  PublicUser,
  ResetPasswordPayload,
} from "./types";

export const authApi = {
  /**
   * Authenticate with email/phone and password
   * Supports role-specific endpoints:
   * admin: POST /api/v1/admin/auth/login
   * manager: POST /api/v1/manager/auth/login
   * seller: POST /api/v1/seller/auth/login
   * default: POST /api/v1/auth/login
   */
  async login(payload: LoginPayload, role?: "admin" | "manager" | "seller"): Promise<LoginResponseData> {
    const endpoint = role ? `${role}/auth/login` : "auth/login";
    return apiRequest<LoginResponseData>(endpoint, {
      method: "POST",
      body: payload,
      skipAuth: true,
    });
  },

  async adminLogin(payload: LoginPayload): Promise<LoginResponseData> {
    return this.login(payload, "admin");
  },

  async managerLogin(payload: LoginPayload): Promise<LoginResponseData> {
    return this.login(payload, "manager");
  },

  async sellerLogin(payload: LoginPayload): Promise<LoginResponseData> {
    return this.login(payload, "seller");
  },

  /**
   * Get current authenticated user details
   * GET /api/v1/auth/me
   */
  async me(): Promise<{ user: PublicUser }> {
    return apiRequest<{ user: PublicUser }>("auth/me", {
      method: "GET",
    });
  },

  /**
   * Change password for the current logged-in user
   * PATCH /api/v1/auth/password
   */
  async changePassword(payload: ChangePasswordPayload): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>("auth/password", {
      method: "PATCH",
      body: payload,
    });
  },

  /**
   * Request password reset instructions
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>("auth/forgot-password", {
      method: "POST",
      body: payload,
      skipAuth: true,
    });
  },

  /**
   * Reset password with valid token
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>("auth/reset-password", {
      method: "POST",
      body: payload,
      skipAuth: true,
    });
  },

  /**
   * Server health check
   * GET /api/v1/health
   */
  async health(): Promise<{ status: string; database: string }> {
    return apiRequest<{ status: string; database: string }>("health", {
      method: "GET",
      skipAuth: true,
    });
  },

  /**
   * Database readiness check
   * GET /api/v1/ready
   */
  async ready(): Promise<{ database: string }> {
    return apiRequest<{ database: string }>("ready", {
      method: "GET",
      skipAuth: true,
    });
  },
};
