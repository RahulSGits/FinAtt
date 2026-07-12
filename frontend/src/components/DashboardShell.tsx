"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Fingerprint,
  Bell,
  Menu,
  LogOut,
  Search,
  Check,
  CheckCheck,
  Sun,
  Moon,
  CreditCard,
  FileText,
  User,
  CalendarCheck,
  Megaphone,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import { company } from "@/lib/mock";
import { useTenants } from "@/lib/tenants";
import AIChatWidget from "./AIChatWidget";

export interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const notifIconMap: Record<string, React.ElementType> = {
  plan_updated: CreditCard,
  payroll_edited: FileText,
  face_reset: Fingerprint,
  broadcast: Megaphone,
  profile_updated: User,
  leave_edited: CalendarCheck,
};

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
  requiredKind: "admin" | "hr" | "employee";
  children: React.ReactNode;
}) {
  const { session, logout, ready } = useAuth();
  const router = useRouter();
  const [sideOpen, setSideOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { items: notifs, unread, markRead, markAllRead } = useNotifications(
    session?.role,
  );
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const { tenants } = useTenants();
  const tenant = tenants.find((t) => t.id === "t1") || tenants[0];

  // ── Role enforcement ───────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    // Admin has access everywhere; otherwise enforce role match
    if (session.role !== "admin") {
      if (session.role !== requiredKind) {
        router.replace("/login");
      }
    }
  }, [ready, session, router, requiredKind]);

  if (!ready || !session) {
    return (
      <div className="grid min-h-screen place-items-center muted">
        Loading…
      </div>
    );
  }

  const roleLabel =
    session.role === "admin"
      ? "Developer Console"
      : session.role === "hr"
        ? "HR Console"
        : "Employee Portal";

  return (
    <div className="flex min-h-screen">
      {/* ── Mobile sidebar overlay ──────────────────────────────────── */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 md:hidden"
              onClick={() => setSideOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0c18] backdrop-blur-xl p-4 md:hidden"
            >
              <SidebarContent
                nav={nav}
                active={active}
                onSelect={(k) => {
                  onSelect(k);
                  setSideOpen(false);
                }}
                roleLabel={roleLabel}
                onLogout={() => {
                  logout();
                  router.replace("/login");
                }}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 dark:border-white/5 p-4 md:flex" style={{ background: 'var(--sidebar-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <SidebarContent
          nav={nav}
          active={active}
          onSelect={onSelect}
          roleLabel={roleLabel}
          onLogout={() => {
            logout();
            router.replace("/login");
          }}
        />
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 dark:border-white/10 px-4 py-3 sm:px-5"
          style={{
            background: "var(--header-bg)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setSideOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 dark:bg-white/5 md:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-bold">
              {session.role === "admin" ? "GEO" : (tenant ? tenant.name.substring(0, 3).toUpperCase() : "CMP")}
            </span>
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-tight">
                {session.role === "admin" ? "geoSelfie Inc." : (session.companyName || tenant?.name || company.name)}
              </div>
              <div className="muted text-xs">
                {session.role === "admin"
                  ? "Platform Administration"
                  : session.role === "employee"
                    ? "Employee Portal"
                    : `Pro · ${tenant?.activeUsers || company.employees} employees`}
              </div>
            </div>
          </div>

          {/* Center Area: AI & Search */}
          <div className="mx-auto flex items-center justify-end gap-3 lg:w-full lg:max-w-sm lg:justify-center">
            <AIChatWidget />
            <div className="hidden w-full items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 lg:flex">
              <Search size={15} className="text-slate-500 dark:text-slate-400" />
              <input
                placeholder="Search employees, sites, reports…"
                className="w-full bg-transparent text-sm outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Theme toggle */}
          {mounted && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-300 transition-all hover:bg-indigo-100 dark:hover:bg-white/10 hover:scale-105" aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-300 transition-all hover:bg-indigo-100 dark:hover:bg-white/10 hover:scale-105"
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-slate-900 dark:text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
                  className="notif-dropdown glass-strong rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-white/10 w-80 sm:w-96 flex flex-col right-0 origin-top-right z-50 absolute mt-2"
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span className="text-base font-semibold tracking-tight">Notifications</span>
                    {unread > 0 && (
                      <button
                        onClick={() => markAllRead()}
                        className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                      >
                        <CheckCheck size={14} /> Mark all read
                      </button>
                    )}
                  </div>
                  {notifs.length === 0 ? (
                    <div className="muted py-8 text-center text-sm flex flex-col items-center gap-2">
                      <Bell size={24} className="opacity-20" />
                      <p>You&apos;re all caught up!</p>
                    </div>
                  ) : (
                    <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                      {notifs.slice(0, 10).map((n) => {
                        const IconCmp = notifIconMap[n.type] || Bell;
                        return (
                          <button
                            key={n.id}
                            onClick={() => { markRead(n.id); if (window.innerWidth < 768) setNotifOpen(false); }}
                            className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all hover:scale-[1.02] ${
                              n.read ? "opacity-60 hover:bg-slate-50 dark:hover:bg-white/5" : "bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/5 hover:border-indigo-100 dark:hover:border-indigo-500/20"
                            }`}
                          >
                            {!n.read && (
                              <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                            )}
                            {n.read && (
                              <Check
                                size={14}
                                className="mt-2 shrink-0 text-slate-400"
                              />
                            )}
                            <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${n.read ? "bg-slate-100 dark:bg-white/10 text-slate-500" : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"}`}>
                              <IconCmp size={15} />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                                {n.title}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                                {n.body}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                {n.at}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="pt-3 mt-2 border-t border-slate-100 dark:border-white/10">
                    <button
                      onClick={() => { setNotifOpen(false); onSelect("notifications"); }}
                      className="w-full rounded-lg py-2 text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                    >
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <span
              className="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold text-white ring-2 ring-indigo-400/40 dark:ring-indigo-400/30"
              style={{
                background: "linear-gradient(135deg,#6366f1,#a855f7)",
              }}
            >
              {session.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-tight">
                {session.name}
              </div>
              <div className="muted text-xs capitalize">{session.role}</div>
            </div>
          </div>
        </header>


        <main className="flex-1 p-4 sm:p-5">{children}</main>
      </div>

      {/* Close notif on outside click */}
      {notifOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setNotifOpen(false)}
        />
      )}


    </div>
  );
}

function SidebarContent({
  nav,
  active,
  onSelect,
  roleLabel,
  onLogout,
}: {
  nav: NavItem[];
  active: string;
  onSelect: (k: string) => void;
  roleLabel: string;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="mb-6 flex items-center gap-2 px-2 pt-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
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
                on
                  ? "text-indigo-700 font-medium dark:text-white"
                  : "muted hover:text-slate-900 dark:hover:text-white hover:bg-indigo-50/50 dark:hover:bg-white/5"
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
        onClick={onLogout}
        className="muted flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
      >
        <LogOut size={18} /> Sign out
      </button>
    </>
  );
}
