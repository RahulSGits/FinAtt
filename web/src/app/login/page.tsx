"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Fingerprint, Building2, Mail, Lock, ArrowRight, ScanFace } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { demoAccounts, type Role } from "@/lib/mock";
import TiltCard from "@/components/TiltCard";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [companyId, setCompanyId] = useState("GEO");
  const [email, setEmail] = useState("rahul@geoselfie.app");
  const [password, setPassword] = useState("demo1234");
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
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300">
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
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-indigo-300">
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
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
                          ? "border-indigo-400/60 bg-indigo-500/20 text-white"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-medium text-white hover:bg-indigo-400"
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
      <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-indigo-400/50">
        <span className="text-slate-400">{icon}</span>
        {children}
      </span>
    </label>
  );
}
