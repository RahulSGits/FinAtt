"use client";

import { useCallback, useEffect, useState } from "react";

export interface FraudEvent {
  id: string;
  employeeEmail: string;
  employeeName: string;
  reason: string;
  at: string;
}

const KEY = "gs_fraud";
const EVT = "gs_fraud_changed";

function readAll(): FraudEvent[] {
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) {
      const mock: FraudEvent[] = [
        { id: "f_1", employeeEmail: "alice@example.com", employeeName: "Alice Smith", reason: "GPS Spoofing detected", at: "2 hrs ago" },
        { id: "f_2", employeeEmail: "alice@example.com", employeeName: "Alice Smith", reason: "Face mismatch during scan", at: "Yesterday" },
        { id: "f_3", employeeEmail: "alice@example.com", employeeName: "Alice Smith", reason: "Multiple device logins", at: "Last week" },
        { id: "f_4", employeeEmail: "bob@example.com", employeeName: "Bob Jones", reason: "GPS Spoofing detected", at: "1 hr ago" },
      ];
      localStorage.setItem(KEY, JSON.stringify(mock));
      return mock;
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function useFraud(email?: string) {
  const [items, setItems] = useState<FraudEvent[]>([]);

  useEffect(() => {
    const load = () => {
      const all = readAll();
      if (email) {
        setItems(all.filter(f => f.employeeEmail === email));
      } else {
        setItems(all);
      }
    };
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, [email]);

  const report = useCallback((e: Omit<FraudEvent, "id" | "at">) => {
    const item: FraudEvent = {
      ...e,
      id: `f_${Date.now()}`,
      at: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
    };
    const next = [item, ...readAll()];
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVT));
  }, []);

  const clear = useCallback((id?: string) => {
    if (id) {
       const next = readAll().filter(f => f.id !== id);
       localStorage.setItem(KEY, JSON.stringify(next));
    } else {
       localStorage.removeItem(KEY);
    }
    window.dispatchEvent(new Event(EVT));
  }, []);

  return { items, report, clear };
}
