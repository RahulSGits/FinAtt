"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Fingerprint, LogOut, Search, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { company } from "@/lib/mock";

export interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

export default function DashboardShell({
  nav,
  active,
  onSelect,
  requiredKind,
  children,
}: {
  nav: NavItem[];
  active: string;
  onSelect: (k: string) => void;
  requiredKind: "admin" | "employee";
  children: React.ReactNode;
}) {
  const { session, logout, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace("/login");
  }, [ready, session, router]);

  if (!ready || !session) {
    return <div className="grid min-h-screen place-items-center muted">Loading…</div>;
  }

  const roleLabel =
    requiredKind === "admin"
      ? session.role === "hr"
        ? "HR Console"
        : session.role === "manager"
          ? "Manager Console"
          : "Admin Console"
      : "Employee Portal";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2 pt-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300">
            <Fingerprint size={20} />
          </span>
          <div>
            <div className="text-sm font-semibold leading-tight">GeoSelfie</div>
            <div className="muted text-xs">{roleLabel}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const on = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelect(item.key)}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  on ? "text-white" : "muted hover:text-white hover:bg-white/5"
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="navactive"
                    className="absolute inset-0 rounded-xl border border-indigo-400/40 bg-indigo-500/15"
                  />
                )}
                <Icon size={18} />
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="muted flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} /> Sign out
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-10 flex items-center gap-4 border-b border-white/5 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-xs font-bold">
              {company.slug}
            </span>
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-tight">{company.name}</div>
              <div className="muted text-xs">{company.plan} · {company.employees} employees</div>
            </div>
          </div>
          <div className="mx-auto hidden w-full max-w-sm items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 lg:flex">
            <Search size={15} className="text-slate-400" />
            <input
              placeholder="Search employees, sites, reports…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <button className="relative grid h-9 w-9 place-items-center rounded-lg bg-white/5">
            <Bell size={17} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
          </button>
          <div className="flex items-center gap-2">
            <span
              className="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}
            >
              {session.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-tight">{session.name}</div>
              <div className="muted text-xs capitalize">{session.role}</div>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-white/5 px-3 py-2 md:hidden">
          {nav.map((item) => (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                active === item.key ? "bg-indigo-500/20 text-white" : "muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
