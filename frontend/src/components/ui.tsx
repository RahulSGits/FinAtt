"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Status } from "@/lib/mock";

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const [n, setN] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const dur = 900;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return (
    <span>
      {n.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export function StatCard({
  label,
  value,
  decimals,
  suffix,
  icon,
  tone = "#6366f1",
  sub,
  delay = 0,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  icon: React.ReactNode;
  tone?: string;
  sub?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass lift rounded-2xl p-5 relative overflow-hidden group"
    >
      {/* Accent glow blob */}
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"
        style={{ background: tone }}
      />
      {/* Top gradient accent line */}
      <div
        className="absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${tone}, transparent)` }}
      />
      <div className="flex items-center justify-between">
        <span className="muted text-sm">{label}</span>
        <span
          className="grid h-10 w-10 place-items-center rounded-xl transition-transform group-hover:scale-110"
          style={{ background: `${tone}22`, color: tone }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
      </div>
      {sub && <div className="muted mt-1 text-xs">{sub}</div>}
    </motion.div>
  );
}

export function Panel({
  title,
  children,
  action,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Avatar({ name, hue }: { name: string; hue: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white ring-2 ring-white/20"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${
          (hue + 40) % 360
        } 70% 45%))`,
      }}
    >
      {initials}
    </span>
  );
}

const statusMeta: Record<Status, { label: string; color: string }> = {
  present: { label: "Present", color: "#34d399" },
  half: { label: "Half day", color: "#fbbf24" },
  absent: { label: "Absent", color: "#f87171" },
  leave: { label: "On leave", color: "#60a5fa" },
  off: { label: "Week off", color: "#64748b" },
  pending: { label: "Pending", color: "#94a3b8" },
};

export function StatusBadge({ status }: { status: Status }) {
  const m = statusMeta[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: `${m.color}1f`, color: m.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

export function Pill({ children, tone = "#a5b4fc" }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: `${tone}1f`, color: tone }}
    >
      {children}
    </span>
  );
}
