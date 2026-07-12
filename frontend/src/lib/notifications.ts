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
  | "profile_updated"
  | "leave_edited";

export interface Notification {
  id: string;
  type: NType;
  title: string;
  body: string;
  /** Roles that should see this notification */
  roles: string[];
  at: string;
  read: boolean;
  targetUserId?: string;
}

const KEY = "gs_notifications";
const EVT = "gs_notif_changed";

const MOCK_NOTIFS: Notification[] = [
  {
    id: "n_1",
    type: "plan_updated",
    title: "Subscription Upgraded",
    body: "Your company's subscription plan has been upgraded to Premium.",
    roles: ["admin", "hr"],
    at: "10:30 AM, 12 Oct",
    read: false,
  },
  {
    id: "n_2",
    type: "leave_edited",
    title: "Leave Request Approved",
    body: "Your annual leave request for next week has been approved.",
    roles: ["employee", "admin", "hr"],
    at: "09:15 AM, 12 Oct",
    read: false,
  },
  {
    id: "n_3",
    type: "broadcast",
    title: "Company Townhall",
    body: "Reminder: We have a company-wide townhall meeting tomorrow at 2 PM.",
    roles: ["hr", "employee"],
    at: "Yesterday",
    read: true,
  },
  {
    id: "n_4",
    type: "payroll_edited",
    title: "Payroll Processed",
    body: "Salary slips for September have been generated and are ready for review.",
    roles: ["admin", "hr"],
    at: "2 days ago",
    read: false,
  },
  {
    id: "n_5",
    type: "profile_updated",
    title: "Profile Updated",
    body: "You successfully updated your emergency contact information.",
    roles: ["employee"],
    at: "Last week",
    read: true,
  }
];

function readAll(): Notification[] {
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) {
      localStorage.setItem(KEY, JSON.stringify(MOCK_NOTIFS));
      return MOCK_NOTIFS;
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function useNotifications(role?: string, userId?: string) {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    const load = () => {
      const all = readAll();
      setItems(
        all.filter((n) => {
          if (n.targetUserId) {
            return n.targetUserId === userId;
          }
          if (role) {
            return n.roles.includes(role) || n.roles.includes("all");
          }
          return true;
        })
      );
    };
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, [role, userId]);

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
