"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Bell,
  CalendarDays,
  Plane,
  FileText,
  Wallet,
  MapPin,
  ScanFace,
  CheckCircle2,
  Clock,
  CalendarCheck,
  Download,
  Camera,
  User,
  Building2,
  Laptop,
  Megaphone,
  X,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import DashboardShell, { type NavItem } from "@/components/DashboardShell";
import dynamic from "next/dynamic";
const FaceScan = dynamic(() => import("@/components/FaceScan"), { ssr: false });
import Profile from "@/components/Profile";
import NotificationsView from "@/components/NotificationsView";
import { StatCard, Panel, Pill, Avatar } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useFaceEnrollment } from "@/lib/face";
import { useBroadcasts } from "@/lib/broadcast";
import { useFraud } from "@/lib/fraud";
import { useLeaves, type LeaveRequest } from "@/lib/leaves";
import { useNotifications } from "@/lib/notifications";
import { useGeofenceSettings, calculateDistance } from "@/lib/geofence";
import {
  myMonth,
  statusColor,
  mySalarySlips,
  INR,
  to12h,
  getWeekDates,
  employees
} from "@/lib/mock";

const nav: NavItem[] = [
  { key: "home", label: "Check In", icon: LayoutDashboard },
  { key: "calendar", label: "My Attendance", icon: CalendarDays },
  { key: "salary", label: "Salary", icon: Wallet },
  { key: "leave", label: "Leave", icon: Plane },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "profile", label: "Profile", icon: User },
];

export default function EmployeePage() {
  const [active, setActive] = useState("home");
  return (
    <DashboardShell
      nav={nav}
      active={active}
      onSelect={setActive}
      requiredKind="employee"
    >
      {active === "home" && <Home onNavigate={setActive} />}
      {active === "calendar" && <Calendar />}
      {active === "salary" && <Salary />}
      {active === "leave" && <Leave />}
      {active === "reports" && <Reports />}
      {active === "notifications" && <NotificationsView />}
      {active === "profile" && <Profile />}
    </DashboardShell>
  );
}

type Step = 0 | 1 | 2 | 3; // idle, face, gps, done

