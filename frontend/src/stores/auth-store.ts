import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";
import type { UserResponse } from "@/types/user";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

const REFRESH_TOKEN_KEY = "threadims.refreshToken";

interface AuthState {
  accessToken: string | null;
  user: UserResponse | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  bootstrap: () => Promise<void>;
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

function clearStoredRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

function storeRefreshToken(token: string, rememberMe: boolean) {
  clearStoredRefreshToken();
  (rememberMe ? localStorage : sessionStorage).setItem(REFRESH_TOKEN_KEY, token);
}

function applyAuthResponse(
  set: (partial: Partial<AuthState>) => void,
  data: AuthResponse,
  rememberMe: boolean,
) {
  storeRefreshToken(data.refreshToken, rememberMe);
  set({ accessToken: data.accessToken, user: data.user, status: "authenticated" });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  status: "idle",

  async login(username, password, rememberMe = true) {
    const response = await apiClient.post<ApiResponse<AuthResponse>>("/api/auth/login", {
      username,
      password,
    });
    applyAuthResponse(set, response.data.data, rememberMe);
  },

  async logout() {
    const refreshToken = getStoredRefreshToken();
    const accessToken = get().accessToken;
    clearStoredRefreshToken();
    set({ accessToken: null, user: null, status: "unauthenticated" });
    if (!accessToken) {
      return;
    }
    try {
      await apiClient.post(
        "/api/auth/logout",
        { refreshToken },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    } catch {
      // Best-effort: the client-side session is already cleared either way.
    }
  },

  async refresh() {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      set({ status: "unauthenticated" });
      return null;
    }
    const rememberMe = localStorage.getItem(REFRESH_TOKEN_KEY) !== null;
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>("/api/auth/refresh", {
        refreshToken,
      });
      applyAuthResponse(set, response.data.data, rememberMe);
      return response.data.data.accessToken;
    } catch {
      clearStoredRefreshToken();
      set({ accessToken: null, user: null, status: "unauthenticated" });
      return null;
    }
  },

  async bootstrap() {
    if (get().status !== "idle") {
      return;
    }
    set({ status: "loading" });
    await get().refresh();
  },
}));
