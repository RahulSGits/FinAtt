"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Bell,
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
  AlertTriangle,
  CreditCard,
  Sparkles,
  Pencil,
  Save,
  RotateCcw,
  Filter,
  MapPin,
  Search,
  Download,
  Printer,
  Trash2,
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
import NotificationsView from "@/components/NotificationsView";
import { StatCard, Panel, Avatar, StatusBadge, Pill } from "@/components/ui";
import { useBroadcasts } from "@/lib/broadcast";
import { useFraud } from "@/lib/fraud";
import { useLeaves } from "@/lib/leaves";
import { useNotifications } from "@/lib/notifications";
import {
  useSubscriptionPlans,
  tierTotal,
  tierPerMonth,
  tierSavings,
} from "@/lib/subscription";
import { useGeofenceSettings } from "@/lib/geofence";
import {
  INR,
  kpis,
  employees as seedEmployees,
  trend,
  payroll as seedPayroll,
  statusColor,
  workMode,
  getWeekDates,
  updateEmployeeAttendanceGlobal,
  type Employee,
  type Status,
  type PayrollRow,
} from "@/lib/mock";
import { useTenants } from "@/lib/tenants";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("@/components/GeofenceMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-slate-500 dark:text-slate-400">
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
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "profile", label: "Profile", icon: User },
];

