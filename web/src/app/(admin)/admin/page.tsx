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
  Tags,
  Eye,
  Save,
  Sparkles,
  Pencil,
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
import {
  useSubscriptionPlans,
  tierTotal,
  tierPerMonth,
  tierSavings,
  DEFAULT_TIERS,
  type PlanTier,
} from "@/lib/subscription";
import { useNotifications } from "@/lib/notifications";
import {
  INR,
  PRICE,
  payments,
  activityFeed,
} from "@/lib/mock";
import { useTenants } from "@/lib/tenants";

const nav: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "plans", label: "Plans", icon: Tags },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "profile", label: "Profile", icon: User },
];

const PIE = ["#34d399", "#fbbf24", "#f87171"];

export default function AdminPage() {
  const [active, setActive] = useState("overview");
  return (
    <DashboardShell
      nav={nav}
      active={active}
      onSelect={setActive}
      requiredKind="admin"
    >
      {active === "overview" && <Overview />}
      {active === "companies" && <Companies />}
      {active === "plans" && <PlansEditor />}
      {active === "payments" && <Payments />}
      {active === "activity" && <ActivityView />}
      {active === "profile" && <Profile />}
    </DashboardShell>
  );
}

function Header({
  title,
  sub,
  action,
}: {
  title: string;
  sub: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="muted text-sm">{sub}</p>
      </div>
      {action}
    </div>
  );
}

function DemoControls() {
  const router = useRouter();
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mr-auto flex items-center gap-2 text-sm">
        <Eye size={16} className="text-indigo-300" />
        <span className="muted">
          Preview a customer dashboard (opens as demo user)
        </span>
      </div>
      <button
        onClick={() => router.push("/demo")}
        className="flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
      >
        Open Live Split-Screen
      </button>
    </div>
  );
}

const statusTone: Record<string, string> = {
  active: "#34d399",
  overdue: "#f87171",
  trial: "#fbbf24",
  paid: "#34d399",
  failed: "#f87171",
  pending: "#fbbf24",
};

