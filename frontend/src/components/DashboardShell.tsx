"use client";

import { motion, AnimatePresence } from "framer-motion";

import { useEffect, useState } from "react";
import {
  Fingerprint,
  Bell,
  Menu,
  LogOut,
  Search,
  Sun,
  Moon,

} from "lucide-react";
import { useTheme } from "next-themes";
import AIChatWidget from "./AIChatWidget";
import { logout } from "@/app/(auth)/actions";

export interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
}


export default function DashboardShell({
  nav,
  active,
  onSelect,
  userProfile,
  children,
}: {
  nav: NavItem[];
  active: string;
  onSelect: (k: string) => void;
  userProfile: UserProfile;
  children: React.ReactNode;
}) {
  const [sideOpen, setSideOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = 0;
  const notifs: Record<string, string>[] = [];
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const roleLabel = userProfile.role === "hr" ? "HR Console" : "Employee Portal";

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
                onLogout={async () => {
                  await logout();
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
          onLogout={async () => {
            await logout();
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
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              FA
            </span>
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-tight">
                FinAtt
              </div>
              <div className="muted text-xs">
                {userProfile.role === "employee" ? "Employee Portal" : "HR Dashboard"}
              </div>
            </div>
          </div>

          {/* Center Area: AI & Search */}
          <div className="mx-auto flex items-center justify-end gap-3 lg:w-full lg:max-w-sm lg:justify-center">
            <AIChatWidget />
            <div className="hidden w-full items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 lg:flex">
              <Search size={15} className="text-slate-500 dark:text-slate-400" />
              <input
                placeholder="Search..."
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
                  </div>
                  {notifs.length === 0 ? (
                    <div className="muted py-8 text-center text-sm flex flex-col items-center gap-2">
                      <Bell size={24} className="opacity-20" />
                      <p>You&apos;re all caught up!</p>
                    </div>
                  ) : (
                    <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                      {/* Notifications would go here */}
                    </div>
                  )}
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
              {userProfile.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-tight">
                {userProfile.name}
              </div>
              <div className="muted text-xs capitalize">{userProfile.role}</div>
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
          <div className="text-sm font-semibold leading-tight">FinAtt</div>
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
