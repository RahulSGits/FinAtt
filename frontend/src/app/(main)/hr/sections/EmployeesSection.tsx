'use client'

import { useMemo, useState } from 'react'
import { Download, Pencil, ScanFace, Search, UserPlus, Users } from 'lucide-react'
import Modal from '@/components/Modal'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import {
  Alert,
  Avatar,
  EmptyState,
  PageHeader,
  Panel,
  Pill,
  Spinner,
} from '@/components/ui'
import { downloadCsv, formatDate, localDateKey, toCsv } from '@/lib/format'
import type { EmployeeWithAssignment, Shift, Site } from '@/lib/types'
import { createEmployee, resetFaceEnrollment, updateEmployee } from '../actions'

export default function EmployeesSection({
  employees,
  sites,
  shifts,
}: {
  employees: EmployeeWithAssignment[]
  sites: Site[]
  shifts: Shift[]
}) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<EmployeeWithAssignment | null>(null)
  const toast = useToast()
  const router = useRouter()

  const departments = useMemo(
    () =>
      Array.from(
        new Set(employees.map((e) => e.department).filter((d): d is string => Boolean(d))),
      ).sort(),
    [employees],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return employees.filter((e) => {
      if (department !== 'all' && e.department !== department) return false
      if (!q) return true
      return (
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employee_id.toLowerCase().includes(q) ||
        (e.designation ?? '').toLowerCase().includes(q)
      )
    })
  }, [employees, query, department])

  function exportCsv() {
    const csv = toCsv(
      ['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Site', 'Shift', 'Joined', 'Status', 'Face enrolled'],
      filtered.map((e) => [
        e.employee_id,
        e.full_name,
        e.email,
        e.phone ?? '',
        e.department ?? '',
        e.designation ?? '',
        e.sites?.name ?? '',
        e.shifts?.name ?? '',
        e.joining_date ?? '',
        e.status,
        e.face_descriptor ? 'Yes' : 'No',
      ]),
    )
    downloadCsv(`employees-${localDateKey()}.csv`, csv)
    toast.success(`Exported ${filtered.length} employees.`)
  }

  async function handleResetFace(employee: EmployeeWithAssignment) {
    const fd = new FormData()
    fd.set('id', employee.id)
    const res = await resetFaceEnrollment(fd)
    if (res.ok) {
      toast.success(`${employee.full_name} can now re-enroll their face.`)
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} on the roster`}
        action={
          <div className="flex gap-2">
            <button onClick={exportCsv} disabled={filtered.length === 0} className="btn btn-ghost btn-sm">
              <Download size={15} /> Export
            </button>
            <button onClick={() => setAdding(true)} className="btn btn-primary btn-sm">
              <UserPlus size={15} /> Add employee
            </button>
          </div>
        }
      />

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap gap-2 border-b border-[var(--border)] p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={15}
              className="muted pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, ID, email or role"
              aria-label="Search employees"
              className="field pl-9"
            />
          </div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Filter by department"
            className="field w-auto min-w-[150px]"
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={30} />}
            title={employees.length === 0 ? 'No employees yet' : 'No matches'}
            description={
              employees.length === 0
                ? 'Invite your first employee to get started.'
                : 'Try a different search term or department.'
            }
            action={
              employees.length === 0 && (
                <button onClick={() => setAdding(true)} className="btn btn-primary btn-sm">
                  <UserPlus size={15} /> Add employee
                </button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Site / Shift</th>
                  <th>Face</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={e.full_name} size={32} />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{e.full_name}</div>
                          <div className="muted truncate text-xs">{e.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{e.employee_id}</td>
                    <td>
                      <div>{e.department || '—'}</div>
                      <div className="muted text-xs">{e.designation || '—'}</div>
                    </td>
                    <td>
                      <div className="text-xs">{e.sites?.name ?? 'Unassigned'}</div>
                      <div className="muted text-xs">{e.shifts?.name ?? 'No shift'}</div>
                    </td>
                    <td>
                      {e.face_descriptor ? (
                        <Pill tone="var(--success)">Enrolled</Pill>
                      ) : (
                        <Pill tone="var(--warning)">Pending</Pill>
                      )}
                    </td>
                    <td>
                      <Pill tone={e.status === 'active' ? 'var(--success)' : 'var(--text-muted)'}>
                        {e.status}
                      </Pill>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(e)}
                          aria-label={`Edit ${e.full_name}`}
                          className="muted touch-target rounded-lg transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] cursor-pointer"
                        >
                          <Pencil size={15} />
                        </button>
                        {e.face_descriptor && (
                          <button
                            onClick={() => handleResetFace(e)}
                            aria-label={`Reset face enrollment for ${e.full_name}`}
                            title="Reset face enrollment"
                            className="muted touch-target rounded-lg transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] cursor-pointer"
                          >
                            <ScanFace size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add employee"
        description="An invite email is sent so they can set their own password."
        size="lg"
      >
        <EmployeeForm
          sites={sites}
          shifts={shifts}
          onDone={() => setAdding(false)}
          mode="create"
        />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.full_name ?? ''}`}
        size="lg"
      >
        {editing && (
          <EmployeeForm
            key={editing.id}
            employee={editing}
            sites={sites}
            shifts={shifts}
            onDone={() => setEditing(null)}
            mode="edit"
          />
        )}
      </Modal>
    </>
  )
}

