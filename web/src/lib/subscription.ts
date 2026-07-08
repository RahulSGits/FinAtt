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
}

export interface SubscriptionPlans {
  basePrice: number; // monthly ₹
  tiers: PlanTier[];
  updatedAt: string;
}

// ── Defaults ────────────────────────────────────────────────────────────
export const DEFAULT_BASE = 2999;

export const DEFAULT_TIERS: PlanTier[] = [
  { id: "monthly", label: "Monthly", months: 1, discountPct: 0 },
  { id: "sixmonth", label: "6 Months", months: 6, discountPct: 20 },
  { id: "yearly", label: "12 Months", months: 12, discountPct: 40 },
];

const KEY = "gs_subscription_plans";
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
    return { ...defaults(), ...JSON.parse(raw) };
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
