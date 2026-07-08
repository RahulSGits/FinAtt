// Typed in-memory data so the whole UI runs with no backend.
// Two management roles: `admin` = platform developer (SaaS billing),
// `hr` = company head (employees, payroll, attendance). `employee` = user.

export type Role = "admin" | "hr" | "employee";

export type Status = "present" | "absent" | "half" | "leave" | "off";

export const INR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

/** "09:00" -> "9:00 AM", "17:30" -> "5:30 PM". */
export const to12h = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
};

// The client company shown in HR & employee views.
export const company = {
  name: "geoSelfie",
  slug: "GEO",
  plan: "Pro",
  price: 1999,
  employees: 42,
  sites: 4,
  branches: 2,
};

// ---------------------------------------------------------------------------
// Employees (client-company staff)
// ---------------------------------------------------------------------------

export interface Employee {
  id: string;
  name: string;
  memberId: string;
  avatarHue: number;
  department: string;
  designation: string;
  site: string;
  shift: string;
  status: "active" | "inactive";
  today: Status;
  checkIn?: string;
  monthPresent: number;
  monthHours: number;
  attendancePct: number;
  faceEnrolled: boolean;
  salary: number; // monthly gross ₹
  week: Status[]; // last 7 days
}

const wk = (s: string): Status[] =>
  s.split("").map((c) =>
    c === "P" ? "present" : c === "H" ? "half" : c === "A" ? "absent" : c === "L" ? "leave" : "off",
  );

export const employees: Employee[] = [
  { id: "e1", name: "Asha Nair", memberId: "GEO-0421", avatarHue: 260, department: "Operations", designation: "Team Lead", site: "Head Office", shift: "Morning", status: "active", today: "present", checkIn: "09:04", monthPresent: 20, monthHours: 162, attendancePct: 96, faceEnrolled: true, salary: 68000, week: wk("PPHPAOP") },
  { id: "e2", name: "Rahul Verma", memberId: "GEO-0422", avatarHue: 200, department: "Sales", designation: "Executive", site: "Head Office", shift: "Morning", status: "active", today: "present", checkIn: "08:58", monthPresent: 21, monthHours: 168, attendancePct: 98, faceEnrolled: true, salary: 54000, week: wk("PPPPPOP") },
  { id: "e3", name: "Meera Iyer", memberId: "GEO-0423", avatarHue: 320, department: "Logistics", designation: "Coordinator", site: "Warehouse", shift: "Evening", status: "active", today: "half", checkIn: "14:10", monthPresent: 17, monthHours: 128, attendancePct: 81, faceEnrolled: true, salary: 46000, week: wk("PHPAPOH") },
  { id: "e4", name: "David Chen", memberId: "GEO-0424", avatarHue: 150, department: "Engineering", designation: "Sr. Engineer", site: "Tech Park", shift: "Flexible", status: "active", today: "present", checkIn: "10:02", monthPresent: 19, monthHours: 158, attendancePct: 90, faceEnrolled: true, salary: 96000, week: wk("PPPHPOP") },
  { id: "e5", name: "Sara Khan", memberId: "GEO-0425", avatarHue: 20, department: "HR", designation: "HR Executive", site: "Head Office", shift: "Morning", status: "active", today: "leave", monthPresent: 18, monthHours: 144, attendancePct: 86, faceEnrolled: true, salary: 58000, week: wk("PPLLPOP") },
  { id: "e6", name: "Tom Wright", memberId: "GEO-0426", avatarHue: 45, department: "Finance", designation: "Analyst", site: "Head Office", shift: "Morning", status: "active", today: "absent", monthPresent: 15, monthHours: 120, attendancePct: 71, faceEnrolled: false, salary: 52000, week: wk("PAPAPOA") },
  { id: "e7", name: "Priya Das", memberId: "GEO-0427", avatarHue: 285, department: "Operations", designation: "Executive", site: "Plant 2", shift: "Night", status: "active", today: "present", checkIn: "22:03", monthPresent: 22, monthHours: 176, attendancePct: 100, faceEnrolled: true, salary: 49000, week: wk("PPPPPOP") },
  { id: "e8", name: "Leo Martin", memberId: "GEO-0428", avatarHue: 175, department: "Engineering", designation: "Engineer", site: "Tech Park", shift: "Flexible", status: "inactive", today: "off", monthPresent: 12, monthHours: 96, attendancePct: 60, faceEnrolled: true, salary: 72000, week: wk("POOAPOO") },
];

export const kpis = {
  present: 34,
  absent: 4,
  late: 3,
  onLeave: 3,
  overtimeHours: 46,
  avgHours: 8.1,
  headcount: 42,
  attendanceRate: 90.5,
};

// Monthly payroll derived from employees.
export interface PayrollRow {
  id: string;
  name: string;
  memberId: string;
  department: string;
  base: number;
  deductions: number;
  net: number;
  status: "paid" | "pending";
}

