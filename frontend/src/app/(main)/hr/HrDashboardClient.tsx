'use client'

import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import {
  Building2,
  CalendarCheck,
  CalendarRange,
  Clock,
  LayoutDashboard,
  MapPin,
  Megaphone,
  ScanFace,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import DashboardShell, {
  type NavItem,
  type Notification,
  type UserProfile,
} from '@/components/DashboardShell'
import LiveClock from '@/components/LiveClock'
import {
  AttendanceTrend,
  DepartmentBars,
  StatusDonut,
} from '@/components/charts/LazyCharts'
import {
  Alert,
  Avatar,
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  staggerContainer,
} from '@/components/ui'
import { formatTime, localDateKey, relativeTime } from '@/lib/format'
import type {
  Announcement,
  AttendanceStatus,
  AttendanceWithEmployee,
  EmployeeWithAssignment,
  LeaveWithEmployee,
  Shift,
  Site,
} from '@/lib/types'
import EmployeesSection from './sections/EmployeesSection'
import AttendanceSection from './sections/AttendanceSection'
import LeavesSection from './sections/LeavesSection'
import AnnouncementsSection from './sections/AnnouncementsSection'
import SitesSection from './sections/SitesSection'
import ShiftsSection from './sections/ShiftsSection'

export default function HrDashboardClient({
  userProfile,
  employees,
  attendance,
  leaves,
  announcements,
  sites,
  shifts,
  loadError,
}: {
  userProfile: UserProfile
  employees: EmployeeWithAssignment[]
  attendance: AttendanceWithEmployee[]
  leaves: LeaveWithEmployee[]
  announcements: Announcement[]
  sites: Site[]
  shifts: Shift[]
  loadError: string | null
}) {
  const [active, setActive] = useState('overview')

  const today = localDateKey()
  const todayRecords = useMemo(
    () => attendance.filter((a) => a.date === today),
    [attendance, today],
  )

  const pendingLeaves = leaves.filter((l) => l.status === 'pending').length

  const stats = useMemo(() => {
    const activeStaff = employees.filter((e) => e.status === 'active').length
    const presentToday = todayRecords.filter(
      (a) => a.status === 'present' || a.status === 'half' || a.status === 'pending',
    ).length
    const lateToday = todayRecords.filter((a) => a.is_late).length
    const enrolled = employees.filter((e) => e.face_descriptor).length

    return {
      headcount: employees.length,
      activeStaff,
      presentToday,
      lateToday,
      enrolled,
      presentRate: activeStaff === 0 ? 0 : (presentToday / activeStaff) * 100,
    }
  }, [employees, todayRecords])

  /** Last 14 days of present/absent/late counts for the trend chart. */
  const trend = useMemo(() => {
    const days: { date: string; present: number; absent: number; late: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = localDateKey(d)
      const rows = attendance.filter((a) => a.date === key)
      days.push({
        date: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        present: rows.filter((a) => a.status === 'present' || a.status === 'half').length,
        absent: rows.filter((a) => a.status === 'absent').length,
        late: rows.filter((a) => a.is_late).length,
      })
    }
    return days
  }, [attendance])

  const departmentData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of employees) {
      const key = e.department?.trim() || 'Unassigned'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts, ([department, headcount]) => ({ department, headcount }))
      .sort((a, b) => b.headcount - a.headcount)
      .slice(0, 8)
  }, [employees])

  const statusData = useMemo(() => {
    const counts = new Map<AttendanceStatus, number>()
    for (const a of attendance) counts.set(a.status, (counts.get(a.status) ?? 0) + 1)
    return Array.from(counts, ([status, count]) => ({ status, count })).sort(
      (a, b) => b.count - a.count,
    )
  }, [attendance])

  const notifications = useMemo<Notification[]>(() => {
    const leaveNotifs = leaves
      .filter((l) => l.status === 'pending')
      .slice(0, 6)
      .map((l) => ({
        id: `leave-${l.id}`,
        title: 'Leave request awaiting approval',
        body: `${l.employees?.full_name ?? 'An employee'} requested ${l.leave_type} leave`,
        createdAt: l.created_at,
      }))

    const unenrolled = employees.filter((e) => !e.face_descriptor && e.status === 'active')
    const enrollNotif: Notification[] =
      unenrolled.length > 0
        ? [
            {
              id: 'face-pending',
              title: `${unenrolled.length} employee${unenrolled.length === 1 ? '' : 's'} not enrolled`,
              body: 'They cannot check in until they register their face.',
              createdAt: new Date().toISOString(),
            },
          ]
        : []

    return [...leaveNotifs, ...enrollNotif].slice(0, 8)
  }, [leaves, employees])

  const nav: NavItem[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'attendance', label: 'Attendance', icon: CalendarRange },
    { key: 'leaves', label: 'Leave requests', icon: CalendarCheck, badge: pendingLeaves },
    { key: 'announcements', label: 'Announcements', icon: Megaphone },
    { key: 'sites', label: 'Work sites', icon: MapPin },
    { key: 'shifts', label: 'Shifts', icon: Clock },
  ]

  return (
    <DashboardShell
      nav={nav}
      active={active}
      onSelect={setActive}
      userProfile={userProfile}
      notifications={notifications}
    >
      {loadError && (
        <div className="mb-4">
          <Alert tone="error">
            Data could not be loaded: {loadError}. If this mentions infinite recursion,
            the RLS migration has not been applied to your Supabase project yet.
          </Alert>
        </div>
      )}

      {active === 'overview' && (
        <>
          <PageHeader title="Overview" subtitle={<LiveClock />} />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatCard
              label="Headcount"
              value={stats.headcount}
              icon={<Users size={17} />}
              tone="var(--primary)"
              sub={`${stats.activeStaff} active`}
            />
            <StatCard
              label="In today"
              value={stats.presentToday}
              icon={<UserCheck size={17} />}
              tone="var(--success)"
              sub={`${stats.lateToday} late`}
            />
            <StatCard
              label="Attendance rate"
              value={stats.presentRate}
              decimals={0}
              suffix="%"
              icon={<TrendingUp size={17} />}
              tone="var(--accent)"
              sub="of active staff"
            />
            <StatCard
              label="Face enrolled"
              value={stats.enrolled}
              icon={<ScanFace size={17} />}
              tone="var(--info)"
              sub={`of ${stats.headcount} employees`}
            />
          </motion.div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Panel
              title="Attendance trend"
              subtitle="Last 14 days"
              className="xl:col-span-2"
            >
              <AttendanceTrend data={trend} />
            </Panel>

            <Panel title="Status mix" subtitle="All loaded records">
              <StatusDonut data={statusData} />
            </Panel>

            <Panel title="Headcount by department" className="xl:col-span-1">
              <DepartmentBars data={departmentData} />
            </Panel>

            <Panel title="Today's activity" className="xl:col-span-2" bodyClassName="p-0">
              {todayRecords.length === 0 ? (
                <EmptyState
                  icon={<CalendarRange size={30} />}
                  title="Nobody has checked in yet"
                  description="Check-ins recorded today will appear here in real time."
                />
              ) : (
                <div className="table-wrap max-h-[320px] overflow-y-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Status</th>
                        <th>In</th>
                        <th>Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayRecords.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={a.employees?.full_name ?? '?'} size={28} />
                              <span className="truncate font-medium">
                                {a.employees?.full_name ?? 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={a.status} />
                          </td>
                          <td className="tabular-nums">{formatTime(a.check_in)}</td>
                          <td className="tabular-nums">{formatTime(a.check_out)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel
              title="Pending approvals"
              action={
                pendingLeaves > 0 && (
                  <button
                    onClick={() => setActive('leaves')}
                    className="text-xs font-medium text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    Review
                  </button>
                )
              }
              bodyClassName="p-0"
            >
              {pendingLeaves === 0 ? (
                <EmptyState
                  icon={<CalendarCheck size={28} />}
                  title="Nothing to approve"
                />
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {leaves
                    .filter((l) => l.status === 'pending')
                    .slice(0, 5)
                    .map((l) => (
                      <li key={l.id} className="flex items-center gap-2.5 px-4 py-2.5">
                        <Avatar name={l.employees?.full_name ?? '?'} size={28} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {l.employees?.full_name ?? 'Unknown'}
                          </div>
                          <div className="muted truncate text-xs">
                            {l.leave_type} · {relativeTime(l.created_at)}
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </Panel>

            <Panel title="Infrastructure" bodyClassName="p-4">
              <dl className="space-y-3 text-sm">
                <InfraRow
                  icon={<MapPin size={15} />}
                  label="Work sites"
                  value={`${sites.length} configured`}
                  onClick={() => setActive('sites')}
                />
                <InfraRow
                  icon={<Clock size={15} />}
                  label="Shifts"
                  value={`${shifts.length} defined`}
                  onClick={() => setActive('shifts')}
                />
                <InfraRow
                  icon={<Building2 size={15} />}
                  label="Departments"
                  value={`${departmentData.length} in use`}
                />
                <InfraRow
                  icon={<Megaphone size={15} />}
                  label="Announcements"
                  value={`${announcements.length} live`}
                  onClick={() => setActive('announcements')}
                />
              </dl>
            </Panel>
          </div>
        </>
      )}

      {active === 'employees' && (
        <EmployeesSection employees={employees} sites={sites} shifts={shifts} />
      )}
      {active === 'attendance' && (
        <AttendanceSection attendance={attendance} employees={employees} />
      )}
      {active === 'leaves' && <LeavesSection leaves={leaves} />}
      {active === 'announcements' && <AnnouncementsSection announcements={announcements} />}
      {active === 'sites' && <SitesSection sites={sites} />}
      {active === 'shifts' && <ShiftsSection shifts={shifts} />}
    </DashboardShell>
  )
}

function InfraRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onClick?: () => void
}) {
  const content = (
    <>
      <dt className="muted flex items-center gap-2">
        {icon}
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </>
  )

  if (!onClick) {
    return <div className="flex items-center justify-between gap-2">{content}</div>
  }

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-[var(--surface-2)] cursor-pointer"
    >
      {content}
    </button>
  )
}
