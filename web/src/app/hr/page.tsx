"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  Wallet,
  CalendarCheck,
  User,
  UserPlus,
  Upload,
  UserCheck,
  UserX,
  Timer,
  Plane,
  Check,
  X,
  IndianRupee,
  BadgeCheck,
  Megaphone,
  Building2,
  Laptop,
  Send,
  CreditCard,
  Sparkles,
  Pencil,
  Save,
  RotateCcw,
  Filter,
  ScanFace,
  MapPin,
  Search,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardShell, { type NavItem } from "@/components/DashboardShell";
import Profile from "@/components/Profile";
import { StatCard, Panel, Avatar, StatusBadge, Pill } from "@/components/ui";
import { useBroadcasts } from "@/lib/broadcast";
import { useNotifications } from "@/lib/notifications";
import {
  useSubscriptionPlans,
  tierTotal,
  tierPerMonth,
  tierSavings,
} from "@/lib/subscription";
import { useFaceEnrollment } from "@/lib/face";
import { useGeofenceSettings } from "@/lib/geofence";
import {
  INR,
  kpis,
  employees as seedEmployees,
  trend,
  payroll as seedPayroll,
  leaves as seedLeaves,
  statusColor,
  workMode,
  type Employee,
  type Status,
  type PayrollRow,
} from "@/lib/mock";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("@/components/GeofenceMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-slate-400">
      Loading interactive map...
    </div>
  ),
});

const nav: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "employees", label: "Employees", icon: Users },
  { key: "attendance", label: "Attendance", icon: CalendarRange },
  { key: "payroll", label: "Payroll", icon: Wallet },
  { key: "leave", label: "Leave", icon: CalendarCheck },
  { key: "broadcast", label: "Broadcast", icon: Megaphone },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "geofence", label: "Geofence", icon: MapPin },
  { key: "profile", label: "Profile", icon: User },
];

