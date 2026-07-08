"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Cross-tab notification system backed by localStorage.
 * Notifications fire from any action (admin plan change, payroll edit, etc.)
 * and appear in the bell dropdown for relevant roles.
 */

export type NType =
  | "plan_updated"
  | "payroll_edited"
  | "face_reset"
  | "broadcast"
  | "profile_updated";

export interface Notification {
  id: string;
  type: NType;
  title: string;
  body: string;
  /** Roles that should see this notification */
  roles: string[];
  at: string;
  read: boolean;
}

const KEY = "gs_notifications";
const EVT = "gs_notif_changed";

function readAll(): Notification[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useNotifications(role?: string) {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    const load = () => {
      const all = readAll();
      setItems(role ? all.filter((n) => n.roles.includes(role) || n.roles.includes("all")) : all);
    };
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, [role]);

  const unread = items.filter((n) => !n.read).length;

  /** Push a new notification. */
  const push = useCallback(
    (n: Omit<Notification, "id" | "at" | "read">) => {
      const item: Notification = {
        ...n,
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        at: new Date().toLocaleString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          day: "numeric",
          month: "short",
        }),
        read: false,
      };
      const next = [item, ...readAll()].slice(0, 100);
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(EVT));
    },
    [],
  );

  /** Mark one notification as read. */
  const markRead = useCallback(
    (id: string) => {
      const all = readAll().map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(KEY, JSON.stringify(all));
      window.dispatchEvent(new Event(EVT));
    },
    [],
  );

  /** Mark all notifications as read. */
  const markAllRead = useCallback(() => {
    const all = readAll().map((n) => ({ ...n, read: true }));
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event(EVT));
  }, []);

  /** Clear all notifications. */
  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVT));
  }, []);

  return { items, unread, push, markRead, markAllRead, clear };
}
