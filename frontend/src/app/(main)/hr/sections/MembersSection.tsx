'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Plus, Shield, ShieldCheck, User } from 'lucide-react'
import { useToast } from '@/components/Toast'
import Modal from '@/components/Modal'
import {
  Alert,
  Avatar,
  EmptyState,
  PageHeader,
  Panel,
  SearchInput,
  Spinner,
} from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import {
  inviteMember,
  listMembers,
  sendPasswordReset,
  setMemberRole,
  type Member,
} from '../actions'

const ROLES = [
  { value: 'employee', label: 'Employee', icon: User, color: '#059669' },
  { value: 'hr', label: 'HR', icon: ShieldCheck, color: '#2563eb' },
  { value: 'admin', label: 'Admin', icon: Shield, color: '#7c3aed' },
] as const

/**
 * The people directory: everyone with a FinAtt account.
 *
 * HR sees the same list and can onboard employees and send reset links, but
 * portal assignment stays with administrators — the buttons render read-only.
 *
 * The button UI is a convenience — the actual authority is `set_member_role` in
 * Postgres, which is SECURITY DEFINER, verifies the caller is an admin, and
 * refuses to demote the last admin. So this list cannot escalate anyone even if
 * it were reached by a non-admin.
 */
export default function MembersSection({ isAdmin }: { isAdmin: boolean }) {
  const [members, setMembers] = useState<Member[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [resetId, setResetId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [inviting, setInviting] = useState(false)
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

  async function resetPassword(member: Member) {
    setResetId(member.id)

    const fd = new FormData()
    fd.set('email', member.email)
    fd.set('name', member.full_name ?? '')
    const res = await sendPasswordReset(fd)

    if (!res.ok) {
      toast.error(res.error)
    } else if (res.data?.emailed) {
      toast.success(`Reset link sent to ${member.email}.`)
    } else if (res.data?.link) {
      // Email is off or the send failed. The link still works, so surface it
      // rather than leaving the admin with nothing.
      await navigator.clipboard?.writeText(res.data.link).catch(() => {})
      toast.success('Email is not configured — reset link copied to your clipboard.')
    }
    setResetId(null)
  }

  const adminCount = members?.filter((m) => m.role === 'admin').length ?? 0

  const needle = query.trim().toLowerCase()
  const shown = (members ?? []).filter((m) => {
    if (roleFilter !== 'all' && m.role !== roleFilter) return false
    if (!needle) return true
    return `${m.full_name ?? ''} ${m.email}`.toLowerCase().includes(needle)
  })

  return (
    <>
      <PageHeader
        title="Members & access"
        subtitle="Everyone with a FinAtt account — admins, HR and employees"
        action={
          <button onClick={() => setInviting(true)} className="btn btn-primary btn-sm">
            <Plus size={15} /> Invite member
          </button>
        }
      />

      {members && members.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by name or email"
            label="Search members"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by portal"
            className="field w-auto"
          >
            <option value="all">All portals</option>
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="employee">Employee</option>
          </select>
          {(query || roleFilter !== 'all') && (
            <span className="muted text-xs">
              {shown.length} of {members.length}
            </span>
          )}
        </div>
      )}

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
                  <th>Last sign-in</th>
                  {!isAdmin && <th>Role</th>}
                  {isAdmin && <th>Portal</th>}
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((member) => {
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
                        {member.last_login_at ? (
                          <span className="text-xs">
                            {formatDateTime(member.last_login_at)}
                          </span>
                        ) : (
                          <span className="muted text-xs">Never signed in</span>
                        )}
                      </td>
                      {!isAdmin && (
                        <td>
                          <span className="text-xs capitalize">{member.role}</span>
                        </td>
                      )}
                      {isAdmin && (
                        <td>
                          <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
                            {ROLES.map((r) => {
                              const active = member.role === r.value
                              const Icon = r.icon
                              const disabled =
                                !isAdmin ||
                                savingId === member.id ||
                                (lockLastAdmin && r.value !== 'admin')
                              return (
                                <button
                                  key={r.value}
                                  onClick={() => assign(member, r.value)}
                                  disabled={disabled}
                                  title={
                                    !isAdmin
                                      ? 'Only an administrator can change portals'
                                      : lockLastAdmin && r.value !== 'admin'
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
                      )}
                      <td>
                        <button
                          onClick={() => resetPassword(member)}
                          disabled={resetId === member.id}
                          title={`Email ${member.email} a link to choose a new password`}
                          className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                        >
                          {resetId === member.id ? (
                            <Spinner size={12} />
                          ) : (
                            <Mail size={12} />
                          )}
                          Send reset link
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

      <Modal
        open={inviting}
        onClose={() => setInviting(false)}
        title="Invite a member"
        size="md"
      >
        <InviteForm
          isAdmin={isAdmin}
          onDone={(created) => {
            setInviting(false)
            if (created) setMembers(null)
            listMembers().then((res) => res.ok && setMembers(res.data))
          }}
        />
      </Modal>

      <p className="muted mt-3 text-xs">
        {isAdmin &&
          'The last administrator cannot be demoted — promote someone else to admin first. '}
        A reset link lets the member choose their own password, so nobody else ever
        knows it. Their current password keeps working until the link is used.
      </p>
    </>
  )
}

/**
 * Invite form. No password field by design: the account is created without one
 * and the invitee chooses their own from the emailed link, so it is never seen
 * by the administrator issuing the invite.
 */
function InviteForm({
  isAdmin,
  onDone,
}: {
  isAdmin: boolean
  onDone: (created: boolean) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await inviteMember(new FormData(e.currentTarget))

    if (!res.ok) {
      setError(res.error)
      setSaving(false)
      return
    }
    if (res.data?.emailed) {
      toast.success('Invite sent. They will get a link to set their password.')
    } else if (res.data?.link) {
      await navigator.clipboard?.writeText(res.data.link).catch(() => {})
      toast.success('Account created — invite link copied to your clipboard.')
    } else {
      toast.success('Account created.')
    }
    setSaving(false)
    onDone(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label" htmlFor="inv-name">
          Full name
        </label>
        <input id="inv-name" name="name" required className="field" placeholder="Asha Menon" />
      </div>

      <div>
        <label className="label" htmlFor="inv-email">
          Work email
        </label>
        <input
          id="inv-email"
          name="email"
          type="email"
          required
          className="field"
          placeholder="asha@company.com"
        />
      </div>

      <div>
        <label className="label" htmlFor="inv-role">
          Portal
        </label>
        <select id="inv-role" name="role" defaultValue="employee" className="field">
          <option value="employee">Employee — check in, leave, own attendance</option>
          {isAdmin && <option value="hr">HR — manage people, attendance and leave</option>}
          {isAdmin && <option value="admin">Admin — everything, including access</option>}
        </select>
        <p className="muted mt-1 text-xs">
          {isAdmin
            ? 'You can change this later from the list.'
            : 'Only an administrator can grant HR or admin access.'}
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <button type="submit" disabled={saving} className="btn btn-primary w-full">
        {saving ? <Spinner size={16} /> : <Mail size={16} />} Send invite
      </button>
    </form>
  )
}