export default function HrPage() {
  const [active, setActive] = useState("overview");
  const [people, setPeople] = useState<Employee[]>(seedEmployees);

  useEffect(() => {
    const handleStorageChange = () => {
      const isAshaCheckedIn = typeof window !== "undefined" && localStorage.getItem("geoselfie_checked_in") === "true";
      setPeople(prev => prev.map(p => {
        if (p.id === "e1") { // Asha Nair
          const newTodayStatus = isAshaCheckedIn ? "present" : "absent";
          const newWeek = [...p.week];
          const todayDay = new Date().getDay();
          const todayIndex = todayDay === 0 ? 6 : todayDay - 1;
          newWeek[todayIndex] = newTodayStatus;
          
          return {
            ...p,
            today: newTodayStatus,
            checkIn: isAshaCheckedIn ? "09:04" : undefined,
            week: newWeek,
          };
        }
        return p;
      }));
    };

    window.addEventListener("storage", handleStorageChange);
    handleStorageChange(); // initial check

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <DashboardShell
      nav={nav}
      active={active}
      onSelect={setActive}
      requiredKind="hr"
    >
      {active === "overview" && <Overview people={people} />}
      {active === "employees" && (
        <EmployeesView people={people} setPeople={setPeople} />
      )}
      {active === "attendance" && <Attendance people={people} setPeople={setPeople} />}
      {active === "payroll" && <Payroll />}
      {active === "leave" && <LeaveView />}
      {active === "broadcast" && <BroadcastView />}
      {active === "billing" && <Billing />}
      {active === "geofence" && <GeofenceView />}
      {active === "notifications" && <NotificationsView />}
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

function Overview({ people }: { people: Employee[] }) {
  const payrollTotal = seedPayroll.reduce((s, p) => s + p.net, 0);
  const todayDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const { items: fraudItems, clear: clearFraud } = useFraud();
  
  const dynHeadcount = people.length;
  const dynPresent = people.filter(e => e.today === "present" || e.today === "half").length;
  const dynAbsent = people.filter(e => e.today === "absent" || e.today === "pending").length;
  const dynLate = people.filter(e => e.today === "late").length;
  const dynOnLeave = people.filter(e => e.today === "leave").length;

  return (
    <div>
      <Header title="Workforce Overview" sub={`geoSelfie · ${todayDate}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Present today"
          value={dynPresent}
          icon={<UserCheck size={18} />}
          tone="#34d399"
          sub={`of ${dynHeadcount}`}
        />
        <StatCard
          label="Absent"
          value={dynAbsent}
          icon={<UserX size={18} />}
          tone="#f87171"
          sub="today"
          delay={0.05}
        />
        <StatCard
          label="Late"
          value={dynLate}
          icon={<Timer size={18} />}
          tone="#fbbf24"
          sub="grace exceeded"
          delay={0.1}
        />
        <StatCard
          label="On leave"
          value={dynOnLeave}
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

      <div className="mt-4">
        <Panel 
          title="Fraudulent Activity Alerts" 
          action={
            fraudItems.length > 0 ? (
              <button 
                onClick={() => clearFraud()}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Dismiss All
              </button>
            ) : undefined
          }
        >
          {fraudItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 flex flex-col items-center">
              <Check size={24} className="mb-2 text-emerald-500 opacity-50" />
              <p>No fraudulent activities detected.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-80 overflow-y-auto pr-2">
              {fraudItems.map(f => (
                <div key={f.id} className="py-3 flex items-start gap-3">
                  <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 grid place-items-center">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{f.employeeName} <span className="text-slate-400 font-normal ml-1">({f.employeeEmail})</span></p>
                      <span className="text-[10px] font-medium text-slate-400 shrink-0">{f.at}</span>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{f.reason}</p>
                  </div>
                  <button onClick={() => clearFraud(f.id)} className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors" title="Dismiss">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
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
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 text-sm hover:bg-slate-200 dark:hover:bg-white/10"
            >
              <Upload size={16} /> Upload CSV
            </button>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-indigo-400"
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
                ? "bg-indigo-500 text-slate-900 dark:text-white"
                : "border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 muted hover:bg-slate-200 dark:hover:bg-white/10"
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
              <tr className="muted border-b border-slate-200 dark:border-white/5 text-left text-xs">
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
                  className="border-b border-slate-200 dark:border-white/5 last:border-0"
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
                        className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-amber-300"
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
      className="fixed inset-0 z-50 grid place-items-center bg-black/20 dark:bg-black/50 p-4"
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
          <button onClick={onClose} className="muted hover:text-slate-900 dark:hover:text-white">
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
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none"
            />
          </Labeled>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Access ID (auto)">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 font-mono text-sm text-indigo-200">
                {memberId}
              </div>
            </Labeled>
            <Labeled label="Department">
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none"
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
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none"
            />
          </Labeled>
          <button
            onClick={submit}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 font-medium text-slate-900 dark:text-white hover:bg-indigo-400"
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

const dow = getWeekDates();
function Attendance({ people, setPeople }: { people: Employee[]; setPeople: React.Dispatch<React.SetStateAction<Employee[]>> }) {
  const { push } = useNotifications();
  const [editingAttendance, setEditingAttendance] = useState<{empId: string; dayIndex: number} | null>(null);

  const updateAttendance = (empId: string, dayIndex: number, newStatus: Status) => {
    setPeople((prev) => {
      const newPeople = prev.map((p) => {
        if (p.id === empId) {
          const newWeek = [...p.week];
          newWeek[dayIndex] = newStatus;
          const isWorkingDay = (s: Status, i: number) => i !== 6 && s !== "off";
          const workingDays = newWeek.filter(isWorkingDay);
          const presents = workingDays.filter(s => s === "present" || s === "half").length;
          const totalDays = workingDays.length || 1;
          const attendancePct = Math.round((presents / totalDays) * 100);
          
          updateEmployeeAttendanceGlobal(empId, dayIndex, newStatus);

          return { ...p, week: newWeek as Status[], attendancePct };
        }
        return p;
      });
      
      const emp = newPeople.find(p => p.id === empId);
      if (emp) {
        push({
          type: "leave_edited", // Reuse icon
          title: "Attendance Updated",
          body: `HR has marked your attendance as ${newStatus} for ${dow[dayIndex]}`,
          roles: ["employee"],
          targetUserId: emp.name
        });
      }
      return newPeople;
    });
    setEditingAttendance(null);
  };
  const [deptFilter, setDeptFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("07"); // July
  const [yearFilter, setYearFilter] = useState("2026");
  const [dayFilter, setDayFilter] = useState("all");

  const departments = useMemo(() => ["all", ...Array.from(new Set(people.map((p) => p.department)))], [people]);

  const filteredPeople = useMemo(() => {
    return people.filter(p => {
      if (deptFilter !== "all" && p.department !== deptFilter) return false;
      return true;
    });
  }, [people, deptFilter]);

  const downloadCSV = () => {
    const headers = ["Employee ID", "Name", "Department", ...dow, "This Month"];
    const rows = filteredPeople.map((e) => {
      const statuses = e.week.map(s => s === "present" ? "P" : s === "absent" ? "A" : s === "half" ? "H" : s === "leave" ? "LV" : s === "pending" ? "-" : "OFF");
      return [e.memberId, e.name, e.department, ...statuses, `${e.attendancePct}%`];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance_report_${yearFilter}_${monthFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Invisible backdrop to close dropdown */}
      {editingAttendance && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setEditingAttendance(null)} 
        />
      )}
      <Header
        title="Attendance"
        sub="Weekly presence & monthly rate per member"
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500 dark:text-slate-400" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-2 py-1 text-sm outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === "all" ? "All Departments" : d}
              </option>
            ))}
          </select>
        </div>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-2 py-1 text-sm outline-none"
        >
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-2 py-1 text-sm outline-none"
        >
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
        <select
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-2 py-1 text-sm outline-none"
        >
          <option value="all">All Days</option>
          <option value="mon">Monday</option>
          <option value="tue">Tuesday</option>
          <option value="wed">Wednesday</option>
          <option value="thu">Thursday</option>
          <option value="fri">Friday</option>
        </select>
        
        {/* Export Buttons */}
        <div className="ml-auto flex items-center gap-2 print-hidden">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 rounded-lg bg-indigo-500/20 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/30 transition-colors"
          >
            <Download size={14} />
            CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <Printer size={14} />
            PDF
          </button>
        </div>
      </div>
      <Panel>
        <div className="space-y-1">
          <div className="muted grid grid-cols-[1.6fr_auto_1fr] items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-2 text-xs">
            <span>Member</span>
            <span className="hidden sm:flex gap-1.5">
              {dow.map((d, i) => (
                <span key={i} className="w-8 text-center text-[10px] leading-tight">
                  {d.split(" ")[0]}<br/>
                  <span className="text-slate-900 dark:text-white/50">{d.split(" ")[1]}</span>
                </span>
              ))}
            </span>
            <span className="text-right">This month</span>
          </div>
          {filteredPeople.map((e) => (
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
                  <div key={i} className="relative flex justify-center w-8">
                    <button
                      onClick={() => setEditingAttendance({ empId: e.id, dayIndex: i })}
                      className="h-4 w-4 rounded-[5px] cursor-pointer hover:ring-2 ring-white/30 transition-all block"
                      style={{
                        background: `${statusColor[s]}${s === "off" ? "55" : "ee"}`,
                      }}
                      title={`Click to edit (${s})`}
                    />
                    {editingAttendance?.empId === e.id && editingAttendance?.dayIndex === i && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg shadow-xl p-1 z-50 flex flex-col gap-1 w-28">
                        {(["present", "absent", "half", "leave", "off", "pending"] as Status[]).map((status) => (
                          <button
                            key={status}
                            onClick={() => updateAttendance(e.id, i, status)}
                            className="text-left px-2 py-1.5 text-xs hover:bg-slate-200 dark:hover:bg-white/10 rounded flex items-center justify-between transition-colors"
                          >
                            <span className="capitalize">{status}</span>
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: statusColor[status] }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-3">
                <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10 sm:block">
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
          <Filter size={14} className="text-slate-500 dark:text-slate-400" />
          <span className="muted text-xs">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-2 py-1 text-sm outline-none"
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
                  ? "bg-indigo-500 text-slate-900 dark:text-white"
                  : "border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 muted hover:bg-slate-200 dark:hover:bg-white/10"
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
              <tr className="muted border-b border-slate-200 dark:border-white/5 text-left text-xs">
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
                  className="border-b border-slate-200 dark:border-white/5 last:border-0"
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
                          className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={() => saveEdit(r.id)}
                          className="rounded-lg bg-indigo-500/20 p-1.5 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/30"
                        >
                          <Save size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(r)}
                        className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-300"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 dark:border-white/10">
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
  const { leaves, updateStatus } = useLeaves();
  const { push } = useNotifications();
  const [filter, setFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const decide = (id: string, status: "approved" | "rejected" | "cancelled", employeeName: string) => {
    updateStatus(id, status, "HR Admin", "hr", remarks[id]);
    push({
      type: "leave_edited",
      title: `Leave ${status}`,
      body: `HR ${status} leave request for ${employeeName}`,
      roles: ["employee", "admin"],
    });
  };

  const filteredLeaves = leaves.filter(l => {
    if (filter !== "All" && l.status !== filter.toLowerCase()) return false;
    if (dateFilter === "This Month") {
      const d = new Date(l.appliedAt);
      const now = new Date();
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
    }
    if (dateFilter === "Last 3 Months") {
      const d = new Date(l.appliedAt);
      const limit = new Date();
      limit.setMonth(limit.getMonth() - 3);
      if (d < limit) return false;
    }
    return true;
  });

  return (
    <div>
      <Header title="Leave Approvals" sub="Audit, approve or reject employee time-off" />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 mt-2">
        <div className="flex gap-2">
          {["All", "Pending", "Approved", "Rejected", "Cancelled"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === f ? "bg-white text-black" : "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-white/20"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["All Time", "This Month", "Last 3 Months"].map(f => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                dateFilter === f ? "bg-white text-black" : "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-white/20"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        {filteredLeaves.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No leave requests found.
          </div>
        ) : (
          filteredLeaves.map((l) => (
            <div
              key={l.id}
              className="glass rounded-2xl p-4 transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-40 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">{l.employeeName}</span>
                    <span className="muted text-xs">· {l.id}</span>
                  </div>
                  <div className="muted text-sm mt-1 mb-2">
                    {l.type} Leave · {l.startDate} &rarr; {l.endDate} ({l.days}d)
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    &ldquo;{l.reason}&rdquo;
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Submitted {new Date(l.appliedAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3 min-w-48">
                  {l.status === "pending" ? (
                    <div className="w-full">
                      <input
                        placeholder="HR Remarks (optional)"
                        value={remarks[l.id] || ""}
                        onChange={(e) => setRemarks({...remarks, [l.id]: e.target.value})}
                        className="w-full mb-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-2 py-1.5 text-xs outline-none"
                      />
                      <div className="flex gap-2 justify-end w-full">
                        <button
                          onClick={() => decide(l.id, "rejected", l.employeeName)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-sm text-rose-300 hover:bg-slate-100 dark:hover:bg-white/5"
                        >
                          <X size={14} /> Reject
                        </button>
                        <button
                          onClick={() => decide(l.id, "approved", l.employeeName)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/30"
                        >
                          <Check size={14} /> Approve
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <Pill tone={l.status === "approved" ? "#34d399" : l.status === "rejected" ? "#f87171" : l.status === "cancelled" ? "#94a3b8" : "#fbbf24"}>
                        {l.status.toUpperCase()}
                      </Pill>
                      {l.hrRemarks && (
                        <div className="mt-2 text-xs text-emerald-300 text-right max-w-xs">
                          <span className="muted">Remarks:</span> {l.hrRemarks}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5">
                <button
                  onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-medium"
                >
                  {expandedId === l.id ? "Hide" : "Show"} Audit Trail & Timeline
                </button>
                
                {expandedId === l.id && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-black/20 p-3 border border-slate-200 dark:border-white/5">
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Versions</h4>
                      {l.versions.length === 0 ? (
                        <div className="text-xs text-slate-500">No edits made.</div>
                      ) : (
                        <div className="space-y-3">
                          {[...l.versions].reverse().map((v, idx) => (
                            <div key={v.id} className="text-xs text-slate-500 dark:text-slate-400 border-l-2 border-indigo-500/30 pl-2">
                              <div className="font-medium text-indigo-600 dark:text-indigo-300">v{l.versions.length - idx} <span className="muted font-normal">· {new Date(v.editedAt).toLocaleString()}</span></div>
                              <div className="mt-1">{v.startDate} &rarr; {v.endDate} ({v.days}d)</div>
                              <div>{v.reason}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="rounded-xl bg-black/20 p-3 border border-slate-200 dark:border-white/5">
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Activity Timeline</h4>
                      <div className="space-y-3">
                        {[...l.timeline].reverse().map((t) => (
                          <div key={t.id} className="text-xs text-slate-500 dark:text-slate-400 border-l-2 border-emerald-500/30 pl-2">
                            <div className="font-medium text-emerald-300">{t.action}</div>
                            <div className="mt-0.5">by {t.actorName} ({t.actorRole})</div>
                            <div className="muted">{new Date(t.timestamp).toLocaleString()}</div>
                            {t.remarks && <div className="mt-1 text-slate-700 dark:text-slate-300">Note: {t.remarks}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
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
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 text-sm hover:bg-slate-200 dark:hover:bg-white/10"
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
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Message…"
              rows={4}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none"
            />
            <label className="text-sm">
              <span className="muted mb-1 block text-xs">Audience</span>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none"
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
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 font-medium text-slate-900 dark:text-white hover:bg-indigo-400"
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
                  className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Megaphone size={15} className="text-indigo-600 dark:text-indigo-300" />
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
  const { tenants, updateTenant } = useTenants();
  const { push } = useNotifications();
  const tenant = tenants.find((t) => t.id === "t1") || tenants[0];
  const [selectedTier, setSelectedTier] = useState<string>("monthly");
  const [extraSeatsInput, setExtraSeatsInput] = useState<string>("");

  const currentTier = plans.tiers.find((t) => t.id === selectedTier) || plans.tiers[0];
  const amount = tierTotal(plans.basePrice, currentTier);

  const extraSeats = parseInt(extraSeatsInput) || 0;
  const extraSeatsCost = Math.ceil((extraSeats / 100) * 599);

  const [invoices, setInvoices] = useState([
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
  ]);

  const handlePurchaseExtraSeats = () => {
    if (extraSeats <= 0) return;
    
    // Check if the user has an active subscription
    if (!(tenant.status === "active" || tenant.status === "trial")) {
      alert("You need an active subscription first. Which subscription plan do you want to choose?");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const options = {
        key: "rzp_test_mock_key", // mock key
        amount: extraSeatsCost * 100, // paise
        currency: "INR",
        name: "geoSelfie SaaS",
        description: `Purchase ${extraSeats} Additional Seats`,
        handler: function (response: { razorpay_payment_id: string }) {
          updateTenant(tenant.id, { seats: tenant.seats + extraSeats });
          
          const newInvoice = {
            id: `INV-${String(invoices.length + 8).padStart(4, "0")}`,
            date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
            amount: extraSeatsCost,
            status: "paid"
          };
          setInvoices([newInvoice, ...invoices]);

          push({
            type: "broadcast",
            title: "Payment Successful",
            body: `Your payment of ${INR(extraSeatsCost)} for ${extraSeats} additional seats was successful. Receipt emailed to hr@geoselfie.app.`,
            roles: ["hr"]
          });
          
          setExtraSeatsInput("");
          alert(`Payment Successful! ${extraSeats} seats added. Payment ID: ${response.razorpay_payment_id}`);
        },
        prefill: {
          name: "geoSelfie HR",
          email: "hr@geoselfie.app"
        },
        theme: {
          color: "#6366f1"
        }
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    };
    document.body.appendChild(script);
  };

  return (
    <div>
      <Header
        title="Subscription & Billing"
        sub={`geoSelfie Pro · manage your plan (Total Seats: ${tenant.seats})`}
      />

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
                  className={`relative rounded-2xl border p-4 text-left transition flex flex-col justify-between ${
                    selectedTier === tier.id
                      ? "border-indigo-400 bg-indigo-500/10"
                      : "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-white/8"
                  }`}
                >
                  {tier.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap rounded-full bg-indigo-500 px-2 py-0.5 text-xs text-slate-900 dark:text-white shadow-lg">
                      <Sparkles size={12} /> {tier.badge}
                    </span>
                  )}
                  {tier.discountPct > 0 && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                      Save {tier.discountPct}%
                    </span>
                  )}
                  <div>
                    <div className="text-sm font-medium mt-1">{tier.label}</div>
                    <div className="mt-1 text-2xl font-semibold">{INR(total)}</div>
                    <div className="muted mt-1 text-xs">
                      {tier.months === 1
                        ? "billed monthly"
                        : `${INR(pm)}/mo · billed every ${tier.months} months`}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
                    <div className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Users size={14} className="text-indigo-400" />
                      {(tier.includedSeats || (tier.id === 'monthly' ? 300 : tier.id === 'sixmonth' ? 1000 : 2000)).toLocaleString()} Seats Included
                    </div>
                    {saved > 0 && (
                      <div className="mt-1 text-xs text-emerald-300">
                        Save {INR(saved)} vs monthly
                      </div>
                    )}
                    <ul className="mt-3 flex flex-col gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {tier.id === "monthly" && (
                        <>
                          <li>• AI HR Assistant</li>
                          <li>• All Dashboards</li>
                          <li>• Audit Logs</li>
                        </>
                      )}
                      {tier.id === "sixmonth" && (
                        <>
                          <li>• Everything in Base</li>
                          <li>• Priority Support</li>
                          <li>• Advanced Reports</li>
                        </>
                      )}
                      {tier.id === "yearly" && (
                        <>
                          <li>• Everything in Pro</li>
                          <li>• Premium AI Features</li>
                          <li>• Highest Priority Support</li>
                        </>
                      )}
                    </ul>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
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
            <button
              onClick={() => {
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.onload = () => {
                  const options = {
                    key: "rzp_test_mock_key",
                    amount: amount * 100,
                    currency: "INR",
                    name: "geoSelfie SaaS",
                    description: `${currentTier.label} Subscription`,
                    handler: function (response: { razorpay_payment_id: string }) {
                      alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
                    },
                    prefill: {
                      name: "geoSelfie HR",
                      email: "hr@geoselfie.app"
                    },
                    theme: {
                      color: "#6366f1"
                    }
                  };
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const rzp = new (window as any).Razorpay(options);
                  rzp.open();
                };
                document.body.appendChild(script);
              }}
              className="rounded-xl bg-indigo-500 px-4 py-2.5 font-medium text-slate-900 dark:text-white hover:bg-indigo-400"
            >
              Pay with Razorpay
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
            <div className="muted mt-1 text-xs">{currentTier.label} · geoSelfie</div>
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
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mt-4">
        <Panel title="Additional Employee Seat Pricing">
          <p className="muted text-sm mb-4">
            Purchase extra seats at any time without changing your subscription plan. 
            Minimum purchase is 50 seats. Every 100 seats cost ₹599.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">Number of Seats</label>
              <input 
                type="number" 
                min="50"
                value={extraSeatsInput} 
                onChange={(e) => setExtraSeatsInput(e.target.value)}
                placeholder="e.g. 50"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2.5 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 flex flex-col justify-center">
              <span className="muted text-xs block">Payable Amount</span>
              <span className="text-xl font-semibold text-emerald-400">
                {INR(extraSeatsCost)}
              </span>
            </div>
          </div>
          <button 
            onClick={handlePurchaseExtraSeats}
            disabled={extraSeats < 50}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 font-medium text-slate-900 dark:text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard size={18} /> Purchase Seats with Razorpay
          </button>
        </Panel>

        <Panel title="Payment history">
          <div className="table-wrap h-full max-h-[220px] overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="muted border-b border-slate-200 dark:border-white/5 text-left text-xs">
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
                    className="border-b border-slate-200 dark:border-white/5 last:border-0"
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
  const { config, updateConfig, history, deleteHistoryRecord } = useGeofenceSettings();
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
    } catch {
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
                  className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2.5 outline-none focus:border-indigo-500/50"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="flex items-center justify-center rounded-lg bg-slate-200 dark:bg-white/10 px-4 text-slate-700 dark:text-slate-300 hover:bg-white/20 disabled:opacity-50"
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
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2.5 outline-none focus:border-indigo-500/50"
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
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2.5 outline-none focus:border-indigo-500/50"
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
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2.5 outline-none focus:border-indigo-500/50"
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

          <div className="h-[450px] w-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 relative bg-[#0e1020]">
            <DynamicMap 
              lat={center.lat} 
              lng={center.lng} 
              radius={numRadius} 
              onChange={(newLat, newLng) => {
                setLat(newLat.toString());
                setLng(newLng.toString());
              }} 
            />
            <div className="absolute top-2 left-16 z-[1000] pointer-events-none rounded bg-black/20 dark:bg-black/50 px-2 py-1 text-xs text-slate-900 dark:text-white backdrop-blur-md">
              Click map to move pin
            </div>
          </div>
        </div>
      </Panel>
      
      <div className="mt-6">
        <Header title="Geofence History" sub="Log of location boundary changes" />
        <Panel>
          {history && history.length > 0 ? (
            <div className="table-wrap">
              <table className="w-full text-sm">
                <thead>
                  <tr className="muted border-b border-slate-200 dark:border-white/5 text-left text-xs">
                    <th className="pb-3 font-medium">Timestamp</th>
                    <th className="pb-3 font-medium">Location Name / Address</th>
                    <th className="pb-3 font-medium">Latitude</th>
                    <th className="pb-3 font-medium">Longitude</th>
                    <th className="pb-3 font-medium text-right">Radius (m)</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record.id} className="border-b border-slate-200 dark:border-white/5 last:border-0 hover:bg-slate-100 dark:hover:bg-white/5">
                      <td className="py-3 text-xs muted">{new Date(record.timestamp).toLocaleString()}</td>
                      <td className="py-3 font-medium">{record.address || "N/A"}</td>
                      <td className="py-3 font-mono text-xs">{record.lat}</td>
                      <td className="py-3 font-mono text-xs">{record.lng}</td>
                      <td className="py-3 text-right">{record.radius}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => deleteHistoryRecord(record.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-sm muted">No history available yet.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