export const payroll: PayrollRow[] = employees.map((e, i) => {
  const deductions = Math.round(e.salary * 0.12);
  return {
    id: e.id,
    name: e.name,
    memberId: e.memberId,
    department: e.department,
    base: e.salary,
    deductions,
    net: e.salary - deductions,
    status: i % 4 === 0 ? "pending" : "paid",
  };
});

export const payrollTotal = payroll.reduce((s, p) => s + p.net, 0);

// ---------------------------------------------------------------------------
// Developer / platform (Admin) — SaaS billing
// ---------------------------------------------------------------------------

export interface Tenant {
  id: string;
  name: string;
  owner: string;
  seats: number;
  activeUsers: number;
  monthly: number; // ₹ per month
  status: "active" | "overdue" | "trial";
  since: string;
  nextBilling: string;
}

export const PRICE = 2999;
/** Six-month plan bills 6 months up front with a 20% discount. */
export const SIX_MONTH = Math.round(PRICE * 6 * 0.8);
/** Twelve-month plan bills 12 months up front with a 40% discount. */
export const TWELVE_MONTH = Math.round(PRICE * 12 * 0.6);

/** Whether an employee works from office or remotely (derived for the demo). */
export const workMode = (e: Employee): "office" | "remote" =>
  e.shift === "Flexible" || e.department === "Engineering" ? "remote" : "office";

export const tenants: Tenant[] = [
  { id: "t1", name: "geoSelfie (Acme HR)", owner: "Priya Menon", seats: 50, activeUsers: 42, monthly: PRICE, status: "active", since: "Jan 2026", nextBilling: "01 Aug" },
  { id: "t2", name: "Nimbus Retail", owner: "K. Rao", seats: 120, activeUsers: 98, monthly: PRICE, status: "active", since: "Feb 2026", nextBilling: "05 Aug" },
  { id: "t3", name: "Orbit Logistics", owner: "S. Fernandes", seats: 80, activeUsers: 61, monthly: PRICE, status: "overdue", since: "Nov 2025", nextBilling: "overdue" },
  { id: "t4", name: "BlueLeaf Cafe", owner: "M. Shaikh", seats: 25, activeUsers: 19, monthly: PRICE, status: "active", since: "Mar 2026", nextBilling: "12 Aug" },
  { id: "t5", name: "Vertex Labs", owner: "A. Kapoor", seats: 60, activeUsers: 55, monthly: PRICE, status: "trial", since: "Jun 2026", nextBilling: "trial ends 09 Jul" },
  { id: "t6", name: "Pinnacle Mfg.", owner: "R. Iyer", seats: 200, activeUsers: 176, monthly: PRICE, status: "active", since: "Sep 2025", nextBilling: "03 Aug" },
];

export const activeTenants = tenants.filter((t) => t.status === "active");
export const mrr = activeTenants.length * PRICE;

export interface Payment {
  id: string;
  company: string;
  amount: number;
  date: string;
  method: string;
  status: "paid" | "failed" | "pending";
}

export const payments: Payment[] = [
  { id: "p1", company: "Pinnacle Mfg.", amount: PRICE, date: "03 Jul 2026", method: "UPI", status: "paid" },
  { id: "p2", company: "Nimbus Retail", amount: PRICE, date: "05 Jul 2026", method: "Card", status: "paid" },
  { id: "p3", company: "geoSelfie (Acme HR)", amount: PRICE, date: "01 Jul 2026", method: "UPI", status: "paid" },
  { id: "p4", company: "Orbit Logistics", amount: PRICE, date: "02 Jul 2026", method: "Card", status: "failed" },
  { id: "p5", company: "BlueLeaf Cafe", amount: PRICE, date: "12 Jul 2026", method: "NetBanking", status: "paid" },
];

export const revenueTrend = [
  { month: "Feb", revenue: 3998 },
  { month: "Mar", revenue: 5997 },
  { month: "Apr", revenue: 7996 },
  { month: "May", revenue: 9995 },
  { month: "Jun", revenue: 9995 },
  { month: "Jul", revenue: mrr },
];

export const planSplit = [
  { name: "Active", value: activeTenants.length },
  { name: "Trial", value: tenants.filter((t) => t.status === "trial").length },
  { name: "Overdue", value: tenants.filter((t) => t.status === "overdue").length },
];

export const activityFeed = [
  { who: "Nimbus Retail", what: "added 6 employees", when: "12m ago" },
  { who: "Pinnacle Mfg.", what: "ran monthly payroll", when: "40m ago" },
  { who: "geoSelfie (Acme HR)", what: "approved 3 leave requests", when: "1h ago" },
  { who: "BlueLeaf Cafe", what: "configured a new geofence", when: "2h ago" },
  { who: "Vertex Labs", what: "started a Pro trial", when: "5h ago" },
];

// ---------------------------------------------------------------------------
// Org config (HR)
// ---------------------------------------------------------------------------

