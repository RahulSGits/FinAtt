import { useState, useEffect } from "react";

export interface GeofenceConfig {
  lat: number;
  lng: number;
  radius: number;
  address?: string;
}

// Default to Connaught Place, New Delhi with 150m radius
const DEFAULT_CONFIG: GeofenceConfig = {
  lat: 28.6329,
  lng: 77.2195,
  radius: 150,
};

const STORAGE_KEY = "gs_geofence";

/**
 * Hook to manage geofence configuration.
 * Uses localStorage and cross-tab synchronization.
 */
export function useGeofenceSettings() {
  const [config, setConfig] = useState<GeofenceConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    function load() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setConfig(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse geofence config", e);
        }
      }
    }
    load();

    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) load();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const updateConfig = (newConfig: Partial<GeofenceConfig>) => {
    const updated = { ...config, ...newConfig };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setConfig(updated);
    
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: JSON.stringify(updated),
      })
    );
  };

  return { config, updateConfig };
}

/**
 * Haversine formula to calculate distance between two coordinates in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const φ1 = lat1 * rad;
  const φ2 = lat2 * rad;
  const Δφ = (lat2 - lat1) * rad;
  const Δλ = (lon2 - lon1) * rad;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}
