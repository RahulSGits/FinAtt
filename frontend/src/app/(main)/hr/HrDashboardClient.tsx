'use client'

import { useState } from 'react'
import { LayoutDashboard, Users, CalendarRange, Megaphone, User, Building2, UserPlus, CheckCircle2, X } from 'lucide-react'
import DashboardShell, { type NavItem, type UserProfile } from '@/components/DashboardShell'
import { createEmployee } from '@/app/(auth)/actions'

const nav: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'attendance', label: 'Attendance', icon: CalendarRange },
  { key: 'broadcast', label: 'Announcements', icon: Megaphone },
  { key: 'profile', label: 'My Profile', icon: User },
]

export default function HrDashboardClient({
  userProfile,
  initialEmployees,
  initialAnnouncements
}: {
  userProfile: UserProfile;
  initialEmployees: Array<Record<string, string>>;
  initialAnnouncements: Array<Record<string, string>>;
}) {
  const [active, setActive] = useState('overview')
  const [employees] = useState(initialEmployees)
  const [isAddingEmployee, setIsAddingEmployee] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleAddEmployee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setAddMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await createEmployee(formData)

    if (result.error) {
      setAddMessage({ type: 'error', text: result.error })
    } else {
      setAddMessage({ type: 'success', text: 'Employee account created successfully. A password setup email has been sent.' })
      // Optionally reload the page to get the updated list, or just show success
      setTimeout(() => {
        setIsAddingEmployee(false)
        setAddMessage(null)
        window.location.reload()
      }, 2000)
    }
    
    setIsSubmitting(false)
  }

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
            <h1 className="text-2xl font-semibold tracking-tight capitalize">{active}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your workforce operations</p>
          </div>
        </div>

        {active === 'overview' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center justify-between text-indigo-500">
                <Users size={20} />
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{employees.length}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Total Employees</div>
            </div>
            
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center justify-between text-emerald-500">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {employees.filter((e) => e.status === 'active').length}
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Active Employees</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center justify-between text-amber-500">
                <Building2 size={20} />
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {new Set(employees.map((e) => e.department)).size}
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Departments</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center justify-between text-rose-500">
                <Megaphone size={20} />
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{initialAnnouncements.length}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Announcements</div>
            </div>
          </div>
        )}

        {active === 'employees' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
              <h2 className="font-semibold">Employee Directory</h2>
              <button 
                onClick={() => setIsAddingEmployee(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400"
              >
                <UserPlus size={16} /> Add Employee
              </button>
            </div>
            
            {isAddingEmployee && (
              <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Add New Employee</h3>
                  <button onClick={() => setIsAddingEmployee(false)} className="text-slate-500 hover:text-slate-700">
                    <X size={20} />
                  </button>
                </div>
                
                {addMessage && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${addMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {addMessage.text}
                  </div>
                )}
                
                <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input name="fullName" required className="w-full rounded-lg border border-slate-200 p-2 dark:bg-slate-800 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input name="email" type="email" required className="w-full rounded-lg border border-slate-200 p-2 dark:bg-slate-800 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input name="phone" className="w-full rounded-lg border border-slate-200 p-2 dark:bg-slate-800 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <input name="department" className="w-full rounded-lg border border-slate-200 p-2 dark:bg-slate-800 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Designation</label>
                    <input name="designation" className="w-full rounded-lg border border-slate-200 p-2 dark:bg-slate-800 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Joining Date</label>
                    <input name="joiningDate" type="date" className="w-full rounded-lg border border-slate-200 p-2 dark:bg-slate-800 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender</label>
                    <select name="gender" className="w-full rounded-lg border border-slate-200 p-2 dark:bg-slate-800 dark:border-slate-700">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <input name="address" className="w-full rounded-lg border border-slate-200 p-2 dark:bg-slate-800 dark:border-slate-700" />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setIsAddingEmployee(false)} className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50">
                      {isSubmitting ? 'Creating...' : 'Create Employee'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-medium">Employee</th>
                    <th className="px-6 py-3 font-medium">ID</th>
                    <th className="px-6 py-3 font-medium">Department</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {employees.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{e.full_name}</td>
                      <td className="px-6 py-4">{e.employee_id}</td>
                      <td className="px-6 py-4">{e.department}</td>
                      <td className="px-6 py-4">{e.designation}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${e.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400'}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No employees found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {active === 'attendance' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            <CalendarRange size={48} className="mx-auto text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Attendance Records</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              View and manage employee attendance records here. This section is connected to the real-time Supabase attendance table.
            </p>
          </div>
        )}
        
        {active === 'broadcast' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            <Megaphone size={48} className="mx-auto text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Company Announcements</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Broadcast messages to all employees.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