export default function HrPage() {
  const [active, setActive] = useState("overview");
  const [people, setPeople] = useState<Employee[]>(seedEmployees);
  return (
    <DashboardShell
      nav={nav}
      active={active}
      onSelect={setActive}
      requiredKind="admin"
    >
      {active === "overview" && <Overview />}
      {active === "employees" && (
        <EmployeesView people={people} setPeople={setPeople} />
      )}
      {active === "attendance" && <Attendance people={people} />}
      {active === "payroll" && <Payroll />}
      {active === "leave" && <LeaveView />}
      {active === "broadcast" && <BroadcastView />}
      {active === "billing" && <Billing />}
      {active === "geofence" && <GeofenceView />}
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

// ── Overview ─────────────────────────────────────────────────────────────

function Overview() {
  const payrollTotal = seedPayroll.reduce((s, p) => s + p.net, 0);
  return (
    <div>
      <Header title="Workforce Overview" sub="geoSelfie · July 2026" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Present today"
          value={kpis.present}
          icon={<UserCheck size={18} />}
          tone="#34d399"
          sub={`of ${kpis.headcount}`}
        />
        <StatCard
          label="Absent"
          value={kpis.absent}
          icon={<UserX size={18} />}
          tone="#f87171"
          sub="today"
          delay={0.05}
        />
        <StatCard
          label="Late"
          value={kpis.late}
          icon={<Timer size={18} />}
          tone="#fbbf24"
          sub="grace exceeded"
          delay={0.1}
        />
        <StatCard
          label="On leave"
          value={kpis.onLeave}
          icon={<Plane size={18} />}
          tone="#60a5fa"
          sub="approved"
          delay={0.15}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Attendance trend (7 days)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trend} margin={{ left: -22, right: 8 }}>
              <defs>
                <linearGradient id="hp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
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
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="present"
                stroke="#818cf8"
                fill="url(#hp)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <div className="grid gap-4">
          <StatCard
            label="Payroll this month"
            value={payrollTotal}
            icon={<IndianRupee size={18} />}
            tone="#34d399"
            sub="net payable"
          />
          <StatCard
            label="Attendance rate"
            value={kpis.attendanceRate}
            decimals={1}
            suffix="%"
            icon={<BadgeCheck size={18} />}
            tone="#22d3ee"
            sub="company average"
          />
        </div>
      </div>
    </div>
  );
}

// ── Employees (with face re-registration) ────────────────────────────────

let idCounter = 900;

function makeEmployee(
  name: string,
  dept: string,
  salary: number,
  idx: number,
): Employee {
  return {
    id: `csv${idCounter++}`,
    name,
    memberId: `GEO-0${430 + idx}`,
    avatarHue: Math.floor(Math.random() * 360),
    department: dept,
    designation: "Executive",
    site: "Head Office",
    shift: "Morning",
    status: "active",
    today: "present",
    monthPresent: 0,
    monthHours: 0,
    attendancePct: 0,
    faceEnrolled: false,
    salary,
    week: ["off", "off", "off", "off", "off", "off", "off"],
  };
}

function EmployeesView({
  people,
  setPeople,
}: {
  people: Employee[];
  setPeople: (p: Employee[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "office" | "remote">("all");
  const fileRef = useRef<HTMLInputElement>(null);
  const { push } = useNotifications();

  const office = people.filter((e) => workMode(e) === "office").length;
  const remote = people.length - office;
  const shown = people.filter(
    (e) => filter === "all" || workMode(e) === filter,
  );

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const rows = text
        .split(/\r?\n/)
        .map((r) => r.trim())
        .filter(Boolean);
      const parsed: Employee[] = [];
      rows.forEach((row, i) => {
        const cols = row.split(",").map((c) => c.trim());
        if (i === 0 && /name/i.test(cols[0])) return; // header row
        if (!cols[0]) return;
        parsed.push(
          makeEmployee(
            cols[0],
            cols[1] || "Operations",
            Number(cols[2]) || 45000,
            people.length + parsed.length,
          ),
        );
      });
      if (parsed.length) {
        setPeople([...parsed, ...people]);
        flash(`Imported ${parsed.length} employee(s) from ${file.name}`);
      } else {
        flash("No valid rows found. Use columns: name, department, salary");
      }
    };
    reader.readAsText(file);
    ev.target.value = "";
  }

  function resetFace(emp: Employee) {
    // Clear face enrollment from localStorage
    const key = `gs_face_${emp.name.toLowerCase().replace(/ /g, "")}@geoselfie.app`;
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_at`);
    // Also try with employee email pattern
    const patterns = [
      `gs_face_${emp.name.split(" ")[0].toLowerCase()}@geoselfie.app`,
      `gs_face_asha@geoselfie.app`,
    ];
    patterns.forEach((k) => {
      localStorage.removeItem(k);
      localStorage.removeItem(`${k}_at`);
    });

    // Update the employee's faceEnrolled status in state
    setPeople(
      people.map((e) =>
        e.id === emp.id ? { ...e, faceEnrolled: false } : e,
      ),
    );

    push({
      type: "face_reset",
      title: "Face registration reset",
      body: `${emp.name} (${emp.memberId}) must re-register their face for attendance`,
      roles: ["hr", "employee"],
    });

    flash(
      `Face registration reset for ${emp.name}. Employee must re-register.`,
    );
  }

  const chips: [typeof filter, string, number][] = [
    ["all", "All", people.length],
    ["office", "In office", office],
    ["remote", "Remote", remote],
  ];

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFile}
      />
      <Header
        title="Employees"
        sub="Manage access, work mode & details · CSV columns: name, department, salary"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              <Upload size={16} /> Upload CSV
            </button>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400"
            >
              <UserPlus size={16} /> Add member
            </button>
          </div>
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

      <div className="mb-4 flex flex-wrap gap-2">
        {chips.map(([key, label, n]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ${
              filter === key
                ? "bg-indigo-500 text-white"
                : "border border-white/10 bg-white/5 muted hover:bg-white/10"
            }`}
          >
            {key === "office" && <Building2 size={14} />}
            {key === "remote" && <Laptop size={14} />}
            {label} <span className="opacity-70">({n})</span>
          </button>
        ))}
      </div>

      {open && (
        <AddMember
          onClose={() => setOpen(false)}
          onAdd={(e) => {
            setPeople([e, ...people]);
            setOpen(false);
            flash(`Added ${e.name} · access ID ${e.memberId}`);
          }}
          count={people.length}
        />
      )}

      <Panel>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="muted border-b border-white/5 text-left text-xs">
                <th className="pb-3 font-medium">Member</th>
                <th className="pb-3 font-medium hidden sm:table-cell">
                  Access ID
                </th>
                <th className="pb-3 font-medium hidden md:table-cell">
                  Dept / Role
                </th>
                <th className="pb-3 font-medium hidden lg:table-cell">Mode</th>
                <th className="pb-3 font-medium">Today</th>
                <th className="pb-3 text-right font-medium hidden sm:table-cell">
                  Salary
                </th>
                <th className="pb-3 text-right font-medium">Access</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={e.name} hue={e.avatarHue} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{e.name}</div>
                        <div className="muted truncate text-xs">
                          {e.site} · {e.shift}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-xs hidden sm:table-cell">
                    {e.memberId}
                  </td>
                  <td className="muted py-3 hidden md:table-cell">
                    {e.department} · {e.designation}
                  </td>
                  <td className="py-3 hidden lg:table-cell">
                    {workMode(e) === "office" ? (
                      <Pill tone="#22d3ee">Office</Pill>
                    ) : (
                      <Pill tone="#a855f7">Remote</Pill>
                    )}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={e.today} />
                  </td>
                  <td className="py-3 text-right hidden sm:table-cell">
                    {INR(e.salary)}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {e.faceEnrolled ? (
                        <Pill tone="#34d399">Granted</Pill>
                      ) : (
                        <Pill tone="#fbbf24">Pending</Pill>
                      )}
                      <button
                        onClick={() => resetFace(e)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-amber-300"
                        title="Reset face registration"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
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

function AddMember({
  onClose,
  onAdd,
  count,
}: {
  onClose: () => void;
  onAdd: (e: Employee) => void;
  count: number;
}) {
  const [name, setName] = useState("");
  const [dept, setDept] = useState("Operations");
  const [salary, setSalary] = useState("45000");
  const memberId = `GEO-0${430 + count}`;

  function submit() {
    if (!name.trim()) return;
    onAdd({
      id: `n${idCounter++}`,
      name: name.trim(),
      memberId,
      avatarHue: Math.floor(Math.random() * 360),
      department: dept,
      designation: "Executive",
      site: "Head Office",
      shift: "Morning",
      status: "active",
      today: "present",
      monthPresent: 0,
      monthHours: 0,
      attendancePct: 0,
      faceEnrolled: true,
      salary: Number(salary) || 45000,
      week: ["off", "off", "off", "off", "off", "off", "off"],
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-md rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add member</h3>
          <button onClick={onClose} className="muted hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="muted mt-1 text-sm">
          Grant app access with a unique member ID.
        </p>
        <div className="mt-4 grid gap-3">
          <Labeled label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anil Kumar"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
            />
          </Labeled>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Access ID (auto)">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-indigo-200">
                {memberId}
              </div>
            </Labeled>
            <Labeled label="Department">
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
              >
                <option>Operations</option>
                <option>Engineering</option>
                <option>Sales</option>
                <option>Logistics</option>
                <option>HR</option>
                <option>Finance</option>
              </select>
            </Labeled>
          </div>
          <Labeled label="Monthly salary (₹)">
            <input
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              type="number"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
            />
          </Labeled>
          <button
            onClick={submit}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 font-medium text-white hover:bg-indigo-400"
          >
            <BadgeCheck size={16} /> Create & grant access
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="muted mb-1 block text-xs">{label}</span>
      {children}
    </label>
  );
}

// ── Attendance ───────────────────────────────────────────────────────────

const dow = ["M", "T", "W", "T", "F", "S", "S"];

function Attendance({ people }: { people: Employee[] }) {
  return (
    <div>
      <Header
        title="Attendance"
        sub="Weekly presence & monthly rate per member"
      />
      <Panel>
        <div className="space-y-1">
          <div className="muted grid grid-cols-[1.6fr_auto_1fr] items-center gap-4 border-b border-white/5 pb-2 text-xs">
            <span>Member</span>
            <span className="hidden sm:flex gap-1.5">
              {dow.map((d, i) => (
                <span key={i} className="w-4 text-center">
                  {d}
                </span>
              ))}
            </span>
            <span className="text-right">This month</span>
          </div>
          {people.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[1.6fr_auto_1fr] items-center gap-4 py-2.5"
            >
              <div className="flex items-center gap-3">
                <Avatar name={e.name} hue={e.avatarHue} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{e.name}</div>
                  <div className="muted truncate text-xs">{e.memberId}</div>
                </div>
              </div>
              <div className="hidden sm:flex gap-1.5">
                {e.week.map((s, i) => (
                  <span
                    key={i}
                    className="h-4 w-4 rounded-[5px]"
                    style={{
                      background: `${statusColor[s]}${s === "off" ? "55" : "ee"}`,
                    }}
                    title={s}
                  />
                ))}
              </div>
              <div className="flex items-center justify-end gap-3">
                <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-white/10 sm:block">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${e.attendancePct}%`,
                      background:
                        e.attendancePct >= 85
                          ? "#34d399"
                          : e.attendancePct >= 70
                            ? "#fbbf24"
                            : "#f87171",
                    }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-medium">
                  {e.attendancePct}%
                </span>
              </div>
            </div>
          ))}
        </div>
        <LegendRow />
      </Panel>
    </div>
  );
}

