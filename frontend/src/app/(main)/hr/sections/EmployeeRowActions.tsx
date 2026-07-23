'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, RotateCcw, ScanFace, Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { Alert, Pill, Spinner } from '@/components/ui'
import { faceAttemptsLeft, MAX_FACE_ENROLL_ATTEMPTS } from '@/lib/types'
import type { EmployeeWithAssignment } from '@/lib/types'
import {
  deleteEmployee,
  getEmployeeImpact,
  resetFaceEnrollment,
  type EmployeeImpact,
} from '../actions'

/**
 * The Face column: enrollment state, and the re-register control for it.
 *
 * Re-registering lives here rather than in the actions column because it acts
 * on this cell's value — and because a bare icon in a row of icons is easy to
 * hit by mistake, which silently locks someone out of check-in.
 */
export function FaceCell({ employee }: { employee: EmployeeWithAssignment }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toast = useToast()
  const router = useRouter()

  const enrolled = Boolean(employee.face_descriptor)
  const left = faceAttemptsLeft(employee)
  const locked = left === 0

  async function handleReset() {
    setBusy(true)
    setError(null)

    const fd = new FormData()
    fd.set('id', employee.id)
    const res = await resetFaceEnrollment(fd)

    if (res.ok) {
      toast.success(
        `${employee.full_name} can register again — ${MAX_FACE_ENROLL_ATTEMPTS} attempts granted.`,
      )
      setConfirm(false)
      router.refresh()
    } else {
      setError(res.error)
    }
    setBusy(false)
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        {enrolled ? (
          <Pill tone="var(--success)">Enrolled</Pill>
        ) : locked ? (
          <Pill tone="var(--danger)">Locked</Pill>
        ) : (
          <Pill tone="var(--warning)">Pending</Pill>
        )}

        {/* Granting is only meaningful once they have enrolled or run out. */}
        {(enrolled || locked) && (
          <button
            onClick={() => setConfirm(true)}
            aria-label={`Grant another face registration to ${employee.full_name}`}
            title={locked ? 'Grant another attempt' : 'Reset and grant a fresh attempt'}
            className="muted inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] cursor-pointer"
          >
            <RotateCcw size={12} />
            {locked ? 'Grant' : 'Re-register'}
          </button>
        )}

        {!locked && (
          <span className="muted text-[10px] tabular-nums" title="Registration attempts left">
            {left}/{MAX_FACE_ENROLL_ATTEMPTS}
          </span>
        )}
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={locked ? 'Grant another registration?' : 'Re-register face?'}
        description={employee.full_name}
        size="sm"
      >
        <div className="space-y-3">
          <Alert tone="warning">
            The stored face template is deleted and their attempt allowance resets to{' '}
            {MAX_FACE_ENROLL_ATTEMPTS}. They will <strong>not be able to check in</strong>{' '}
            until they enroll again from their own portal.
          </Alert>

          {locked && (
            <Alert tone="info">
              They have used all {MAX_FACE_ENROLL_ATTEMPTS} attempts, so they cannot
              register without this grant.
            </Alert>
          )}

          {employee.face_enrolled_at && (
            <p className="muted text-xs">
              Enrolled since {new Date(employee.face_enrolled_at).toLocaleDateString()}.
            </p>
          )}

          {error && <Alert tone="error">{error}</Alert>}

          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirm(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button onClick={handleReset} disabled={busy} className="btn btn-danger">
              {busy && <Spinner size={16} />}
              <ScanFace size={15} /> {locked ? 'Grant access' : 'Reset registration'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/**
 * Row actions: edit and delete only.
 *
 * Activate/deactivate deliberately has no button here — status is a field on
 * the edit form. A one-click status toggle sitting between other icons is too
 * easy to fire by accident, and it changes who counts as staff.
 */
export default function EmployeeRowActions({
  employee,
  onEdit,
}: {
  employee: EmployeeWithAssignment
  onEdit: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [impact, setImpact] = useState<EmployeeImpact | null>(null)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toast = useToast()
  const router = useRouter()

  async function openDelete() {
    setConfirmDelete(true)
    setTyped('')
    setError(null)
    setImpact(null)

    // Fetched on open so the dialog can state exactly what will be lost.
    // A failure has to surface: handling only the success branch left the
    // skeleton spinning forever with no explanation.
    const res = await getEmployeeImpact(employee.id)
    if (res.ok) setImpact(res.data)
    else setError(`Could not read linked records: ${res.error}`)
  }

  async function handleDelete() {
    setBusy(true)
    setError(null)

    const fd = new FormData()
    fd.set('id', employee.id)
    fd.set('confirmName', typed)
    const res = await deleteEmployee(fd)

    if (res.ok) {
      toast.success(`${employee.full_name} was removed.`)
      setConfirmDelete(false)
      router.refresh()
    } else {
      setError(res.error)
    }
    setBusy(false)
  }

  const nameMatches = typed.trim().toLowerCase() === employee.full_name.trim().toLowerCase()

  return (
    <>
      <div className="flex justify-end gap-1">
        <button onClick={onEdit} aria-label={`Edit ${employee.full_name}`} className="icon-btn">
          <Pencil size={15} />
        </button>
        <button
          onClick={openDelete}
          aria-label={`Delete ${employee.full_name}`}
          title="Delete permanently"
          className="icon-btn icon-btn-danger"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this employee?"
        description={`${employee.full_name} · ${employee.employee_id}`}
      >
        <div className="space-y-3">
          <Alert tone="error">
            This cannot be undone. Deleting an employee also deletes everything linked
            to them:
          </Alert>

          {impact === null && !error ? (
            <div className="skeleton h-16 w-full rounded-lg" />
          ) : impact === null ? (
            <Alert tone="warning">
              Linked-record counts are unavailable, so this delete cannot show what it
              will remove. Setting their status to inactive on the edit form is the safer
              choice.
            </Alert>
          ) : (
            <ul className="space-y-1.5 rounded-lg bg-[var(--surface-2)] p-3 text-sm">
              <li className="flex justify-between">
                <span className="muted">Attendance records</span>
                <span className="font-semibold tabular-nums">{impact.attendance}</span>
              </li>
              <li className="flex justify-between">
                <span className="muted">Leave requests</span>
                <span className="font-semibold tabular-nums">{impact.leaves}</span>
              </li>
              <li className="flex justify-between">
                <span className="muted">Face registration</span>
                <span className="font-semibold">{impact.faceEnrolled ? 'Yes' : 'None'}</span>
              </li>
            </ul>
          )}

          {impact?.hasLogin && (
            <Alert tone="warning">
              Their sign-in account is <strong>not</strong> removed — that needs Supabase
              access. Remove it under Authentication → Users if they should lose access.
            </Alert>
          )}

          <Alert tone="info">
            If they have simply left, set their status to <strong>inactive</strong> on the
            edit form instead. That keeps every record for reporting and payroll.
          </Alert>

          <div>
            <label className="label" htmlFor="confirm-name">
              Type <strong>{employee.full_name}</strong> to confirm
            </label>
            <input
              id="confirm-name"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={employee.full_name}
              autoComplete="off"
              className="field"
            />
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={busy || !nameMatches}
              className="btn btn-danger"
            >
              {busy && <Spinner size={16} />} Delete permanently
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