function EmployeeForm({
  employee,
  sites,
  shifts,
  onDone,
  mode,
}: {
  employee?: EmployeeWithAssignment
  sites: Site[]
  shifts: Shift[]
  onDone: () => void
  mode: 'create' | 'edit'
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    if (employee) fd.set('id', employee.id)

    const res = mode === 'create' ? await createEmployee(fd) : await updateEmployee(fd)

    if (res.ok) {
      toast.success(mode === 'create' ? 'Invite sent.' : 'Employee updated.')
      onDone()
      router.refresh()
    } else {
      setError(res.error)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" name="fullName" required defaultValue={employee?.full_name} />
        {mode === 'create' ? (
          <Field label="Email" name="email" type="email" required />
        ) : (
          <div>
            <span className="label">Email</span>
            <input value={employee?.email ?? ''} disabled className="field" />
          </div>
        )}
        <Field label="Phone" name="phone" type="tel" defaultValue={employee?.phone ?? ''} />
        <Field
          label="Department"
          name="department"
          defaultValue={employee?.department ?? ''}
        />
        <Field
          label="Designation"
          name="designation"
          defaultValue={employee?.designation ?? ''}
        />
        {mode === 'create' ? (
          <Field label="Joining date" name="joiningDate" type="date" />
        ) : (
          <div>
            <span className="label">Joined</span>
            <input
              value={employee?.joining_date ? formatDate(employee.joining_date) : '—'}
              disabled
              className="field"
            />
          </div>
        )}

        <div>
          <label className="label" htmlFor="ef-gender">
            Gender
          </label>
          <select
            id="ef-gender"
            name="gender"
            defaultValue={employee?.gender ?? ''}
            className="field"
          >
            <option value="">Prefer not to say</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {mode === 'edit' && (
          <div>
            <label className="label" htmlFor="ef-status">
              Status
            </label>
            <select
              id="ef-status"
              name="status"
              defaultValue={employee?.status ?? 'active'}
              className="field"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        )}

        <div>
          <label className="label" htmlFor="ef-site">
            Work site
          </label>
          <select
            id="ef-site"
            name="siteId"
            defaultValue={employee?.site_id ?? ''}
            className="field"
          >
            <option value="">Unassigned</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="ef-shift">
            Shift
          </label>
          <select
            id="ef-shift"
            name="shiftId"
            defaultValue={employee?.shift_id ?? ''}
            className="field"
          >
            <option value="">Unassigned</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="ef-address">
          Address
        </label>
        <textarea
          id="ef-address"
          name="address"
          rows={2}
          defaultValue={employee?.address ?? ''}
          className="field resize-y"
        />
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className="btn btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting && <Spinner size={16} />}
          {mode === 'create' ? 'Send invite' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  defaultValue?: string
}) {
  const id = `ef-${name}`
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
        {required && <span aria-hidden> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="field"
      />
    </div>
  )
}
