import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { secureStorage } from "../store/storage";
import { api } from "../lib/axios";

// Adapt secureStorage for Zustand persist
const zustandStorage: StateStorage = {
  getItem: (name: string): string | null => {
    return secureStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    secureStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    secureStorage.removeItem(name);
  },
};

export interface AttendanceRecord {
  id: string; // local UUID
  timestamp: string;
  latitude: number;
  longitude: number;
  faceData?: string; // base64 or path
  deviceInfo?: string;
  isSynced: boolean;
}

interface AttendanceState {
  queue: AttendanceRecord[];
  addRecord: (record: Omit<AttendanceRecord, "id" | "isSynced">) => Promise<void>;
  syncQueue: () => Promise<void>;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      queue: [],
      addRecord: async (recordData) => {
        const newRecord: AttendanceRecord = {
          ...recordData,
          id: Date.now().toString(),
          isSynced: false,
        };
        
        set((state) => ({
          queue: [...state.queue, newRecord],
        }));

        // Try syncing immediately
        get().syncQueue();
      },
      syncQueue: async () => {
        const state = get();
        const unsynced = state.queue.filter((r) => !r.isSynced);
        
        if (unsynced.length === 0) return;

        try {
          // In a real app we might batch these or send one by one
          // Here we assume a bulk endpoint or sending individually
          for (const record of unsynced) {
            try {
              await api.post("/attendance/sync", record);
              // Mark as synced if successful
              set((s) => ({
                queue: s.queue.map((r) => 
                  r.id === record.id ? { ...r, isSynced: true } : r
                )
              }));
            } catch (err) {
              console.error("Failed to sync record", record.id, err);
              // Break loop on network failure to avoid spamming
              break; 
            }
          }
        } catch (error) {
          console.error("Sync queue error", error);
        }
      },
    }),
    {
      name: "attendance-queue",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
