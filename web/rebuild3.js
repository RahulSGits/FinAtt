const fs = require('fs');

// DashboardShell.tsx
let shell = fs.readFileSync('src/components/DashboardShell.tsx', 'utf8');
shell = shell.replace('import {\n  Search,\n  Check,\n  CheckCheck,\n} from "lucide-react";', 'import {\n  Search,\n  Check,\n  CheckCheck,\n  Sun,\n  Moon,\n} from "lucide-react";');
shell = shell.replace('import { useAuth } from "@/lib/auth";\nimport { updateEmployeeAttendanceGlobal, employees } from "@/lib/mock";', 'import { useAuth } from "@/lib/auth";\nimport { useTheme } from "next-themes";\nimport { updateEmployeeAttendanceGlobal, employees } from "@/lib/mock";');
shell = shell.replace('  const { items: notifs, unread, markRead, markAllRead } = useNotifications(\n    session?.role,\n  );\n  const { tenants } = useTenants();', '  const { items: notifs, unread, markRead, markAllRead } = useNotifications(\n    session?.role,\n  );\n  const { theme, setTheme } = useTheme();\n  const [mounted, setMounted] = React.useState(false);\n  React.useEffect(() => setMounted(true), []);\n  const { tenants } = useTenants();');

shell = shell.replace('  const handleLogout = () => {', `  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const handleLogoutClick = () => {
    if (session?.role === "employee") {
      setShowLogoutModal(true);
    } else {
      executeLogout();
    }
  };
  const executeLogout = (markAbsent = false) => {
    if (markAbsent && session?.role === "employee") {
      const todayDay = new Date().getDay();
      const dayIndex = (todayDay + 6) % 7;
      const me = employees.find(e => e.name === session?.name);
      if (me) {
        updateEmployeeAttendanceGlobal(me.id, dayIndex, "absent");
      }
      localStorage.setItem("gs_checked_in", "false");
      localStorage.removeItem("gs_checked_in_time");
      window.dispatchEvent(new Event("gs_checked_in_changed"));
    }
    setShowLogoutModal(false);`);
shell = shell.replace('    logout();\n    router.replace("/login");\n  };', '    logout();\n    router.replace("/login");\n  };'); // (It was already matching inside executeLogout)

shell = shell.replace('                onLogout={handleLogout}\n              />\n            </motion.aside>\n          </>\n        )}\n      </AnimatePresence>', `                onLogout={handleLogoutClick}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f111a] p-6 shadow-2xl">
              <h2 className="mb-2 text-xl font-semibold text-rose-500 dark:text-rose-400">Early Logout Warning</h2>
              <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">If you log out now, your attendance for today will be automatically marked as <strong className="text-rose-500 dark:text-rose-400 font-semibold">ABSENT</strong>. Are you sure you want to continue?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 rounded-xl bg-slate-100 dark:bg-white/5 py-2.5 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-800 dark:text-white">Cancel</button>
                <button onClick={() => executeLogout(true)} className="flex-1 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 py-2.5 text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-500/30 transition-colors">Confirm Logout</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>`);
shell = shell.replace('          onLogout={handleLogout}', '          onLogout={handleLogoutClick}');
shell = shell.replace('          {/* Notification bell */}', `          {/* Theme toggle */}
          {mounted && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-white/10" aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}
          {/* Notification bell */}`);

shell = shell.replace('className="notif-dropdown glass-strong rounded-2xl p-3"', 'className="notif-dropdown glass-strong rounded-2xl p-3 shadow-2xl border border-slate-200 dark:border-white/10"');
shell = shell.replace('className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/5 ${', 'className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all hover:bg-slate-100 dark:hover:bg-white/10 active:scale-[0.98] ${');
shell = shell.replace('n.read ? "opacity-60" : ""', 'n.read ? "opacity-60" : "bg-slate-50 dark:bg-white/5"');
shell = shell.replace('<span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />', '<span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)] dark:shadow-[0_0_8px_rgba(129,140,248,0.8)]" />');
shell = shell.replace('<div className="min-w-0 flex-1">\n                            <div className="truncate font-medium">\n                              {n.title}\n                            </div>\n                            <div className="muted truncate text-xs">\n                              {n.body}\n                            </div>\n                            <div className="muted mt-0.5 text-[10px]">\n                              {n.at}\n                            </div>\n                          </div>', '<div className="min-w-0 flex-1 space-y-1">\n                            <div className="font-semibold text-slate-900 dark:text-slate-200 leading-tight">\n                              {n.title}\n                            </div>\n                            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">\n                              {n.body}\n                            </div>\n                            <div className="mt-1.5 text-[10px] font-medium text-indigo-500 dark:text-indigo-400">\n                              {n.at}\n                            </div>\n                          </div>');
fs.writeFileSync('src/components/DashboardShell.tsx', shell);

console.log("Rebuild part 3 done.");