export interface Site { id: string; name: string; lat: number; lng: number; radius: number; employees: number; }
export const sites: Site[] = [
  { id: "s1", name: "Head Office", lat: 28.6139, lng: 77.209, radius: 150, employees: 20 },
  { id: "s2", name: "Warehouse", lat: 28.5355, lng: 77.391, radius: 250, employees: 8 },
  { id: "s3", name: "Tech Park", lat: 28.4595, lng: 77.0266, radius: 120, employees: 9 },
  { id: "s4", name: "Plant 2", lat: 28.7041, lng: 77.1025, radius: 300, employees: 5 },
];

export interface Shift { id: string; name: string; type: string; start: string; end: string; grace: number; minPresence: number; employees: number; }
export const shifts: Shift[] = [
  { id: "sh1", name: "Morning", type: "Fixed", start: "09:00", end: "17:00", grace: 10, minPresence: 50, employees: 22 },
  { id: "sh2", name: "Evening", type: "Fixed", start: "14:00", end: "22:00", grace: 10, minPresence: 50, employees: 8 },
  { id: "sh3", name: "Night", type: "Night", start: "22:00", end: "06:00", grace: 15, minPresence: 60, employees: 6 },
  { id: "sh4", name: "Flexible", type: "Flexible", start: "08:00", end: "20:00", grace: 30, minPresence: 40, employees: 6 },
];

export interface LeaveRow { id: string; name: string; type: string; from: string; to: string; days: number; reason: string; status: "pending" | "approved" | "rejected"; }
export const leaves: LeaveRow[] = [
  { id: "l1", name: "Meera Iyer", type: "Casual", from: "10 Jul", to: "11 Jul", days: 2, reason: "Family function", status: "pending" },
  { id: "l2", name: "Sara Khan", type: "Sick", from: "03 Jul", to: "03 Jul", days: 1, reason: "Medical", status: "approved" },
  { id: "l3", name: "David Chen", type: "Earned", from: "18 Jul", to: "19 Jul", days: 2, reason: "Personal", status: "pending" },
  { id: "l4", name: "Tom Wright", type: "Casual", from: "22 Jul", to: "22 Jul", days: 1, reason: "Errand", status: "pending" },
];

export const trend = [
  { day: "Mon", present: 31, absent: 6, late: 3 },
  { day: "Tue", present: 35, absent: 4, late: 2 },
  { day: "Wed", present: 37, absent: 3, late: 3 },
  { day: "Thu", present: 33, absent: 5, late: 4 },
  { day: "Fri", present: 34, absent: 4, late: 3 },
  { day: "Sat", present: 21, absent: 2, late: 1 },
  { day: "Sun", present: 4, absent: 0, late: 0 },
];

export const deptSplit = [
  { name: "Operations", value: 12 },
  { name: "Engineering", value: 9 },
  { name: "Sales", value: 8 },
  { name: "Logistics", value: 6 },
  { name: "HR", value: 4 },
  { name: "Finance", value: 3 },
];

// ---------------------------------------------------------------------------
// Employee self view
// ---------------------------------------------------------------------------

export type DayCell = { day: number; status: Status | "none"; hours?: string };
export function myMonth(): DayCell[] {
  const pattern: Status[] = ["present", "present", "half", "present", "absent", "leave", "present"];
  const cells: DayCell[] = [];
  for (let d = 1; d <= 31; d++) {
    const wd = new Date(2026, 6, d).getDay();
    if (wd === 0) { cells.push({ day: d, status: "off" }); continue; }
    if (d > 24) { cells.push({ day: d, status: "none" }); continue; }
    const s = pattern[d % pattern.length];
    cells.push({ day: d, status: s, hours: s === "present" ? "8h 12m" : s === "half" ? "3h 40m" : undefined });
  }
  return cells;
}

export const mySalarySlips = [
  { month: "June 2026", gross: 68000, deductions: 8160, net: 59840, status: "paid" as const },
  { month: "May 2026", gross: 68000, deductions: 8160, net: 59840, status: "paid" as const },
  { month: "April 2026", gross: 66000, deductions: 7920, net: 58080, status: "paid" as const },
  { month: "March 2026", gross: 66000, deductions: 7920, net: 58080, status: "paid" as const },
];

export const statusColor: Record<Status | "none", string> = {
  present: "#34d399",
  half: "#fbbf24",
  absent: "#f87171",
  leave: "#60a5fa",
  off: "#475569",
  none: "transparent",
};

export const demoAccounts: { role: Role; label: string; email: string; name: string }[] = [
  { role: "admin", label: "Developer · Admin", email: "rahul@geoselfie.app", name: "Rahul" },
  { role: "hr", label: "HR · Company Head", email: "priya@geoselfie.app", name: "Priya Menon" },
  { role: "employee", label: "Employee", email: "asha@geoselfie.app", name: "Asha Nair" },
];
