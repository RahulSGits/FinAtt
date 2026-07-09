"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Reactive subscription-plan store. Admin edits plans; HR sees them in
 * real-time via `localStorage` + `storage` (cross-tab) and a custom event
 * (same-tab) — same pattern as broadcast.ts.
 */

export interface PlanTier {
  id: "monthly" | "sixmonth" | "yearly";
  label: string;
  months: number;
  discountPct: number; // 0–100
  includedSeats: number;
  badge?: string;
}

export interface SubscriptionPlans {
  basePrice: number; // monthly ₹
  tiers: PlanTier[];
  updatedAt: string;
}

// ── Defaults ────────────────────────────────────────────────────────────
export const DEFAULT_BASE = 8999;

export const DEFAULT_TIERS: PlanTier[] = [
  { id: "monthly", label: "Base Plan", months: 1, discountPct: 0, includedSeats: 300 },
  { id: "sixmonth", label: "Professional Plan", months: 6, discountPct: 20, includedSeats: 1000 },
  { id: "yearly", label: "Enterprise Plan", months: 12, discountPct: 40, includedSeats: 2000, badge: "Best Value" },
];

const KEY = "gs_subscription_plans_v2"; // Changed to v2 to invalidate old state
const EVT = "gs_plans_changed";

function defaults(): SubscriptionPlans {
  return {
    basePrice: DEFAULT_BASE,
    tiers: DEFAULT_TIERS,
    updatedAt: "",
  };
}

function read(): SubscriptionPlans {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    return { ...defaults(), ...parsed };
  } catch {
    return defaults();
  }
}

/** Calculate total for a tier. */
export function tierTotal(base: number, tier: PlanTier): number {
  return Math.round(base * tier.months * (1 - tier.discountPct / 100));
}

/** Calculate per-month for a tier. */
export function tierPerMonth(base: number, tier: PlanTier): number {
  return Math.round(tierTotal(base, tier) / tier.months);
}

/** Calculate savings vs paying monthly for full duration. */
export function tierSavings(base: number, tier: PlanTier): number {
  return base * tier.months - tierTotal(base, tier);
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlans>(defaults());

  useEffect(() => {
    const load = () => setPlans(read());
    load();
    window.addEventListener("storage", load);
    window.addEventListener(EVT, load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener(EVT, load);
    };
  }, []);

  /** Admin-only: save updated plans. */
  const save = useCallback((next: SubscriptionPlans) => {
    const data = { ...next, updatedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(EVT));
    setPlans(data);
  }, []);

  return { plans, save };
}
