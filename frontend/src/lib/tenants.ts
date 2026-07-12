"use client";

import { useCallback, useEffect, useState } from "react";
import { tenants as seedTenants, Tenant } from "./mock";

const KEY = "gs_tenants";
const EVT = "gs_tenants_changed";

function read(): Tenant[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedTenants;
    return JSON.parse(raw);
  } catch {
    return seedTenants;
  }
}

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>(seedTenants);

  useEffect(() => {
    const load = () => setTenants(read());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);

  const updateTenant = useCallback((id: string, updates: Partial<Tenant>) => {
    setTenants((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(EVT));
      return next;
    });
  }, []);

  return { tenants, updateTenant };
}
