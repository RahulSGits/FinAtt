'use client'

import { useState } from 'react'
import { LayoutDashboard, CalendarRange, Megaphone, User, CalendarCheck } from 'lucide-react'
import DashboardShell, { type NavItem, type UserProfile } from '@/components/DashboardShell'

const nav: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'attendance', label: 'My Attendance', icon: CalendarRange },
  { key: 'leaves', label: 'My Leaves', icon: CalendarCheck },
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
  { key: 'profile', label: 'My Profile', icon: User },
]

export default function EmployeeDashboardClient({
  userProfile,
  employeeData,
  initialAnnouncements
}: {
  userProfile: UserProfile;
  employeeData: Record<string, string>;
  initialAnnouncements: Array<{ id: string, title: string, description: string }>;
}) {
  const [active, setActive] = useState('overview')

  return (
    <DashboardShell
      nav={nav}
      active={active}
      onSelect={setActive}
      userProfile={userProfile}
    >
      <div className="space-y-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {active === 'overview' ? `Welcome back, ${userProfile.name}` : <span className="capitalize">{active}</span>}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {active === 'overview' ? 'Here is your daily summary' : `Manage your ${active}`}
            </p>
          </div>
        </div>

        {active === 'overview' && (
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">Today&apos;s Status</div>
                <div className="text-xl font-semibold text-slate-900 dark:text-white">
                  Not Checked In
                </div>
                <button className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500">
                  Check In Now
                </button>
              </div>
              
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:col-span-2">
                <div className="mb-4 text-sm font-medium text-slate-900 dark:text-white">Recent Announcements</div>
                {initialAnnouncements.length > 0 ? (
                  <ul className="space-y-3">
                    {initialAnnouncements.map((ann) => (
                      <li key={ann.id} className="text-sm">
                        <span className="font-semibold">{ann.title}</span> - <span className="text-slate-500">{ann.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No new announcements.</p>
                )}
              </div>
            </div>
            
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
               <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">My Information</h2>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                 <div>
                   <div className="text-slate-500 dark:text-slate-400 mb-1">Employee ID</div>
                   <div className="font-medium text-slate-900 dark:text-white">{employeeData?.employee_id || 'N/A'}</div>
                 </div>
                 <div>
                   <div className="text-slate-500 dark:text-slate-400 mb-1">Department</div>
                   <div className="font-medium text-slate-900 dark:text-white">{employeeData?.department || 'N/A'}</div>
                 </div>
                 <div>
                   <div className="text-slate-500 dark:text-slate-400 mb-1">Designation</div>
                   <div className="font-medium text-slate-900 dark:text-white">{employeeData?.designation || 'N/A'}</div>
                 </div>
                 <div>
                   <div className="text-slate-500 dark:text-slate-400 mb-1">Joining Date</div>
                   <div className="font-medium text-slate-900 dark:text-white">{employeeData?.joining_date || 'N/A'}</div>
                 </div>
               </div>
            </div>
          </div>
        )}

        {active === 'attendance' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            <CalendarRange size={48} className="mx-auto text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">My Attendance</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              View your check-in and check-out history here.
            </p>
          </div>
        )}
        
        {active === 'leaves' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            <CalendarCheck size={48} className="mx-auto text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Leave Requests</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Apply for leaves and track their status.
            </p>
          </div>
        )}

        {active === 'profile' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            <User size={48} className="mx-auto text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">My Profile</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Update your personal information and profile picture.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
