import axios from "axios";
import { secureStorage } from "../store/storage";
import { Platform } from "react-native";

// Use 10.0.2.2 for Android Emulator, localhost for iOS/Web, or actual IP if running on physical device
const baseURL = Platform.OS === "android" 
  ? "http://10.0.2.2:3000/api" 
  : "http://localhost:3000/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = secureStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // We could handle token refresh logic here
    if (error.response?.status === 401) {
      secureStorage.removeItem("accessToken");
      secureStorage.removeItem("refreshToken");
    }
    return Promise.reject(error);
  }
);
