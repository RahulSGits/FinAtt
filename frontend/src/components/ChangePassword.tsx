'use client'

import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { changeOwnPassword } from '@/app/(auth)/actions'
import { Alert, Panel, Spinner } from './ui'

const MIN_PASSWORD_LENGTH = 8

/**
 * Self-service password change, shown in the employee and HR profiles.
 *
 * Gated: only available on first login, or once an administrator has granted
 * permission. The same check runs server-side, so hiding the form is a courtesy
 * rather than the control.
 */
export default function ChangePassword({ allowed }: { allowed: boolean }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // Independent per field: the eye sat only on the first box, so the confirm
  // field silently followed it with no control of its own. Someone checking a
  // typo in one should not have to reveal both.
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (mismatch || tooShort) return

    setSaving(true)
    setError(null)

    const res = await changeOwnPassword(new FormData(e.currentTarget))
    if (res?.error) {
      setError(res.error)
    } else {
      setDone(true)
      setPassword('')
      setConfirmPassword('')
      setShowNew(false)
      setShowConfirm(false)
    }
    setSaving(false)
  }

  return (
    <Panel title="Password" subtitle="Change the password you sign in with">
      {!allowed ? (
        <Alert tone="info">
          Your password can only be changed when an administrator grants
          permission. Ask them to enable it for your account.
        </Alert>
      ) : done ? (
        <Alert tone="success">
          Password updated. Use the new one next time you sign in.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label" htmlFor="cp-password">
              New password
            </label>
            <div className="relative">
              <input
                id="cp-password"
                name="password"
                type={showNew ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={tooShort}
                placeholder="••••••••"
                className="field pr-11"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
                aria-pressed={showNew}
                className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p
              className="mt-1 text-xs"
              style={{ color: tooShort ? 'var(--danger)' : 'var(--text-muted)' }}
            >
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="cp-confirm">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="cp-confirm"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={mismatch}
                placeholder="••••••••"
                className="field pr-11"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
                aria-pressed={showConfirm}
                className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mismatch && (
              <p role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
                Passwords do not match.
              </p>
            )}
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <button
            type="submit"
            disabled={saving || mismatch || tooShort || !password}
            className="btn btn-primary"
          >
            {saving ? <Spinner size={16} /> : <KeyRound size={16} />} Update password
          </button>
        </form>
      )}
    </Panel>
  )
}
