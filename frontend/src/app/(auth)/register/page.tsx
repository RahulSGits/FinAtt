'use client'

import { motion } from 'motion/react'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Fingerprint, MailCheck } from 'lucide-react'
import { register } from '../actions'
import { Alert, Spinner } from '@/components/ui'

const MIN_PASSWORD_LENGTH = 8

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (mismatch || tooShort) return

    setLoading(true)
    setError(null)

    const res = await register(new FormData(e.currentTarget))
    if (res?.needsConfirmation) {
      setConfirmationSent(true)
      setLoading(false)
    } else if (res?.error) {
      setError(res.error)
      setLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="grid min-h-dvh place-items-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card w-full max-w-md p-8 text-center"
        >
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
          >
            <MailCheck size={26} />
          </span>
          <h1 className="mt-5 text-2xl font-bold">Check your inbox</h1>
          <p className="muted mt-2">
            We sent you a confirmation link. Click it to activate your account, then sign
            in.
          </p>
          <Link href="/login" className="btn btn-primary mt-6 w-full">
            Go to sign in
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="grid min-h-dvh place-items-center p-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card w-full max-w-2xl overflow-hidden"
      >
        <div className="p-6 sm:p-10">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <span
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
              >
                <Fingerprint size={20} />
              </span>
            </Link>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Create your account
            </h1>
            <p className="muted mt-2">Join FinAtt to manage attendance end to end.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert tone="error">{error}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="fullName">
                  Full name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  required
                  autoComplete="name"
                  placeholder="Priya Menon"
                  className="field"
                />
              </div>

              <div>
                <label className="label" htmlFor="email">
                  Email address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="priya@company.com"
                  className="field"
                />
              </div>

              <div>
                <label className="label" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  className="field"
                />
              </div>

              <div>
                <label className="label" htmlFor="role">
                  Account role *
                </label>
                <select id="role" name="role" required defaultValue="employee" className="field">
                  <option value="employee">Employee</option>
                  <option value="hr">HR manager</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="department">
                  Department
                </label>
                <input
                  id="department"
                  name="department"
                  placeholder="Engineering"
                  className="field"
                />
              </div>

              <div>
                <label className="label" htmlFor="designation">
                  Designation
                </label>
                <input
                  id="designation"
                  name="designation"
                  placeholder="Software Engineer"
                  className="field"
                />
              </div>

              <div>
                <label className="label" htmlFor="password">
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={tooShort}
                    aria-describedby="password-help"
                    placeholder="••••••••"
                    className="field pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="muted absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg transition-colors hover:text-[var(--text)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p
                  id="password-help"
                  className="mt-1 text-xs"
                  style={{ color: tooShort ? 'var(--danger)' : 'var(--text-muted)' }}
                >
                  At least {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>

              <div>
                <label className="label" htmlFor="confirmPassword">
                  Confirm password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={mismatch}
                  aria-describedby="confirm-help"
                  placeholder="••••••••"
                  className="field"
                />
                {/* Validated inline, next to the field, not in a banner at the top. */}
                {mismatch && (
                  <p id="confirm-help" role="alert" className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
                    Passwords do not match.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || mismatch || tooShort}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <Spinner size={17} />
              ) : (
                <>
                  Create account <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="border-t border-[var(--border)] bg-[var(--surface-2)] px-6 py-4 text-center">
          <p className="muted text-sm">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