function Home({ onNavigate }: { onNavigate: (k: string) => void }) {
  const { session } = useAuth();
  const me = employees.find(e => e.name === session?.name) || employees[0];
  const dow = getWeekDates();
  const { enrolled, descriptor } = useFaceEnrollment(session?.email ?? "guest");
  const { items: broadcasts } = useBroadcasts();
  const { items: fraudItems } = useFraud(session?.email ?? "guest");
  const warningsCount = fraudItems.length;
  const { config } = useGeofenceSettings();
  const [distance, setDistance] = useState<number | null>(null);
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [mode, setMode] = useState<"office" | "remote">("office");

  useEffect(() => {
    if (!navigator.geolocation) {
      const t = setTimeout(() => setGeoError("Geolocation not supported"), 0);
      return () => clearTimeout(t);
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const dist = calculateDistance(
          pos.coords.latitude,
          pos.coords.longitude,
          config.lat,
          config.lng
        );
        setDistance(dist);
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoError(null);
      },
      () => {
        setGeoError("Location access denied.");
      },
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [config.lat, config.lng]);

  const isInside = distance !== null && distance <= config.radius;

  function run() {
    setStep(1);
    setTimeout(() => setStep(2), 1100);
    setTimeout(() => {
      setStep(3);
      setCheckedIn(true);
    }, 2300);
  }

  const todayDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Good morning, {session?.name?.split(" ")[0] || "User"} 👋
      </h1>
      <p className="muted text-sm mt-1">
        {todayDate} · Head Office · Morning shift
      </p>

      {warningsCount >= 3 && (
        <div className="mt-6 rounded-xl border border-red-500 bg-red-50 dark:bg-red-500/10 p-5 text-red-600 dark:text-red-400">
          <div className="flex items-center gap-3 font-bold text-lg mb-1">
            <AlertTriangle size={24} className="shrink-0" />
            Action Required: You are at risk
          </div>
          <p className="text-sm font-medium leading-relaxed">
            We have detected {warningsCount} fraudulent activities on your account. Continued violations may result in account suspension. Please contact HR immediately.
          </p>
        </div>
      )}

      {warningsCount > 0 && warningsCount < 3 && (
        <div className="mt-6 rounded-xl border border-amber-500 bg-amber-50 dark:bg-amber-500/10 p-5 text-amber-700 dark:text-amber-500">
           <div className="flex items-center gap-2 font-bold text-base mb-1">
            <AlertTriangle size={20} className="shrink-0" />
            Warning ({warningsCount}/3)
          </div>
          <p className="text-sm font-medium leading-relaxed">
            We have detected suspicious activity on your account. Further violations will put your account at risk.
          </p>
        </div>
      )}

      {broadcasts.length > 0 && (
        <div className="mt-4 space-y-2">
          {broadcasts.slice(0, 2).map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-4 py-3"
            >
              <Megaphone
                size={18}
                className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-300"
              />
              <div className="min-w-0 text-sm">
                <div className="font-medium">{b.title}</div>
                <div className="muted">{b.body}</div>
                <div className="muted mt-0.5 text-xs">
                  {b.audience} · {b.at}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!enrolled && (
        <button
          onClick={() => onNavigate("profile")}
          className="mt-4 flex w-full items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-200"
        >
          <ScanFace size={18} />
          <span>
            Register your face once in <b>Profile</b> to enable attendance
            check-in.
          </span>
        </button>
      )}

      {scanOpen && (
        <FaceScan
          mode="verify"
          enrolledDescriptor={descriptor}
          onClose={() => setScanOpen(false)}
          onVerified={() => {
            setScanOpen(false);
            run();
          }}
        />
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="grid items-center gap-6 sm:grid-cols-2">
            <div className="scene">
              <motion.div
                animate={{
                  rotateY: checkedIn ? 0 : [0, 6, 0, -6, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: checkedIn ? 0 : Infinity,
                }}
                className="tilt relative mx-auto grid h-44 w-44 place-items-center rounded-3xl border border-slate-200 dark:border-white/10 sm:h-52 sm:w-52"
                style={{
                  background:
                    "radial-gradient(circle at 50% 30%, rgba(99,102,241,0.25), rgba(14,16,32,0.6))",
                }}
              >
                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <Face
                      key="idle"
                      label="Ready"
                      icon={<ScanFace size={54} />}
                      tone="#a5b4fc"
                    />
                  )}
                  {step === 1 && (
                    <Face
                      key="face"
                      label="Verifying face…"
                      icon={<ScanFace size={54} />}
                      tone="#818cf8"
                      pulse
                    />
                  )}
                  {step === 2 && (
                    <Face
                      key="gps"
                      label="Checking location…"
                      icon={<MapPin size={54} />}
                      tone="#22d3ee"
                      pulse
                    />
                  )}
                  {step === 3 && (
                    <Face
                      key="done"
                      label="Checked in!"
                      icon={<CheckCircle2 size={54} />}
                      tone="#34d399"
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            <div>
              <div className="muted text-sm">Current status</div>
              <div className="mt-1 text-xl font-semibold sm:text-2xl">
                {checkedIn
                  ? `${mode === "office" ? "On site" : "Remote"} · ${to12h("09:04")}`
                  : "Not checked in"}
              </div>

              {userPos && mode === "office" && (
                <div className="mt-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-3 text-xs">
                  <div className="font-medium text-slate-700 dark:text-slate-300">Your Location:</div>
                  <div className="muted mt-1 font-mono">
                    {userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}
                  </div>
                  <div className="mt-1">
                    {distance !== null ? (
                      <span className={distance <= config.radius ? "text-emerald-400" : "text-amber-400"}>
                        {distance} meters from office (Max allowed: {config.radius}m)
                      </span>
                    ) : (
                      <span className="muted">Calculating distance...</span>
                    )}
                  </div>
                </div>
              )}

              {!checkedIn && (
                <div className="mt-3">
                  <div className="muted mb-1.5 text-xs">Work mode</div>
                  <div className="inline-flex rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-1">
                    <button
                      onClick={() => setMode("office")}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
                        mode === "office"
                          ? "bg-indigo-500 text-slate-900 dark:text-white"
                          : "muted"
                      }`}
                    >
                      <Building2 size={15} /> In office
                    </button>
                    <button
                      onClick={() => setMode("remote")}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
                        mode === "remote"
                          ? "bg-indigo-500 text-slate-900 dark:text-white"
                          : "muted"
                      }`}
                    >
                      <Laptop size={15} /> Remote
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <CheckRow
                  active={step === 1}
                  label="Face verification (liveness + match)"
                  done={step > 1}
                />
                <CheckRow
                  active={step === 2}
                  label={
                    mode === "office"
                      ? distance === null
                        ? geoError ? `Geofence: ${geoError}` : "Locating..."
                        : isInside
                          ? `Inside geofence (${distance}m away)`
                          : `Outside geofence (${distance}m away. Max: ${config.radius}m)`
                      : "Remote (Geofence disabled)"
                  }
                  done={step > 2 || (step === 0 && mode === "office" && isInside) || (step === 0 && mode === "remote")}
                  error={mode === "office" && step === 0 && distance !== null && !isInside}
                />
                <CheckRow
                  active={step === 3}
                  label="Within shift window"
                  done={step >= 3}
                />
              </div>
              <button
                onClick={
                  checkedIn
                    ? () => resetCheckIn(setStep, setCheckedIn)
                    : enrolled
                      ? () => setScanOpen(true)
                      : () => onNavigate("profile")
                }
                disabled={step === 1 || step === 2 || (!checkedIn && mode === "office" && !isInside)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-medium text-slate-900 dark:text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {!checkedIn && step === 0 && <Camera size={18} />}
                {checkedIn
                  ? "Check out"
                  : step === 0
                    ? enrolled
                      ? "Open camera & check in"
                      : "Register your face first"
                    : "Verifying…"}
              </button>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4">
          <StatCard
            label="This month"
            value={20}
            suffix=" days"
            icon={<CalendarCheck size={18} />}
            tone="#34d399"
            sub="present"
          />
          <StatCard
            label="Hours logged"
            value={162}
            icon={<Clock size={18} />}
            tone="#a855f7"
            sub="86% attendance"
          />
        </div>
      </div>

      {/* Shared Attendance Timeline Row */}
      <Panel className="mt-4">
        <h2 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">My Weekly Attendance</h2>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 p-3 text-sm">
          <div className="flex items-center gap-3 w-40 flex-shrink-0">
            <Avatar name={me.name} hue={me.avatarHue} />
            <div>
              <div className="font-medium">{me.name}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">{me.memberId}</div>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-4 overflow-x-auto hide-scrollbar border-l border-slate-200 dark:border-white/10 pl-4 py-1 flex-1">
            {dow.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[32px]">
                <span className="text-center text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                  {d.split(" ")[0]}<br/>
                  <span className="text-slate-900 dark:text-white/30">{d.split(" ")[1]}</span>
                </span>
                <div
                  className="h-4 w-4 rounded-[5px] flex-shrink-0"
                  style={{ background: statusColor[me.week[i]] }}
                />
              </div>
            ))}
          </div>
          <div className="ml-auto w-32 flex-shrink-0 border-l border-slate-200 dark:border-white/10 pl-4">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">This Month</span>
              <span>{me.attendancePct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${me.attendancePct}%` }}
              />
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function resetCheckIn(
  setStep: (s: Step) => void,
  setCheckedIn: (b: boolean) => void,
) {
  setStep(0);
  setCheckedIn(false);
}

function Face({
  label,
  icon,
  tone,
  pulse,
}: {
  label: string;
  icon: React.ReactNode;
  tone: string;
  pulse?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex flex-col items-center gap-3"
      style={{ color: tone }}
    >
      <span className={pulse ? "animate-pulse" : ""}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </motion.div>
  );
}

function CheckRow({
  active,
  label,
  done,
  error,
}: {
  active: boolean;
  label: string;
  done: boolean;
  error?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span
        className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
          error
            ? "bg-red-500/25 text-red-400"
            : done
              ? "bg-emerald-500/25 text-emerald-300"
              : active
                ? "bg-indigo-500/25 text-indigo-200"
                : "bg-slate-100 dark:bg-white/5 text-slate-500"
        }`}
      >
        {error ? (
          <X size={12} />
        ) : done ? (
          <CheckCircle2 size={12} />
        ) : active ? (
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-current"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </span>
      <span
        className={
          error
            ? "text-red-400"
            : done || active
              ? "text-slate-800 dark:text-slate-200"
              : "text-slate-500"
        }
      >
        {label}
      </span>
    </div>
  );
}

const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Calendar() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const cells = myMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();
  const present = cells.filter((c) => c.status === "present").length;
  const half = cells.filter((c) => c.status === "half").length;
  const absent = cells.filter((c) => c.status === "absent").length;
  const leave = cells.filter((c) => c.status === "leave").length;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Attendance</h1>
          <p className="muted text-sm">{monthNames[month]} {year}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 transition-colors"
          >
            {monthNames.map((m, i) => (
              <option key={m} value={i} className="bg-slate-800">{m}</option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 transition-colors"
          >
            {Array.from({length: 5}).map((_, i) => (
              <option key={i} value={currentYear - i} className="bg-slate-800">{currentYear - i}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Panel title="Calendar" className="lg:col-span-2">
          <div className="grid grid-cols-7 gap-1 text-center sm:gap-1.5">
            {dowNames.map((d) => (
              <div key={d} className="muted pb-1 text-xs">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {cells.map((c) => (
              <motion.div
                key={c.day}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: c.day * 0.008 }}
                className="aspect-square rounded-lg border border-slate-200 dark:border-white/5 p-1 text-left sm:rounded-xl sm:p-1.5"
                style={{
                  background:
                    c.status !== "none"
                      ? `${statusColor[c.status]}1a`
                      : "transparent",
                }}
                title={c.hours}
              >
                <div className="text-[10px] sm:text-xs">{c.day}</div>
                {c.status !== "none" && c.status !== "off" && (
                  <div
                    className="mt-0.5 h-1 w-1 rounded-full sm:mt-1 sm:h-1.5 sm:w-1.5"
                    style={{ background: statusColor[c.status] }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </Panel>
        <div className="grid content-start gap-3">
          <Legend color="#34d399" label="Present" n={present} />
          <Legend color="#fbbf24" label="Half day" n={half} />
          <Legend color="#f87171" label="Absent" n={absent} />
          <Legend color="#60a5fa" label="On leave" n={leave} />
        </div>
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
  n,
}: {
  color: string;
  label: string;
  n: number;
}) {
  return (
    <div className="glass flex items-center justify-between rounded-xl p-3">
      <span className="flex items-center gap-2 text-sm">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: color }}
        />
        {label}
      </span>
      <span className="font-semibold">{n}</span>
    </div>
  );
}

function Leave() {
  const { session } = useAuth();
  const { leaves, addLeave, updateLeave } = useLeaves();
  const { push } = useNotifications();
  const myLeaves = leaves.filter((l) => l.employeeName === session?.name);
  
  const [type, setType] = useState("Casual");
  const [days, setDays] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState("");
  const [editDays, setEditDays] = useState(1);
  const [editStartDate, setEditStartDate] = useState("");
  const [editReason, setEditReason] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filter, setFilter] = useState("All");
  
  const handleSubmit = () => {
    if (!reason || !session) return;
    const end = new Date(startDate);
    end.setDate(end.getDate() + days - 1);
    addLeave({
      employeeId: "emp_curr",
      employeeName: session.name,
      type,
      startDate,
      endDate: end.toISOString().split("T")[0],
      days,
      reason,
      documents: [],
    });
    setReason("");
  };

  const startEdit = (leave: LeaveRequest) => {
    setEditingId(leave.id);
    setEditType(leave.type);
    setEditDays(leave.days);
    setEditStartDate(leave.startDate);
    setEditReason(leave.reason);
  };

  const saveEdit = (leave: LeaveRequest) => {
    const end = new Date(editStartDate);
    end.setDate(end.getDate() + editDays - 1);
    updateLeave(
      leave.id,
      { type: editType, days: editDays, startDate: editStartDate, endDate: end.toISOString().split("T")[0], reason: editReason },
      session?.name || "Employee",
      "employee"
    );
    push({
      type: "leave_edited",
      title: `Leave Request Edited`,
      body: `${session?.name || "Employee"} updated Leave Request #${leave.id}`,
      roles: ["hr", "admin"],
    });
    setEditingId(null);
  };

  const canEdit = (appliedAt: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diffMins = (Date.now() - new Date(appliedAt).getTime()) / (1000 * 60);
    return diffMins <= 30;
  };

  const filtered = myLeaves.filter(l => filter === "All" ? true : filter.toLowerCase() === l.status);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Leave</h1>
      <p className="muted text-sm">Balance & history</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Panel title="Leave balance">
          {[
            { t: "Casual", n: 8, c: "#34d399" },
            { t: "Sick", n: 5, c: "#fbbf24" },
            { t: "Earned", n: 12, c: "#60a5fa" },
          ].map((b) => (
            <div key={b.t} className="mb-2 flex items-center justify-between">
              <span className="muted text-sm">{b.t}</span>
              <Pill tone={b.c}>{b.n} days</Pill>
            </div>
          ))}
        </Panel>
        
        <Panel title="Request leave" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="muted mb-1 block text-xs">Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none"
              >
                <option>Casual</option>
                <option>Sick</option>
                <option>Earned</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">
                <span className="muted mb-1 block text-xs">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none [color-scheme:dark]"
                />
              </label>
              <label className="text-sm">
                <span className="muted mb-1 block text-xs">Days</span>
                <input
                  type="number"
                  min="1"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none"
                />
              </label>
            </div>
            <label className="text-sm sm:col-span-2">
              <span className="muted mb-1 block text-xs">Reason</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Family function, medical appointment…"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none"
              />
            </label>
            <button
              onClick={handleSubmit}
              disabled={!reason}
              className="rounded-xl bg-indigo-500 py-2.5 font-medium text-slate-900 dark:text-white hover:bg-indigo-400 disabled:opacity-50 sm:col-span-2"
            >
              Submit request
            </button>
          </div>
        </Panel>

        <div className="lg:col-span-3 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Leave History</h2>
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
          </div>
          <div className="grid gap-3">
            {filtered.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No leave requests found.
              </div>
            ) : (
              filtered.map(l => (
                <div key={l.id} className="glass rounded-2xl p-4 transition-all">
                  {editingId === l.id ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <h3 className="sm:col-span-2 font-medium text-indigo-600 dark:text-indigo-300 flex items-center gap-2">
                        <Pencil size={16} /> Editing Request {l.id}
                      </h3>
                      <label className="text-sm">
                        <span className="muted mb-1 block text-xs">Type</span>
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none"
                        >
                          <option>Casual</option>
                          <option>Sick</option>
                          <option>Earned</option>
                        </select>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-sm">
                          <span className="muted mb-1 block text-xs">Start Date</span>
                          <input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none [color-scheme:dark]"
                          />
                        </label>
                        <label className="text-sm">
                          <span className="muted mb-1 block text-xs">Days</span>
                          <input
                            type="number"
                            min="1"
                            value={editDays}
                            onChange={(e) => setEditDays(parseInt(e.target.value) || 1)}
                            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none"
                          />
                        </label>
                      </div>
                      <label className="text-sm sm:col-span-2">
                        <span className="muted mb-1 block text-xs">Reason</span>
                        <input
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-3 py-2 outline-none"
                        />
                      </label>
                      <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
                        <button onClick={() => setEditingId(null)} className="rounded-lg bg-slate-200 dark:bg-white/10 px-4 py-2 text-sm hover:bg-white/20">Cancel</button>
                        <button onClick={() => saveEdit(l)} className="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-slate-900 dark:text-white hover:bg-indigo-400">Save Changes</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900 dark:text-white">{l.type} Leave</span>
                            <span className="muted text-xs">· {l.id}</span>
                            {l.versions.length > 0 && (
                              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                                EDITED {l.versions.length} TIME{l.versions.length > 1 ? 'S' : ''}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                            {l.startDate} &rarr; {l.endDate} ({l.days} days)
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            &ldquo;{l.reason}&rdquo;
                          </div>
                          <div className="text-xs text-slate-500 mt-2">
                            Submitted on {new Date(l.appliedAt).toLocaleString()}
                            {l.versions.length > 0 && ` · Last edited ${new Date(l.versions[l.versions.length - 1].editedAt).toLocaleString()}`}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Pill tone={l.status === 'approved' ? '#34d399' : l.status === 'rejected' ? '#f87171' : l.status === 'cancelled' ? '#94a3b8' : '#fbbf24'}>
                            {l.status.toUpperCase()}
                          </Pill>
                          {l.status === 'pending' && canEdit(l.appliedAt) && (
                            <button
                              onClick={() => startEdit(l)}
                              className="text-xs text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-1 mt-1 font-medium bg-indigo-500/10 px-2 py-1 rounded-md"
                            >
                              {/* eslint-disable-next-line react-hooks/purity */}
                              <Pencil size={12} /> Edit ({(30 - Math.floor((Date.now() - new Date(l.appliedAt).getTime()) / (1000 * 60)))}m left)
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {l.hrRemarks && (
                        <div className="mt-3 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200 border border-emerald-500/20">
                          <strong>HR Remark:</strong> {l.hrRemarks}
                        </div>
                      )}

                      {l.versions.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5">
                          <button
                            onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                          >
                            {expandedId === l.id ? "Hide" : "Show"} version history ({l.versions.length})
                          </button>
                          
                          <AnimatePresence>
                            {expandedId === l.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 space-y-2 pl-3 border-l-2 border-slate-200 dark:border-white/10">
                                  {[...l.versions].reverse().map((v, idx) => (
                                    <div key={v.id} className="text-xs text-slate-500 dark:text-slate-400">
                                      <div className="font-medium text-slate-700 dark:text-slate-300">Version {l.versions.length - idx} <span className="muted font-normal">· {new Date(v.editedAt).toLocaleString()}</span></div>
                                      <div className="mt-1">{v.type} | {v.startDate} &rarr; {v.endDate} ({v.days}d)</div>
                                      <div>Reason: {v.reason}</div>
                                    </div>
                                  ))}
                                  <div className="text-xs text-slate-500 dark:text-slate-400 opacity-60">
                                    <div className="font-medium text-slate-700 dark:text-slate-300">Original Submission <span className="font-normal">· {new Date(l.appliedAt).toLocaleString()}</span></div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MoneyCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub: string;
  tone: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="muted text-sm">{label}</div>
      <div className="mt-2 text-2xl font-semibold" style={{ color: tone }}>
        {INR(value)}
      </div>
      <div className="muted mt-1 text-xs">{sub}</div>
    </div>
  );
}

function Salary() {
  const latest = mySalarySlips[0];
  const total = mySalarySlips.reduce((s, x) => s + x.net, 0);
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Salary</h1>
      <p className="muted text-sm">Monthly pay &amp; downloadable slips</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <MoneyCard
          label="Net this month"
          value={latest.net}
          sub={latest.month}
          tone="#34d399"
        />
        <MoneyCard
          label="Gross"
          value={latest.gross}
          sub="before deductions"
          tone="#818cf8"
        />
        <MoneyCard
          label="Paid (last 4 months)"
          value={total}
          sub="net total"
          tone="#22d3ee"
        />
      </div>
      <Panel title="Payslips" className="mt-4">
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="muted border-b border-slate-200 dark:border-white/5 text-left text-xs">
                <th className="pb-3 font-medium">Month</th>
                <th className="pb-3 text-right font-medium hidden sm:table-cell">
                  Gross
                </th>
                <th className="pb-3 text-right font-medium hidden sm:table-cell">
                  Deductions
                </th>
                <th className="pb-3 text-right font-medium">Net</th>
                <th className="pb-3 text-right font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Slip</th>
              </tr>
            </thead>
            <tbody>
              {mySalarySlips.map((s) => (
                <tr
                  key={s.month}
                  className="border-b border-slate-200 dark:border-white/5 last:border-0"
                >
                  <td className="py-3 font-medium">{s.month}</td>
                  <td className="py-3 text-right hidden sm:table-cell">
                    {INR(s.gross)}
                  </td>
                  <td className="py-3 text-right text-rose-300 hidden sm:table-cell">
                    −{INR(s.deductions)}
                  </td>
                  <td className="py-3 text-right font-semibold">
                    {INR(s.net)}
                  </td>
                  <td className="py-3 text-right">
                    <Pill tone="#34d399">{s.status}</Pill>
                  </td>
                  <td className="py-3 text-right">
                    <button className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-white/5 px-2.5 py-1 text-xs hover:bg-slate-200 dark:hover:bg-white/10">
                      <Download size={13} /> PDF
                    </button>
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

function Reports() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      <p className="muted text-sm">Download your attendance summary</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[
          { t: "Monthly PDF", d: "July 2026 attendance report", c: "#f87171" },
          { t: "Excel export", d: "Raw punch data (.xlsx)", c: "#34d399" },
        ].map((r) => (
          <div
            key={r.t}
            className="glass lift flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="font-medium">{r.t}</div>
              <div className="muted text-sm">{r.d}</div>
            </div>
            <button
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm"
              style={{ background: `${r.c}22`, color: r.c }}
            >
              <Download size={16} /> Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
