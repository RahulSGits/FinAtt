'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pencil } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { Spinner, StatusBadge } from '@/components/ui'
import { statusMeta } from '@/lib/format'
import type { AttendanceStatus, AttendanceWithEmployee } from '@/lib/types'
import { overrideAttendance } from '../actions'

/** Statuses HR may set by hand. `late` is derived from the shift, not chosen. */
const EDITABLE: AttendanceStatus[] = ['present', 'half', 'absent', 'leave', 'off']

/**
 * Click-to-edit status pill.
 *
 * The automatic rules get a day wrong often enough — a forgotten check-out, an
 * off-site errand — that HR needs a one-click correction rather than a separate
 * form. Saving sets `manual_override`, which stops the trigger recomputing the
 * value back on the next write.
 */
export default function AttendanceStatusEditor({
  record,
}: {
  record: AttendanceWithEmployee
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState<AttendanceStatus | null>(null)
  const toast = useToast()
  const router = useRouter()

  async function choose(status: AttendanceStatus) {
    if (status === record.status) {
      setOpen(false)
      return
    }

    setSaving(status)

    const fd = new FormData()
    fd.set('employeeId', record.employee_id)
    fd.set('date', record.date)
    fd.set('status', status)

    const res = await overrideAttendance(fd)

    if (res.ok) {
      toast.success(
        `${record.employees?.full_name ?? 'Record'} marked ${statusMeta[status].label.toLowerCase()}.`,
      )
      setOpen(false)
      router.refresh()
    } else {
      toast.error(res.error)
    }
    setSaving(null)
  }

  return (
    <div className="relative inline-flex">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change status for ${record.employees?.full_name ?? 'this record'}, currently ${statusMeta[record.status].label}`}
        className="group inline-flex items-center gap-1 rounded-full transition-opacity hover:opacity-80 cursor-pointer"
      >
        <StatusBadge status={record.status} />
        <Pencil
          size={11}
          className="muted opacity-0 transition-opacity group-hover:opacity-100"
        />
      </button>

      {open && (
        <>
          {/* Click-away layer, below the menu but above the table. */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <ul
            role="listbox"
            className="glass-strong absolute left-0 top-full z-50 mt-1 w-40 p-1"
          >
            {EDITABLE.map((status) => {
              const meta = statusMeta[status]
              const current = status === record.status
              return (
                <li key={status}>
                  <button
                    role="option"
                    aria-selected={current}
                    onClick={() => choose(status)}
                    disabled={saving !== null}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50 cursor-pointer"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: meta.color }}
                    />
                    <span className="flex-1">{meta.label}</span>
                    {saving === status ? (
                      <Spinner size={12} />
                    ) : current ? (
                      <Check size={12} className="muted" />
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
