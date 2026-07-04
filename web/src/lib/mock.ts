// Typed in-memory data so the whole UI runs with no backend.
// Swap these for calls to the NestJS API later.

export type Role = "admin" | "hr" | "manager" | "employee";

export type Status = "present" | "absent" | "half" | "leave" | "off";

export interface Employee {
  id: string;
  name: string;
  code: string;
  avatarHue: number;
  department: string;
  designation: string;
  site: string;
  shift: string;
  status: "active" | "inactive";
  today: Status;
  checkIn?: string;
  checkOut?: string;
  monthPresent: number;
  monthHours: number;
  attendancePct: number;
  faceEnrolled: boolean;
}

export interface Site {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  employees: number;
}

export interface Shift {
  id: string;
  name: string;
  type: string;
  start: string;
  end: string;
  grace: number;
  minPresence: number;
  employees: number;
}

export interface LeaveRow {
  id: string;
  name: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

export const company = {
  name: "Acme Industries",
  slug: "ACME",
  plan: "Enterprise",
  employees: 1284,
  sites: 12,
  branches: 5,
};

export const kpis = {
  present: 1042,
  absent: 96,
  late: 58,
  onLeave: 88,
  overtimeHours: 214,
  avgHours: 8.1,
  headcount: 1284,
  attendanceRate: 87.4,
};

export const employees: Employee[] = [
  { id: "e1", name: "Asha Nair", code: "ACME-0421", avatarHue: 260, department: "Operations", designation: "Team Lead", site: "Head Office", shift: "Morning", status: "active", today: "present", checkIn: "09:04", monthPresent: 20, monthHours: 162, attendancePct: 96, faceEnrolled: true },
  { id: "e2", name: "Rahul Verma", code: "ACME-0422", avatarHue: 200, department: "Sales", designation: "Executive", site: "Head Office", shift: "Morning", status: "active", today: "present", checkIn: "08:58", monthPresent: 21, monthHours: 168, attendancePct: 98, faceEnrolled: true },
  { id: "e3", name: "Meera Iyer", code: "ACME-0423", avatarHue: 320, department: "Logistics", designation: "Coordinator", site: "Warehouse", shift: "Evening", status: "active", today: "half", checkIn: "14:10", monthPresent: 17, monthHours: 128, attendancePct: 81, faceEnrolled: true },
  { id: "e4", name: "David Chen", code: "ACME-0424", avatarHue: 150, department: "Engineering", designation: "Sr. Engineer", site: "Tech Park", shift: "Flexible", status: "active", today: "present", checkIn: "10:02", monthPresent: 19, monthHours: 158, attendancePct: 90, faceEnrolled: true },
  { id: "e5", name: "Sara Khan", code: "ACME-0425", avatarHue: 20, department: "HR", designation: "HR Manager", site: "Head Office", shift: "Morning", status: "active", today: "leave", monthPresent: 18, monthHours: 144, attendancePct: 86, faceEnrolled: true },
  { id: "e6", name: "Tom Wright", code: "ACME-0426", avatarHue: 45, department: "Finance", designation: "Analyst", site: "Head Office", shift: "Morning", status: "active", today: "absent", monthPresent: 15, monthHours: 120, attendancePct: 71, faceEnrolled: false },
  { id: "e7", name: "Priya Das", code: "ACME-0427", avatarHue: 285, department: "Operations", designation: "Executive", site: "Plant 2", shift: "Night", status: "active", today: "present", checkIn: "22:03", monthPresent: 22, monthHours: 176, attendancePct: 100, faceEnrolled: true },
  { id: "e8", name: "Leo Marti", code: "ACME-0428", avatarHue: 175, department: "Engineering", designation: "Engineer", site: "Tech Park", shift: "Flexible", status: "inactive", today: "off", monthPresent: 12, monthHours: 96, attendancePct: 60, faceEnrolled: true },
];

export const sites: Site[] = [
  { id: "s1", name: "Head Office", lat: 28.6139, lng: 77.209, radius: 150, employees: 512 },
  { id: "s2", name: "Warehouse", lat: 28.5355, lng: 77.391, radius: 250, employees: 208 },
  { id: "s3", name: "Tech Park", lat: 28.4595, lng: 77.0266, radius: 120, employees: 344 },
  { id: "s4", name: "Plant 2", lat: 28.7041, lng: 77.1025, radius: 300, employees: 220 },
];

export const shifts: Shift[] = [
  { id: "sh1", name: "Morning", type: "Fixed", start: "09:00", end: "17:00", grace: 10, minPresence: 50, employees: 640 },
  { id: "sh2", name: "Evening", type: "Fixed", start: "14:00", end: "22:00", grace: 10, minPresence: 50, employees: 280 },
  { id: "sh3", name: "Night", type: "Night", start: "22:00", end: "06:00", grace: 15, minPresence: 60, employees: 160 },
  { id: "sh4", name: "Flexible", type: "Flexible", start: "08:00", end: "20:00", grace: 30, minPresence: 40, employees: 204 },
];

export const leaves: LeaveRow[] = [
  { id: "l1", name: "Meera Iyer", type: "Casual", from: "10 Jul", to: "11 Jul", days: 2, reason: "Family function", status: "pending" },
  { id: "l2", name: "Sara Khan", type: "Sick", from: "03 Jul", to: "03 Jul", days: 1, reason: "Medical", status: "approved" },
  { id: "l3", name: "David Chen", type: "Earned", from: "18 Jul", to: "19 Jul", days: 2, reason: "Personal", status: "pending" },
  { id: "l4", name: "Tom Wright", type: "Casual", from: "22 Jul", to: "22 Jul", days: 1, reason: "Errand", status: "pending" },
];

// 14-day attendance trend for charts
export const trend = [
  { day: "Mon", present: 980, absent: 120, late: 60 },
  { day: "Tue", present: 1020, absent: 90, late: 44 },
  { day: "Wed", present: 1055, absent: 70, late: 51 },
  { day: "Thu", present: 1010, absent: 110, late: 66 },
  { day: "Fri", present: 1042, absent: 96, late: 58 },
  { day: "Sat", present: 610, absent: 40, late: 20 },
  { day: "Sun", present: 120, absent: 8, late: 4 },
];

export const deptSplit = [
  { name: "Operations", value: 320 },
  { name: "Engineering", value: 268 },
  { name: "Sales", value: 210 },
  { name: "Logistics", value: 186 },
  { name: "HR", value: 96 },
  { name: "Finance", value: 84 },
];

export const hoursByDept = [
  { dept: "Ops", hours: 162 },
  { dept: "Eng", hours: 158 },
  { dept: "Sales", hours: 168 },
  { dept: "Logi", hours: 128 },
  { dept: "HR", hours: 144 },
  { dept: "Fin", hours: 120 },
];

// Employee self view — calendar for the month
export type DayCell = { day: number; status: Status | "none"; hours?: string };
export function myMonth(): DayCell[] {
  const pattern: Status[] = ["present", "present", "half", "present", "absent", "leave", "present"];
  const cells: DayCell[] = [];
  for (let d = 1; d <= 31; d++) {
    const wd = new Date(2026, 6, d).getDay();
    if (wd === 0) {
      cells.push({ day: d, status: "off" });
      continue;
    }
    if (d > 24) {
      cells.push({ day: d, status: "none" });
      continue;
    }
    const s = pattern[d % pattern.length];
    cells.push({
      day: d,
      status: s,
      hours: s === "present" ? "8h 12m" : s === "half" ? "3h 40m" : undefined,
    });
  }
  return cells;
}

export const statusColor: Record<Status | "none", string> = {
  present: "#34d399",
  half: "#fbbf24",
  absent: "#f87171",
  leave: "#60a5fa",
  off: "#475569",
  none: "transparent",
};

export const demoAccounts: { role: Role; label: string; email: string }[] = [
  { role: "admin", label: "Company Admin", email: "admin@acme.io" },
  { role: "hr", label: "HR Manager", email: "hr@acme.io" },
  { role: "manager", label: "Manager", email: "manager@acme.io" },
  { role: "employee", label: "Employee", email: "asha@acme.io" },
];
