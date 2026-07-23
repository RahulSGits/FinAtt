'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Lock, Shield, ShieldCheck, User } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { Alert, Avatar, EmptyState, PageHeader, Panel, Spinner } from '@/components/ui'
import {
  listMembers,
  setMemberRole,
  setPasswordResetPermission,
  type Member,
} from '../actions'

const ROLES = [
  { value: 'employee', label: 'Employee', icon: User, color: '#059669' },
  { value: 'hr', label: 'HR', icon: ShieldCheck, color: '#2563eb' },
  { value: 'admin', label: 'Admin', icon: Shield, color: '#7c3aed' },
] as const

/**
 * Admin-only: assign each member's portal.
 *
 * The button UI is a convenience — the actual authority is `set_member_role` in
 * Postgres, which is SECURITY DEFINER, verifies the caller is an admin, and
 * refuses to demote the last admin. So this list cannot escalate anyone even if
 * it were reached by a non-admin.
 */
export default function MembersSection() {
  const [members, setMembers] = useState<Member[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [resetId, setResetId] = useState<string | null>(null)
  const toast = useToast()
  const router = useRouter()

  useEffect(() => {
    listMembers().then((res) => {
      if (res.ok) setMembers(res.data)
      else setError(res.error)
    })
  }, [])

  async function assign(member: Member, role: string) {
    if (role === member.role) return
    setSavingId(member.id)

    const fd = new FormData()
    fd.set('memberId', member.id)
    fd.set('role', role)
    const res = await setMemberRole(fd)

    if (res.ok) {
      toast.success(`${member.full_name || member.email} is now ${role}.`)
      setMembers((prev) =>
        prev ? prev.map((m) => (m.id === member.id ? { ...m, role } : m)) : prev,
      )
      router.refresh()
    } else {
      toast.error(res.error)
    }
    setSavingId(null)
  }

  async function togglePasswordReset(member: Member) {
    const allowed = !member.password_reset_allowed
    setResetId(member.id)

    const fd = new FormData()
    fd.set('memberId', member.id)
    fd.set('allowed', String(allowed))
    const res = await setPasswordResetPermission(fd)

    if (res.ok) {
      toast.success(
        allowed
          ? `${member.full_name || member.email} can now set a new password.`
          : `Password changes locked for ${member.full_name || member.email}.`,
      )
      setMembers((prev) =>
        prev
          ? prev.map((m) =>
              m.id === member.id ? { ...m, password_reset_allowed: allowed } : m,
            )
          : prev,
      )
    } else {
      toast.error(res.error)
    }
    setResetId(null)
  }

  const adminCount = members?.filter((m) => m.role === 'admin').length ?? 0

  return (
    <>
      <PageHeader
        title="Members & access"
        subtitle="Assign which portal each person can use"
      />

      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <Panel bodyClassName="p-0">
        {members === null ? (
          <div className="space-y-2 p-4" aria-busy>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState icon={<User size={30} />} title="No members" />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Portal</th>
                  <th>Password reset</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  // Guard the last admin in the UI too, matching the DB rule.
                  const lockLastAdmin = member.role === 'admin' && adminCount <= 1
                  return (
                    <tr key={member.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={member.full_name || member.email} size={30} />
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {member.full_name || '—'}
                            </div>
                            <div className="muted truncate text-xs">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
                          {ROLES.map((r) => {
                            const active = member.role === r.value
                            const Icon = r.icon
                            const disabled =
                              savingId === member.id || (lockLastAdmin && r.value !== 'admin')
                            return (
                              <button
                                key={r.value}
                                onClick={() => assign(member, r.value)}
                                disabled={disabled}
                                title={
                                  lockLastAdmin && r.value !== 'admin'
                                    ? 'Promote someone else to admin first'
                                    : `Set ${r.label}`
                                }
                                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
                                style={
                                  active
                                    ? { background: r.color, color: '#fff' }
                                    : { color: 'var(--text-muted)' }
                                }
                              >
                                {savingId === member.id && active ? (
                                  <Spinner size={12} />
                                ) : (
                                  <Icon size={12} />
                                )}
                                {r.label}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => togglePasswordReset(member)}
                          disabled={resetId === member.id}
                          title={
                            member.password_reset_allowed
                              ? 'Revoke permission to change password'
                              : 'Allow this member to set a new password once'
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
                          style={
                            member.password_reset_allowed
                              ? {
                                  borderColor: 'transparent',
                                  background: 'var(--success-soft)',
                                  color: 'var(--success)',
                                }
                              : {
                                  borderColor: 'var(--border)',
                                  color: 'var(--text-muted)',
                                }
                          }
                        >
                          {resetId === member.id ? (
                            <Spinner size={12} />
                          ) : member.password_reset_allowed ? (
                            <KeyRound size={12} />
                          ) : (
                            <Lock size={12} />
                          )}
                          {member.password_reset_allowed ? 'Allowed' : 'Locked'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="muted mt-3 text-xs">
        The last administrator cannot be demoted — promote someone else to admin first.
        Granting a password reset is single-use: it locks again once the member sets
        their new password.
      </p>
    </>
  )
}
