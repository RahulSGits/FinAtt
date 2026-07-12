import { create } from "zustand";

import { Platform } from "react-native";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "hr" | "employee";
  companyId?: string;
  faceEnrolled?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  enrollFace: () => Promise<void>;
}

import { secureStorage } from "./storage";

const setToken = async (key: string, value: string) => {
  secureStorage.setItem(key, value);
}

const getToken = async (key: string) => {
  return secureStorage.getItem(key);
}

const removeToken = async (key: string) => {
  secureStorage.removeItem(key);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (user, accessToken, refreshToken) => {
    await setToken("accessToken", accessToken);
    await setToken("refreshToken", refreshToken);
    await setToken("user", JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  logout: async () => {
    await removeToken("accessToken");
    await removeToken("refreshToken");
    await removeToken("user");
    set({ user: null, isAuthenticated: false });
  },
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await getToken("accessToken");
      const userStr = await getToken("user");
      if (token && userStr) {
        set({ user: JSON.parse(userStr), isAuthenticated: true });
      }
    } catch (e) {
      console.error("Auth check failed", e);
    } finally {
      set({ isLoading: false });
    }
  },
  enrollFace: async () => {
    set((state) => {
      if (state.user) {
        const updatedUser = { ...state.user, faceEnrolled: true };
        setToken("user", JSON.stringify(updatedUser));
        return { user: updatedUser };
      }
      return state;
    });
  }
}));
