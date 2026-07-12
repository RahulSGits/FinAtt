import { Platform } from "react-native";
import { MMKV } from "react-native-mmkv";

let storage: MMKV | null = null;

if (Platform.OS !== "web") {
  // @ts-ignore
  storage = new MMKV({
    id: "geoselfie-storage",
    encryptionKey: "secure-enterprise-key-geoselfie"
  });
}

export const secureStorage = {
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
    } else {
      storage?.set(key, value);
    }
  },
  getItem: (key: string) => {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    } else {
      return storage?.getString(key) || null;
    }
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
    } else {
      // @ts-ignore
      storage?.delete(key);
    }
  },
  clearAll: () => {
    if (Platform.OS === "web") {
      localStorage.clear();
    } else {
      storage?.clearAll();
    }
  }
};
