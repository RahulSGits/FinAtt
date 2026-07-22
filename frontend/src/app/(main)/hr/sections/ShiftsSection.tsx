'use client'

import { useState } from 'react'
import { Clock, Pencil, Plus, Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { Alert, EmptyState, PageHeader, Panel, Pill, Spinner } from '@/components/ui'
import { formatDuration, formatShiftTime, WEEKDAY_LABELS } from '@/lib/format'
import type { Shift } from '@/lib/types'
import { deleteShift, saveShift } from '../actions'

export default function ShiftsSection({ shifts }: { shifts: Shift[] }) {
  const [editing, setEditing] = useState<Shift | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Shift | null>(null)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()
  const router = useRouter()

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)

    const fd = new FormData()
    fd.set('id', confirmDelete.id)
    const res = await deleteShift(fd)

    if (res.ok) {
      toast.success('Shift deleted.')
      setConfirmDelete(null)
      router.refresh()
    } else {
      toast.error(res.error)
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Shifts"
        subtitle="Working windows and the thresholds that decide each day's status"
        action={
          <button onClick={() => setCreating(true)} className="btn btn-primary btn-sm">
            <Plus size={15} /> Add shift
          </button>
        }
      />

      {shifts.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<Clock size={30} />}
            title="No shifts defined"
            description="Define a shift so lateness and daily status can be calculated."
            action={
              <button onClick={() => setCreating(true)} className="btn btn-primary btn-sm">
                <Plus size={15} /> Add shift
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shifts.map((shift) => (
            <article key={shift.id} className="card lift p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{shift.name}</h3>
                  <p className="muted mt-0.5 text-sm tabular-nums">
                    {formatShiftTime(shift.start_time)} – {formatShiftTime(shift.end_time)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setEditing(shift)}
                    aria-label={`Edit ${shift.name}`}
                    className="icon-btn"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(shift)}
                    aria-label={`Delete ${shift.name}`}
                    className="icon-btn icon-btn-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-1">
                {WEEKDAY_LABELS.map((label, i) => {
                  const on = shift.work_days.includes(i + 1)
                  return (
                    <span
                      key={label}
                      title={label}
                      className="grid h-6 w-6 place-items-center rounded text-[10px] font-semibold"
                      style={{
                        background: on ? 'var(--primary-soft)' : 'var(--surface-2)',
                        color: on ? 'var(--primary)' : 'var(--text-subtle)',
                      }}
                    >
                      {label[0]}
                    </span>
                  )
                })}
              </div>

              <dl className="space-y-1.5 border-t border-[var(--border)] pt-2.5 text-xs">
                <Row label="Full day at" value={formatDuration(shift.full_day_minutes)} />
                <Row label="Half day at" value={formatDuration(shift.half_day_minutes)} />
                <Row label="Late after" value={`${shift.grace_minutes} min grace`} />
              </dl>

              <div className="mt-3">
                <Pill tone={shift.is_active ? 'var(--success)' : 'var(--text-muted)'}>
                  {shift.is_active ? 'Active' : 'Inactive'}
                </Pill>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        title={editing ? `Edit ${editing.name}` : 'Add shift'}
        size="lg"
      >
        <ShiftForm
          key={editing?.id ?? 'new'}
          shift={editing}
          onDone={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete shift?"
        description={confirmDelete?.name}
        size="sm"
      >
        <div className="space-y-3">
          <Alert tone="warning">
            Employees on this shift will lose their schedule, and their daily status will
            fall back to the default 8-hour rule.
          </Alert>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmDelete(null)} className="btn btn-ghost">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting} className="btn btn-danger">
              {deleting && <Spinner size={16} />} Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="muted">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function ShiftForm({ shift, onDone }: { shift: Shift | null; onDone: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    if (shift) fd.set('id', shift.id)

    const res = await saveShift(fd)
    if (res.ok) {
      toast.success(shift ? 'Shift updated.' : 'Shift created.')
      onDone()
      router.refresh()
    } else {
      setError(res.error)
      setSubmitting(false)
    }
  }

  // `time` inputs want HH:MM; Postgres hands back HH:MM:SS.
  const timeValue = (t?: string) => (t ? t.slice(0, 5) : '')

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label" htmlFor="shift-name">
          Shift name *
        </label>
        <input
          id="shift-name"
          name="name"
          required
          defaultValue={shift?.name}
          placeholder="General Shift"
          className="field"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="shift-start">
            Starts
          </label>
          <input
            id="shift-start"
            name="startTime"
            type="time"
            required
            defaultValue={timeValue(shift?.start_time) || '09:00'}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="shift-end">
            Ends
          </label>
          <input
            id="shift-end"
            name="endTime"
            type="time"
            required
            defaultValue={timeValue(shift?.end_time) || '18:00'}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="shift-grace">
            Grace (min)
          </label>
          <input
            id="shift-grace"
            name="graceMinutes"
            type="number"
            min={0}
            max={180}
            defaultValue={shift?.grace_minutes ?? 15}
            className="field"
          />
        </div>
      </div>

      <fieldset>
        <legend className="label">Working days</legend>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_LABELS.map((label, i) => (
            <label
              key={label}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-2 text-sm has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[var(--primary-soft)]"
            >
              <input
                type="checkbox"
                name="workDays"
                value={i + 1}
                defaultChecked={(shift?.work_days ?? [1, 2, 3, 4, 5]).includes(i + 1)}
                className="h-3.5 w-3.5 accent-[var(--primary)]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="shift-full">
            Full day after (minutes)
          </label>
          <input
            id="shift-full"
            name="fullDayMinutes"
            type="number"
            min={1}
            max={1440}
            required
            defaultValue={shift?.full_day_minutes ?? 480}
            className="field"
            aria-describedby="full-help"
          />
          <p id="full-help" className="muted mt-1 text-xs">
            Worked at least this long → Present.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="shift-half">
            Half day after (minutes)
          </label>
          <input
            id="shift-half"
            name="halfDayMinutes"
            type="number"
            min={1}
            max={1440}
            required
            defaultValue={shift?.half_day_minutes ?? 240}
            className="field"
            aria-describedby="half-help"
          />
          <p id="half-help" className="muted mt-1 text-xs">
            Below this → Absent. Between the two → Half day.
          </p>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          value="true"
          defaultChecked={shift?.is_active ?? true}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        Active
      </label>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className="btn btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting && <Spinner size={16} />} {shift ? 'Save changes' : 'Create shift'}
        </button>
      </div>
    </form>
  )
}
