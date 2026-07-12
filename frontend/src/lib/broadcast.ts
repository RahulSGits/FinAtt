"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Real-time broadcast store backed by localStorage. HR/Admin publish a message
 * and every open dashboard (this tab via a custom event, other tabs via the
 * native `storage` event) updates immediately — no backend needed for the demo.
 */
export interface Broadcast {
  id: string;
  title: string;
  body: string;
  audience: string;
  at: string;
}

const KEY = "gs_broadcasts";
const EVT = "gs_broadcasts_changed";

function read(): Broadcast[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useBroadcasts() {
  const [items, setItems] = useState<Broadcast[]>([]);

  useEffect(() => {
    const load = () => setItems(read());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);

  const send = useCallback((b: Omit<Broadcast, "id" | "at">) => {
    const item: Broadcast = {
      ...b,
      id: `b_${Date.now()}`,
      at: new Date().toLocaleString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        day: "numeric",
        month: "short",
      }),
    };
    const next = [item, ...read()].slice(0, 50);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVT));
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVT));
    setItems([]);
  }, []);

  return { items, send, clear };
}
