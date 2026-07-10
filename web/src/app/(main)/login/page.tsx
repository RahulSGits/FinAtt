"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Fingerprint, Building2, Mail, Lock, ArrowRight, ScanFace, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { demoAccounts, type Role } from "@/lib/mock";
import TiltCard from "@/components/TiltCard";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [companyId, setCompanyId] = useState("GEO");
  const [email, setEmail] = useState("rahul@geoselfie.app");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("admin");

  const routeFor = (r: Role) => (r === "admin" ? "/admin" : r === "hr" ? "/hr" : "/employee");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const acc = demoAccounts.find((a) => a.role === role)!;
    login({ role, email: email || acc.email, name: acc.name });
    router.push(routeFor(role));
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:block"
        >
          <div className="mb-6 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
              <Fingerprint size={20} />
            </span>
            <span className="text-lg font-semibold">GeoSelfie</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            Welcome back to your <span className="gradient-text">workforce cockpit.</span>
          </h1>
          <p className="muted mt-4 max-w-sm">
            Secure company-ID login with role-based access. Pick a demo role to
            explore the matching dashboard instantly.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { icon: ScanFace, t: "Selfie + face verification" },
              { icon: Building2, t: "Multi-tenant, per-company isolation" },
              { icon: Lock, t: "Argon2 · JWT rotation · audit logs" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-300">
                  <f.icon size={16} />
                </span>
                <span className="muted text-sm">{f.t}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <TiltCard max={6}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-strong rounded-3xl p-7 accent-glow"
          >
            <h2 className="text-xl font-semibold">Sign in</h2>
            <p className="muted mb-5 mt-1 text-sm">Use the demo credentials below.</p>

            <form onSubmit={submit} className="space-y-4">
              <Field icon={<Building2 size={16} />} label="Company ID">
                <input
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </Field>
              <Field icon={<Mail size={16} />} label="Email">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </Field>
              <Field icon={<Lock size={16} />} label="Password">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white focus:outline-none flex-shrink-0"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>

              <div>
                <div className="muted mb-2 text-xs">Sign in as</div>
                <div className="grid grid-cols-2 gap-2">
                  {demoAccounts.map((a) => (
                    <button
                      key={a.role}
                      type="button"
                      onClick={() => {
                        setRole(a.role);
                        setEmail(a.email);
                      }}
                      className={`rounded-xl border px-3 py-2 text-sm transition ${
                        role === a.role
                          ? "border-indigo-400/60 bg-indigo-500/20 text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3.5 font-medium text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all"
              >
                Enter dashboard
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </motion.div>
        </TiltCard>
      </div>
    </main>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="muted mb-1.5 block text-xs">{label}</span>
      <span className="flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2.5 focus-within:border-indigo-400/60 focus-within:ring-2 focus-within:ring-indigo-400/15 transition-all backdrop-blur-sm">
        <span className="text-slate-500 dark:text-slate-400">{icon}</span>
        {children}
      </span>
    </label>
  );
}
