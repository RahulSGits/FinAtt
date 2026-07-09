"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
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
} from "lucide-react";
import DashboardShell, { type NavItem } from "@/components/DashboardShell";
import FaceScan from "@/components/FaceScan";
import Profile from "@/components/Profile";
import { StatCard, Panel, Pill } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useFaceEnrollment } from "@/lib/face";
import { useBroadcasts } from "@/lib/broadcast";
import { useGeofenceSettings, calculateDistance } from "@/lib/geofence";
import {
  myMonth,
  statusColor,
  mySalarySlips,
  INR,
  to12h,
  type Status,
} from "@/lib/mock";

const nav: NavItem[] = [
  { key: "home", label: "Check In", icon: LayoutDashboard },
  { key: "calendar", label: "My Attendance", icon: CalendarDays },
  { key: "salary", label: "Salary", icon: Wallet },
  { key: "leave", label: "Leave", icon: Plane },
  { key: "reports", label: "Reports", icon: FileText },
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
      {active === "profile" && <Profile />}
    </DashboardShell>
  );
}

type Step = 0 | 1 | 2 | 3; // idle, face, gps, done

function Home({ onNavigate }: { onNavigate: (k: string) => void }) {
  const { session } = useAuth();
  const { enrolled, descriptor } = useFaceEnrollment(session?.email ?? "guest");
  const { items: broadcasts } = useBroadcasts();
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
      setGeoError("Geolocation not supported");
      return;
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
      (err) => {
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

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Good morning, {session?.name?.split(" ")[0] || "User"} 👋
      </h1>
      <p className="muted text-sm">
        Head Office · Morning shift · {to12h("09:00")} – {to12h("17:00")}
      </p>

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
                className="mt-0.5 shrink-0 text-indigo-300"
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
                className="tilt relative mx-auto grid h-44 w-44 place-items-center rounded-3xl border border-white/10 sm:h-52 sm:w-52"
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
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                  <div className="font-medium text-slate-300">Your Location:</div>
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
                  <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
                    <button
                      onClick={() => setMode("office")}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
                        mode === "office"
                          ? "bg-indigo-500 text-white"
                          : "muted"
                      }`}
                    >
                      <Building2 size={15} /> In office
                    </button>
                    <button
                      onClick={() => setMode("remote")}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
                        mode === "remote"
                          ? "bg-indigo-500 text-white"
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
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
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
                : "bg-white/5 text-slate-500"
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
              ? "text-slate-200"
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
  const cells = myMonth();
  const firstDow = new Date(2026, 6, 1).getDay();
  const present = cells.filter((c) => c.status === "present").length;
  const half = cells.filter((c) => c.status === "half").length;
  const absent = cells.filter((c) => c.status === "absent").length;
  const leave = cells.filter((c) => c.status === "leave").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">My Attendance</h1>
      <p className="muted text-sm">July 2026</p>

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
                className="aspect-square rounded-lg border border-white/5 p-1 text-left sm:rounded-xl sm:p-1.5"
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
  const [type, setType] = useState("Casual");
  const [sent, setSent] = useState(false);
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Leave</h1>
      <p className="muted text-sm">Balance & requests</p>
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
          {sent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-emerald-300"
            >
              <CheckCircle2 size={18} /> Request submitted — pending manager
              approval.
            </motion.div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="muted mb-1 block text-xs">Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
                >
                  <option>Casual</option>
                  <option>Sick</option>
                  <option>Earned</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="muted mb-1 block text-xs">Days</span>
                <input
                  defaultValue={1}
                  type="number"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="muted mb-1 block text-xs">Reason</span>
                <input
                  placeholder="Reason…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none"
                />
              </label>
              <button
                onClick={() => setSent(true)}
                className="rounded-xl bg-indigo-500 py-2.5 font-medium text-white hover:bg-indigo-400 sm:col-span-2"
              >
                Submit request
              </button>
            </div>
          )}
        </Panel>
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
              <tr className="muted border-b border-white/5 text-left text-xs">
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
                  className="border-b border-white/5 last:border-0"
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
                    <button className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10">
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
