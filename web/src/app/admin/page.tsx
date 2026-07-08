"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Activity,
  User,
  IndianRupee,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRouter } from "next/navigation";
import DashboardShell, { type NavItem } from "@/components/DashboardShell";
import Profile from "@/components/Profile";
import { StatCard, Panel, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { demoAccounts } from "@/lib/mock";
import { Eye, UserRound } from "lucide-react";
import {
  INR,
  PRICE,
  tenants,
  activeTenants,
  mrr,
  payments,
  revenueTrend,
  planSplit,
  activityFeed,
} from "@/lib/mock";

const nav: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "profile", label: "Profile", icon: User },
];

const PIE = ["#34d399", "#fbbf24", "#f87171"];

export default function AdminPage() {
  const [active, setActive] = useState("overview");
  return (
    <DashboardShell nav={nav} active={active} onSelect={setActive} requiredKind="admin">
      {active === "overview" && <Overview />}
      {active === "companies" && <Companies />}
      {active === "payments" && <Payments />}
      {active === "activity" && <ActivityView />}
      {active === "profile" && <Profile />}
    </DashboardShell>
  );
}

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="muted text-sm">{sub}</p>
    </div>
  );
}

function DemoControls() {
  const router = useRouter();
  const { login } = useAuth();
  function openAs(role: "hr" | "employee") {
    const acc = demoAccounts.find((a) => a.role === role)!;
    login({ role, email: acc.email, name: acc.name });
    router.push(role === "hr" ? "/hr" : "/employee");
  }
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mr-auto flex items-center gap-2 text-sm">
        <Eye size={16} className="text-indigo-300" />
        <span className="muted">Preview a customer dashboard (opens as demo user)</span>
      </div>
      <button onClick={() => openAs("hr")} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400">
        <Building2 size={16} /> Open HR demo
      </button>
      <button onClick={() => openAs("employee")} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
        <UserRound size={16} /> Open Employee demo
      </button>
    </div>
  );
}

const statusTone: Record<string, string> = { active: "#34d399", overdue: "#f87171", trial: "#fbbf24", paid: "#34d399", failed: "#f87171", pending: "#fbbf24" };

function Overview() {
  const thisMonth = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const overdue = tenants.filter((t) => t.status === "overdue").length;
  return (
    <div>
      <Header title="Platform Billing" sub={`geoSelfie SaaS · ${INR(PRICE)}/company · month of July 2026`} />

      <DemoControls />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Monthly recurring revenue" value={mrr} icon={<IndianRupee size={18} />} tone="#34d399" sub={`${activeTenants.length} active × ${INR(PRICE)}`} />
        <StatCard label="Collected this month" value={thisMonth} icon={<Wallet size={18} />} tone="#22d3ee" sub="paid invoices" delay={0.05} />
        <StatCard label="Total companies" value={tenants.length} icon={<Building2 size={18} />} tone="#6366f1" sub="tenants on platform" delay={0.1} />
        <StatCard label="Overdue accounts" value={overdue} icon={<AlertTriangle size={18} />} tone="#f87171" sub="need follow-up" delay={0.15} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Revenue trend (₹)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend} margin={{ left: -10, right: 8 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={54} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => INR(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#34d399" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Subscription status">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={planSplit} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} paddingAngle={3}>
                {planSplit.map((_, i) => (
                  <Cell key={i} fill={PIE[i % PIE.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {planSplit.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: PIE[i] }} />{d.name}</span>
                <span className="muted">{d.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Companies() {
  return (
    <div>
      <Header title="Companies" sub={`Every tenant subscribed at ${INR(PRICE)}/month`} />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="muted border-b border-white/5 text-left text-xs">
                <th className="pb-3 font-medium">Company</th>
                <th className="pb-3 font-medium">Owner</th>
                <th className="pb-3 font-medium">Seats used</th>
                <th className="pb-3 font-medium">Charge</th>
                <th className="pb-3 font-medium">Next billing</th>
                <th className="pb-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 font-medium">{t.name}</td>
                  <td className="muted py-3">{t.owner}</td>
                  <td className="py-3">{t.activeUsers}/{t.seats}</td>
                  <td className="py-3">{INR(t.monthly)}/mo</td>
                  <td className="muted py-3">{t.nextBilling}</td>
                  <td className="py-3 text-right"><Pill tone={statusTone[t.status]}>{t.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="muted mt-4 flex items-center gap-2 text-sm">
          <TrendingUp size={15} className="text-emerald-300" />
          {activeTenants.length} paying companies · {INR(mrr)} MRR · {INR(mrr * 12)} ARR
        </div>
      </Panel>
    </div>
  );
}

function Payments() {
  const icon = (s: string) =>
    s === "paid" ? <CheckCircle2 size={16} className="text-emerald-300" /> : s === "failed" ? <XCircle size={16} className="text-rose-300" /> : <Clock size={16} className="text-amber-300" />;
  return (
    <div>
      <Header title="Payments" sub="Latest subscription invoices" />
      <div className="grid gap-3">
        {payments.map((p) => (
          <div key={p.id} className="glass flex items-center gap-4 rounded-2xl p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5">{icon(p.status)}</span>
            <div className="flex-1">
              <div className="font-medium">{p.company}</div>
              <div className="muted text-xs">{p.date} · {p.method}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{INR(p.amount)}</div>
              <Pill tone={statusTone[p.status]}>{p.status}</Pill>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityView() {
  return (
    <div>
      <Header title="Activity" sub="What companies are doing on the platform" />
      <Panel>
        <div className="space-y-4">
          {activityFeed.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3"
            >
              <span className="relative grid h-8 w-8 place-items-center rounded-full bg-indigo-500/15 text-indigo-300">
                <Activity size={15} />
              </span>
              <div className="flex-1 text-sm">
                <span className="font-medium">{a.who}</span> <span className="muted">{a.what}</span>
              </div>
              <span className="muted text-xs">{a.when}</span>
            </motion.div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

const tooltipStyle = {
  background: "#0e1020",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
};