function LegendRow() {
  const items: [Status, string][] = [
    ["present", "Present"],
    ["half", "Half"],
    ["absent", "Absent"],
    ["leave", "Leave"],
    ["off", "Week off"],
  ];
  return (
    <div className="muted mt-4 flex flex-wrap gap-4 text-xs">
      {items.map(([s, l]) => (
        <span key={s} className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded"
            style={{
              background: `${statusColor[s]}${s === "off" ? "55" : "ee"}`,
            }}
          />{" "}
          {l}
        </span>
      ))}
    </div>
  );
}

// ── Payroll (editable + filters) ─────────────────────────────────────────

function Payroll() {
  const [rows, setRows] = useState<PayrollRow[]>(seedPayroll);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBase, setEditBase] = useState(0);
  const [editDeductions, setEditDeductions] = useState(0);
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">(
    "all",
  );
  const [toast, setToast] = useState<string | null>(null);
  const { push } = useNotifications();

  const departments = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((r) => r.department)))],
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (deptFilter !== "all" && r.department !== deptFilter) return false;
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        return true;
      }),
    [rows, deptFilter, statusFilter],
  );

  const total = filtered.reduce((s, p) => s + p.net, 0);
  const paid = filtered.filter((r) => r.status === "paid").length;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function startEdit(r: PayrollRow) {
    setEditingId(r.id);
    setEditBase(r.base);
    setEditDeductions(r.deductions);
  }

  function saveEdit(id: string) {
    const net = editBase - editDeductions;
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, base: editBase, deductions: editDeductions, net }
          : r,
      ),
    );
    setEditingId(null);
    push({
      type: "payroll_edited",
      title: "Payroll updated",
      body: `Salary edited for ${rows.find((r) => r.id === id)?.name}`,
      roles: ["hr"],
    });
    flash("Payroll row updated ✓");
  }

  function toggleStatus(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "paid" ? "pending" : "paid" }
          : r,
      ),
    );
  }

  return (
    <div>
      <Header
        title="Payroll — July 2026"
        sub={`${INR(total)} net · ${paid}/${filtered.length} paid`}
        action={
          <button
            onClick={() => {
              setRows(rows.map((r) => ({ ...r, status: "paid" as const })));
              flash("All payroll marked as paid ✓");
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/30"
          >
            <Wallet size={16} /> Run payroll
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

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="muted text-xs">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === "all" ? "All departments" : d}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-1.5">
          {(["all", "paid", "pending"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs capitalize ${
                statusFilter === s
                  ? "bg-indigo-500 text-white"
                  : "border border-white/10 bg-white/5 muted hover:bg-white/10"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      <Panel>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="muted border-b border-white/5 text-left text-xs">
                <th className="pb-3 font-medium">Member</th>
                <th className="pb-3 font-medium hidden sm:table-cell">Dept</th>
                <th className="pb-3 text-right font-medium">Gross</th>
                <th className="pb-3 text-right font-medium hidden sm:table-cell">
                  Deductions
                </th>
                <th className="pb-3 text-right font-medium">Net pay</th>
                <th className="pb-3 text-right font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Edit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="py-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="muted font-mono text-xs">{r.memberId}</div>
                  </td>
                  <td className="muted py-3 hidden sm:table-cell">
                    {r.department}
                  </td>
                  <td className="py-3 text-right">
                    {editingId === r.id ? (
                      <input
                        type="number"
                        value={editBase}
                        onChange={(e) => setEditBase(Number(e.target.value))}
                        className="inline-edit w-24 text-right"
                      />
                    ) : (
                      INR(r.base)
                    )}
                  </td>
                  <td className="py-3 text-right text-rose-300 hidden sm:table-cell">
                    {editingId === r.id ? (
                      <input
                        type="number"
                        value={editDeductions}
                        onChange={(e) =>
                          setEditDeductions(Number(e.target.value))
                        }
                        className="inline-edit w-24 text-right"
                      />
                    ) : (
                      `−${INR(r.deductions)}`
                    )}
                  </td>
                  <td className="py-3 text-right font-semibold">
                    {editingId === r.id
                      ? INR(editBase - editDeductions)
                      : INR(r.net)}
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => toggleStatus(r.id)}>
                      <Pill
                        tone={r.status === "paid" ? "#34d399" : "#fbbf24"}
                      >
                        {r.status}
                      </Pill>
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    {editingId === r.id ? (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={() => saveEdit(r.id)}
                          className="rounded-lg bg-indigo-500/20 p-1.5 text-indigo-300 hover:bg-indigo-500/30"
                        >
                          <Save size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(r)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-indigo-300"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10">
                <td className="pt-3 font-medium" colSpan={4}>
                  Total net payable
                </td>
                <td className="pt-3 text-right text-lg font-semibold text-emerald-300">
                  {INR(total)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ── Leave ────────────────────────────────────────────────────────────────

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
          <div
            key={l.id}
            className="glass flex flex-wrap items-center gap-4 rounded-2xl p-4"
          >
            <div className="min-w-40 flex-1">
              <div className="font-medium">{l.name}</div>
              <div className="muted text-xs">
                {l.type} · {l.reason}
              </div>
            </div>
            <div className="muted text-sm">
              {l.from} → {l.to} · {l.days}d
            </div>
            {l.status === "pending" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => decide(l.id, "rejected")}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-rose-300 hover:bg-white/5"
                >
                  <X size={14} /> Reject
                </button>
                <button
                  onClick={() => decide(l.id, "approved")}
                  className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/30"
                >
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

// ── Broadcast ────────────────────────────────────────────────────────────

function BroadcastView() {
  const { items, send, clear } = useBroadcasts();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("All employees");

  function publish() {
    if (!title.trim() || !body.trim()) return;
    send({ title: title.trim(), body: body.trim(), audience });
    setTitle("");
    setBody("");
  }

  return (
    <div>
      <Header
        title="Broadcast"
        sub="Send announcements — they appear instantly on employee dashboards"
        action={
          items.length > 0 ? (
            <button
              onClick={clear}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Clear all
            </button>
          ) : undefined
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Compose">
          <div className="grid gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. Office closed Friday)"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Message…"
              rows={4}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
            />
            <label className="text-sm">
              <span className="muted mb-1 block text-xs">Audience</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
              >
                <option>All employees</option>
                <option>In office</option>
                <option>Remote</option>
                <option>Operations</option>
                <option>Engineering</option>
              </select>
            </label>
            <button
              onClick={publish}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 font-medium text-white hover:bg-indigo-400"
            >
              <Send size={16} /> Publish broadcast
            </button>
          </div>
        </Panel>
        <Panel title={`Sent (${items.length})`}>
          {items.length === 0 ? (
            <div className="muted py-8 text-center text-sm">
              No broadcasts yet. Publish one and it shows up live for employees.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-white/5 bg-white/5 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Megaphone size={15} className="text-indigo-300" />
                    <span className="font-medium">{b.title}</span>
                  </div>
                  <div className="muted mt-1 text-sm">{b.body}</div>
                  <div className="muted mt-1 text-xs">
                    {b.audience} · {b.at}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

// ── Billing (real-time plans from admin) ─────────────────────────────────

function Billing() {
  const { plans } = useSubscriptionPlans();
  const [selectedTier, setSelectedTier] = useState<string>("monthly");

  const currentTier = plans.tiers.find((t) => t.id === selectedTier) || plans.tiers[0];
  const amount = tierTotal(plans.basePrice, currentTier);

  const invoices = [
    {
      id: "INV-0007",
      date: "01 Jul 2026",
      amount: plans.basePrice,
      status: "paid",
    },
    {
      id: "INV-0006",
      date: "01 Jun 2026",
      amount: plans.basePrice,
      status: "paid",
    },
    {
      id: "INV-0005",
      date: "01 May 2026",
      amount: plans.basePrice,
      status: "paid",
    },
  ];

  return (
    <div>
      <Header
        title="Subscription & Billing"
        sub="geoSelfie Pro · manage your plan"
      />

      {/* Plan update notification */}
      {plans.updatedAt && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200">
          <Sparkles size={15} />
          Plans last updated:{" "}
          {new Date(plans.updatedAt).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Choose your plan" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            {plans.tiers.map((tier) => {
              const total = tierTotal(plans.basePrice, tier);
              const pm = tierPerMonth(plans.basePrice, tier);
              const saved = tierSavings(plans.basePrice, tier);
              return (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`relative rounded-2xl border p-4 text-left transition ${
                    selectedTier === tier.id
                      ? "border-indigo-400 bg-indigo-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/8"
                  }`}
                >
                  {tier.discountPct > 0 && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                      <Sparkles size={12} /> Save {tier.discountPct}%
                    </span>
                  )}
                  <div className="text-sm font-medium">{tier.label}</div>
                  <div className="mt-1 text-2xl font-semibold">{INR(total)}</div>
                  <div className="muted mt-1 text-xs">
                    {tier.months === 1
                      ? "billed monthly"
                      : `${INR(pm)}/mo · billed every ${tier.months} months`}
                  </div>
                  {saved > 0 && (
                    <div className="mt-1 text-xs text-emerald-300">
                      Save {INR(saved)} vs monthly
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="muted text-xs">You&apos;ll be charged</div>
              <div className="text-xl font-semibold">
                {INR(amount)}{" "}
                <span className="muted text-sm">
                  /{" "}
                  {currentTier.months === 1
                    ? "month"
                    : `${currentTier.months} months`}
                </span>
              </div>
            </div>
            <button className="rounded-xl bg-indigo-500 px-4 py-2.5 font-medium text-white hover:bg-indigo-400">
              {selectedTier === "monthly" ? "Keep monthly" : "Switch & save"}
            </button>
          </div>
        </Panel>
        <div className="grid content-start gap-4">
          <div className="glass rounded-2xl p-5">
            <div className="muted text-sm">Subscription</div>
            <div className="mt-2 flex items-center gap-2">
              <Pill tone="#34d399">Active</Pill>
              <span className="muted text-xs">auto-renew on</span>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="muted text-sm">Next billing</div>
            <div className="mt-1 text-xl font-semibold">01 Aug 2026</div>
            <div className="muted mt-1 text-xs">Pro plan · geoSelfie</div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="muted text-sm">Billing schedule</div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>01 Aug 2026</span>
                <span>{INR(amount)}</span>
              </div>
              <div className="flex justify-between muted">
                <span>
                  {currentTier.months === 1
                    ? "01 Sep 2026"
                    : currentTier.months === 6
                      ? "01 Feb 2027"
                      : "01 Aug 2027"}
                </span>
                <span>{INR(amount)}</span>
              </div>
              <div className="flex justify-between muted">
                <span>
                  {currentTier.months === 1
                    ? "01 Oct 2026"
                    : currentTier.months === 6
                      ? "01 Aug 2027"
                      : "01 Aug 2028"}
                </span>
                <span>{INR(amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Panel title="Payment history" className="mt-4">
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="muted border-b border-white/5 text-left text-xs">
                <th className="pb-3 font-medium">Invoice</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 text-right font-medium">Amount</th>
                <th className="pb-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((iv) => (
                <tr
                  key={iv.id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="py-3 font-mono text-xs">{iv.id}</td>
                  <td className="muted py-3">{iv.date}</td>
                  <td className="py-3 text-right">{INR(iv.amount)}</td>
                  <td className="py-3 text-right">
                    <Pill tone="#34d399">{iv.status}</Pill>
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

const tooltipStyle = {
  background: "#0e1020",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
};



// ── Geofence ─────────────────────────────────────────────────────────────

function GeofenceView() {
  const { config, updateConfig } = useGeofenceSettings();
  const [lat, setLat] = useState(config.lat.toString());
  const [lng, setLng] = useState(config.lng.toString());
  const [radius, setRadius] = useState(config.radius.toString());
  const [address, setAddress] = useState("");
  const [locationName, setLocationName] = useState(config.address || "");
  const [searching, setSearching] = useState(false);
  const [saved, setSaved] = useState(false);

  const center = {
    lat: parseFloat(lat) || config.lat,
    lng: parseFloat(lng) || config.lng,
  };
  const numRadius = parseInt(radius, 10) || config.radius;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setLat(data[0].lat);
        setLng(data[0].lon);
        setLocationName(data[0].display_name || address);
        setAddress("");
      } else {
        alert("Location not found");
      }
    } catch (err) {
      alert("Error searching location");
    } finally {
      setSearching(false);
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateConfig({
      lat: center.lat,
      lng: center.lng,
      radius: numRadius,
      address: locationName,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-4xl">
      <Header
        title="Geofence Configuration"
        sub="Set the office location boundaries for employee check-ins."
      />
      <Panel>
        <div className="grid lg:grid-cols-2 gap-6 p-6">
          <div className="space-y-6">
            <form onSubmit={handleSearch}>
              <label className="muted mb-1.5 block text-sm">Search Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Connaught Place, New Delhi"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 outline-none focus:border-indigo-500/50"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="flex items-center justify-center rounded-lg bg-white/10 px-4 text-slate-300 hover:bg-white/20 disabled:opacity-50"
                >
                  <Search size={18} />
                </button>
              </div>
            </form>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="muted mb-1.5 block text-sm">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="muted mb-1.5 block text-sm">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="muted mb-1.5 block text-sm">
                    Allowed Radius (meters)
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 outline-none focus:border-indigo-500/50"
                  />
                  <p className="muted mt-2 text-xs">
                    Employees must be within this distance from the office to mark attendance. Default is 150m.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-2.5 text-sm font-medium hover:bg-indigo-400"
                >
                  <Save size={16} />
                  Save Settings
                </button>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1 text-sm text-emerald-400"
                  >
                    <Check size={14} /> Saved and broadcasted
                  </motion.span>
                )}
              </div>
            </form>
          </div>

          <div className="h-[450px] w-full overflow-hidden rounded-xl border border-white/10 relative bg-[#0e1020]">
            <DynamicMap 
              lat={center.lat} 
              lng={center.lng} 
              radius={numRadius} 
              onChange={(newLat, newLng) => {
                setLat(newLat.toString());
                setLng(newLng.toString());
              }} 
            />
            <div className="absolute top-2 left-16 z-[1000] pointer-events-none rounded bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-md">
              Click map to move pin
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
