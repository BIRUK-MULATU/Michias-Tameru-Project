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
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  bootstrap: () => Promise<void>;
}

function applyAuthResponse(set: (partial: Partial<AuthState>) => void, data: AuthResponse) {
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  set({ accessToken: data.accessToken, user: data.user, status: "authenticated" });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  status: "idle",

  async login(username, password) {
    const response = await apiClient.post<ApiResponse<AuthResponse>>("/api/auth/login", {
      username,
      password,
    });
    applyAuthResponse(set, response.data.data);
  },

  async logout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const accessToken = get().accessToken;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      set({ status: "unauthenticated" });
      return null;
    }
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>("/api/auth/refresh", {
        refreshToken,
      });
      applyAuthResponse(set, response.data.data);
      return response.data.data.accessToken;
    } catch {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
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
