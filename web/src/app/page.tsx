"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ScanFace,
  MapPin,
  ShieldCheck,
  BarChart3,
  Clock,
  Users,
  Fingerprint,
  Building2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Globe from "@/components/Globe";
import TiltCard from "@/components/TiltCard";

const features = [
  { icon: ScanFace, title: "AI Face Attendance", desc: "Liveness + anti-spoof selfie check with 1:1 face matching." },
  { icon: MapPin, title: "Geofenced GPS", desc: "Admin-set radius, mock-location & spoof detection." },
  { icon: Clock, title: "Shift Engine", desc: "Fixed, flexible, night, rotational & split shifts with rules." },
  { icon: ShieldCheck, title: "Enterprise Security", desc: "RBAC, Argon2, JWT rotation, audit logs, OWASP hardened." },
  { icon: BarChart3, title: "Live Analytics", desc: "Real-time KPIs, heatmaps, overtime & absenteeism insight." },
  { icon: Building2, title: "Multi-Tenant SaaS", desc: "Companies, branches, plants — isolated & white-labelled." },
];

const steps = [
  { n: "01", t: "Check in", d: "Employee takes a selfie inside the geofence." },
  { n: "02", t: "Verify", d: "Face + location + shift window validated on-device & server." },
  { n: "03", t: "Track", d: "Presence hours accrue; status auto-computed." },
  { n: "04", t: "Report", d: "Live dashboards, exports & payroll-ready data." },
];

export default function Landing() {
  return (
    <main className="mx-auto max-w-7xl px-6">
      <nav className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300">
            <Fingerprint size={20} />
          </span>
          <span className="text-lg font-semibold">GeoSelfie</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="muted text-sm hover:text-white">
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
          >
            Launch demo
          </Link>
        </div>
      </nav>

      <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs muted">
            <Sparkles size={13} className="text-indigo-300" />
            Enterprise Workforce Platform
          </span>
          <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Smart attendance,
            <br />
            <span className="gradient-text">reimagined in 3D.</span>
          </h1>
          <p className="muted mt-5 max-w-md text-lg">
            Selfie + geofence attendance, a full shift engine, and real-time
            analytics for Android, iOS &amp; web — one secure multi-tenant SaaS.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-medium text-white accent-glow hover:bg-indigo-400"
            >
              Open live demo
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/admin"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium hover:bg-white/10"
            >
              View admin dashboard
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-6">
            {[
              { k: "1,284", v: "Employees" },
              { k: "12", v: "Sites" },
              { k: "87%", v: "Attendance" },
            ].map((s) => (
              <div key={s.v}>
                <div className="text-2xl font-semibold">{s.k}</div>
                <div className="muted text-xs">{s.v}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative grid place-items-center"
        >
          <div className="absolute h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <Globe size={400} />
        </motion.div>
      </section>

      <section className="py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Everything a workforce needs
        </h2>
        <p className="muted mx-auto mt-3 max-w-lg text-center">
          A commercial-grade platform covering attendance, HR, security and
          analytics end to end.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <TiltCard key={f.title} max={8}>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="glass lift h-full rounded-2xl p-6"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/15 text-indigo-300">
                  <f.icon size={22} />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="muted mt-2 text-sm">{f.desc}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </section>

      <section className="py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">How it runs</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass rounded-2xl p-6"
            >
              <div className="gradient-text text-4xl font-bold">{s.n}</div>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="muted mt-1 text-sm">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-12 text-center">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
          <Users className="mx-auto text-indigo-300" size={32} />
          <h2 className="mt-4 text-3xl font-bold">See the full workflow</h2>
          <p className="muted mx-auto mt-2 max-w-md">
            Jump into the live demo — admin, HR and employee dashboards, all
            interactive.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 font-medium text-white accent-glow hover:bg-indigo-400"
          >
            Launch demo <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="muted border-t border-white/5 py-8 text-center text-sm">
        GeoSelfie Enterprise — Attendance &amp; Workforce Management · Demo build
      </footer>
    </main>
  );
}
