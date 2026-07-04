"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Clock,
  CalendarCheck,
  Activity,
  UserCheck,
  UserX,
  Timer,
  Plane,
  TrendingUp,
  Check,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardShell, { type NavItem } from "@/components/DashboardShell";
import { StatCard, Panel, Avatar, StatusBadge, Pill } from "@/components/ui";
import {
  kpis,
  employees,
  sites,
  shifts,
  leaves as seedLeaves,
  trend,
  deptSplit,
  hoursByDept,
} from "@/lib/mock";

const nav: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "live", label: "Live Monitor", icon: Activity },
  { key: "employees", label: "Employees", icon: Users },
  { key: "sites", label: "Sites", icon: MapPin },
  { key: "shifts", label: "Shifts", icon: Clock },
  { key: "leave", label: "Leave", icon: CalendarCheck },
];

const PIE = ["#6366f1", "#22d3ee", "#a855f7", "#34d399", "#fbbf24", "#f87171"];

export default function AdminPage() {
  const [active, setActive] = useState("overview");
  return (
    <DashboardShell nav={nav} active={active} onSelect={setActive} requiredKind="admin">
      {active === "overview" && <Overview />}
      {active === "live" && <Live />}
      {active === "employees" && <EmployeesView />}
      {active === "sites" && <SitesView />}
      {active === "shifts" && <ShiftsView />}
      {active === "leave" && <LeaveView />}
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

function Overview() {
  return (
    <div>
      <Header title="Company Overview" sub="Real-time attendance across all sites · July 2026" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Present today" value={kpis.present} icon={<UserCheck size={18} />} tone="#34d399" sub="of 1,284 employees" delay={0} />
        <StatCard label="Absent" value={kpis.absent} icon={<UserX size={18} />} tone="#f87171" sub="7.5% of workforce" delay={0.05} />
        <StatCard label="Late arrivals" value={kpis.late} icon={<Timer size={18} />} tone="#fbbf24" sub="grace exceeded" delay={0.1} />
        <StatCard label="On leave" value={kpis.onLeave} icon={<Plane size={18} />} tone="#60a5fa" sub="approved today" delay={0.15} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Attendance trend (7 days)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend} margin={{ left: -20, right: 8 }}>
              <defs>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="present" stroke="#818cf8" fill="url(#gP)" strokeWidth={2} />
              <Area type="monotone" dataKey="absent" stroke="#f87171" fill="url(#gA)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Headcount by department">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={deptSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {deptSplit.map((_, i) => (
                  <Cell key={i} fill={PIE[i % PIE.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {deptSplit.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE[i % PIE.length] }} />
                <span className="muted">{d.name}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Avg hours by department" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hoursByDept} margin={{ left: -20, right: 8 }}>
              <XAxis dataKey="dept" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                {hoursByDept.map((_, i) => (
                  <Cell key={i} fill={PIE[i % PIE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <div className="grid gap-4">
          <StatCard label="Attendance rate" value={kpis.attendanceRate} decimals={1} suffix="%" icon={<TrendingUp size={18} />} tone="#22d3ee" sub="vs 84.2% last month" />
          <StatCard label="Overtime hours" value={kpis.overtimeHours} icon={<Timer size={18} />} tone="#a855f7" sub="this week" />
        </div>
      </div>
    </div>
  );
}

function Live() {
  return (
    <div>
      <Header title="Live Monitor" sub="Who's on-site right now" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {employees.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass lift rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar name={e.name} hue={e.avatarHue} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{e.name}</div>
                <div className="muted truncate text-xs">{e.designation} · {e.site}</div>
              </div>
              <StatusBadge status={e.today} />
            </div>
            <div className="muted mt-3 flex items-center justify-between text-xs">
              <span>{e.checkIn ? `In ${e.checkIn}` : "—"}</span>
              <span className="flex items-center gap-1.5">
                {e.today === "present" && (
                  <span className="relative inline-block h-2 w-2 rounded-full bg-emerald-400 pulse-dot text-emerald-400" />
                )}
                {e.shift} shift
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EmployeesView() {
  return (
    <div>
      <Header title="Employees" sub={`${employees.length} shown · ${kpis.headcount} total`} />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="muted border-b border-white/5 text-left text-xs">
                <th className="pb-3 font-medium">Employee</th>
                <th className="pb-3 font-medium">Department</th>
                <th className="pb-3 font-medium">Site / Shift</th>
                <th className="pb-3 font-medium">Today</th>
                <th className="pb-3 text-right font-medium">Month %</th>
                <th className="pb-3 text-right font-medium">Face</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={e.name} hue={e.avatarHue} />
                      <div>
                        <div className="font-medium">{e.name}</div>
                        <div className="muted text-xs">{e.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="muted py-3">{e.department}</td>
                  <td className="muted py-3">{e.site} · {e.shift}</td>
                  <td className="py-3"><StatusBadge status={e.today} /></td>
                  <td className="py-3 text-right font-medium">{e.attendancePct}%</td>
                  <td className="py-3 text-right">
                    {e.faceEnrolled ? <Pill tone="#34d399">Enrolled</Pill> : <Pill tone="#fbbf24">Pending</Pill>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function SitesView() {
  return (
    <div>
      <Header title="Sites & Geofences" sub="Admin-configurable radius per location" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sites.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass lift rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/15 text-cyan-300"><MapPin size={20} /></span>
              <Pill tone="#22d3ee">{s.radius} m radius</Pill>
            </div>
            <h3 className="mt-3 font-semibold">{s.name}</h3>
            <div className="muted mt-1 text-xs">
              {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="muted">Assigned</span>
              <span className="font-medium">{s.employees} employees</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ShiftsView() {
  return (
    <div>
      <Header title="Shift Management" sub="Fixed, flexible, night & rotational shifts" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {shifts.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass lift rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><Clock size={20} /></span>
              <Pill tone="#a855f7">{s.type}</Pill>
            </div>
            <h3 className="mt-3 font-semibold">{s.name}</h3>
            <div className="muted mt-1 text-sm">{s.start} – {s.end}</div>
            <div className="muted mt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span>Grace</span><span className="text-slate-200">{s.grace} min</span></div>
              <div className="flex justify-between"><span>Min presence</span><span className="text-slate-200">{s.minPresence}%</span></div>
              <div className="flex justify-between"><span>Assigned</span><span className="text-slate-200">{s.employees}</span></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LeaveView() {
  const [rows, setRows] = useState(seedLeaves);
  function decide(id: string, status: "approved" | "rejected") {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
  }
  return (
    <div>
      <Header title="Leave Approvals" sub="Approve or reject employee time-off" />
      <div className="grid gap-3">
        {rows.map((l) => (
          <div key={l.id} className="glass flex flex-wrap items-center gap-4 rounded-2xl p-4">
            <div className="min-w-40 flex-1">
              <div className="font-medium">{l.name}</div>
              <div className="muted text-xs">{l.type} · {l.reason}</div>
            </div>
            <div className="muted text-sm">{l.from} → {l.to} · {l.days}d</div>
            {l.status === "pending" ? (
              <div className="flex gap-2">
                <button onClick={() => decide(l.id, "rejected")} className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-rose-300 hover:bg-white/5">
                  <X size={14} /> Reject
                </button>
                <button onClick={() => decide(l.id, "approved")} className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/30">
                  <Check size={14} /> Approve
                </button>
              </div>
            ) : (
              <Pill tone={l.status === "approved" ? "#34d399" : "#f87171"}>
                {l.status}
              </Pill>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "#0e1020",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
};