function Overview() {
  const { tenants } = useTenants();
  const activeTenants = tenants.filter((t) => t.status === "active");
  const mrr = activeTenants.reduce((s, t) => s + t.monthly, 0);

  const revenueTrend = [
    { month: "Feb", revenue: 3998 },
    { month: "Mar", revenue: 5997 },
    { month: "Apr", revenue: 7996 },
    { month: "May", revenue: 9995 },
    { month: "Jun", revenue: 9995 },
    { month: "Jul", revenue: mrr },
  ];

  const thisMonth = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);
  const overdue = tenants.filter((t) => t.status === "overdue").length;
  return (
    <div>
      <Header
        title="Platform Billing"
        sub={`geoSelfie SaaS · Base ${INR(PRICE)} for 300 seats · month of July 2026`}
      />

      <DemoControls />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Monthly recurring revenue"
          value={mrr}
          icon={<IndianRupee size={18} />}
          tone="#34d399"
          sub={`${activeTenants.length} active companies`}
        />
        <StatCard
          label="Collected this month"
          value={thisMonth}
          icon={<Wallet size={18} />}
          tone="#22d3ee"
          sub="paid invoices"
          delay={0.05}
        />
        <StatCard
          label="Total companies"
          value={tenants.length}
          icon={<Building2 size={18} />}
          tone="#6366f1"
          sub="tenants on platform"
          delay={0.1}
        />
        <StatCard
          label="Overdue accounts"
          value={overdue}
          icon={<AlertTriangle size={18} />}
          tone="#f87171"
          sub="need follow-up"
          delay={0.15}
        />
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
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={54}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => INR(Number(v))}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#34d399"
                fill="url(#rev)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Subscription status">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: "Active", value: activeTenants.length },
                  { name: "Trial", value: tenants.filter((t) => t.status === "trial").length },
                  { name: "Overdue", value: tenants.filter((t) => t.status === "overdue").length },
                ]}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={82}
                paddingAngle={3}
              >
                {[1, 2, 3].map((_, i) => (
                  <Cell
                    key={i}
                    fill={PIE[i % PIE.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {[
              { name: "Active", value: activeTenants.length },
              { name: "Trial", value: tenants.filter((t) => t.status === "trial").length },
              { name: "Overdue", value: tenants.filter((t) => t.status === "overdue").length },
            ].map((d, i) => (
              <div
                key={d.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: PIE[i] }}
                  />
                  {d.name}
                </span>
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
  const { tenants, updateTenant } = useTenants();
  const { plans } = useSubscriptionPlans();
  const activeTenants = tenants.filter((t) => t.status === "active");
  const mrr = activeTenants.reduce((s, t) => s + t.monthly, 0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSeats, setEditSeats] = useState<number>(300);

  function startEdit(t: { id: string; seats: number; activeUsers: number }) {
    setEditingId(t.id);
    setEditSeats(t.seats);
  }

  function saveEdit(id: string) {
    const blocks = Math.max(1, Math.ceil(editSeats / 100));
    const newMonthly = blocks * plans.basePrice;
    updateTenant(id, { seats: editSeats, monthly: newMonthly });
    setEditingId(null);
  }

  return (
    <div>
      <Header
        title="Companies"
        sub={`Base price ${INR(plans.basePrice)}/month (includes up to 300 seats)`}
      />
      <Panel>
        <div className="table-wrap">
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
                <tr
                  key={t.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5"
                >
                  <td className="py-3 font-medium">{t.name}</td>
                  <td className="muted py-3">{t.owner}</td>
                  <td className="py-3">
                    {editingId === t.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editSeats}
                          onChange={(e) => setEditSeats(Number(e.target.value))}
                          className="w-20 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-sm outline-none focus:border-indigo-500"
                          min={1}
                        />
                        <button onClick={() => saveEdit(t.id)} className="text-indigo-400 hover:text-indigo-300">
                          <Save size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-300">
                          <XCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => startEdit(t)}>
                        <span>{t.activeUsers}/{t.seats}</span>
                        <Pencil size={14} className="opacity-0 transition-opacity group-hover:opacity-100 text-indigo-400" />
                      </div>
                    )}
                  </td>
                  <td className="py-3">{INR(t.monthly)}/mo</td>
                  <td className="muted py-3">{t.nextBilling}</td>
                  <td className="py-3 text-right">
                    <Pill tone={statusTone[t.status]}>{t.status}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="muted mt-4 flex items-center gap-2 text-sm">
          <TrendingUp size={15} className="text-emerald-300" />
          {activeTenants.length} paying companies · {INR(mrr)} MRR ·{" "}
          {INR(mrr * 12)} ARR
        </div>
      </Panel>
    </div>
  );
}

// ── Plans Editor (Admin only) ──────────────────────────────────────────

function PlansEditor() {
  const { plans, save } = useSubscriptionPlans();
  const { push } = useNotifications();
  const [base, setBase] = useState(plans.basePrice);
  const [tiers, setTiers] = useState<PlanTier[]>(
    plans.tiers.length ? plans.tiers : DEFAULT_TIERS,
  );
  const [toast, setToast] = useState<string | null>(null);

  function updateDiscount(id: string, val: number) {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, discountPct: Math.max(0, Math.min(100, val)) } : t,
      ),
    );
  }

  function publish() {
    save({ basePrice: base, tiers, updatedAt: "" });
    push({
      type: "plan_updated",
      title: "Subscription plans updated",
      body: `Base price: ${INR(base)}/mo. Discounts: ${tiers.map((t) => `${t.label} ${t.discountPct}%`).join(", ")}`,
      roles: ["hr", "admin"],
    });
    setToast("Plans published! HR portals will see the update in real-time.");
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div>
      <Header
        title="Subscription Plans"
        sub="Edit pricing visible to all HR portals in real-time"
        action={
          <button
            onClick={publish}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"
          >
            <Save size={16} /> Publish plans
          </button>
        }
      />

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="toast-enter mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200"
        >
          {toast}
        </motion.div>
      )}

      {/* Base price editor */}
      <Panel title="Base monthly price" className="mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="muted text-xs">Price per company / month (₹)</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg font-semibold text-indigo-300">₹</span>
              <input
                type="number"
                value={base}
                onChange={(e) => setBase(Number(e.target.value) || 0)}
                className="inline-edit w-32 text-lg font-semibold"
              />
            </div>
          </div>
          <div className="muted text-sm">
            This price is the starting point. Discount percentages below are
            applied for longer commitments.
          </div>
        </div>
      </Panel>

      {/* Tier cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((tier) => {
          const total = tierTotal(base, tier);
          const pm = tierPerMonth(base, tier);
          const saved = tierSavings(base, tier);
          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{tier.label}</h3>
                {tier.discountPct > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                    <Sparkles size={12} /> {tier.discountPct}% off
                  </span>
                )}
              </div>
              <div className="mt-3 text-3xl font-bold">{INR(total)}</div>
              <div className="muted mt-1 text-sm">
                {tier.months === 1
                  ? `for up to ${(tier.includedSeats || (tier.id === 'monthly' ? 300 : tier.id === 'sixmonth' ? 1400 : 3800)).toLocaleString()} seats, billed every month`
                  : `${INR(pm)}/mo for up to ${(tier.includedSeats || (tier.id === 'monthly' ? 300 : tier.id === 'sixmonth' ? 1400 : 3800)).toLocaleString()} seats · billed every ${tier.months} months`}
              </div>
              {saved > 0 && (
                <div className="mt-2 text-xs text-emerald-300">
                  Save {INR(saved)} vs monthly
                </div>
              )}

              {/* Discount editor */}
              <div className="mt-4 border-t border-white/5 pt-3">
                <span className="muted text-xs">Discount %</span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={tier.discountPct}
                    onChange={(e) =>
                      updateDiscount(tier.id, Number(e.target.value))
                    }
                    className="inline-edit w-20 text-center"
                  />
                  <span className="muted text-sm">%</span>
                </div>
              </div>

              {/* Billing schedule preview */}
              <div className="mt-3 rounded-xl bg-white/5 p-3">
                <div className="muted text-xs">Billing schedule</div>
                <div className="mt-1 text-sm">
                  {tier.months === 1
                    ? "Recurring every month"
                    : `Recurring every ${tier.months} months`}
                </div>
                <div className="muted mt-0.5 text-xs">
                  Next: 01 Aug 2026 → {INR(total)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Last published info */}
      {plans.updatedAt && (
        <div className="muted mt-4 text-xs">
          Last published:{" "}
          {new Date(plans.updatedAt).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </div>
      )}
    </div>
  );
}

function Payments() {
  const icon = (s: string) =>
    s === "paid" ? (
      <CheckCircle2 size={16} className="text-emerald-300" />
    ) : s === "failed" ? (
      <XCircle size={16} className="text-rose-300" />
    ) : (
      <Clock size={16} className="text-amber-300" />
    );
  return (
    <div>
      <Header title="Payments" sub="Latest subscription invoices" />
      <div className="grid gap-3">
        {payments.map((p) => (
          <div
            key={p.id}
            className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5">
              {icon(p.status)}
            </span>
            <div className="flex-1">
              <div className="font-medium">{p.company}</div>
              <div className="muted text-xs">
                {p.date} · {p.method}
              </div>
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
      <Header
        title="Activity"
        sub="What companies are doing on the platform"
      />
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
                <span className="font-medium">{a.who}</span>{" "}
                <span className="muted">{a.what}</span>
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
